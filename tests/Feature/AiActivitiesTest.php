<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\LessonStep;
use App\Models\StepCompletion;
use App\Models\User;
use App\Models\XpTransaction;
use App\Services\Content\ContentValidator;
use App\Services\Content\CoursePublisher;
use App\Services\Content\PublicId;
use App\Services\Content\PublishedContent;
use App\Services\Learning\GamificationService;
use Database\Seeders\AiActivitiesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class AiActivitiesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create(['is_admin' => true]);
        $dump = json_decode(file_get_contents(database_path('seeders/data/content-dump.json')), true);
        $document = collect($dump['courses'])->firstWhere('id', 'ai-fundamentals');
        unset($document['status']);
        $document['plannedLessonIds'] = null;
        foreach ($document['units'] as &$unit) {
            foreach ($unit['lessons'] as &$lesson) {
                $lesson['steps'] = array_slice($lesson['steps'], 0, 6);
                foreach ($lesson['steps'] as &$step) {
                    $step['validation'] ??= null;
                    $step['challenge'] ??= null;
                }
                unset($step);
            }
            unset($lesson);
        }
        unset($unit);
        $course = Course::create(['id' => 'ai-fundamentals', 'title' => $document['title'], 'description' => $document['description'], 'level' => $document['level'], 'access_tier' => 'free', 'status' => 'draft', 'content_revision' => 1, 'sort_order' => 0]);
        $publisher = app(CoursePublisher::class);
        $draft = $publisher->saveDraft($course, $document, $admin, 0);
        $publisher->publish($course, $admin, $draft->revision);
    }

    private function step(string $type): LessonStep
    {
        $this->seed(AiActivitiesSeeder::class);

        return LessonStep::where('lesson_id', 'ai-fundamentals-lesson-01')->where('type', $type)->firstOrFail();
    }

    private function answer(LessonStep $step): array
    {
        $revision = Course::findOrFail('ai-fundamentals')->content_revision;

        return match ($step->type->value) {
            'unjumble' => ['type' => 'unjumble', 'order' => array_map(fn ($id) => PublicId::for('token', $revision, $step->id, $id), $step->validation['correctOrder'])],
            'matching' => ['type' => 'matching', 'pairs' => collect($step->validation['pairs'])->mapWithKeys(fn ($right, $left) => [PublicId::for('left', $revision, $step->id, $left) => PublicId::for('right', $revision, $step->id, $right)])->all()],
            default => ['type' => 'flashcard', 'reviewedIds' => array_column($step->content['cards'], 'id')],
        };
    }

    private function payload(LessonStep $step, array $answer): array
    {
        return ['lesson_id' => $step->lesson_id, 'step_id' => $step->id, 'attempt_id' => (string) Str::uuid(), 'content_revision' => Course::findOrFail('ai-fundamentals')->content_revision, 'answer' => $answer];
    }

    public function test_all_activity_types_submit_and_replay_without_duplicate_rewards(): void
    {
        $user = User::factory()->create();
        foreach (['unjumble', 'matching', 'flashcard'] as $type) {
            $step = $this->step($type);
            $payload = $this->payload($step, $this->answer($step));
            $first = $this->actingAs($user)->postJson('/learning/attempts', $payload)->assertOk()->assertJsonPath('result.correct', true);
            $this->postJson('/learning/attempts', $payload)->assertOk()->assertExactJson($first->json());
            $payload['answer'] = ['type' => $type];
            $this->postJson('/learning/attempts', $payload)->assertStatus(409)->assertJsonPath('error.code', 'attempt_conflict');
        }
        $this->assertDatabaseCount('lesson_attempts', 3);
        $this->assertDatabaseCount('step_completions', 3);
        $this->assertSame(10, (int) XpTransaction::sum('amount'));
    }

    public function test_private_ids_are_hidden_and_rejected_as_answers(): void
    {
        $user = User::factory()->create();
        $course = Course::findOrFail('ai-fundamentals');
        foreach (['unjumble', 'matching'] as $type) {
            $step = $this->step($type);
            $public = app(PublishedContent::class)->publicStep($step, $course->content_revision);
            $this->assertArrayNotHasKey('validation', $public);
            $this->assertStringNotContainsString('piece-', json_encode($public));
            $this->assertStringNotContainsString('term-', json_encode($public));
            $this->assertStringNotContainsString('meaning-', json_encode($public));
            $raw = $type === 'unjumble' ? ['type' => $type, 'order' => $step->validation['correctOrder']] : ['type' => $type, 'pairs' => $step->validation['pairs']];
            $this->actingAs($user)->postJson('/learning/attempts', $this->payload($step, $raw))->assertOk()->assertJsonPath('result.correct', false);
        }
        $this->assertDatabaseCount('step_completions', 0);
    }

    public function test_wrong_complete_answers_cost_a_heart_but_incomplete_and_flashcards_do_not(): void
    {
        $user = User::factory()->create();
        $step = $this->step('unjumble');
        $answer = $this->answer($step);
        $answer['order'] = array_reverse($answer['order']);
        $this->actingAs($user)->postJson('/learning/attempts', $this->payload($step, $answer))->assertOk()->assertJsonPath('result.correct', false)->assertJsonPath('result.consumeHeart', true);
        $this->postJson('/learning/attempts', $this->payload($step, ['type' => 'unjumble', 'order' => []]))->assertOk()->assertJsonPath('result.consumeHeart', false);
        $step = $this->step('matching');
        $answer = $this->answer($step);
        $answer['pairs'] = array_combine(array_keys($answer['pairs']), array_reverse(array_values($answer['pairs'])));
        $this->postJson('/learning/attempts', $this->payload($step, $answer))->assertOk()->assertJsonPath('result.correct', false)->assertJsonPath('result.consumeHeart', true);
        $step = $this->step('flashcard');
        $this->postJson('/learning/attempts', $this->payload($step, ['type' => 'flashcard', 'reviewedIds' => []]))->assertOk()->assertJsonPath('result.correct', false)->assertJsonPath('result.consumeHeart', false);
        $this->postJson('/learning/attempts', $this->payload($step, $this->answer($step)))->assertOk()->assertJsonPath('result.correct', true)->assertJsonPath('xpAwarded', 0);
    }

    public function test_old_revision_and_duplicate_tokens_are_rejected(): void
    {
        $user = User::factory()->create();
        $step = $this->step('unjumble');
        $payload = $this->payload($step, $this->answer($step));
        $payload['content_revision']--;
        $this->actingAs($user)->postJson('/learning/attempts', $payload)->assertStatus(409);
        $payload = $this->payload($step, $this->answer($step));
        $payload['answer']['order'][1] = $payload['answer']['order'][0];
        $this->postJson('/learning/attempts', $payload)->assertUnprocessable();
    }

    public function test_flashcards_can_be_reviewed_with_zero_hearts(): void
    {
        $user = User::factory()->create();
        for ($i = 0; $i < 5; $i++) {
            app(GamificationService::class)->consumeHeart($user, "drain:{$i}");
        }
        $step = $this->step('flashcard');
        $this->actingAs($user)->postJson('/learning/attempts', $this->payload($step, $this->answer($step)))
            ->assertOk()->assertJsonPath('result.correct', true)->assertJsonPath('progress.hearts', 0);
    }

    public function test_invalid_matching_and_unjumble_keys_cannot_publish(): void
    {
        $this->seed(AiActivitiesSeeder::class);
        $course = Course::findOrFail('ai-fundamentals');
        $document = app(CoursePublisher::class)->projectionDocument($course);
        $this->assertSame([], app(ContentValidator::class)->validate($document));
        $document['units'][0]['lessons'][0]['steps'][7]['validation']['pairs'] = ['unknown' => 'unknown'];
        $document['units'][0]['lessons'][0]['steps'][8]['validation']['correctOrder'] = ['unknown'];
        $this->assertCount(2, app(ContentValidator::class)->validate($document));
    }

    public function test_append_publication_preserves_existing_edits_and_completions_and_is_idempotent(): void
    {
        $course = Course::findOrFail('ai-fundamentals');
        $publisher = app(CoursePublisher::class);
        $admin = User::where('is_admin', true)->firstOrFail();
        $document = $publisher->projectionDocument($course);
        foreach ($document['units'] as &$unit) {
            foreach ($unit['lessons'] as &$lesson) {
                $lesson['steps'] = array_slice($lesson['steps'], 0, 6);
            }
            unset($lesson);
        }
        unset($unit);
        $document['units'][0]['lessons'][0]['steps'][0]['content']['body'] = 'Materi yang diedit pengajar.';
        $saved = $publisher->saveDraft($course, $document, $admin, CourseDraft::where('course_id', $course->id)->value('revision'));
        $publisher->publish($course, $admin, $saved->revision);
        StepCompletion::create(['user_id' => $admin->id, 'step_id' => 'ai-fundamentals-lesson-01-step-1', 'lesson_id' => 'ai-fundamentals-lesson-01', 'content_revision' => $course->fresh()->content_revision, 'completed_at' => now()]);
        $this->seed(AiActivitiesSeeder::class);
        $this->assertSame('Materi yang diedit pengajar.', LessonStep::findOrFail('ai-fundamentals-lesson-01-step-1')->content['body']);
        $this->assertDatabaseCount('step_completions', 1);
        $this->assertSame(72, LessonStep::count());
        $revision = $course->fresh()->content_revision;
        $this->seed(AiActivitiesSeeder::class);
        $this->assertSame($revision, $course->fresh()->content_revision);
    }

    public function test_pending_draft_is_not_overwritten(): void
    {
        $course = Course::findOrFail('ai-fundamentals');
        $publisher = app(CoursePublisher::class);
        $document = $publisher->projectionDocument($course);
        $document['title'] = 'Draft pengajar';
        $publisher->saveDraft($course, $document, User::where('is_admin', true)->firstOrFail(), CourseDraft::where('course_id', $course->id)->value('revision'));
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('AI course has pending draft edits.');
        $this->seed(AiActivitiesSeeder::class);
    }
}
