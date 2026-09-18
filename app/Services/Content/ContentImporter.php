<?php

namespace App\Services\Content;

use App\Enums\StepType;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use JsonException;
use RuntimeException;

class ContentImporter
{
    public function importFile(string $path): void
    {
        if (! is_file($path)) {
            throw new InvalidArgumentException("Content dump not found: {$path}");
        }

        try {
            $dump = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("Content dump is not valid JSON: {$path}", previous: $exception);
        }

        if (! is_array($dump)) {
            throw new InvalidArgumentException('Content dump must decode to an object.');
        }

        $this->import($dump);
    }

    /**
     * @param  array<string, mixed>  $dump
     */
    public function import(array $dump): void
    {
        $courses = $dump['courses'] ?? null;

        if (! is_array($courses)) {
            throw new InvalidArgumentException('Content dump is missing the courses array.');
        }

        DB::transaction(function () use ($courses): void {
            foreach (array_values($courses) as $courseIndex => $course) {
                if (! is_array($course)) {
                    throw new InvalidArgumentException('Each course must be an object.');
                }

                $this->importCourse($course, $courseIndex);
            }
        });
    }

    /**
     * @param  array<string, mixed>  $course
     */
    private function importCourse(array $course, int $courseIndex): void
    {
        $courseModel = Course::updateOrCreate(
            ['id' => $this->stringMember($course, 'id')],
            [
                'title' => $this->stringMember($course, 'title'),
                'description' => $this->stringMember($course, 'description'),
                'level' => $this->stringMember($course, 'level'),
                'status' => $this->stringMember($course, 'status'),
                'planned_lesson_ids' => $course['plannedLessonIds'] ?? null,
                'sort_order' => $courseIndex,
            ],
        );

        foreach (array_values($this->arrayMember($course, 'units')) as $unitIndex => $unit) {
            if (! is_array($unit)) {
                throw new InvalidArgumentException('Each unit must be an object.');
            }

            $this->importUnit($courseModel, $unit, $unitIndex);
        }
    }

    /**
     * @param  array<string, mixed>  $unit
     */
    private function importUnit(Course $course, array $unit, int $unitIndex): void
    {
        $unitModel = Unit::updateOrCreate(
            ['id' => $this->stringMember($unit, 'id')],
            [
                'course_id' => $course->id,
                'title' => $this->stringMember($unit, 'title'),
                'description' => $this->stringMember($unit, 'description'),
                'sort_order' => $unitIndex,
            ],
        );

        foreach (array_values($this->arrayMember($unit, 'lessons')) as $lessonIndex => $lesson) {
            if (! is_array($lesson)) {
                throw new InvalidArgumentException('Each lesson must be an object.');
            }

            $this->importLesson($unitModel, $lesson, $lessonIndex);
        }
    }

    /**
     * @param  array<string, mixed>  $lesson
     */
    private function importLesson(Unit $unit, array $lesson, int $lessonIndex): void
    {
        $lessonModel = Lesson::updateOrCreate(
            ['id' => $this->stringMember($lesson, 'id')],
            [
                'unit_id' => $unit->id,
                'title' => $this->stringMember($lesson, 'title'),
                'description' => $this->stringMember($lesson, 'description'),
                'completion_reward_xp' => (int) ($lesson['completionRewardXp'] ?? 0),
                'sort_order' => $lessonIndex,
            ],
        );

        foreach (array_values($this->arrayMember($lesson, 'steps')) as $stepIndex => $step) {
            if (! is_array($step)) {
                throw new InvalidArgumentException('Each step must be an object.');
            }

            $this->importStep($lessonModel, $step, $stepIndex);
        }
    }

    /**
     * @param  array<string, mixed>  $step
     */
    private function importStep(Lesson $lesson, array $step, int $stepIndex): void
    {
        $type = $this->stringMember($step, 'type');

        if (StepType::tryFrom($type) === null) {
            throw new InvalidArgumentException("Unknown step type: {$type}");
        }

        $content = $step['content'] ?? null;
        if (! is_array($content)) {
            throw new InvalidArgumentException("Step {$type} is missing content.");
        }

        $reward = $step['reward'] ?? null;

        LessonStep::updateOrCreate(
            ['id' => $this->stringMember($step, 'id')],
            [
                'lesson_id' => $lesson->id,
                'type' => $type,
                'reward_xp' => is_array($reward) ? (int) ($reward['xp'] ?? 0) : 0,
                'content' => $content,
                'validation' => $this->optionalArray($step, 'validation'),
                'challenge' => $this->optionalArray($step, 'challenge'),
                'sort_order' => $stepIndex,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int|string, mixed>
     */
    private function arrayMember(array $data, string $key): array
    {
        $value = $data[$key] ?? null;

        if (! is_array($value)) {
            throw new InvalidArgumentException("Missing array member: {$key}");
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int|string, mixed>|null
     */
    private function optionalArray(array $data, string $key): ?array
    {
        $value = $data[$key] ?? null;

        if ($value === null) {
            return null;
        }

        if (! is_array($value)) {
            throw new InvalidArgumentException("Member must be an object or null: {$key}");
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function stringMember(array $data, string $key): string
    {
        $value = $data[$key] ?? null;

        if (! is_string($value) || $value === '') {
            throw new InvalidArgumentException("Missing string member: {$key}");
        }

        return $value;
    }
}
