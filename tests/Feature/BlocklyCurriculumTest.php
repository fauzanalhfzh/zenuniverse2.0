<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Models\Lesson;
use App\Models\StepCompletion;
use App\Models\Unit;
use App\Models\User;
use App\Services\Content\ContentImporter;
use App\Services\Content\CoursePublisher;
use Database\Seeders\BlocklyCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class BlocklyCurriculumTest extends TestCase
{
    use RefreshDatabase;

    private function originalCourse(): Course
    {
        $dump = json_decode((string) file_get_contents(database_path('seeders/data/content-dump.json')), true, 512, JSON_THROW_ON_ERROR);
        $document = collect($dump['courses'])->firstWhere('id', 'blockly-basics');
        $lessons = collect($document['units'])->firstWhere('id', 'blockly-unit-01')['lessons'];
        $document['title'] = 'Code Block';
        $document['description'] = 'Belajar dasar coding, koordinat game 2D, dan navigasi lewat blok visual.';
        $document['level'] = 'Pemula';
        $document['accessTier'] = 'free';
        $document['plannedLessonIds'] = null;
        $document['units'] = array_map(fn (array $lesson, int $index): array => [
            'id' => sprintf('blockly-unit-%02d', $index + 1),
            'title' => 'Original unit '.($index + 1),
            'description' => 'Original description',
            'lessons' => [$lesson],
        ], $lessons, array_keys($lessons));
        app(ContentImporter::class)->import(['courses' => [$document]]);

        return Course::findOrFail('blockly-basics');
    }

    public function test_rollout_preserves_completion_and_repeated_run_is_a_no_op(): void
    {
        $course = $this->originalCourse();
        User::factory()->create(['is_admin' => true]);
        $learner = User::factory()->create();
        $lesson = Lesson::findOrFail('blockly-basics-lesson-10');
        $completion = StepCompletion::create([
            'user_id' => $learner->id,
            'lesson_id' => $lesson->id,
            'step_id' => $lesson->steps()->firstOrFail()->id,
            'content_revision' => $course->content_revision,
            'reward_xp' => 10,
        ]);
        $before = $completion->refresh()->getAttributes();
        $revision = $course->content_revision;
        $step = $lesson->steps()->firstOrFail();
        $step->forceFill(['content' => array_reverse($step->content, true)])->save();

        $this->seed(BlocklyCurriculumSeeder::class);

        $this->assertSame(['blockly-unit-introduction', 'blockly-unit-01'], $course->units()->pluck('id')->all());
        $this->assertSame(8, Lesson::where('unit_id', 'blockly-unit-introduction')->count());
        $this->assertSame(10, Lesson::where('unit_id', 'blockly-unit-01')->count());
        $this->assertSame($before, $completion->refresh()->getAttributes());
        $this->assertSame($revision + 1, $course->refresh()->content_revision);
        $this->assertDatabaseCount('course_releases', 1);
        $this->assertDatabaseHas('reserved_content_ids', ['course_id' => $course->id, 'content_id' => 'blockly-unit-10', 'kind' => 'unit']);
        $this->assertSame(app(CoursePublisher::class)->projectionDocument($course), CourseRelease::firstOrFail()->document);
        $this->assertSame(hash('sha256', json_encode(app(CoursePublisher::class)->projectionDocument($course), JSON_THROW_ON_ERROR)), CourseDraft::firstOrFail()->projection_hash);

        $draft = CourseDraft::firstOrFail()->getAttributes();
        $this->seed(BlocklyCurriculumSeeder::class);

        $this->assertSame($revision + 1, $course->refresh()->content_revision);
        $this->assertDatabaseCount('course_releases', 1);
        $this->assertDatabaseCount('admin_audits', 2);
        $this->assertSame($draft, CourseDraft::firstOrFail()->getAttributes());
    }

    public function test_pending_draft_is_not_overwritten(): void
    {
        $course = $this->originalCourse();
        $admin = User::factory()->create(['is_admin' => true]);
        $publisher = app(CoursePublisher::class);
        $document = $publisher->projectionDocument($course);
        $document['title'] = 'Pending local title';
        $publisher->saveDraft($course, $document, $admin, 0);

        try {
            $this->seed(BlocklyCurriculumSeeder::class);
            $this->fail('Pending draft must block rollout.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Blockly curriculum has pending draft edits.', $exception->getMessage());
        }

        $this->assertSame($document, CourseDraft::firstOrFail()->document);
        $this->assertDatabaseCount('course_releases', 0);
        $this->assertDatabaseCount('units', 10);
    }

    public function test_local_step_changes_are_not_overwritten(): void
    {
        $course = $this->originalCourse();
        User::factory()->create(['is_admin' => true]);
        $step = Lesson::findOrFail('blockly-basics-lesson-01')->steps()->firstOrFail();
        $step->forceFill(['reward_xp' => $step->reward_xp + 1])->save();
        $before = app(CoursePublisher::class)->projectionDocument($course);

        try {
            $this->seed(BlocklyCurriculumSeeder::class);
            $this->fail('Local edits must block rollout.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Blockly curriculum differs from the original seed; local changes were not overwritten.', $exception->getMessage());
        }

        $this->assertSame($before, app(CoursePublisher::class)->projectionDocument($course->refresh()));
        $this->assertDatabaseCount('course_drafts', 0);
        $this->assertDatabaseCount('course_releases', 0);
    }

    public function test_custom_units_are_not_removed(): void
    {
        $course = $this->originalCourse();
        User::factory()->create(['is_admin' => true]);
        $unit = Unit::create([
            'id' => 'blockly-custom-unit',
            'course_id' => $course->id,
            'title' => 'Local unit',
            'description' => 'Local content',
            'sort_order' => 10,
        ]);

        try {
            $this->seed(BlocklyCurriculumSeeder::class);
            $this->fail('Custom units must block rollout.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Blockly curriculum differs from the original seed; local changes were not overwritten.', $exception->getMessage());
        }

        $this->assertModelExists($unit);
        $this->assertDatabaseCount('course_drafts', 0);
        $this->assertDatabaseCount('course_releases', 0);
    }

    public function test_missing_admin_blocks_publication(): void
    {
        $this->originalCourse();

        try {
            $this->seed(BlocklyCurriculumSeeder::class);
            $this->fail('Publication must require an admin.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Blockly curriculum publication requires an existing admin user.', $exception->getMessage());
        }

        $this->assertDatabaseCount('course_drafts', 0);
        $this->assertDatabaseCount('course_releases', 0);
        $this->assertDatabaseCount('units', 10);
    }

    public function test_publisher_keeps_omitted_nonempty_units(): void
    {
        $course = $this->originalCourse();
        $admin = User::factory()->create(['is_admin' => true]);
        $publisher = app(CoursePublisher::class);
        $document = $publisher->projectionDocument($course);
        $document['units'][0]['lessons'][0]['steps'] = [];
        Lesson::findOrFail('blockly-basics-lesson-01')->steps()->delete();
        array_shift($document['units']);
        $draft = $publisher->saveDraft($course, $document, $admin, 0);

        $publisher->publish($course, $admin, $draft->revision);

        $this->assertModelExists(Unit::findOrFail('blockly-unit-01'));
        $this->assertModelExists(Lesson::findOrFail('blockly-basics-lesson-01'));
    }
}
