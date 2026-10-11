<?php

namespace App\Services\Content;

use App\Enums\StepType;

/**
 * Validates an admin course document before it can be published. Returns a list
 * of human readable issues instead of throwing so the CMS can show them inline.
 */
class ContentValidator
{
    private const STEP_TYPES = ['concept', 'quiz', 'blockly', 'code-fill', 'code', 'unjumble', 'matching', 'flashcard'];

    /**
     * Missing accessTier is legacy free; explicit values must be free or plus.
     *
     * @param  array<string, mixed>  $document
     * @return array<int, array{path: string, message: string}>
     */
    public function validateAccessTier(array $document): array
    {
        if (array_key_exists('accessTier', $document) && ! in_array($document['accessTier'], ['free', 'plus'], true)) {
            return [['path' => 'course.accessTier', 'message' => 'Access tier harus free atau plus.']];
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $document
     * @return array<int, array{path: string, message: string}>
     */
    public function validate(array $document): array
    {
        $issues = $this->validateAccessTier($document);

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
                    $issues = array_merge($issues, $this->activityIssues($step, $stepPath));
                }

                $this->assertUnique($localStepIds, "{$lessonPath}.steps", $issues, 'ID step tidak boleh berulang.');
            }
        }

        $this->assertUnique(array_filter($lessonIds), 'course.units', $issues, 'ID lesson tidak boleh berulang.');
        $this->assertUnique(array_filter($stepIds), 'course.units', $issues, 'ID step tidak boleh berulang.');

        return $issues;
    }

    /**
     * @param  array<string, mixed>  $step
     * @return array<int, array{path: string, message: string}>
     */
    private function activityIssues(array $step, string $path): array
    {
        $type = $step['type'] ?? '';
        if (! in_array($type, ['unjumble', 'matching', 'flashcard'], true)) {
            return [];
        }
        $content = is_array($step['content'] ?? null) ? $step['content'] : [];
        $validation = is_array($step['validation'] ?? null) ? $step['validation'] : [];
        $issues = [];
        $groups = match ($type) {
            'unjumble' => ['tokens'],
            'matching' => ['left', 'right'],
            default => ['cards'],
        };
        $ids = ['tokens' => [], 'left' => [], 'right' => [], 'cards' => []];
        foreach (['title', 'instructions'] as $field) {
            if (trim($this->string($content, $field)) === '') {
                $issues[] = ['path' => "{$path}.content.{$field}", 'message' => 'Wajib diisi.'];
            }
        }
        foreach ($groups as $group) {
            $items = $this->list($content[$group] ?? null);
            $ids[$group] = array_map(fn (array $item): string => $this->string($item, 'id'), $items);
            if (! is_array($content[$group] ?? null) || ! array_is_list($content[$group]) || count($items) !== count($content[$group]) || $items === [] || count($items) > 50 || count(array_unique($ids[$group])) !== count($items)) {
                $issues[] = ['path' => "{$path}.content.{$group}", 'message' => 'Isi 1–50 item dengan ID unik.'];
            }
            foreach ($items as $item) {
                foreach ($type === 'flashcard' ? ['id', 'front', 'back'] : ['id', 'label'] as $field) {
                    if (trim($this->string($item, $field)) === '') {
                        $issues[] = ['path' => "{$path}.content.{$group}", 'message' => 'ID dan teks setiap item wajib diisi.'];
                    }
                }
            }
        }
        if ($type === 'unjumble') {
            $order = $validation['correctOrder'] ?? [];
            if (! is_array($order) || count($order) !== count($ids['tokens']) || array_filter($order, 'is_string') !== $order
                || array_diff($ids['tokens'], $order) !== [] || count(array_unique($order)) !== count($order)) {
                $issues[] = ['path' => "{$path}.validation.correctOrder", 'message' => 'Urutan harus memuat setiap ID token tepat satu kali.'];
            }
        }
        if ($type === 'matching') {
            $pairs = $validation['pairs'] ?? [];
            if (! is_array($pairs) || count($ids['left']) !== count($ids['right']) || count($pairs) !== count($ids['left'])
                || array_filter($pairs, 'is_string') !== $pairs || array_diff($ids['left'], array_keys($pairs)) !== []
                || array_diff($ids['right'], array_values($pairs)) !== [] || count(array_unique($pairs)) !== count($pairs)) {
                $issues[] = ['path' => "{$path}.validation.pairs", 'message' => 'Setiap item kiri dan kanan harus berpasangan tepat satu kali.'];
            }
        }

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
