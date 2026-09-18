<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DuplicateCourseRequest;
use App\Http\Requests\PublishCourseRequest;
use App\Http\Requests\SaveDraftRequest;
use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Services\Content\CoursePublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(private readonly CoursePublisher $publisher) {}

    public function index(): JsonResponse
    {
        $courses = Course::query()
            ->withCount('units')
            ->orderBy('sort_order')
            ->get()
            ->map(function (Course $course): array {
                $draft = CourseDraft::query()->where('course_id', $course->id)->first();

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status,
                    'contentRevision' => (int) $course->content_revision,
                    'draftRevision' => $draft !== null ? (int) $draft->revision : null,
                    'unitCount' => (int) $course->units_count,
                ];
            })
            ->all();

        return response()->json(['courses' => $courses]);
    }

    public function show(Course $course): JsonResponse
    {
        $draft = CourseDraft::query()->where('course_id', $course->id)->first();

        $releases = CourseRelease::query()
            ->where('course_id', $course->id)
            ->orderByDesc('revision')
            ->get()
            ->map(fn (CourseRelease $release): array => [
                'revision' => (int) $release->revision,
                'hash' => $release->hash,
                'publishedAt' => $release->published_at->toIso8601String(),
            ])
            ->all();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
                'contentRevision' => (int) $course->content_revision,
            ],
            'draft' => $draft?->document,
            'draftRevision' => $draft !== null ? (int) $draft->revision : null,
            'releases' => $releases,
        ]);
    }

    public function updateDraft(SaveDraftRequest $request, Course $course): JsonResponse
    {
        $data = $request->validated();

        $draft = $this->publisher->saveDraft(
            $course,
            $data['document'],
            $request->user(),
            isset($data['expected_revision']) ? (int) $data['expected_revision'] : null,
        );

        return response()->json(['revision' => (int) $draft->revision]);
    }

    public function publish(PublishCourseRequest $request, Course $course): JsonResponse
    {
        $data = $request->validated();

        $release = $this->publisher->publish($course, $request->user(), (int) $data['expected_revision']);

        return response()->json([
            'revision' => (int) $release->revision,
            'publishedAt' => $release->published_at->toIso8601String(),
        ]);
    }

    public function preview(Course $course): JsonResponse
    {
        return response()->json(['document' => $this->publisher->preview($course)]);
    }

    public function archive(Request $request, Course $course): JsonResponse
    {
        $this->publisher->archive($course, $request->user());

        return response()->json(['status' => 'archived']);
    }

    public function restore(Request $request, Course $course): JsonResponse
    {
        $this->publisher->restore($course, $request->user());

        return response()->json(['status' => 'published']);
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $this->publisher->delete($course, $request->user());

        return response()->json(['deleted' => true]);
    }

    public function duplicate(DuplicateCourseRequest $request, Course $course): JsonResponse
    {
        $data = $request->validated();

        $copy = $this->publisher->duplicate(
            $course,
            (string) $data['new_id'],
            $request->user(),
            isset($data['title']) ? (string) $data['title'] : null,
        );

        return response()->json(['id' => $copy->id, 'status' => $copy->status], 201);
    }
}
