<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PythonCurriculumSeeder extends Seeder
{
    public function run(CoursePublisher $publisher): void
    {
        $dump = json_decode((string) file_get_contents(database_path('seeders/data/content-dump.json')), true, 512, JSON_THROW_ON_ERROR);
        $source = collect($dump['courses'])->firstWhere('id', 'python-fundamentals');
        $unitIds = array_map(fn (int $number): string => 'python-unit-'.$number, range(11, 14));
        $additions = array_values(array_filter($source['units'] ?? [], fn (array $unit): bool => in_array($unit['id'], $unitIds, true)));

        if (array_column($additions, 'id') !== $unitIds || array_sum(array_map(fn (array $unit): int => count($unit['lessons']), $additions)) !== 12) {
            throw new RuntimeException('Python expansion must contain four units and twelve lessons.');
        }

        foreach ($additions as &$unit) {
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

        DB::transaction(function () use ($publisher, $additions): void {
            $course = Course::query()->whereKey('python-fundamentals')->lockForUpdate()->firstOrFail();
            if ($course->status !== 'published') {
                throw new RuntimeException('Python expansion requires an already published course.');
            }

            $document = $publisher->projectionDocument($course);
            $draft = CourseDraft::query()->where('course_id', $course->id)->lockForUpdate()->first();
            if ($draft !== null && $draft->document != $document) {
                throw new RuntimeException('Python course has pending draft edits.');
            }

            $changed = false;
            foreach ($additions as $unit) {
                $existing = collect($document['units'])->firstWhere('id', $unit['id']);
                if ($existing !== null) {
                    if ($existing != $unit) {
                        throw new RuntimeException('Python expansion unit has local edits: '.$unit['id']);
                    }

                    continue;
                }
                $document['units'][] = $unit;
                $changed = true;
            }

            if (! $changed) {
                return;
            }

            $actor = User::query()->where('is_admin', true)->orderBy('id')->first();
            if ($actor === null) {
                throw new RuntimeException('Python curriculum publication requires an existing admin user.');
            }

            $draft = $publisher->saveDraft($course, $document, $actor, $draft?->revision ?? 0);
            $publisher->publish($course, $actor, $draft->revision);
        }, 3);
    }
}
