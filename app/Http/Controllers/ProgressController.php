<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitStepRequest;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\LessonStep;
use App\Models\StepCompletion;
use App\Models\User;
use App\Services\Learning\GamificationService;
use App\Services\Learning\SubmitAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function __construct(private readonly GamificationService $gamification) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json($this->progressPayload($user), 200, ['Cache-Control' => 'no-store']);
    }

    public function attempt(SubmitStepRequest $request, SubmitAttempt $submitAttempt): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $step = LessonStep::query()->whereKey((string) $data['step_id'])->first();

        if (! $step instanceof LessonStep) {
            abort(404);
        }

        $outcome = $submitAttempt->handle(
            $user,
            $step,
            (string) $data['lesson_id'],
            (int) $data['content_revision'],
            (string) $data['attempt_id'],
            (array) $data['answer'],
        );

        return response()->json([
            'result' => [
                'correct' => $outcome['correct'],
                'consumeHeart' => $outcome['consumeHeart'],
                'feedback' => $outcome['feedback'],
            ],
            'xpAwarded' => $outcome['xpAwarded'],
            'completed' => $outcome['completed'],
            'progress' => $this->progressPayload($user),
        ]);
    }

    public function complete(Request $request, Lesson $lesson, SubmitAttempt $submitAttempt): JsonResponse
    {
        $data = $request->validate([
            'content_revision' => ['required', 'integer', 'min:1'],
        ]);

        $outcome = $submitAttempt->completeLesson($request->user(), $lesson, (int) $data['content_revision']);

        return response()->json([
            'xpAwarded' => $outcome['xpAwarded'],
            'completed' => $outcome['completed'],
            'progress' => $this->progressPayload($request->user()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function progressPayload(User $user): array
    {
        $snapshot = $this->gamification->snapshot($user);

        $completedLessonIds = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('lesson_id')
            ->all();

        $completedStepIds = StepCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('step_id')
            ->all();

        $courses = Course::query()
            ->where('status', 'published')
            ->with('units.lessons')
            ->orderBy('sort_order')
            ->get();

        $courseProgress = $courses->map(function (Course $course) use ($completedLessonIds): array {
            $lessonIds = $course->units->flatMap(fn ($unit) => $unit->lessons->pluck('id'))->all();
            $target = $course->planned_lesson_ids ?: $lessonIds;
            $completed = count(array_intersect($target, $completedLessonIds));
            $total = count($target);

            return [
                'courseId' => $course->id,
                'title' => $course->title,
                'completed' => $completed,
                'total' => $total,
                'percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ];
        })->values()->all();

        return [
            ...$snapshot,
            'completedLessonIds' => $completedLessonIds,
            'completedStepIds' => $completedStepIds,
            'courseProgress' => $courseProgress,
        ];
    }
}
