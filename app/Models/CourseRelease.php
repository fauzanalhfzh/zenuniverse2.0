<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $course_id
 * @property int $revision
 * @property array<string, mixed> $document
 * @property string $hash
 * @property Carbon $published_at
 * @property int|null $actor_id
 */
#[Fillable(['course_id', 'revision', 'document', 'hash', 'published_at', 'actor_id'])]
class CourseRelease extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'document' => 'array',
            'revision' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
