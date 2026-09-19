<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $path
 * @property string $original_name
 * @property string $mime
 * @property int $size
 * @property int|null $uploaded_by
 */
#[Fillable(['path', 'original_name', 'mime', 'size', 'uploaded_by'])]
class CmsAsset extends Model
{
    protected static function booted(): void
    {
        static::saving(function (CmsAsset $asset): void {
            if (! $asset->isDirty('path') || blank($asset->path)) {
                return;
            }

            $disk = Storage::disk('public');

            if (! $disk->exists($asset->path)) {
                return;
            }

            $asset->mime = $disk->mimeType($asset->path) ?: ($asset->mime ?: 'application/octet-stream');
            $asset->size = (int) ($disk->size($asset->path) ?: 0);
            $asset->original_name = $asset->original_name ?: basename($asset->path);
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
