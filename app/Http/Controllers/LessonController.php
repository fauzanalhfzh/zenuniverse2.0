<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\StepCompletion;
use App\Services\Content\LessonAccess;
use App\Services\Content\PublishedContent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LessonController extends Controller
{
    public function show(Request $request, Lesson $lesson, PublishedContent $content): Response
    {
        $lesson->loadMissing('unit.course', 'steps');

        $user = $request->user();
        app(LessonAccess::class)->ensure($user, $lesson);

        $completedLessonIds = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('lesson_id')
            ->all();

        $completedStepIds = StepCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('step_id')
            ->all();

        return Inertia::render('lesson/show', [
            'lesson' => $content->lessonPayload($lesson, $completedLessonIds, $completedStepIds),
        ]);
    }
}
