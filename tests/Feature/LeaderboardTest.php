<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserGamification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    private function player(string $name, int $totalXp, ?Carbon $createdAt = null): User
    {
        $user = User::factory()->create(['name' => $name]);

        if ($createdAt !== null) {
            $user->forceFill(['created_at' => $createdAt])->save();
        }

        UserGamification::create([
            'user_id' => $user->id,
            'total_xp' => $totalXp,
        ]);

        return $user;
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/leaderboard')->assertStatus(401);
    }

    public function test_orders_by_total_xp_desc(): void
    {
        $low = $this->player('Low', 10);
        $high = $this->player('High', 500);
        $mid = $this->player('Mid', 100);

        $this->actingAs($high)->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('leaderboard')
                ->where('entries.0.displayName', 'High')
                ->where('entries.0.rank', 1)
                ->where('entries.1.displayName', 'Mid')
                ->where('entries.2.displayName', 'Low')
                ->where('totalParticipants', 3)
                ->where('viewerRank', 1)
            );

        $this->assertNotNull($mid);
        $this->assertNotNull($low);
    }

    public function test_ties_break_by_created_at_then_id(): void
    {
        $older = $this->player('Older', 100, Carbon::parse('2026-01-01 00:00:00'));
        $newer = $this->player('Newer', 100, Carbon::parse('2026-02-01 00:00:00'));

        $this->actingAs($newer)->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('entries.0.displayName', 'Older')
                ->where('entries.1.displayName', 'Newer')
                ->where('viewerRank', 2)
            );

        $this->assertNotNull($older);
    }

    public function test_viewer_rank_works_outside_the_visible_page(): void
    {
        for ($index = 0; $index < 27; $index++) {
            $this->player("Player {$index}", 1000 - $index);
        }

        $viewer = $this->player('Viewer', 0);

        $this->actingAs($viewer)->get('/leaderboard?page=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('viewerRank', 28)
                ->where('totalParticipants', 28)
                ->has('entries', 25)
            );
    }

    public function test_zero_xp_players_are_listed(): void
    {
        $zero = $this->player('Zero', 0);

        $this->actingAs($zero)->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('entries.0.displayName', 'Zero')
                ->where('entries.0.totalXp', 0)
            );
    }

    public function test_viewer_without_activity_has_null_rank(): void
    {
        $this->player('Someone', 50);
        $lurker = User::factory()->create(['name' => 'Lurker']);

        $this->actingAs($lurker)->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('viewerRank', null));
    }

    public function test_email_is_never_exposed(): void
    {
        $user = $this->player('Secret', 10);
        $user->forceFill(['email' => 'private-address@zen.id'])->save();

        $response = $this->actingAs($user)->get('/leaderboard');

        $this->assertStringNotContainsString('private-address@zen.id', $response->getContent());
    }
}
