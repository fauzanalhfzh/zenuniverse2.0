<?php

namespace App\Services\Learning;

use Carbon\CarbonImmutable;

/**
 * Pure gamification rules ported from the legacy content package. No database
 * access is allowed here so every rule stays unit-testable.
 */
class GamificationRules
{
    public const DAILY_GOAL_XP = 50;

    public const DAILY_GOAL_REWARD_XP = 50;

    public const COURSE_COMPLETE_REWARD_XP = 100;

    public const MAX_HEARTS = 5;

    public const HEART_REGEN_MS = 5 * 60 * 1000;

    public const BADGE_FIRST_STEP = 'first-step';

    public const BADGE_BLOCK_MASTER = 'block-master';

    public const BADGE_WEEK_WARRIOR = 'week-warrior';

    /**
     * @var array<int, array{level: int, name: string, minXp: int, nextXp: int}>
     */
    public const LEVELS = [
        ['level' => 1, 'name' => 'Beginner', 'minXp' => 0, 'nextXp' => 100],
        ['level' => 2, 'name' => 'Explorer', 'minXp' => 100, 'nextXp' => 250],
        ['level' => 3, 'name' => 'Coder', 'minXp' => 250, 'nextXp' => 500],
    ];

    /**
     * @return array{level: int, name: string, minXp: int, nextXp: int}
     */
    public static function levelForXp(int $totalXp): array
    {
        $safe = max(0, $totalXp);
        $current = self::LEVELS[0];

        foreach (self::LEVELS as $level) {
            if ($safe >= $level['minXp']) {
                $current = $level;
            }
        }

        return $current;
    }

    /**
     * @return array{current: array<string, mixed>, currentXp: int, xpIntoLevel: int, xpToNextLevel: int, percent: int}
     */
    public static function levelProgress(int $totalXp): array
    {
        $safe = max(0, $totalXp);
        $current = self::levelForXp($safe);
        $isFinal = $current === self::LEVELS[count(self::LEVELS) - 1];
        $xpIntoLevel = $safe - $current['minXp'];
        $span = $current['nextXp'] - $current['minXp'];

        return [
            'current' => $current,
            'currentXp' => $safe,
            'xpIntoLevel' => $xpIntoLevel,
            'xpToNextLevel' => max(0, $current['nextXp'] - $safe),
            'percent' => $isFinal ? 100 : min(100, (int) round(($xpIntoLevel / $span) * 100)),
        ];
    }

    /**
     * @return array{hearts: int, nextHeartInMs: int|null}
     */
    public static function computeHearts(
        int $hearts,
        ?int $heartsUpdatedAtMs,
        int $nowMs,
        int $capacity = self::MAX_HEARTS,
        int $regenMs = self::HEART_REGEN_MS,
    ): array {
        $safe = max(0, $hearts);

        if ($heartsUpdatedAtMs === null || $safe >= $capacity) {
            return ['hearts' => $capacity, 'nextHeartInMs' => null];
        }

        $elapsed = max(0, $nowMs - $heartsUpdatedAtMs);
        $nextHearts = min($capacity, $safe + intdiv($elapsed, $regenMs));

        if ($nextHearts >= $capacity) {
            return ['hearts' => $capacity, 'nextHeartInMs' => null];
        }

        return ['hearts' => $nextHearts, 'nextHeartInMs' => $regenMs - ($elapsed % $regenMs)];
    }

    /**
     * @param  array{currentStreak: int, longestStreak: int, lastActivityDate: string|null}  $previous
     * @return array{currentStreak: int, longestStreak: int, lastActivityDate: string|null}
     */
    public static function computeStreak(array $previous, string $today): array
    {
        if ($previous['lastActivityDate'] === null) {
            return ['currentStreak' => 1, 'longestStreak' => 1, 'lastActivityDate' => $today];
        }

        if ($previous['lastActivityDate'] === $today) {
            return $previous;
        }

        $yesterday = CarbonImmutable::parse($today)->subDay()->toDateString();

        if ($previous['lastActivityDate'] === $yesterday) {
            $currentStreak = $previous['currentStreak'] + 1;

            return [
                'currentStreak' => $currentStreak,
                'longestStreak' => max($previous['longestStreak'], $currentStreak),
                'lastActivityDate' => $today,
            ];
        }

        return [
            'currentStreak' => 1,
            'longestStreak' => $previous['longestStreak'],
            'lastActivityDate' => $today,
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function unlockedBadges(int $completedLessons, int $completedChallenges, int $currentStreak): array
    {
        $badges = [];

        if ($completedLessons >= 1) {
            $badges[] = self::BADGE_FIRST_STEP;
        }

        if ($completedChallenges >= 1) {
            $badges[] = self::BADGE_BLOCK_MASTER;
        }

        if ($currentStreak >= 7) {
            $badges[] = self::BADGE_WEEK_WARRIOR;
        }

        return $badges;
    }

    /**
     * @return array{progress: int, percent: int, claimed: bool, remaining: int}
     */
    public static function dailyGoalProgress(int $dailyXp): array
    {
        $safe = max(0, $dailyXp);

        return [
            'progress' => min($safe, self::DAILY_GOAL_XP),
            'percent' => min(100, (int) round(($safe / self::DAILY_GOAL_XP) * 100)),
            'claimed' => false,
            'remaining' => max(0, self::DAILY_GOAL_XP - $safe),
        ];
    }
}
