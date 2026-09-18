<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\User;
use App\Models\UserGamification;
use App\Services\Learning\GamificationService;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class GamificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private GamificationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(GamificationService::class);
    }

    public function test_award_is_idempotent_per_event(): void
    {
        $user = User::factory()->create();

        $this->assertSame(10, $this->service->award($user, 10, 'step', 'step:one'));
        $this->assertSame(0, $this->service->award($user, 10, 'step', 'step:one'));
        $this->assertSame(5, $this->service->award($user, 5, 'step', 'step:two'));

        $this->assertSame(15, (int) UserGamification::where('user_id', $user->id)->value('total_xp'));
    }

    public function test_heart_consumption_is_idempotent_and_regenerates(): void
    {
        Carbon::setTestNow('2026-09-18 10:00:00');
        $user = User::factory()->create();

        $this->service->snapshot($user);
        $this->assertSame(5, $this->service->snapshot($user)['hearts']);

        $this->assertTrue($this->service->consumeHeart($user, 'mistake:one'));
        $this->assertFalse($this->service->consumeHeart($user, 'mistake:one'));
        $this->assertTrue($this->service->consumeHeart($user, 'mistake:two'));

        $this->assertSame(3, $this->service->snapshot($user)['hearts']);

        Carbon::setTestNow('2026-09-18 10:05:00');
        $this->assertSame(4, $this->service->snapshot($user)['hearts']);
    }

    public function test_daily_goal_bonus_claimed_once(): void
    {
        $user = User::factory()->create();
        $date = '2026-09-18';

        $this->service->addDailyXp($user, $date, 50);

        $this->assertSame(50, $this->service->claimDailyBonus($user, $date));
        $this->assertSame(0, $this->service->claimDailyBonus($user, $date));
        $this->assertSame(50, (int) UserGamification::where('user_id', $user->id)->value('total_xp'));
        $this->assertSame(50, $this->service->dailyXp($user, $date));
    }

    public function test_streak_and_snapshot(): void
    {
        $user = User::factory()->create();

        $this->service->touchStreak($user, '2026-09-18');
        $this->service->touchStreak($user, '2026-09-18');
        $this->service->touchStreak($user, '2026-09-19');

        $snapshot = $this->service->snapshot($user);

        $this->assertSame(2, $snapshot['currentStreak']);
        $this->assertSame(2, $snapshot['longestStreak']);
        $this->assertSame('2026-09-19', $snapshot['lastActivityDate']);
        $this->assertArrayHasKey('level', $snapshot);
        $this->assertArrayHasKey('dailyGoal', $snapshot);
        $this->assertSame('Beginner', $snapshot['level']['current']['name']);
    }

    public function test_badges_unlock_from_completions(): void
    {
        $this->seed(ContentSeeder::class);

        $user = User::factory()->create();
        $lesson = Lesson::whereHas('unit.course', fn ($query) => $query->where('status', 'published'))
            ->firstOrFail();

        $this->service->completeLesson($user, $lesson->id, 1, 10);
        $this->service->syncBadges($user);
        $this->assertDatabaseHas('user_badges', ['user_id' => $user->id, 'badge_key' => 'first-step']);

        $blockly = LessonStep::where('type', 'blockly')->firstOrFail();
        $this->service->completeStep($user, $blockly->lesson_id, $blockly->id, 1, 5);
        $this->service->syncBadges($user);
        $this->assertDatabaseHas('user_badges', ['user_id' => $user->id, 'badge_key' => 'block-master']);
    }

    public function test_step_and_lesson_completion_are_idempotent(): void
    {
        $user = User::factory()->create();

        $this->assertTrue($this->service->completeStep($user, 'lesson-x', 'step-x', 1, 5));
        $this->assertFalse($this->service->completeStep($user, 'lesson-x', 'step-x', 1, 5));
        $this->assertTrue($this->service->completeLesson($user, 'lesson-x', 1, 10));
        $this->assertFalse($this->service->completeLesson($user, 'lesson-x', 1, 10));
    }
}
