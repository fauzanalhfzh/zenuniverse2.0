<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use App\Services\Content\PublishedContent;
use App\Services\Learning\StepVerifier;
use Database\Seeders\AiCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class AiCurriculumTest extends TestCase
{
    use RefreshDatabase;

    public function test_publication_makes_complete_free_module_available_and_is_idempotent(): void
    {
        User::factory()->create(['is_admin' => true]);
        $this->seed(AiCurriculumSeeder::class);
        $course = Course::with('units.lessons.steps')->findOrFail('ai-fundamentals');
        $this->assertSame('published', $course->status);
        $this->assertSame('free', $course->access_tier);
        $this->assertCount(2, $course->units);
        $this->assertSame(8, $course->units->sum(fn ($unit) => $unit->lessons->count()));
        $catalog = app(PublishedContent::class)->catalog();
        $this->assertSame(8, $catalog[0]['lessonCount']);
        $detail = app(PublishedContent::class)->course($course, []);
        $this->assertTrue($detail['units'][0]['lessons'][0]['unlocked']);
        $this->assertFalse($detail['units'][0]['lessons'][1]['unlocked']);

        foreach ($course->units as $unit) {
            foreach ($unit->lessons as $lesson) {
                $this->assertCount(9, $lesson->steps);
                foreach ($lesson->steps as $step) {
                    $public = app(PublishedContent::class)->publicStep($step, $course->content_revision);
                    $this->assertArrayNotHasKey('validation', $public);
                    $this->assertArrayNotHasKey('explanation', $public['content']);
                    if ($step->type->value !== 'quiz') {
                        continue;
                    }
                    $verifier = app(StepVerifier::class);
                    $this->assertTrue($verifier->verify($step, ['type' => 'quiz', 'optionId' => $step->validation['correctOptionId']])->correct);
                    $this->assertFalse($verifier->verify($step, ['type' => 'quiz', 'optionId' => 'missing'])->correct);
                }
            }
        }
        $before = $course->getAttributes();
        $this->seed(AiCurriculumSeeder::class);
        $this->assertSame($before, $course->refresh()->getAttributes());
        $this->assertDatabaseCount('course_releases', 1);
    }

    public function test_existing_local_content_is_preserved(): void
    {
        User::factory()->create(['is_admin' => true]);
        $this->seed(AiCurriculumSeeder::class);
        $course = Course::findOrFail('ai-fundamentals');
        $course->update(['title' => 'AI kelas lokal']);
        CourseDraft::query()->delete();
        try {
            $this->seed(AiCurriculumSeeder::class);
            $this->fail('Existing content must not be overwritten.');
        } catch (RuntimeException $exception) {
            $this->assertSame('AI course already exists with different content; local changes were not overwritten.', $exception->getMessage());
        }
        $this->assertSame('AI kelas lokal', $course->refresh()->title);
        $this->assertSame(1, CourseRelease::count());
    }

    public function test_pending_draft_is_preserved(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->seed(AiCurriculumSeeder::class);
        $course = Course::findOrFail('ai-fundamentals');
        $document = app(CoursePublisher::class)->projectionDocument($course);
        $document['title'] = 'Draft AI baru';
        app(CoursePublisher::class)->saveDraft($course, $document, $admin, 1);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('AI course has pending draft edits.');
        $this->seed(AiCurriculumSeeder::class);
    }

    public function test_missing_admin_leaves_database_unchanged(): void
    {
        try {
            $this->seed(AiCurriculumSeeder::class);
            $this->fail('Publication requires an existing admin.');
        } catch (RuntimeException $exception) {
            $this->assertSame('AI curriculum publication requires an existing admin user.', $exception->getMessage());
        }
        $this->assertDatabaseCount('courses', 0);
        $this->assertDatabaseCount('course_releases', 0);
    }
}
