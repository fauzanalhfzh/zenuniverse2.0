<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAttempt;
use App\Models\LessonStep;
use App\Models\Subscription;
use App\Models\Unit;
use App\Models\User;
use App\Services\Content\PublicId;
use App\Services\Content\PublishedContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PremiumAccessTest extends TestCase
{
    use RefreshDatabase;

    private function content(string $tier = 'plus'): void
    {
        Course::create(['id' => 'course', 'title' => 'Course', 'description' => '', 'level' => 'beginner', 'status' => 'published', 'access_tier' => $tier, 'content_revision' => 1, 'sort_order' => 0]);
        Unit::create(['id' => 'unit', 'course_id' => 'course', 'title' => 'Unit', 'description' => '', 'sort_order' => 0]);
        foreach (['lesson', 'next'] as $index => $id) {
            Lesson::create(['id' => $id, 'unit_id' => 'unit', 'title' => 'Lesson', 'description' => '', 'completion_reward_xp' => 10, 'sort_order' => $index]);
        }
        LessonStep::create(['id' => 'quiz', 'lesson_id' => 'lesson', 'type' => 'quiz', 'reward_xp' => 5, 'sort_order' => 0,
            'content' => ['question' => 'Pick yes', 'options' => [['id' => 'yes', 'label' => 'Yes'], ['id' => 'no', 'label' => 'No']], 'explanation' => 'Original feedback'],
            'validation' => ['correctOptionId' => 'yes'],
        ]);
    }

    private function subscription(User $user, string $state = 'active'): Subscription
    {
        $subscription = new Subscription;
        $subscription->forceFill(['user_id' => $user->id, 'provider' => 'mayar', 'provider_subscription_id' => 'premium-test', 'plan' => 'monthly', 'status' => 'active',
            'starts_at' => now()->subDay(), 'ends_at' => $state === 'expired' ? now() : now()->addDay(), 'verified_at' => $state === 'unverified' ? null : now()->subDay(),
        ])->save();

        return $subscription;
    }

    private function payload(): array
    {
        return ['lesson_id' => 'lesson', 'step_id' => 'quiz', 'attempt_id' => '11111111-1111-4111-8111-111111111111', 'content_revision' => 1,
            'answer' => ['type' => 'quiz', 'optionId' => PublicId::option(1, 'quiz', 'yes')]];
    }

    public static function accessCases(): array
    {
        $cases = [];
        foreach (['web', 'mobile'] as $client) {
            foreach (['none', 'active', 'expired', 'unverified'] as $state) {
                foreach (['free', 'plus'] as $tier) {
                    $cases["$client $tier $state"] = [$client, $tier, $state];
                }
            }
        }

        return $cases;
    }

    private function authenticate(User $user, string $client): void
    {
        if ($client === 'web') {
            $this->actingAs($user);
        } else {
            $token = $user->createToken('mobile', ['learner'], now()->addDay());
            $this->withToken($token->plainTextToken);
        }
    }

    #[DataProvider('accessCases')]
    public function test_reads_and_writes_follow_entitlement(string $client, string $tier, string $state): void
    {
        $this->travelTo(now()->setDate(2026, 10, 10)->startOfDay());
        $this->content($tier);
        $user = User::factory()->create();
        if ($state !== 'none') {
            $this->subscription($user, $state);
        }
        $this->authenticate($user, $client);
        $prefix = $client === 'mobile' ? '/api/v1' : '';
        $allowed = $tier === 'free' || $state === 'active';
        $read = $this->getJson($client === 'mobile' ? '/api/v1/lessons/lesson' : '/lesson/lesson');
        $write = $this->postJson("$prefix/learning/attempts", $this->payload());
        if ($allowed) {
            $read->assertOk();
            $write->assertOk();
            $this->assertStringNotContainsString('correctOptionId', $read->getContent());
            $this->assertStringNotContainsString('Original feedback', $read->getContent());
            $this->getJson($client === 'mobile' ? '/api/v1/lessons/next' : '/lesson/next')->assertOk();
        } else {
            $read->assertForbidden()->assertJsonPath('error.code', 'plus_required');
            $write->assertForbidden()->assertJsonPath('error.code', 'plus_required');
            $this->postJson("$prefix/learning/lessons/lesson/complete", ['content_revision' => 1])->assertForbidden()->assertJsonPath('error.code', 'plus_required');
            foreach (['lesson_attempts', 'step_completions', 'lesson_completions', 'xp_transactions', 'user_gamification'] as $table) {
                $this->assertDatabaseCount($table, 0);
            }
        }
    }

    public function test_plus_does_not_bypass_prerequisite_and_catalog_exposes_only_tier(): void
    {
        $this->content();
        $user = User::factory()->create();
        $this->subscription($user);
        $this->actingAs($user)->getJson('/lesson/next')->assertForbidden()->assertJsonPath('error.code', 'lesson_locked');
        $this->postJson('/learning/lessons/next/complete', ['content_revision' => 1])->assertForbidden()->assertJsonPath('error.code', 'lesson_locked');
        $this->app['auth']->forgetGuards();
        $this->authenticate($user, 'mobile');
        $this->getJson('/api/v1/lessons/next')->assertForbidden()->assertJsonPath('error.code', 'lesson_locked');
        $this->getJson('/api/v1/courses')->assertOk()->assertJsonPath('data.0.accessTier', 'plus');
        $this->getJson('/api/v1/courses/course')->assertOk()->assertJsonPath('data.accessTier', 'plus')->assertJsonMissingPath('data.units.0.lessons.0.steps');
        $catalog = app(PublishedContent::class)->catalog();
        $this->assertSame('plus', $catalog[0]['accessTier']);
    }

    public function test_attempt_id_from_another_account_cannot_bypass_plus(): void
    {
        $this->content();
        $owner = User::factory()->create();
        $this->subscription($owner);
        $this->actingAs($owner)->postJson('/learning/attempts', $this->payload())->assertOk();
        $this->actingAs(User::factory()->create())->postJson('/learning/attempts', $this->payload())
            ->assertForbidden()->assertJsonPath('error.code', 'plus_required');
        $this->assertDatabaseCount('lesson_attempts', 1);
    }

    public static function clients(): array
    {
        return [['web'], ['mobile']];
    }

    #[DataProvider('clients')]
    public function test_accepted_replay_survives_expiry_and_revision_without_new_feedback_or_rewards(string $client): void
    {
        $this->content();
        $user = User::factory()->create();
        $subscription = $this->subscription($user);
        $payload = $this->payload();
        $this->authenticate($user, $client);
        $endpoint = $client === 'mobile' ? '/api/v1/learning/attempts' : '/learning/attempts';
        $root = $client === 'mobile' ? 'data.' : '';
        $first = $this->postJson($endpoint, $payload)->assertOk()->json($client === 'mobile' ? 'data' : null);
        $count = DB::table('xp_transactions')->count();
        $subscription->forceFill(['ends_at' => now()])->save();
        $this->postJson($endpoint, $payload)->assertOk()->assertJsonPath($root.'result', $first['result'])->assertJsonPath($root.'xpAwarded', $first['xpAwarded']);
        $conflict = $payload;
        $conflict['answer']['optionId'] = 'other';
        $this->postJson($endpoint, $conflict)->assertConflict()->assertJsonPath('error.code', 'attempt_conflict');
        Course::whereKey('course')->update(['content_revision' => 2]);
        $step = LessonStep::findOrFail('quiz');
        $content = $step->content;
        $content['explanation'] = 'New private feedback';
        $step->update(['content' => $content]);
        $this->postJson($endpoint, $payload)->assertOk()->assertJsonPath($root.'result', $first['result']);
        $this->postJson($endpoint, $conflict)->assertConflict()->assertJsonPath('error.code', 'content_changed');
        $new = $payload;
        $new['attempt_id'] = '22222222-2222-4222-8222-222222222222';
        $this->postJson($endpoint, $new)->assertConflict()->assertJsonPath('error.code', 'content_changed');
        $new['content_revision'] = 2;
        $this->postJson($endpoint, $new)->assertForbidden()->assertJsonPath('error.code', 'plus_required');
        $this->assertDatabaseCount('xp_transactions', $count);
        $this->assertDatabaseCount('lesson_attempts', 1);
        LessonAttempt::query()->update(['response' => null]);
        $this->postJson($endpoint, $payload)->assertConflict()->assertJsonPath('error.code', 'content_changed');
    }
}
