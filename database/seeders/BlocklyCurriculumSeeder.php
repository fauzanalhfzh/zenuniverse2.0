<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class BlocklyCurriculumSeeder extends Seeder
{
    public function run(CoursePublisher $publisher): void
    {
        $dump = json_decode((string) file_get_contents(database_path('seeders/data/content-dump.json')), true, 512, JSON_THROW_ON_ERROR);
        $document = collect($dump['courses'])->firstWhere('id', 'blockly-basics');

        if ($document === null || array_column($document['units'], 'id') !== ['blockly-unit-introduction', 'blockly-unit-01']
            || count($document['units'][0]['lessons']) !== 8 || count($document['units'][1]['lessons']) !== 10) {
            throw new RuntimeException('Blockly curriculum dump must contain the introduction and original lessons.');
        }

        unset($document['status']);
        $document = [
            'id' => $document['id'],
            'title' => $document['title'],
            'description' => $document['description'],
            'level' => $document['level'],
            'accessTier' => $document['accessTier'] ?? 'free',
            'plannedLessonIds' => $document['plannedLessonIds'] ?? null,
            'units' => $document['units'],
        ];
        foreach ($document['units'] as &$unit) {
            foreach ($unit['lessons'] as &$lesson) {
                foreach ($lesson['steps'] as &$step) {
                    $step = [
                        'id' => $step['id'],
                        'type' => $step['type'],
                        'reward' => $step['reward'],
                        'content' => $step['content'],
                        'validation' => $step['validation'] ?? null,
                        'challenge' => $step['challenge'] ?? null,
                    ];
                }
                unset($step);
            }
            unset($lesson);
        }
        unset($unit);

        DB::transaction(function () use ($publisher, $document): void {
            $course = Course::query()->whereKey('blockly-basics')->lockForUpdate()->firstOrFail();
            $projection = $publisher->projectionDocument($course);
            $draft = CourseDraft::query()->where('course_id', $course->id)->lockForUpdate()->first();

            if ($draft !== null && $draft->document != $projection) {
                throw new RuntimeException('Blockly curriculum has pending draft edits.');
            }

            if ($projection == $document && $course->status === 'published') {
                return;
            }

            $originalIds = array_map(fn (int $number): string => sprintf('blockly-basics-lesson-%02d', $number), range(1, 10));
            $unitIds = array_map(fn (int $number): string => sprintf('blockly-unit-%02d', $number), range(1, 10));
            $lessons = array_merge(...array_column($projection['units'], 'lessons'));
            $metadata = $projection;
            unset($metadata['units']);
            $originalMetadata = [
                'id' => 'blockly-basics',
                'title' => 'Code Block',
                'description' => 'Belajar dasar coding, koordinat game 2D, dan navigasi lewat blok visual.',
                'level' => 'Pemula',
                'accessTier' => 'free',
                'plannedLessonIds' => null,
            ];

            if ($course->status !== 'published' || $metadata !== $originalMetadata
                || array_column($projection['units'], 'id') !== $unitIds
                || array_column($lessons, 'id') !== $originalIds
                || $lessons != $document['units'][1]['lessons']) {
                throw new RuntimeException('Blockly curriculum differs from the original seed; local changes were not overwritten.');
            }

            $actor = User::query()->where('is_admin', true)->orderBy('id')->first();
            if ($actor === null) {
                throw new RuntimeException('Blockly curriculum publication requires an existing admin user.');
            }

            $draft = $publisher->saveDraft($course, $document, $actor, $draft?->revision ?? 0);
            $publisher->publish($course, $actor, $draft->revision);
        }, 3);
    }
}
