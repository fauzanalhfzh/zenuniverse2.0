<?php

namespace App\Http\Controllers;

use App\Exceptions\LearningException;
use App\Http\Requests\UploadAvatarRequest;
use App\Models\Course;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Models\UserBadge;
use App\Services\Learning\GamificationService;
use App\Services\Profile\AvatarService;
use App\Support\Achievements;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request, GamificationService $gamification): Response
    {
        $user = $request->user();
        $snapshot = $gamification->snapshot($user);

        $completedLessonIds = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('lesson_id')
            ->all();

        $unlockedBadgeIds = UserBadge::query()
            ->where('user_id', $user->id)
            ->pluck('badge_key')
            ->all();

        $totalLessonCount = Course::query()
            ->where('status', 'published')
            ->with('units.lessons')
            ->get()
            ->flatMap(fn (Course $course) => $course->units->flatMap->lessons)
            ->count();

        $badges = array_map(
            fn (array $badge): array => [...$badge, 'unlocked' => in_array($badge['id'], $unlockedBadgeIds, true)],
            Achievements::all(),
        );

        return Inertia::render('profile', [
            'displayName' => $user->name,
            'avatarUrl' => $this->avatarUrl($user),
            'joinedAt' => $user->created_at?->toIso8601String(),
            'gamification' => [
                'totalXp' => $snapshot['totalXp'],
                'currentStreak' => $snapshot['currentStreak'],
                'longestStreak' => $snapshot['longestStreak'],
            ],
            'level' => $snapshot['level'],
            'completedLessonCount' => count(array_unique($completedLessonIds)),
            'totalLessonCount' => $totalLessonCount,
            'badges' => $badges,
            'unlockedBadgeIds' => $unlockedBadgeIds,
            'unlockedBadgeCount' => count($unlockedBadgeIds),
        ]);
    }

    public function updateAvatar(UploadAvatarRequest $request, AvatarService $avatars): RedirectResponse
    {
        $file = $request->file('avatar');

        if (! $file instanceof UploadedFile) {
            throw new LearningException('invalid_avatar', 'Avatar tidak ditemukan.', 422);
        }

        $avatars->update($request->user(), $file);

        return back();
    }

    private function avatarUrl(User $user): ?string
    {
        if ($user->avatar_path !== null) {
            return Storage::disk('public')->url($user->avatar_path);
        }

        return $user->provider_avatar_url;
    }
}
