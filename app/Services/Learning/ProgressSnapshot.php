<?php

namespace App\Services\Learning;

use App\Models\Course;
use App\Models\LessonCompletion;
use App\Models\StepCompletion;
use App\Models\User;

class ProgressSnapshot
{
    public function __construct(private readonly GamificationService $gamification) {}

    public function forUser(User $user): array
    {
        $snapshot = $this->gamification->snapshot($user);
        $completedLessonIds = LessonCompletion::query()->where('user_id', $user->id)->pluck('lesson_id')->all();
        $completedStepIds = StepCompletion::query()->where('user_id', $user->id)->pluck('step_id')->all();
        $courses = Course::query()->where('status', 'published')->with('units.lessons')->orderBy('sort_order')->get();
        $courseProgress = $courses->map(function (Course $course) use ($completedLessonIds): array {
            $lessonIds = $course->units->flatMap(fn ($unit) => $unit->lessons->pluck('id'))->all();
            $target = $course->planned_lesson_ids ?: $lessonIds;
            $completed = count(array_intersect($target, $completedLessonIds));
            $total = count($target);
            return ['courseId' => $course->id, 'title' => $course->title, 'completed' => $completed, 'total' => $total, 'percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0];
        })->values()->all();
        return [...$snapshot, 'completedLessonIds' => $completedLessonIds, 'completedStepIds' => $completedStepIds, 'courseProgress' => $courseProgress];
    }
}
