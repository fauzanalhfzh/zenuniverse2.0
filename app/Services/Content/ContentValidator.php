<?php

namespace App\Services\Content;

use App\Enums\StepType;

/**
 * Validates an admin course document before it can be published. Returns a list
 * of human readable issues instead of throwing so the CMS can show them inline.
 */
class ContentValidator
{
    private const STEP_TYPES = ['concept', 'quiz', 'blockly', 'code-arrange', 'code-fill', 'code'];

    /**
     * @param  array<string, mixed>  $document
     * @return array<int, array{path: string, message: string}>
     */
    public function validate(array $document): array
    {
        $issues = [];

        $required = function (string $value, string $path) use (&$issues): void {
            if (trim($value) === '') {
                $issues[] = ['path' => $path, 'message' => 'Wajib diisi.'];
            }
        };

        $required($this->string($document, 'title'), 'course.title');
        $required($this->string($document, 'description'), 'course.description');
        $required($this->string($document, 'level'), 'course.level');

        $units = $this->list($document['units'] ?? null);

        if ($units === []) {
            $issues[] = ['path' => 'course.units', 'message' => 'Tambahkan minimal satu unit.'];
        }

        $this->assertUnique(array_map(fn ($unit) => $this->string($unit, 'id'), $units), 'course.units', $issues, 'ID unit tidak boleh berulang.');

        $lessonIds = [];
        $stepIds = [];

        foreach ($units as $unitIndex => $unit) {
            $unitPath = "course.units.{$unitIndex}";
            $required($this->string($unit, 'title'), "{$unitPath}.title");

            $lessons = $this->list($unit['lessons'] ?? null);

            if ($lessons === []) {
                $issues[] = ['path' => "{$unitPath}.lessons", 'message' => 'Tambahkan minimal satu lesson.'];
            }

            foreach ($lessons as $lessonIndex => $lesson) {
                $lessonPath = "{$unitPath}.lessons.{$lessonIndex}";
                $lessonIds[] = $this->string($lesson, 'id');
                $required($this->string($lesson, 'title'), "{$lessonPath}.title");
                $required($this->string($lesson, 'description'), "{$lessonPath}.description");

                $steps = $this->list($lesson['steps'] ?? null);

                if ($steps === []) {
                    $issues[] = ['path' => "{$lessonPath}.steps", 'message' => 'Tambahkan minimal satu step.'];
                }

                $localStepIds = [];

                foreach ($steps as $stepIndex => $step) {
                    $stepPath = "{$lessonPath}.steps.{$stepIndex}";
                    $stepId = $this->string($step, 'id');
                    $localStepIds[] = $stepId;
                    $stepIds[] = $stepId;

                    if (! in_array($this->string($step, 'type'), self::STEP_TYPES, true)) {
                        $issues[] = ['path' => "{$stepPath}.type", 'message' => 'Tipe step tidak dikenal.'];
                    }

                    if (! is_array($step['reward'] ?? null)) {
                        $issues[] = ['path' => "{$stepPath}.reward", 'message' => 'Reward XP wajib berupa objek.'];
                    }
                }

                $this->assertUnique($localStepIds, "{$lessonPath}.steps", $issues, 'ID step tidak boleh berulang.');
            }
        }

        $this->assertUnique(array_filter($lessonIds), 'course.units', $issues, 'ID lesson tidak boleh berulang.');
        $this->assertUnique(array_filter($stepIds), 'course.units', $issues, 'ID step tidak boleh berulang.');

        return $issues;
    }

    /**
     * @param  array<int, string>  $values
     * @param  array<int, array{path: string, message: string}>  $issues
     */
    private function assertUnique(array $values, string $path, array &$issues, string $message): void
    {
        if (count($values) !== count(array_unique($values))) {
            $issues[] = ['path' => $path, 'message' => $message];
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function string(array $data, string $key): string
    {
        $value = $data[$key] ?? '';

        return is_string($value) ? $value : '';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function list(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter($value, 'is_array'));
    }

    /**
     * @param  array<string, mixed>  $step
     */
    public function stepType(array $step): ?StepType
    {
        $type = $step['type'] ?? null;

        return is_string($type) ? StepType::tryFrom($type) : null;
    }
}
