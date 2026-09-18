<?php

namespace Tests\Feature;

use App\Models\OauthAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.google', [
            'client_id' => 'test-client',
            'client_secret' => 'test-secret',
            'redirect' => url('/auth/google/callback'),
        ]);
    }

    private function fakeProvider(SocialiteUser $googleUser): void
    {
        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('user')->andReturn($googleUser);
        $provider->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }

    private function fakeGoogleUser(string $id, string $email, string $name): SocialiteUser
    {
        $user = Mockery::mock(SocialiteUser::class);
        $user->shouldReceive('getId')->andReturn($id);
        $user->shouldReceive('getEmail')->andReturn($email);
        $user->shouldReceive('getName')->andReturn($name);
        $user->shouldReceive('getAvatar')->andReturn(null);

        return $user;
    }

    public function test_redirect_sends_user_to_google(): void
    {
        $this->fakeProvider($this->fakeGoogleUser('google-123', 'budi@zen.id', 'Budi'));

        $response = $this->get('/auth/google/redirect');

        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location'));
    }

    public function test_callback_creates_account_for_new_google_identity(): void
    {
        $this->fakeProvider($this->fakeGoogleUser('google-123', 'budi@zen.id', 'Budi'));

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect('/');
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'budi@zen.id']);
        $this->assertDatabaseHas('oauth_accounts', [
            'provider' => 'google',
            'provider_subject' => 'google-123',
        ]);
    }

    public function test_callback_reuses_account_for_existing_google_identity(): void
    {
        $this->fakeProvider($this->fakeGoogleUser('google-123', 'budi@zen.id', 'Budi'));
        $this->get('/auth/google/callback');
        $userId = User::where('email', 'budi@zen.id')->value('id');

        $this->get('/auth/google/callback');

        $this->assertSame(1, User::count());
        $this->assertSame(1, OauthAccount::count());
        $this->assertAuthenticatedAs(User::find($userId));
    }

    public function test_callback_does_not_auto_link_different_subject_same_email(): void
    {
        $existing = User::factory()->create(['email' => 'budi@zen.id']);
        OauthAccount::create([
            'user_id' => $existing->id,
            'provider' => 'google',
            'provider_subject' => 'google-first',
        ]);

        $this->fakeProvider($this->fakeGoogleUser('google-second', 'budi@zen.id', 'Budi Lain'));
        $response = $this->get('/auth/google/callback');

        $response->assertRedirect('/login');
        $this->assertGuest();
        $this->assertSame(1, User::count());
    }

    public function test_logout_invalidates_session(): void
    {
        $this->fakeProvider($this->fakeGoogleUser('google-123', 'budi@zen.id', 'Budi'));
        $this->get('/auth/google/callback');
        $this->assertAuthenticated();

        $response = $this->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }
}
