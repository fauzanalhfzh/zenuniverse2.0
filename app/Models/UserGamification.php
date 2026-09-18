<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $total_xp
 * @property int $current_streak
 * @property int $longest_streak
 * @property Carbon|null $last_activity_date
 * @property int $hearts
 * @property Carbon|null $hearts_updated_at
 */
#[Fillable(['user_id', 'total_xp', 'current_streak', 'longest_streak', 'last_activity_date', 'hearts', 'hearts_updated_at'])]
class UserGamification extends Model
{
    protected $table = 'user_gamification';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_activity_date' => 'date',
            'hearts_updated_at' => 'datetime',
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
