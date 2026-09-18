<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $capacity
 * @property int $regen_minutes
 * @property int $version
 */
#[Fillable(['capacity', 'regen_minutes', 'version'])]
class HeartSetting extends Model
{
    public static function current(): self
    {
        return self::query()->firstOrCreate([], [
            'capacity' => 5,
            'regen_minutes' => 5,
            'version' => 1,
        ]);
    }
}
