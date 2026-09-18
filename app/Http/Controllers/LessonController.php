<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\StepCompletion;
use App\Services\Content\PublishedContent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LessonController extends Controller
{
    public function show(Request $request, Lesson $lesson, PublishedContent $content): Response
    {
        $lesson->loadMissing('unit.course', 'steps');

        $course = $lesson->unit->course;

        if ($course->status !== 'published') {
            abort(404);
        }

        $user = $request->user();

        $completedLessonIds = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('lesson_id')
            ->all();

        if (! $content->isUnlocked($course, $lesson->id, $completedLessonIds)) {
            abort(403);
        }

        $completedStepIds = StepCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('step_id')
            ->all();

        return Inertia::render('lesson/show', [
            'lesson' => $content->lessonPayload($lesson, $completedLessonIds, $completedStepIds),
        ]);
    }
}
