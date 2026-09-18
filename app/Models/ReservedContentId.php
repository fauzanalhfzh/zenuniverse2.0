<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $course_id
 * @property string $content_id
 * @property string $kind
 */
#[Fillable(['course_id', 'content_id', 'kind'])]
class ReservedContentId extends Model {}
