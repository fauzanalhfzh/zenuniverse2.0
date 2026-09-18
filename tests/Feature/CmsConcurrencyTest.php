<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseRelease;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class CmsConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        $connection = getenv('DB_CONNECTION') ?: 'sqlite';
        $database = getenv('DB_DATABASE') ?: '';

        if ($connection !== 'mysql' || ! str_ends_with($database, '_test')) {
            $this->markTestSkipped('Requires a dedicated MySQL *_test database.');
        }

        parent::setUp();

        $this->seed(ContentSeeder::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function document(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'level' => $course->level,
            'plannedLessonIds' => $course->planned_lesson_ids,
            'units' => $course->units->map(fn ($unit): array => [
                'id' => $unit->id,
                'title' => $unit->title,
                'description' => $unit->description,
                'lessons' => $unit->lessons->map(fn (Lesson $lesson): array => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'description' => $lesson->description,
                    'completionRewardXp' => $lesson->completion_reward_xp,
                    'steps' => $lesson->steps->map(fn ($step): array => [
                        'id' => $step->id,
                        'type' => $step->type->value,
                        'reward' => ['xp' => $step->reward_xp],
                        'content' => $step->content,
                        'validation' => $step->validation,
                        'challenge' => $step->challenge,
                    ])->all(),
                ])->all(),
            ])->all(),
        ];
    }

    public function test_concurrent_publish_creates_one_release(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $course = Course::query()
            ->where('status', 'published')
            ->with('units.lessons.steps')
            ->orderBy('sort_order')
            ->firstOrFail();

        app(CoursePublisher::class)->saveDraft($course, $this->document($course), $admin, null);

        $processes = [];

        foreach ([1, 2] as $ignored) {
            $process = new Process([
                PHP_BINARY,
                base_path('tests/Support/concurrent-publish.php'),
                $course->id,
                '1',
                (string) $admin->id,
            ]);
            $process->setTimeout(60);
            $process->start();
            $processes[] = $process;
        }

        $outputs = [];

        foreach ($processes as $process) {
            $process->wait();
            $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
            $outputs[] = trim($process->getOutput());
        }

        $this->assertSame(1, CourseRelease::query()->where('course_id', $course->id)->count(), implode(' || ', $outputs));
        $this->assertSame(2, (int) $course->refresh()->content_revision);

        $decoded = array_map(fn (string $json) => json_decode($json, true), $outputs);
        $this->assertTrue(collect($decoded)->contains(fn (array $item) => $item['ok'] === true));
    }
}
