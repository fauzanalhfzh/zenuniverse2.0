<?php

namespace App\Services\Content;

use App\Enums\StepType;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonStep;

/**
 * Builds the public read model for learners. Every payload is an explicit
 * allowlist so private answer material (validation, expectedCode, quiz
 * explanation) can never leak through Inertia props or JSON responses.
 */
class PublishedContent
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function catalog(): array
    {
        return Course::query()
            ->where('status', 'published')
            ->with('units.lessons')
            ->orderBy('sort_order')
            ->get()
            ->map(function (Course $course): array {
                $lessonCount = $course->units->sum(fn ($unit) => $unit->lessons->count());

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'level' => $course->level,
                    'lessonCount' => $lessonCount,
                ];
            })
            ->all();
    }

    /**
     * @param  array<int, string>  $completedLessonIds
     * @return array<string, mixed>
     */
    public function course(Course $course, array $completedLessonIds): array
    {
        $course->loadMissing('units.lessons');

        $units = $course->units->map(function ($unit) use ($course, $completedLessonIds): array {
            $lessons = $unit->lessons->map(fn (Lesson $lesson): array => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'completed' => in_array($lesson->id, $completedLessonIds, true),
                'unlocked' => $this->isUnlocked($course, $lesson->id, $completedLessonIds),
            ])->all();

            return [
                'id' => $unit->id,
                'title' => $unit->title,
                'description' => $unit->description,
                'lessons' => $lessons,
            ];
        })->all();

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'level' => $course->level,
            'contentRevision' => (int) $course->content_revision,
            'units' => $units,
        ];
    }

    /**
     * @param  array<int, string>  $completedLessonIds
     * @param  array<int, string>  $completedStepIds
     * @return array<string, mixed>
     */
    public function lessonPayload(Lesson $lesson, array $completedLessonIds, array $completedStepIds): array
    {
        $lesson->loadMissing('unit.course', 'steps');

        $course = $lesson->unit->course;
        $revision = (int) $course->content_revision;

        $stepIds = $lesson->steps->pluck('id')->all();
        $steps = $lesson->steps->map(fn (LessonStep $step): array => $this->publicStep($step, $revision))->all();

        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'description' => $lesson->description,
            'completionRewardXp' => (int) $lesson->completion_reward_xp,
            'contentRevision' => $revision,
            'courseId' => $course->id,
            'courseTitle' => $course->title,
            'completed' => in_array($lesson->id, $completedLessonIds, true),
            'completedStepIds' => array_values(array_intersect($stepIds, $completedStepIds)),
            'steps' => $steps,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function publicStep(LessonStep $step, int $revision): array
    {
        $content = $step->content;

        $payload = [
            'id' => $step->id,
            'type' => $step->type->value,
            'reward' => ['xp' => (int) $step->reward_xp],
        ];

        return match ($step->type) {
            StepType::Concept => [
                ...$payload,
                'content' => $this->pick($content, ['eyebrow', 'title', 'body', 'illustration', 'code']),
            ],
            StepType::Quiz => [
                ...$payload,
                'content' => [
                    ...$this->pick($content, ['question']),
                    'options' => $this->shuffle(
                        array_map(fn (array $option): array => [
                            'id' => PublicId::option($revision, $step->id, (string) $option['id']),
                            'label' => $option['label'] ?? '',
                        ], $this->list($content['options'] ?? null)),
                        fn (array $option): string => $option['id'],
                        "quiz|{$revision}|{$step->id}",
                    ),
                ],
            ],
            StepType::Blockly => [
                ...$payload,
                'content' => $this->pick($content, ['title', 'objective', 'availableBlocks']),
                'challenge' => $this->pick(
                    is_array($step->challenge) ? $step->challenge : [],
                    ['board', 'start', 'goal', 'obstacles', 'maxExecutionSteps', 'maxBlocks', 'starterProgram', 'hint', 'hints'],
                ),
            ],
            StepType::CodeArrange => [
                ...$payload,
                'content' => [
                    ...$this->pick($content, ['title', 'instructions', 'language', 'hint']),
                    'tokens' => $this->shuffle(
                        array_map(fn (array $token): array => [
                            'id' => PublicId::token($revision, $step->id, (string) $token['id']),
                            'text' => $token['text'] ?? '',
                        ], $this->list($content['tokens'] ?? null)),
                        fn (array $token): string => $token['id'],
                        "arrange|{$revision}|{$step->id}",
                    ),
                ],
            ],
            StepType::CodeFill => [
                ...$payload,
                'content' => $this->pick($content, ['title', 'instructions', 'language', 'parts', 'blanks', 'hint']),
            ],
            StepType::Code => [
                ...$payload,
                'content' => $this->pick($content, ['title', 'prompt', 'language', 'starterCode', 'mockOutput', 'sampleInput', 'hint']),
            ],
        };
    }

    /**
     * @param  array<int, string>  $completedLessonIds
     */
    public function isUnlocked(Course $course, string $lessonId, array $completedLessonIds): bool
    {
        $course->loadMissing('units.lessons');
        $ids = $course->units->flatMap(fn ($unit) => $unit->lessons->pluck('id'))->values()->all();
        $index = array_search($lessonId, $ids, true);

        if ($index === false) {
            return false;
        }

        if ($index === 0) {
            return true;
        }

        return in_array($lessonId, $completedLessonIds, true)
            || in_array($ids[$index - 1], $completedLessonIds, true);
    }

    /**
     * @param  array<string, mixed>  $source
     * @param  array<int, string>  $keys
     * @return array<string, mixed>
     */
    private function pick(array $source, array $keys): array
    {
        $picked = [];

        foreach ($keys as $key) {
            if (array_key_exists($key, $source)) {
                $picked[$key] = $source[$key];
            }
        }

        return $picked;
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
     * @param  array<int, array<string, mixed>>  $items
     * @param  callable(array<string, mixed>): string  $key
     * @return array<int, array<string, mixed>>
     */
    private function shuffle(array $items, callable $key, string $seed): array
    {
        usort($items, function (array $left, array $right) use ($key, $seed): int {
            $leftHash = hash_hmac('sha256', "{$seed}|{$key($left)}", (string) config('app.key'));
            $rightHash = hash_hmac('sha256', "{$seed}|{$key($right)}", (string) config('app.key'));

            return $leftHash <=> $rightHash;
        });

        return $items;
    }
}
