<?php

namespace App\Services\Learning;

use App\Exceptions\LearningException;
use App\Models\AdminAudit;
use App\Models\HeartSetting;
use App\Models\User;
use App\Models\UserGamification;
use Illuminate\Support\Facades\DB;

/**
 * Admin control over global heart settings and per-player adjustments. Both
 * operations are audited and guarded by optimistic versions / idempotency keys.
 */
class HeartSettingsService
{
    public function __construct(private readonly GamificationService $gamification) {}

    public function update(User $actor, int $capacity, int $regenMinutes, int $expectedVersion): HeartSetting
    {
        return DB::transaction(function () use ($actor, $capacity, $regenMinutes, $expectedVersion): HeartSetting {
            $settings = HeartSetting::query()->lockForUpdate()->first();

            if ($settings === null) {
                $settings = HeartSetting::current();
                $settings = HeartSetting::query()->lockForUpdate()->findOrFail($settings->id);
            }

            if ((int) $settings->version !== $expectedVersion) {
                throw LearningException::revisionConflict();
            }

            $before = ['capacity' => (int) $settings->capacity, 'regenMinutes' => (int) $settings->regen_minutes];

            $settings->forceFill([
                'capacity' => $capacity,
                'regen_minutes' => $regenMinutes,
                'version' => (int) $settings->version + 1,
            ])->save();

            UserGamification::query()
                ->where('hearts', '>', $capacity)
                ->update(['hearts' => $capacity]);

            UserGamification::query()
                ->whereNull('hearts_updated_at')
                ->update(['hearts' => $capacity]);

            AdminAudit::create([
                'actor_id' => $actor->id,
                'action' => 'hearts.settings_updated',
                'subject_type' => HeartSetting::class,
                'subject_id' => (string) $settings->id,
                'before' => $before,
                'after' => ['capacity' => $capacity, 'regenMinutes' => $regenMinutes],
            ]);

            return $settings->refresh();
        }, 3);
    }

    /**
     * @return array{hearts: int, delta: int}
     */
    public function adjust(
        User $actor,
        User $player,
        int $delta,
        string $reason,
        string $adjustmentId,
        ?int $expectedHearts = null,
    ): array {
        return DB::transaction(function () use ($actor, $player, $delta, $reason, $adjustmentId, $expectedHearts): array {
            $settings = HeartSetting::current();

            $state = $this->gamification->current($player);
            $state = UserGamification::query()->whereKey($state->id)->lockForUpdate()->firstOrFail();
            $state = $this->gamification->persistHearts($state);

            $before = (int) $state->hearts;

            if ($expectedHearts !== null && $before !== $expectedHearts) {
                throw LearningException::revisionConflict();
            }

            $next = max(0, min((int) $settings->capacity, $before + $delta));
            $applied = $next - $before;

            $inserted = DB::table('heart_events')->insertOrIgnore([
                'user_id' => $player->id,
                'delta' => $applied,
                'reason' => 'admin_adjustment',
                'event_key' => "admin:{$adjustmentId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($inserted === 0) {
                return ['hearts' => $before, 'delta' => 0];
            }

            $state->forceFill(['hearts' => $next, 'hearts_updated_at' => now()])->save();

            AdminAudit::create([
                'actor_id' => $actor->id,
                'action' => 'hearts.player_adjusted',
                'subject_type' => UserGamification::class,
                'subject_id' => (string) $player->id,
                'before' => ['hearts' => $before],
                'after' => ['hearts' => $next, 'reason' => $reason, 'adjustmentId' => $adjustmentId],
            ]);

            return ['hearts' => $next, 'delta' => $applied];
        }, 3);
    }
}
