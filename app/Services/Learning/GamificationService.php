<?php

namespace App\Services\Learning;

use App\Enums\StepType;
use App\Models\DailyActivity;
use App\Models\HeartSetting;
use App\Models\LessonCompletion;
use App\Models\StepCompletion;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserGamification;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Persistence layer for server-authoritative gamification. Callers wrap reward
 * flows in a transaction; every write here is idempotent through unique keys.
 */
class GamificationService
{
    public const TZ = 'Asia/Jakarta';

    public function today(?CarbonInterface $now = null): string
    {
        return ($now ?? now())->timezone(self::TZ)->toDateString();
    }

    public function settings(): HeartSetting
    {
        return HeartSetting::current();
    }

    public function current(User $user): UserGamification
    {
        $capacity = $this->settings()->capacity;

        return UserGamification::firstOrCreate(
            ['user_id' => $user->id],
            ['hearts' => $capacity, 'hearts_updated_at' => now()],
        );
    }

    /**
     * @return array{hearts: int, nextHeartInMs: int|null}
     */
    public function effectiveHearts(UserGamification $state, ?HeartSetting $settings = null, ?CarbonInterface $now = null): array
    {
        $settings ??= $this->settings();
        $moment = $now ?? now();

        return GamificationRules::computeHearts(
            (int) $state->hearts,
            $state->hearts_updated_at?->getTimestampMs(),
            $moment->getTimestampMs(),
            (int) $settings->capacity,
            (int) $settings->regen_minutes * 60_000,
        );
    }

    public function persistHearts(UserGamification $state, ?HeartSetting $settings = null, ?CarbonInterface $now = null): UserGamification
    {
        $settings ??= $this->settings();
        $moment = $now ?? now();
        $result = $this->effectiveHearts($state, $settings, $moment);

        if ($result['nextHeartInMs'] === null) {
            $state->forceFill(['hearts' => $result['hearts'], 'hearts_updated_at' => null])->save();

            return $state;
        }

        $regenMs = (int) $settings->regen_minutes * 60_000;
        $anchor = $moment->copy()->subMilliseconds($regenMs - $result['nextHeartInMs']);

        $state->forceFill(['hearts' => $result['hearts'], 'hearts_updated_at' => $anchor])->save();

        return $state;
    }

    public function consumeHeart(User $user, string $eventKey, ?CarbonInterface $now = null): bool
    {
        $moment = $now ?? now();
        $state = $this->persistHearts($this->current($user), null, $moment);

        if ((int) $state->hearts <= 0) {
            return false;
        }

        $inserted = DB::table('heart_events')->insertOrIgnore([
            'user_id' => $user->id,
            'delta' => -1,
            'reason' => 'mistake',
            'event_key' => $eventKey,
            'created_at' => $moment,
            'updated_at' => $moment,
        ]);

        if ($inserted === 0) {
            return false;
        }

        $state->forceFill(['hearts' => max(0, (int) $state->hearts - 1), 'hearts_updated_at' => $moment])->save();

        return true;
    }

    public function award(User $user, int $amount, string $reason, string $eventKey, ?string $reference = null): int
    {
        if ($amount <= 0) {
            return 0;
        }

        $now = now();

        $inserted = DB::table('xp_transactions')->insertOrIgnore([
            'user_id' => $user->id,
            'amount' => $amount,
            'reason' => $reason,
            'event_key' => $eventKey,
            'reference' => $reference,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if ($inserted === 0) {
            return 0;
        }

        $this->current($user)->increment('total_xp', $amount);

        return $amount;
    }

    public function addDailyXp(User $user, string $date, int $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $this->activity($user, $date)->increment('earned_xp', $amount);
    }

    private function activity(User $user, string $date): DailyActivity
    {
        $existing = DailyActivity::query()
            ->where('user_id', $user->id)
            ->whereDate('activity_date', $date)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            return DailyActivity::create([
                'user_id' => $user->id,
                'activity_date' => $date,
                'earned_xp' => 0,
            ]);
        } catch (QueryException) {
            return DailyActivity::query()
                ->where('user_id', $user->id)
                ->whereDate('activity_date', $date)
                ->firstOrFail();
        }
    }

    public function dailyXp(User $user, string $date): int
    {
        return (int) DailyActivity::query()
            ->where('user_id', $user->id)
            ->whereDate('activity_date', $date)
            ->value('earned_xp');
    }

    public function claimDailyBonus(User $user, string $date): int
    {
        $activity = $this->activity($user, $date);

        if ($activity->bonus_claimed || (int) $activity->earned_xp < GamificationRules::DAILY_GOAL_XP) {
            return 0;
        }

        $awarded = $this->award(
            $user,
            GamificationRules::DAILY_GOAL_REWARD_XP,
            'daily_goal',
            "daily-bonus:{$date}",
        );

        if ($awarded > 0) {
            $activity->forceFill(['bonus_claimed' => true])->save();
        }

        return $awarded;
    }

    public function touchStreak(User $user, string $date): void
    {
        $state = $this->current($user);

        $next = GamificationRules::computeStreak([
            'currentStreak' => (int) $state->current_streak,
            'longestStreak' => (int) $state->longest_streak,
            'lastActivityDate' => $state->last_activity_date?->toDateString(),
        ], $date);

        $state->forceFill([
            'current_streak' => $next['currentStreak'],
            'longest_streak' => $next['longestStreak'],
            'last_activity_date' => $next['lastActivityDate'],
        ])->save();
    }

    public function syncBadges(User $user): void
    {
        $completedLessons = LessonCompletion::query()->where('user_id', $user->id)->count();

        $completedChallenges = StepCompletion::query()
            ->join('lesson_steps', 'lesson_steps.id', '=', 'step_completions.step_id')
            ->where('step_completions.user_id', $user->id)
            ->where('lesson_steps.type', StepType::Blockly->value)
            ->count();

        $streak = (int) $this->current($user)->current_streak;

        foreach (GamificationRules::unlockedBadges($completedLessons, $completedChallenges, $streak) as $badge) {
            UserBadge::firstOrCreate(['user_id' => $user->id, 'badge_key' => $badge]);
        }
    }

    public function completeStep(User $user, string $lessonId, string $stepId, int $contentRevision, int $rewardXp): bool
    {
        $inserted = DB::table('step_completions')->insertOrIgnore([
            'user_id' => $user->id,
            'step_id' => $stepId,
            'lesson_id' => $lessonId,
            'content_revision' => $contentRevision,
            'reward_xp' => $rewardXp,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $inserted > 0;
    }

    public function completeLesson(User $user, string $lessonId, int $contentRevision, int $rewardXp): bool
    {
        $inserted = DB::table('lesson_completions')->insertOrIgnore([
            'user_id' => $user->id,
            'lesson_id' => $lessonId,
            'content_revision' => $contentRevision,
            'reward_xp' => $rewardXp,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $inserted > 0;
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshot(User $user, ?CarbonInterface $now = null): array
    {
        $moment = $now ?? now();
        $date = $this->today($moment);
        $settings = $this->settings();
        $state = $this->persistHearts($this->current($user), $settings, $moment);
        $hearts = $this->effectiveHearts($state, $settings, $moment);

        $dailyXp = $this->dailyXp($user, $date);
        $activity = DailyActivity::query()
            ->where('user_id', $user->id)
            ->whereDate('activity_date', $date)
            ->first();

        $dailyGoal = GamificationRules::dailyGoalProgress($dailyXp);
        $dailyGoal['claimed'] = $activity?->bonus_claimed === true;

        $badges = UserBadge::query()
            ->where('user_id', $user->id)
            ->orderBy('badge_key')
            ->pluck('badge_key')
            ->all();

        return [
            'totalXp' => (int) $state->total_xp,
            'updatedAt' => $state->updated_at?->getTimestampMs() ?? 0,
            'dailyXp' => $dailyXp,
            'dailyXpDate' => $activity !== null ? $date : null,
            'dailyGoalClaimedDate' => $activity?->bonus_claimed === true ? $date : null,
            'currentStreak' => (int) $state->current_streak,
            'longestStreak' => (int) $state->longest_streak,
            'lastActivityDate' => $state->last_activity_date?->toDateString(),
            'hearts' => $hearts['hearts'],
            'heartsCapacity' => (int) $settings->capacity,
            'heartsRegenMinutes' => (int) $settings->regen_minutes,
            'nextHeartInMs' => $hearts['nextHeartInMs'],
            'badges' => $badges,
            'level' => GamificationRules::levelProgress((int) $state->total_xp),
            'dailyGoal' => $dailyGoal,
        ];
    }
}
