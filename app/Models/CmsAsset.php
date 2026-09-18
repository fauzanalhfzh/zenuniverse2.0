<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
