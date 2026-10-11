<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\Subscription;
use App\Models\Unit;
use App\Models\User;
use App\Models\UserGamification;
use App\Services\Learning\GamificationService;
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

    public function test_plus_skips_heart_mutations_but_snapshot_preserves_free_regeneration_and_expiry(): void
    {
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create();
        $subscription = new Subscription;
        $subscription->forceFill([
            'user_id' => $user->id, 'provider' => 'google_play', 'provider_subscription_id' => 'member',
            'plan' => 'monthly', 'status' => 'active', 'starts_at' => now()->subDay(),
            'ends_at' => now()->addMinutes(5), 'verified_at' => now()->subDay(),
        ])->save();

        $this->assertTrue($this->service->hasUnlimitedHearts($user));
        $this->assertFalse($this->service->consumeHeart($user, 'mistake:uninitialized'));
        $this->assertDatabaseCount('user_gamification', 0);
        $state = $this->service->current($user);
        $anchor = now()->subMinutes(2);
        $state->forceFill(['hearts' => 1, 'hearts_updated_at' => $anchor])->save();
        $this->travel(1)->minutes();
        $this->assertFalse($this->service->consumeHeart($user, 'mistake:plus'));
        $this->assertSame(1, $state->fresh()->hearts);
        $this->assertTrue($state->fresh()->hearts_updated_at->equalTo($anchor));
        $snapshot = $this->service->snapshot($user);
        $this->assertTrue($snapshot['heartsUnlimited']);
        $this->assertSame(1, $snapshot['hearts']);
        $this->assertSame(120_000, $snapshot['nextHeartInMs']);
        $this->travel(2)->minutes();
        $this->assertSame(2, $this->service->snapshot($user)['hearts']);
        $this->assertTrue($state->fresh()->hearts_updated_at->equalTo($anchor->copy()->addMinutes(5)));
        $this->assertDatabaseCount('heart_events', 0);

        $this->travel(2)->minutes();
        $this->assertFalse($this->service->snapshot($user)['heartsUnlimited']);
        $this->assertTrue($this->service->consumeHeart($user, 'mistake:expired'));
        $this->assertSame(1, $state->fresh()->hearts);
        $this->assertTrue($state->fresh()->hearts_updated_at->equalTo(now()));
        $this->assertDatabaseCount('heart_events', 1);
    }

    public function test_unverified_subscription_keeps_free_heart_behavior(): void
    {
        $user = User::factory()->create();
        $subscription = new Subscription;
        $subscription->forceFill([
            'user_id' => $user->id, 'provider' => 'mayar', 'provider_subscription_id' => 'unverified',
            'plan' => 'monthly', 'status' => 'active', 'starts_at' => now()->subDay(), 'ends_at' => now()->addDay(),
        ])->save();
        $this->assertFalse($this->service->hasUnlimitedHearts($user));
        $this->assertTrue($this->service->consumeHeart($user, 'mistake:free'));
        $this->assertFalse($this->service->snapshot($user)['heartsUnlimited']);
        $this->assertSame(4, $this->service->snapshot($user)['hearts']);
        $this->assertDatabaseCount('heart_events', 1);
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
        Course::create(['id' => 'course', 'title' => 'Course', 'description' => '', 'level' => 'beginner', 'status' => 'published', 'content_revision' => 1, 'sort_order' => 0]);
        Unit::create(['id' => 'unit', 'course_id' => 'course', 'title' => 'Unit', 'description' => '', 'sort_order' => 0]);
        Lesson::create(['id' => 'lesson', 'unit_id' => 'unit', 'title' => 'Lesson', 'description' => '', 'completion_reward_xp' => 10, 'sort_order' => 0]);
        LessonStep::create(['id' => 'blockly', 'lesson_id' => 'lesson', 'type' => 'blockly', 'reward_xp' => 5, 'sort_order' => 0, 'content' => []]);

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
