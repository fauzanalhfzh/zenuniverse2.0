<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/profile')->assertStatus(401);
        $this->postJson('/profile/avatar', [])->assertStatus(401);
    }

    public function test_profile_payload_shape(): void
    {
        $user = User::factory()->create(['name' => 'Budi']);

        $this->actingAs($user)->get('/profile')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('profile')
                ->where('displayName', 'Budi')
                ->where('completedLessonCount', 0)
                ->where('unlockedBadgeCount', 0)
                ->has('level.current.name')
                ->has('gamification.totalXp')
                ->has('badges', 3)
            );
    }

    public function test_upload_avatar_stores_server_named_file(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('My Photo.png', 120, 120),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(302);

        $user->refresh();
        $this->assertNotNull($user->avatar_path);
        $this->assertStringStartsWith("avatars/{$user->id}/", (string) $user->avatar_path);
        $this->assertStringNotContainsString('My Photo', (string) $user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
    }

    public function test_fake_extension_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('evil.png', 10, 'text/plain'),
        ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'invalid_avatar');

        $this->assertNull($user->refresh()->avatar_path);
    }

    public function test_svg_and_oversized_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('icon.svg', 10, 'image/svg+xml'),
        ], ['Accept' => 'application/json'])->assertStatus(422);

        $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('big.png', 3000, 'image/png'),
        ], ['Accept' => 'application/json'])->assertStatus(422);

        $this->assertNull($user->refresh()->avatar_path);
    }

    public function test_invalid_upload_keeps_previous_avatar(): void
    {
        $user = User::factory()->create();
        Storage::disk('public')->put('avatars/old.png', 'old');
        $user->forceFill(['avatar_path' => 'avatars/old.png'])->save();

        $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('evil.png', 10, 'text/plain'),
        ], ['Accept' => 'application/json'])->assertStatus(422);

        Storage::disk('public')->assertExists('avatars/old.png');
        $this->assertSame('avatars/old.png', $user->refresh()->avatar_path);
    }

    public function test_new_avatar_replaces_previous_file(): void
    {
        $user = User::factory()->create();
        Storage::disk('public')->put('avatars/old.png', 'old');
        $user->forceFill(['avatar_path' => 'avatars/old.png'])->save();

        $this->actingAs($user)->post('/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('new.png', 64, 64),
        ], ['Accept' => 'application/json'])->assertStatus(302);

        $path = $user->refresh()->avatar_path;
        $this->assertNotNull($path);
        $this->assertNotSame('avatars/old.png', $path);
        Storage::disk('public')->assertMissing('avatars/old.png');
        Storage::disk('public')->assertExists($path);
    }
}
