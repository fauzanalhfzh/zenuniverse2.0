<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use stdClass;

class LeaderboardController extends Controller
{
    private const PAGE_SIZE = 25;

    public function index(Request $request): Response
    {
        $viewer = $request->user();

        $base = DB::table('users')
            ->join('user_gamification', 'user_gamification.user_id', '=', 'users.id');

        $totalParticipants = (clone $base)->count();
        $totalPages = max(1, (int) ceil($totalParticipants / self::PAGE_SIZE));
        $page = min(max(1, (int) $request->query('page', 1)), $totalPages);

        $rows = (clone $base)
            ->select([
                'users.id',
                'users.name',
                'users.avatar_path',
                'users.provider_avatar_url',
                'users.created_at',
                'user_gamification.total_xp',
            ])
            ->orderByDesc('user_gamification.total_xp')
            ->orderBy('users.created_at')
            ->orderBy('users.id')
            ->forPage($page, self::PAGE_SIZE)
            ->get();

        $entries = $rows->values()->map(function (object $row, int $index) use ($viewer, $page): array {
            return [
                'rank' => (($page - 1) * self::PAGE_SIZE) + $index + 1,
                'userId' => $row->id,
                'displayName' => $row->name,
                'avatarUrl' => $this->avatarUrl($row),
                'totalXp' => (int) $row->total_xp,
                'isViewer' => $viewer !== null && (int) $row->id === $viewer->id,
            ];
        })->all();

        return Inertia::render('leaderboard', [
            'entries' => $entries,
            'page' => $page,
            'pageSize' => self::PAGE_SIZE,
            'totalParticipants' => $totalParticipants,
            'totalPages' => $totalPages,
            'viewerRank' => $this->viewerRank($viewer),
        ]);
    }

    private function viewerRank(?User $viewer): ?int
    {
        if ($viewer === null) {
            return null;
        }

        $state = DB::table('user_gamification')->where('user_id', $viewer->id)->first();

        if ($state === null) {
            return null;
        }

        $viewerCreatedAt = DB::table('users')->where('id', $viewer->id)->value('created_at');

        $higher = DB::table('users')
            ->join('user_gamification', 'user_gamification.user_id', '=', 'users.id')
            ->where(function ($query) use ($state, $viewerCreatedAt): void {
                $query->where('user_gamification.total_xp', '>', $state->total_xp)
                    ->orWhere(function ($tie) use ($state, $viewerCreatedAt): void {
                        $tie->where('user_gamification.total_xp', '=', $state->total_xp)
                            ->where(function ($tieBreak) use ($state, $viewerCreatedAt): void {
                                $tieBreak->where('users.created_at', '<', $viewerCreatedAt)
                                    ->orWhere(function ($sameCreated) use ($state, $viewerCreatedAt): void {
                                        $sameCreated->where('users.created_at', '=', $viewerCreatedAt)
                                            ->where('users.id', '<', $state->user_id);
                                    });
                            });
                    });
            })
            ->count();

        return $higher + 1;
    }

    private function avatarUrl(stdClass $row): ?string
    {
        if ($row->avatar_path !== null) {
            return Storage::disk('public')->url($row->avatar_path);
        }

        return $row->provider_avatar_url;
    }
}
