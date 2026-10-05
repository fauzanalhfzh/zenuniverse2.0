<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TokenAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_gets_json_envelope_even_without_accept_header(): void
    {
        $this->get('/api/v1/me')->assertUnauthorized()->assertJsonPath('error.code', 'unauthenticated')->assertJsonStructure(['meta' => ['requestId']]);
    }

    public function test_bearer_profile_is_safe_and_logout_only_revokes_current_device(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $first = $user->createToken('android', ['learner'], now()->addDays(30));
        $second = $user->createToken('ios', ['learner'], now()->addDays(30));
        $this->withToken($first->plainTextToken)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id)->assertJsonMissingPath('data.is_admin')->assertJsonMissingPath('data.password');
        $this->withToken($first->plainTextToken)->postJson('/api/v1/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withToken($first->plainTextToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($second->plainTextToken)->getJson('/api/v1/me')->assertOk();
        $this->withToken($second->plainTextToken)->getJson('/admin/courses')->assertUnauthorized();
    }

    public function test_expired_or_wrong_ability_tokens_and_session_are_rejected(): void
    {
        $user = User::factory()->create();
        $expired = $user->createToken('old', ['learner'], now()->subSecond());
        $this->withToken($expired->plainTextToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $wrong = $user->createToken('other', ['other'], now()->addDays(30));
        $this->withToken($wrong->plainTextToken)->getJson('/api/v1/me')->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'web')->withHeader('Authorization', '')->getJson('/api/v1/me')->assertUnauthorized();
    }
}
