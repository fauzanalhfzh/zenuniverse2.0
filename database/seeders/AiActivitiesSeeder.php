<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AiActivitiesSeeder extends Seeder
{
    public function run(CoursePublisher $publisher): void
    {
        $dump = json_decode((string) file_get_contents(database_path('seeders/data/content-dump.json')), true, 512, JSON_THROW_ON_ERROR);
        $source = collect($this->list($dump['courses'] ?? null))->firstWhere('id', 'ai-fundamentals');
        if ($source === null) {
            throw new RuntimeException('AI curriculum source is missing.');
        }
        DB::transaction(function () use ($publisher, $source): void {
            $course = Course::query()->lockForUpdate()->findOrFail('ai-fundamentals');
            $document = $publisher->projectionDocument($course);
            $draft = CourseDraft::query()->where('course_id', $course->id)->lockForUpdate()->first();
            if ($draft !== null && $draft->document != $document) {
                throw new RuntimeException('AI course has pending draft edits.');
            }
            $changed = false;
            foreach ($document['units'] as &$unit) {
                foreach ($unit['lessons'] as &$lesson) {
                    $sourceLesson = collect($this->list($source['units'] ?? null))->flatMap(fn (array $unit): array => $this->list($unit['lessons'] ?? null))->firstWhere('id', $lesson['id']);
                    $activities = array_values(array_filter($sourceLesson['steps'] ?? [], fn (array $step): bool => in_array($step['type'], ['flashcard', 'matching', 'unjumble'], true)));
                    if (count($activities) !== 3) {
                        throw new RuntimeException('Each AI lesson requires three activities.');
                    }
                    foreach ($activities as $activity) {
                        $activity['validation'] ??= null;
                        $activity['challenge'] ??= null;
                        $existing = collect($this->list($lesson['steps']))->firstWhere('id', $activity['id']);
                        if ($existing !== null && $existing != $activity) {
                            throw new RuntimeException('Existing AI activity was edited; publication stopped.');
                        }
                        if ($existing === null) {
                            $lesson['steps'][] = $activity;
                            $changed = true;
                        }
                    }
                }
                unset($lesson);
            }
            unset($unit);
            if (! $changed) {
                return;
            }
            $actor = User::query()->where('is_admin', true)->orderBy('id')->firstOrFail();
            $saved = $publisher->saveDraft($course, $document, $actor, $draft->revision ?? 0);
            $publisher->publish($course, $actor, $saved->revision);
        }, 3);
    }

    /** @return array<int, array<string, mixed>> */
    private function list(mixed $value): array
    {
        return is_array($value) ? array_values(array_filter($value, 'is_array')) : [];
    }
}
