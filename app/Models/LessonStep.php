<?php

namespace App\Models;

use App\Enums\StepType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $lesson_id
 * @property StepType $type
 * @property int $reward_xp
 * @property array<string, mixed> $content
 * @property array<string, mixed>|null $validation
 * @property array<string, mixed>|null $challenge
 * @property int $sort_order
 */
#[Fillable(['id', 'lesson_id', 'type', 'reward_xp', 'content', 'validation', 'challenge', 'sort_order'])]
#[Hidden(['validation'])]
class LessonStep extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => StepType::class,
            'content' => 'array',
            'validation' => 'array',
            'challenge' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Lesson, $this>
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
