<?php

namespace Tests\Feature;

use App\Models\HeartSetting;
use App\Models\User;
use App\Models\UserGamification;
use App\Services\Learning\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HeartSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        return $user;
    }

    public function test_non_admin_is_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/admin/settings/hearts')->assertStatus(403);
        $this->actingAs($user)->putJson('/admin/settings/hearts', [
            'capacity' => 5,
            'regen_minutes' => 5,
            'version' => 1,
        ])->assertStatus(403);
    }

    public function test_show_returns_defaults(): void
    {
        $response = $this->actingAs($this->admin())->getJson('/admin/settings/hearts');

        $response->assertOk()
            ->assertJsonPath('capacity', 5)
            ->assertJsonPath('regenMinutes', 5)
            ->assertJsonPath('version', 1);
    }

    public function test_update_requires_matching_version(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->putJson('/admin/settings/hearts', [
            'capacity' => 7,
            'regen_minutes' => 10,
            'version' => 99,
        ])->assertStatus(409)->assertJsonPath('error.code', 'revision_conflict');

        $ok = $this->actingAs($admin)->putJson('/admin/settings/hearts', [
            'capacity' => 7,
            'regen_minutes' => 10,
            'version' => 1,
        ]);

        $ok->assertOk()->assertJsonPath('capacity', 7)->assertJsonPath('version', 2);
        $this->assertDatabaseHas('admin_audits', ['action' => 'hearts.settings_updated']);
    }

    public function test_update_validates_ranges(): void
    {
        $this->actingAs($this->admin())->putJson('/admin/settings/hearts', [
            'capacity' => 101,
            'regen_minutes' => 1441,
            'version' => 1,
        ])->assertStatus(422);
    }

    public function test_capacity_change_clamps_player_hearts(): void
    {
        $admin = $this->admin();
        $player = User::factory()->create();

        app(GamificationService::class)->snapshot($player);
        $this->assertSame(5, (int) UserGamification::where('user_id', $player->id)->value('hearts'));

        $this->actingAs($admin)->putJson('/admin/settings/hearts', [
            'capacity' => 3,
            'regen_minutes' => 5,
            'version' => 1,
        ])->assertOk();

        $hearts = (int) UserGamification::where('user_id', $player->id)->value('hearts');

        $this->assertSame(3, $hearts);
        $this->assertSame(3, (int) HeartSetting::current()->capacity);
    }
}
