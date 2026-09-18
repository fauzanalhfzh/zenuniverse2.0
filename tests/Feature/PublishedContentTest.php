<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\LessonStep;
use App\Models\User;
use App\Services\Content\PublicId;
use App\Services\Content\PublishedContent;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublishedContentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ContentSeeder::class);
    }

    private function content(): PublishedContent
    {
        return app(PublishedContent::class);
    }

    private function publishedQuiz(): LessonStep
    {
        return LessonStep::query()
            ->where('type', 'quiz')
            ->whereHas('lesson.unit.course', fn ($query) => $query->where('status', 'published'))
            ->firstOrFail();
    }

    private function publishedArrange(): LessonStep
    {
        return LessonStep::query()
            ->where('type', 'code-arrange')
            ->whereHas('lesson.unit.course', fn ($query) => $query->where('status', 'published'))
            ->whereNotNull('validation')
            ->firstOrFail();
    }

    /**
     * @param  array<mixed>  $data
     */
    private function assertNoPrivateKeys(array $data): void
    {
        foreach ($data as $key => $value) {
            if (in_array($key, ['validation', 'expectedCode', 'correctOrder', 'acceptedAnswers', 'explanation'], true)) {
                $this->fail("Leaked private key in public payload: {$key}");
            }

            if (is_array($value)) {
                $this->assertNoPrivateKeys($value);
            }
        }
    }

    public function test_catalog_lists_only_published_courses_in_order(): void
    {
        $catalog = $this->content()->catalog();

        $this->assertSame(5, count($catalog));
        $this->assertSame('blockly-basics', $catalog[0]['id']);
        $this->assertNotContains('cpp-fundamentals', array_column($catalog, 'id'));
    }

    public function test_public_quiz_hides_answers_and_uses_opaque_ids(): void
    {
        $quiz = $this->publishedQuiz();
        $step = $this->content()->publicStep($quiz, 1);

        $this->assertNoPrivateKeys($step);

        $rawIds = array_column($quiz->content['options'], 'id');
        $publicIds = array_column($step['content']['options'], 'id');

        $this->assertSame(count($rawIds), count($publicIds));
        $this->assertSame(count($publicIds), count(array_unique($publicIds)));

        foreach ($rawIds as $rawId) {
            $this->assertContains(PublicId::option(1, $quiz->id, (string) $rawId), $publicIds);
            $this->assertNotContains((string) $rawId, $publicIds);
        }

        $json = json_encode($step, JSON_THROW_ON_ERROR);
        foreach ($rawIds as $rawId) {
            $this->assertStringNotContainsString((string) $rawId, $json);
        }
    }

    public function test_public_arrange_hides_order_and_opaque_tokens(): void
    {
        $arrange = $this->publishedArrange();
        $step = $this->content()->publicStep($arrange, 1);

        $this->assertNoPrivateKeys($step);

        $rawTokenIds = array_column($arrange->content['tokens'], 'id');
        $publicIds = array_column($step['content']['tokens'], 'id');

        $this->assertSame(count($rawTokenIds), count($publicIds));

        foreach ($rawTokenIds as $rawId) {
            $this->assertNotContains((string) $rawId, $publicIds);
        }

        $mappedCorrectOrder = array_map(
            fn (string $rawId): string => PublicId::token(1, $arrange->id, $rawId),
            $arrange->validation['correctOrder'],
        );

        $this->assertNotSame($mappedCorrectOrder, $publicIds, 'Arranged tokens must not be presented in solution order.');
    }

    public function test_public_code_hides_expected_code(): void
    {
        $code = LessonStep::query()
            ->where('type', 'code')
            ->whereHas('lesson.unit.course', fn ($query) => $query->where('status', 'published'))
            ->firstOrFail();

        $step = $this->content()->publicStep($code, 1);

        $this->assertNoPrivateKeys($step);
        $this->assertArrayNotHasKey('expectedCode', $step['content']);
        $this->assertStringNotContainsString((string) $code->content['expectedCode'], json_encode($step, JSON_THROW_ON_ERROR));
    }

    public function test_unlock_follows_previous_lesson_completion(): void
    {
        $course = Course::where('status', 'published')->with('units.lessons')->orderBy('sort_order')->firstOrFail();
        $lessonIds = $course->units->flatMap(fn ($unit) => $unit->lessons->pluck('id'))->values();

        $this->assertTrue($this->content()->isUnlocked($course, $lessonIds[0], []));
        $this->assertFalse($this->content()->isUnlocked($course, $lessonIds[1], []));
        $this->assertTrue($this->content()->isUnlocked($course, $lessonIds[1], [$lessonIds[0]]));
    }

    public function test_lesson_payload_marks_progress(): void
    {
        $user = User::factory()->create();
        $lesson = Lesson::whereHas('unit.course', fn ($q) => $q->where('status', 'published'))->with('steps')->firstOrFail();

        $payload = $this->content()->lessonPayload($lesson, [], []);

        $this->assertSame($lesson->id, $payload['id']);
        $this->assertSame(1, $payload['contentRevision']);
        $this->assertNoPrivateKeys($payload);
        $this->assertFalse($payload['completed']);
    }

    public function test_locked_lesson_returns_403_and_first_lesson_ok(): void
    {
        $user = User::factory()->create();
        $course = Course::where('status', 'published')->with('units.lessons')->orderBy('sort_order')->firstOrFail();
        $lessonIds = $course->units->flatMap(fn ($unit) => $unit->lessons->pluck('id'))->values();

        $this->actingAs($user)->get("/lesson/{$lessonIds[0]}")->assertOk();
        $this->actingAs($user)->get("/lesson/{$lessonIds[1]}")->assertStatus(403);
    }

    public function test_draft_course_lesson_is_not_found(): void
    {
        $user = User::factory()->create();
        $draftLesson = Lesson::whereHas('unit.course', fn ($query) => $query->where('status', 'draft'))->firstOrFail();

        $this->actingAs($user)->get("/lesson/{$draftLesson->id}")->assertStatus(404);
    }

    public function test_progress_makes_lesson_payload_completed(): void
    {
        $user = User::factory()->create();
        $lesson = Lesson::whereHas('unit.course', fn ($q) => $q->where('status', 'published'))->firstOrFail();

        LessonCompletion::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'content_revision' => 1,
            'reward_xp' => 0,
        ]);

        $payload = $this->content()->lessonPayload($lesson, [$lesson->id], []);

        $this->assertTrue($payload['completed']);
    }
}
