<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Models\Lesson;
use App\Models\StepCompletion;
use App\Models\User;
use App\Services\Content\ContentImporter;
use App\Services\Content\CoursePublisher;
use App\Services\Content\PublishedContent;
use App\Services\Learning\StepVerifier;
use Database\Seeders\PythonCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class PythonCurriculumTest extends TestCase
{
    use RefreshDatabase;

    private function originalCourse(): Course
    {
        $dump = json_decode((string) file_get_contents(database_path('seeders/data/content-dump.json')), true, 512, JSON_THROW_ON_ERROR);
        $course = collect($dump['courses'])->firstWhere('id', 'python-fundamentals');
        $course['units'] = array_slice($course['units'], 0, 10);
        app(ContentImporter::class)->import(['courses' => [$course]]);

        return Course::findOrFail('python-fundamentals');
    }

    public function test_expansion_preserves_content_and_progress_and_is_idempotent(): void
    {
        $course = $this->originalCourse();
        User::factory()->create(['is_admin' => true]);
        $learner = User::factory()->create();
        $lesson = Lesson::findOrFail('python-fundamentals-lesson-01');
        $step = $lesson->steps()->firstOrFail();
        $step->forceFill(['reward_xp' => 7])->save();
        $course->forceFill(['title' => 'Python kelas lokal'])->save();
        $before = app(CoursePublisher::class)->projectionDocument($course);
        $completion = StepCompletion::create([
            'user_id' => $learner->id, 'lesson_id' => $lesson->id, 'step_id' => $step->id,
            'content_revision' => $course->content_revision, 'reward_xp' => 7,
        ]);
        $progress = $completion->refresh()->getAttributes();

        $this->seed(PythonCurriculumSeeder::class);

        $after = app(CoursePublisher::class)->projectionDocument($course->refresh());
        $this->assertSame($before['units'], array_slice($after['units'], 0, 10));
        $this->assertSame('Python kelas lokal', $after['title']);
        $this->assertCount(14, $after['units']);
        $this->assertSame(22, $course->units->sum(fn ($unit) => $unit->lessons->count()));
        $this->assertSame($progress, $completion->refresh()->getAttributes());
        $this->assertDatabaseCount('course_releases', 1);
        $revision = $course->content_revision;
        $draft = CourseDraft::firstOrFail()->getAttributes();

        $this->seed(PythonCurriculumSeeder::class);
        $this->assertSame($revision, $course->refresh()->content_revision);
        $this->assertSame($draft, CourseDraft::firstOrFail()->getAttributes());
        $this->assertDatabaseCount('course_releases', 1);
    }

    public function test_pending_draft_is_not_overwritten(): void
    {
        $course = $this->originalCourse();
        $admin = User::factory()->create(['is_admin' => true]);
        $document = app(CoursePublisher::class)->projectionDocument($course);
        $document['title'] = 'Draft belum selesai';
        app(CoursePublisher::class)->saveDraft($course, $document, $admin, 0);

        try {
            $this->seed(PythonCurriculumSeeder::class);
            $this->fail('Draft edits must block publication.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Python course has pending draft edits.', $exception->getMessage());
        }
        $this->assertSame($document, CourseDraft::firstOrFail()->document);
        $this->assertDatabaseCount('units', 10);
        $this->assertDatabaseCount('course_releases', 0);
    }

    public function test_modified_expansion_is_not_overwritten(): void
    {
        $this->originalCourse();
        User::factory()->create(['is_admin' => true]);
        $this->seed(PythonCurriculumSeeder::class);
        Lesson::findOrFail('python-fundamentals-lesson-11')->steps()->firstOrFail()->update(['reward_xp' => 9]);
        CourseDraft::query()->delete();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Python expansion unit has local edits: python-unit-11');
        $this->seed(PythonCurriculumSeeder::class);
    }

    public function test_missing_admin_blocks_publication(): void
    {
        $this->originalCourse();
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Python curriculum publication requires an existing admin user.');
        $this->seed(PythonCurriculumSeeder::class);
    }

    public function test_new_exercises_are_verifiable_and_public_payload_hides_answers(): void
    {
        $course = $this->originalCourse();
        User::factory()->create(['is_admin' => true]);
        $this->seed(PythonCurriculumSeeder::class);
        $lessons = Lesson::query()->whereIn('unit_id', ['python-unit-11', 'python-unit-12', 'python-unit-13', 'python-unit-14'])->with('steps')->get();
        $this->assertCount(12, $lessons);
        $verifier = app(StepVerifier::class);
        foreach ($lessons as $lesson) {
            $this->assertCount(8, $lesson->steps);
            foreach ($lesson->steps as $step) {
                $public = app(PublishedContent::class)->publicStep($step, $course->refresh()->content_revision);
                $this->assertArrayNotHasKey('validation', $public);
                $this->assertArrayNotHasKey('explanation', $public['content']);
                $this->assertArrayNotHasKey('acceptedAnswers', $public['content']);
                if ($step->type->value === 'quiz') {
                    $this->assertSame($step->content['code'], $public['content']['code']);
                    $result = $verifier->verify($step, ['type' => 'quiz', 'optionId' => $step->validation['correctOptionId']]);
                    $wrong = $verifier->verify($step, ['type' => 'quiz', 'optionId' => 'missing-option']);
                } elseif ($step->type->value === 'code-fill') {
                    $answers = array_map(fn (array $values): string => $values[0], $step->validation['acceptedAnswers']);
                    $result = $verifier->verify($step, ['type' => 'code-fill', 'answers' => $answers]);
                    $wrong = $verifier->verify($step, ['type' => 'code-fill', 'answers' => array_map(fn (): string => 'wrong', $answers)]);
                } else {
                    continue;
                }
                $this->assertTrue($result->correct, $step->id);
                $this->assertFalse($wrong->correct, $step->id);
            }
        }
        $this->assertSame(1, CourseRelease::count());
    }
}
