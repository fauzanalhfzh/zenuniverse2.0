<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserGamification;
use App\Services\Learning\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlayerHeartsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        return $user;
    }

    private function player(): User
    {
        $player = User::factory()->create();
        app(GamificationService::class)->snapshot($player);

        return $player;
    }

    public function test_non_admin_is_forbidden(): void
    {
        $player = $this->player();

        $this->actingAs(User::factory()->create())->postJson("/admin/players/{$player->id}/hearts", [
            'delta' => -1,
            'reason' => 'test',
            'adjustment_id' => '11111111-1111-4111-8111-111111111111',
        ])->assertStatus(403);
    }

    public function test_adjustment_moves_hearts_and_audits(): void
    {
        $admin = $this->admin();
        $player = $this->player();

        $response = $this->actingAs($admin)->postJson("/admin/players/{$player->id}/hearts", [
            'delta' => -2,
            'reason' => 'duplicate reward rollback',
            'adjustment_id' => '22222222-2222-4222-8222-222222222222',
        ]);

        $response->assertOk()->assertJsonPath('hearts', 3)->assertJsonPath('delta', -2);
        $this->assertSame(3, (int) UserGamification::where('user_id', $player->id)->value('hearts'));
        $this->assertDatabaseHas('admin_audits', ['action' => 'hearts.player_adjusted', 'subject_id' => (string) $player->id]);
    }

    public function test_adjustment_is_idempotent(): void
    {
        $admin = $this->admin();
        $player = $this->player();

        $payload = [
            'delta' => -1,
            'reason' => 'manual',
            'adjustment_id' => '33333333-3333-4333-8333-333333333333',
        ];

        $this->actingAs($admin)->postJson("/admin/players/{$player->id}/hearts", $payload)->assertOk()->assertJsonPath('hearts', 4);
        $this->actingAs($admin)->postJson("/admin/players/{$player->id}/hearts", $payload)->assertOk()->assertJsonPath('delta', 0);

        $this->assertSame(4, (int) UserGamification::where('user_id', $player->id)->value('hearts'));
        $this->assertDatabaseCount('heart_events', 1);
    }

    public function test_adjustment_clamps_to_capacity_and_zero(): void
    {
        $admin = $this->admin();
        $player = $this->player();

        $this->actingAs($admin)->postJson("/admin/players/{$player->id}/hearts", [
            'delta' => 100,
            'reason' => 'gift',
            'adjustment_id' => '44444444-4444-4444-8444-444444444444',
        ])->assertOk()->assertJsonPath('hearts', 5);

        $this->actingAs($admin)->postJson("/admin/players/{$player->id}/hearts", [
            'delta' => -100,
            'reason' => 'reset',
            'adjustment_id' => '55555555-5555-4555-8555-555555555555',
        ])->assertOk()->assertJsonPath('hearts', 0);
    }

    public function test_expected_hearts_mismatch_conflicts(): void
    {
        $admin = $this->admin();
        $player = $this->player();

        $this->actingAs($admin)->postJson("/admin/players/{$player->id}/hearts", [
            'delta' => -1,
            'reason' => 'stale',
            'adjustment_id' => '66666666-6666-4666-8666-666666666666',
            'expected_hearts' => 1,
        ])->assertStatus(409)->assertJsonPath('error.code', 'revision_conflict');
    }

    public function test_delta_bounds_are_validated(): void
    {
        $player = $this->player();

        $this->actingAs($this->admin())->postJson("/admin/players/{$player->id}/hearts", [
            'delta' => 500,
            'reason' => 'too much',
            'adjustment_id' => '77777777-7777-4777-8777-777777777777',
        ])->assertStatus(422);
    }
}
