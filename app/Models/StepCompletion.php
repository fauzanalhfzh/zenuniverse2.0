<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $step_id
 * @property string $lesson_id
 * @property int $content_revision
 * @property int $reward_xp
 */
#[Fillable(['user_id', 'step_id', 'lesson_id', 'content_revision', 'reward_xp'])]
class StepCompletion extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
