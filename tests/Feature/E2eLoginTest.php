<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class E2eLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_seam_is_hidden_when_disabled(): void
    {
        config()->set('zenuniverse.e2e.enabled', false);

        $this->get('/e2e/login')->assertStatus(404);
        $this->assertGuest();
    }

    public function test_seam_logs_in_when_enabled_in_testing(): void
    {
        config()->set('zenuniverse.e2e.enabled', true);

        $this->get('/e2e/login?email=e2e-runner@zenuniverse.test')
            ->assertRedirect('/dashboard');

        $this->assertAuthenticated();

        $user = User::where('email', 'e2e-runner@zenuniverse.test')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertFalse($user->is_admin);
    }

    public function test_seam_reuses_existing_user(): void
    {
        config()->set('zenuniverse.e2e.enabled', true);

        $existing = User::factory()->create(['email' => 'e2e-reuse@zenuniverse.test']);

        $this->get('/e2e/login?email=e2e-reuse@zenuniverse.test')->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($existing);
        $this->assertSame(1, User::where('email', 'e2e-reuse@zenuniverse.test')->count());
    }
}
