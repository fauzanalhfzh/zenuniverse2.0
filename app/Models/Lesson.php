<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $unit_id
 * @property string $title
 * @property string $description
 * @property int $completion_reward_xp
 * @property int $sort_order
 */
#[Fillable(['id', 'unit_id', 'title', 'description', 'completion_reward_xp', 'sort_order'])]
class Lesson extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * @return HasMany<LessonStep, $this>
     */
    public function steps(): HasMany
    {
        return $this->hasMany(LessonStep::class)->orderBy('sort_order');
    }
}
