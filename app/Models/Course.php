<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $title
 * @property string $description
 * @property string $level
 * @property string $status
 * @property array<int, string>|null $planned_lesson_ids
 * @property int $sort_order
 */
#[Fillable(['id', 'title', 'description', 'level', 'status', 'planned_lesson_ids', 'sort_order'])]
class Course extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'planned_lesson_ids' => 'array',
        ];
    }

    /**
     * @return HasMany<Unit, $this>
     */
    public function units(): HasMany
    {
        return $this->hasMany(Unit::class)->orderBy('sort_order');
    }
}
