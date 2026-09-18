<?php

namespace Tests\Unit;

use App\Services\Learning\GamificationRules;
use Tests\TestCase;

class GamificationRulesTest extends TestCase
{
    public function test_level_boundaries(): void
    {
        $this->assertSame('Beginner', GamificationRules::levelForXp(0)['name']);
        $this->assertSame('Beginner', GamificationRules::levelForXp(99)['name']);
        $this->assertSame('Explorer', GamificationRules::levelForXp(100)['name']);
        $this->assertSame('Explorer', GamificationRules::levelForXp(249)['name']);
        $this->assertSame('Coder', GamificationRules::levelForXp(250)['name']);
        $this->assertSame('Coder', GamificationRules::levelForXp(9999)['name']);
    }

    public function test_final_level_is_always_full(): void
    {
        $progress = GamificationRules::levelProgress(400);

        $this->assertSame(100, $progress['percent']);
        $this->assertSame(100, $progress['xpToNextLevel']);
        $this->assertSame(150, $progress['xpIntoLevel']);
    }

    public function test_level_progress_percent(): void
    {
        $progress = GamificationRules::levelProgress(50);

        $this->assertSame(50, $progress['percent']);
        $this->assertSame(50, $progress['xpToNextLevel']);
    }

    public function test_hearts_regenerate_over_time(): void
    {
        $regen = GamificationRules::HEART_REGEN_MS;

        $fresh = GamificationRules::computeHearts(5, null, 0);
        $this->assertSame(['hearts' => 5, 'nextHeartInMs' => null], $fresh);

        $partial = GamificationRules::computeHearts(2, 0, $regen);
        $this->assertSame(3, $partial['hearts']);
        $this->assertSame($regen, $partial['nextHeartInMs']);

        $almost = GamificationRules::computeHearts(2, 0, $regen - 1000);
        $this->assertSame(2, $almost['hearts']);
        $this->assertSame(1000, $almost['nextHeartInMs']);

        $full = GamificationRules::computeHearts(2, 0, $regen * 5);
        $this->assertSame(['hearts' => 5, 'nextHeartInMs' => null], $full);
    }

    public function test_hearts_honour_custom_settings(): void
    {
        $result = GamificationRules::computeHearts(1, 0, 60_000, 10, 60_000);

        $this->assertSame(2, $result['hearts']);
        $this->assertSame(60_000, $result['nextHeartInMs']);
    }

    public function test_streak_rules(): void
    {
        $fresh = GamificationRules::computeStreak(
            ['currentStreak' => 0, 'longestStreak' => 0, 'lastActivityDate' => null],
            '2026-09-18',
        );
        $this->assertSame(1, $fresh['currentStreak']);

        $sameDay = GamificationRules::computeStreak(
            ['currentStreak' => 3, 'longestStreak' => 3, 'lastActivityDate' => '2026-09-18'],
            '2026-09-18',
        );
        $this->assertSame(3, $sameDay['currentStreak']);

        $consecutive = GamificationRules::computeStreak(
            ['currentStreak' => 3, 'longestStreak' => 3, 'lastActivityDate' => '2026-09-17'],
            '2026-09-18',
        );
        $this->assertSame(4, $consecutive['currentStreak']);
        $this->assertSame(4, $consecutive['longestStreak']);

        $missed = GamificationRules::computeStreak(
            ['currentStreak' => 6, 'longestStreak' => 6, 'lastActivityDate' => '2026-09-15'],
            '2026-09-18',
        );
        $this->assertSame(1, $missed['currentStreak']);
        $this->assertSame(6, $missed['longestStreak']);
    }

    public function test_badge_thresholds(): void
    {
        $this->assertSame([], GamificationRules::unlockedBadges(0, 0, 0));
        $this->assertSame(
            ['first-step'],
            GamificationRules::unlockedBadges(1, 0, 0),
        );
        $this->assertSame(
            ['first-step', 'block-master'],
            GamificationRules::unlockedBadges(1, 1, 0),
        );
        $this->assertSame(
            ['first-step', 'block-master', 'week-warrior'],
            GamificationRules::unlockedBadges(1, 1, 7),
        );
    }

    public function test_daily_goal_progress(): void
    {
        $start = GamificationRules::dailyGoalProgress(0);
        $this->assertSame(0, $start['percent']);
        $this->assertSame(50, $start['remaining']);

        $half = GamificationRules::dailyGoalProgress(25);
        $this->assertSame(50, $half['percent']);
        $this->assertSame(25, $half['remaining']);

        $done = GamificationRules::dailyGoalProgress(80);
        $this->assertSame(100, $done['percent']);
        $this->assertSame(0, $done['remaining']);
    }
}
