<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AiCurriculumSeeder extends Seeder
{
    public function run(CoursePublisher $publisher): void
    {
        $dump = json_decode((string) file_get_contents(database_path('seeders/data/content-dump.json')), true, 512, JSON_THROW_ON_ERROR);
        $source = collect($dump['courses'])->firstWhere('id', 'ai-fundamentals');
        if ($source === null || count($source['units']) !== 2 || array_sum(array_map(fn (array $unit): int => count($unit['lessons']), $source['units'])) !== 8) {
            throw new RuntimeException('AI curriculum must contain two units and eight lessons.');
        }
        unset($source['status']);
        $source['plannedLessonIds'] ??= null;
        foreach ($source['units'] as &$unit) {
            foreach ($unit['lessons'] as &$lesson) {
                foreach ($lesson['steps'] as &$step) {
                    $step['validation'] ??= null;
                    $step['challenge'] ??= null;
                }
                unset($step);
            }
            unset($lesson);
        }
        unset($unit);

        DB::transaction(function () use ($publisher, $source): void {
            $course = Course::query()->whereKey('ai-fundamentals')->lockForUpdate()->first();
            if ($course !== null) {
                $document = $publisher->projectionDocument($course);
                $draft = CourseDraft::query()->where('course_id', $course->id)->lockForUpdate()->first();
                if ($draft !== null && $draft->document != $document) {
                    throw new RuntimeException('AI course has pending draft edits.');
                }
                if ($course->status === 'published' && $document == $source) {
                    return;
                }
                throw new RuntimeException('AI course already exists with different content; local changes were not overwritten.');
            }

            $actor = User::query()->where('is_admin', true)->orderBy('id')->first();
            if ($actor === null) {
                throw new RuntimeException('AI curriculum publication requires an existing admin user.');
            }
            $course = Course::create([
                'id' => $source['id'], 'title' => $source['title'], 'description' => $source['description'],
                'level' => $source['level'], 'access_tier' => $source['accessTier'], 'status' => 'draft',
                'content_revision' => 1, 'planned_lesson_ids' => null,
                'sort_order' => ((int) Course::query()->max('sort_order')) + 1,
            ]);
            $draft = $publisher->saveDraft($course, $source, $actor, 0);
            $publisher->publish($course, $actor, $draft->revision);
        }, 3);
    }
}
