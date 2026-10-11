<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use App\Models\UserGamification;
use App\Services\Billing\Entitlement;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private function subscription(User $user, array $attributes = []): Subscription
    {
        $subscription = new Subscription;
        $subscription->forceFill([
            'user_id' => $user->id,
            'provider' => 'mayar',
            'provider_subscription_id' => 'member-1',
            'plan' => 'monthly',
            'status' => 'active',
            'starts_at' => '2026-10-01 00:00:00',
            'ends_at' => '2026-11-01 00:00:00',
            'verified_at' => '2026-10-01 00:00:00',
            ...$attributes,
        ])->save();

        return $subscription;
    }

    public function test_status_requires_session_or_learner_token(): void
    {
        $this->get('/me/subscription')->assertRedirect('/login');
        $this->get('/api/v1/me/subscription')->assertUnauthorized()->assertJsonPath('error.code', 'unauthenticated');
        $user = User::factory()->create();
        $this->actingAs($user)->getJson('/api/v1/me/subscription')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $token = $user->createToken('other', ['other'], now()->addDay());
        $this->withToken($token->plainTextToken)->getJson('/api/v1/me/subscription')->assertForbidden();
    }

    public function test_session_and_mobile_share_status_without_provider_secrets_or_other_users_access(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 10)->startOfDay());
        $user = User::factory()->create();
        $this->subscription(User::factory()->create());
        $this->actingAs($user)->getJson('/me/subscription')->assertOk()
            ->assertJsonPath('plusActive', false)->assertJsonPath('accessUntil', null)
            ->assertJsonPath('checkoutAvailable', false);
        $this->subscription($user, ['provider_subscription_id' => 'member-2']);
        $web = $this->getJson('/me/subscription')->assertOk()->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('plusActive', true)->assertJsonPath('accessUntil', '2026-11-01T00:00:00.000000Z')->json();
        $this->app['auth']->forgetGuards();
        $token = $user->createToken('android', ['learner'], now()->addDay());
        $this->withToken($token->plainTextToken)->getJson('/api/v1/me/subscription')->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')->assertJsonPath('data', $web)
            ->assertJsonStructure(['meta' => ['requestId']])->assertJsonMissingPath('data.provider_subscription_id');
    }

    public function test_web_and_mobile_status_expire_at_exact_boundary_without_revision_or_gamification_changes(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 31)->setTime(23, 59, 59));
        $user = User::factory()->create();
        $this->subscription($user);
        $state = UserGamification::create([
            'user_id' => $user->id,
            'total_xp' => 120,
            'current_streak' => 2,
            'longest_streak' => 3,
            'last_activity_date' => '2026-10-30',
            'hearts' => 1,
            'hearts_updated_at' => now()->subDay(),
        ]);
        $gamification = $state->fresh()->getAttributes();
        $token = $user->createToken('android', ['learner'], now()->addDay());

        foreach (['/me/subscription' => '', '/api/v1/me/subscription' => 'data.'] as $url => $prefix) {
            $this->travelTo(now()->setDate(2026, 10, 31)->setTime(23, 59, 59));
            $this->app['auth']->forgetGuards();
            if ($prefix === '') {
                $this->actingAs($user);
            } else {
                $this->withToken($token->plainTextToken);
            }

            $active = $this->getJson($url)->assertOk()
                ->assertHeader('Cache-Control', 'no-store, private')
                ->assertJsonPath($prefix.'plusActive', true)
                ->assertJsonPath($prefix.'accessUntil', '2026-11-01T00:00:00.000000Z')
                ->assertJsonPath($prefix.'evaluatedAt', '2026-10-31T23:59:59.000000Z');
            $this->assertSame($gamification, $state->fresh()->getAttributes());
            $this->assertDatabaseCount('xp_transactions', 0);

            $this->travelTo(now()->setDate(2026, 11, 1)->startOfDay());
            $this->getJson($url)->assertOk()
                ->assertHeader('Cache-Control', 'no-store, private')
                ->assertJsonPath($prefix.'plusActive', false)
                ->assertJsonPath($prefix.'accessUntil', null)
                ->assertJsonPath($prefix.'revision', $active->json($prefix.'revision'))
                ->assertJsonPath($prefix.'evaluatedAt', '2026-11-01T00:00:00.000000Z');
            $this->assertSame($gamification, $state->fresh()->getAttributes());
            $this->assertDatabaseCount('xp_transactions', 0);
        }
    }

    public static function states(): array
    {
        return [
            'active' => ['active', true], 'grace' => ['grace', true], 'canceled' => ['canceled', true],
            'pending' => ['pending', false], 'hold' => ['hold', false], 'paused' => ['paused', false],
            'expired' => ['expired', false], 'revoked' => ['revoked', false], 'unknown' => ['unknown', false],
        ];
    }

    #[DataProvider('states')]
    public function test_only_permitted_verified_states_grant_access(string $status, bool $expected): void
    {
        $this->travelTo(now()->setDate(2026, 10, 10)->startOfDay());
        $user = User::factory()->create();
        $this->subscription($user, ['status' => $status]);
        $this->assertSame($expected, app(Entitlement::class)->forUser($user)['plusActive']);
    }

    public function test_time_boundaries_unverified_and_future_verification_fail_closed(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 1)->startOfDay());
        $user = User::factory()->create();
        $subscription = $this->subscription($user, ['starts_at' => null, 'ends_at' => null]);
        $service = app(Entitlement::class);
        $this->assertFalse($service->forUser($user)['plusActive']);
        $subscription->starts_at = '2026-10-01 00:00:00';
        $subscription->ends_at = '2026-11-01 00:00:00';
        $subscription->verified_at = null;
        $subscription->save();
        $this->assertFalse($service->forUser($user)['plusActive']);
        $subscription->verified_at = '2026-10-02 00:00:00';
        $subscription->save();
        $this->assertFalse($service->forUser($user)['plusActive']);
        $subscription->verified_at = '2026-09-30 00:00:00';
        $subscription->save();
        $this->travelBack();
        $this->travelTo(now()->setDate(2026, 9, 30)->startOfDay());
        $this->assertFalse($service->forUser($user)['plusActive']);
        $this->travelTo(now()->setDate(2026, 10, 1)->startOfDay());
        $active = $service->forUser($user);
        $this->assertTrue($active['plusActive']);
        $this->travelTo(now()->setDate(2026, 11, 1)->startOfDay());
        $expired = $service->forUser($user);
        $this->assertFalse($expired['plusActive']);
        $this->assertNull($expired['accessUntil']);
        $this->assertSame($active['revision'], $expired['revision']);
        $this->assertNotSame($active['evaluatedAt'], $expired['evaluatedAt']);
    }

    public function test_sources_are_or_not_stacked_and_revoking_one_keeps_other_valid_source(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 10)->startOfDay());
        $user = User::factory()->create();
        $this->subscription($user);
        $play = $this->subscription($user, ['provider' => 'google_play', 'ends_at' => '2026-12-01 00:00:00']);
        $service = app(Entitlement::class);
        $this->assertSame('2026-12-01T00:00:00.000000Z', $service->forUser($user)['accessUntil']);
        $before = $service->forUser($user)['revision'];
        $play->status = 'revoked';
        $play->save();
        $this->assertTrue($service->forUser($user)['plusActive']);
        $this->assertSame('2026-11-01T00:00:00.000000Z', $service->forUser($user)['accessUntil']);
        $this->assertGreaterThan($before, $service->forUser($user)['revision']);
    }

    public static function invalidRecords(): array
    {
        return [
            'provider' => [['provider' => 'client']],
            'status' => [['status' => 'invented']],
            'plan' => [['plan' => 'lifetime']],
            'missing identity' => [['provider_subscription_id' => '']],
            'reversed period' => [['ends_at' => '2026-09-01 00:00:00']],
            'empty period' => [['ends_at' => '2026-10-01 00:00:00']],
            'incomplete period' => [['starts_at' => null]],
        ];
    }

    #[DataProvider('invalidRecords')]
    public function test_invalid_records_are_rejected(array $attributes): void
    {
        $user = User::factory()->create();
        $this->expectException(ValidationException::class);
        $this->subscription($user, $attributes);
    }

    public function test_provider_identity_cannot_be_claimed_by_another_user(): void
    {
        $this->subscription(User::factory()->create());
        $other = User::factory()->create();
        $this->expectException(QueryException::class);
        $this->subscription($other);
    }

    public function test_existing_ownership_cannot_be_transferred(): void
    {
        $subscription = $this->subscription(User::factory()->create());
        $subscription->user_id = User::factory()->create()->id;
        $this->expectException(ValidationException::class);
        $subscription->save();
    }

    public function test_periods_are_stored_in_utc(): void
    {
        $subscription = $this->subscription(User::factory()->create(), [
            'starts_at' => '2026-10-01T07:00:00+07:00',
            'ends_at' => '2026-11-01T07:00:00+07:00',
        ]);
        $this->assertSame('2026-10-01 00:00:00', $subscription->fresh()->getRawOriginal('starts_at'));
        $this->assertSame('2026-11-01 00:00:00', $subscription->fresh()->getRawOriginal('ends_at'));
    }

    public function test_status_endpoint_cannot_create_or_grant_subscriptions(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/me/subscription', ['status' => 'active'])->assertMethodNotAllowed();
        $this->assertDatabaseCount('subscriptions', 0);
    }
}
