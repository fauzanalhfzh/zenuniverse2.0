<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SubmitStepRequest;
use App\Http\Resources\Api\V1\ApiResource;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\LessonStep;
use App\Models\StepCompletion;
use App\Services\Content\LessonAccess;
use App\Services\Content\PublishedContent;
use App\Services\Learning\ProgressSnapshot;
use App\Services\Learning\SubmitAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LearningController
{
    public function __construct(private readonly PublishedContent $content, private readonly ProgressSnapshot $progress) {}

    private function pageSize(Request $request): int
    {
        $data = $request->validate(['per_page' => ['sometimes', 'integer', 'min:1', 'max:100'], 'page' => ['sometimes', 'integer', 'min:1', 'max:100000']]);
        return (int) ($data['per_page'] ?? 25);
    }

    private function page($paginator, array $items): ApiResource
    {
        return (new ApiResource($items))->additional(['meta' => ['pagination' => ['total' => $paginator->total(), 'perPage' => $paginator->perPage(), 'currentPage' => $paginator->currentPage(), 'lastPage' => $paginator->lastPage()]]]);
    }

    public function courses(Request $request): ApiResource
    {
        $page = Course::query()->where('status', 'published')->with('units.lessons')->orderBy('sort_order')->orderBy('id')->paginate($this->pageSize($request));
        $items = $page->getCollection()->map(fn (Course $course) => ['id' => $course->id, 'title' => $course->title, 'description' => $course->description, 'level' => $course->level, 'lessonCount' => $course->units->sum(fn ($unit) => $unit->lessons->count())])->all();
        return $this->page($page, $items);
    }

    public function course(Request $request, Course $course): ApiResource
    {
        abort_unless($course->status === 'published', 404);
        $ids = LessonCompletion::where('user_id', $request->user()->id)->pluck('lesson_id')->all();
        return new ApiResource($this->content->course($course, $ids));
    }

    public function lesson(Request $request, Lesson $lesson, LessonAccess $access): ApiResource
    {
        $access->ensure($request->user(), $lesson);
        $lessons = LessonCompletion::where('user_id', $request->user()->id)->pluck('lesson_id')->all();
        $steps = StepCompletion::where('user_id', $request->user()->id)->pluck('step_id')->all();
        return new ApiResource($this->content->lessonPayload($lesson, $lessons, $steps));
    }

    public function progress(Request $request): ApiResource
    {
        return new ApiResource($this->progress->forUser($request->user()));
    }

    public function attempt(SubmitStepRequest $request, SubmitAttempt $submit): ApiResource
    {
        $data = $request->validated();
        $step = LessonStep::findOrFail($data['step_id']);
        $outcome = $submit->handle($request->user(), $step, $data['lesson_id'], (int) $data['content_revision'], $data['attempt_id'], $data['answer']);
        return new ApiResource(['result' => ['correct' => $outcome['correct'], 'consumeHeart' => $outcome['consumeHeart'], 'feedback' => $outcome['feedback']], 'xpAwarded' => $outcome['xpAwarded'], 'completed' => $outcome['completed'], 'progress' => $this->progress->forUser($request->user())]);
    }

    public function complete(Request $request, Lesson $lesson, SubmitAttempt $submit): ApiResource
    {
        $data = $request->validate(['content_revision' => ['required', 'integer', 'min:1']]);
        $outcome = $submit->completeLesson($request->user(), $lesson, (int) $data['content_revision']);
        return new ApiResource([...$outcome, 'progress' => $this->progress->forUser($request->user())]);
    }

    public function leaderboard(Request $request): ApiResource
    {
        $page = DB::table('users')->join('user_gamification', 'user_gamification.user_id', '=', 'users.id')
            ->select('users.name', 'users.avatar_path', 'users.provider_avatar_url', 'user_gamification.total_xp')
            ->orderByDesc('user_gamification.total_xp')->orderBy('users.created_at')->orderBy('users.id')->paginate($this->pageSize($request));
        $items = $page->getCollection()->values()->map(fn ($row, $index) => ['rank' => ($page->currentPage() - 1) * $page->perPage() + $index + 1, 'displayName' => $row->name, 'avatarUrl' => $row->avatar_path ? url(Storage::disk('public')->url($row->avatar_path)) : $row->provider_avatar_url, 'totalXp' => (int) $row->total_xp])->all();
        return $this->page($page, $items);
    }
}
