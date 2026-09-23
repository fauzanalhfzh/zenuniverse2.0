<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LessonCompletion;
use App\Services\Content\PublishedContent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearnController extends Controller
{
    public function index(PublishedContent $content): Response
    {
        return Inertia::render('learn', [
            'courses' => $content->catalog(),
        ]);
    }

    public function dashboard(Request $request, PublishedContent $content): Response
    {
        $user = $request->user();
        $completedLessonIds = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->pluck('lesson_id')
            ->all();

        $courseId = $request->query('course');
        $course = Course::query()
            ->where('status', 'published')
            ->with('units.lessons')
            ->when(
                is_string($courseId) && $courseId !== '',
                fn ($query) => $query->whereKey($courseId),
                fn ($query) => $query->orderBy('id'),
            )
            ->firstOrFail();

        $active = $content->course($course, $completedLessonIds);

        return Inertia::render('dashboard', [
            'courses' => $content->catalog(),
            'active' => $active,
        ]);
    }
}
