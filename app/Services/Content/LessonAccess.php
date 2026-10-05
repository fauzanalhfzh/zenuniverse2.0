<?php

namespace App\Services\Content;

use App\Exceptions\LearningException;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;

class LessonAccess
{
    public function __construct(private readonly PublishedContent $content) {}

    public function ensure(User $user, Lesson $lesson): void
    {
        $lesson->loadMissing('unit.course');
        $course = $lesson->unit->course;
        if ($course->status !== 'published') {
            throw new LearningException('not_found', 'Pelajaran tidak tersedia.', 404);
        }
        $ids = LessonCompletion::query()->where('user_id', $user->id)->pluck('lesson_id')->all();
        if (! $this->content->isUnlocked($course, $lesson->id, $ids)) {
            throw new LearningException('lesson_locked', 'Selesaikan pelajaran sebelumnya.', 403);
        }
    }
}
