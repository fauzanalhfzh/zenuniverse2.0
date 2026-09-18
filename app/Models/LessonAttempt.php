<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $attempt_id
 * @property string $lesson_id
 * @property string $step_id
 * @property int $content_revision
 * @property string $payload_hash
 * @property bool $correct
 * @property bool $consume_heart
 * @property int $xp_awarded
 */
#[Fillable(['user_id', 'attempt_id', 'lesson_id', 'step_id', 'content_revision', 'payload_hash', 'correct', 'consume_heart', 'xp_awarded'])]
class LessonAttempt extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'correct' => 'boolean',
            'consume_heart' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
