<?php

namespace App\Services\Content;

use App\Exceptions\LearningException;
use App\Models\AdminAudit;
use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\ReservedContentId;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Owns the admin authoring lifecycle: optimistic draft saves, validated
 * publication that updates the learner projection, id reservation, and audits.
 */
class CoursePublisher
{
    public function __construct(private readonly ContentValidator $validator) {}

    /**
     * @param  array<string, mixed>  $document
     */
    public function saveDraft(Course $course, array $document, User $actor, ?int $expectedRevision): CourseDraft
    {
        return DB::transaction(function () use ($course, $document, $actor, $expectedRevision): CourseDraft {
            $draft = CourseDraft::query()->where('course_id', $course->id)->lockForUpdate()->first();

            if ($draft === null) {
                if ($expectedRevision !== null && $expectedRevision !== 0) {
                    throw LearningException::revisionConflict();
                }

                $draft = CourseDraft::create([
                    'course_id' => $course->id,
                    'document' => $document,
                    'revision' => 1,
                    'updated_by' => $actor->id,
                ]);
            } else {
                if ($expectedRevision !== null && $expectedRevision !== (int) $draft->revision) {
                    throw LearningException::revisionConflict();
                }

                $draft->forceFill([
                    'document' => $document,
                    'revision' => (int) $draft->revision + 1,
                    'updated_by' => $actor->id,
                ])->save();
            }

            $this->audit($actor, 'course.draft_saved', $course->id, null, ['revision' => (int) $draft->revision]);

            return $draft->refresh();
        }, 3);
    }

    public function publish(Course $course, User $actor, int $expectedRevision): CourseRelease
    {
        return DB::transaction(function () use ($course, $actor, $expectedRevision): CourseRelease {
            $draft = CourseDraft::query()->where('course_id', $course->id)->lockForUpdate()->first();

            if ($draft === null) {
                throw new LearningException('no_draft', 'Belum ada draft untuk dipublikasikan.', 422);
            }

            if ($expectedRevision !== (int) $draft->revision) {
                throw LearningException::revisionConflict();
            }

            $document = $draft->document;
            $issues = $this->validator->validate($document);

            if ($issues !== []) {
                throw LearningException::invalidContent($issues);
            }

            $this->assertStructureUnchanged($course, $document);
            $this->assertNewIdsUnused($course, $document);

            $hash = hash('sha256', json_encode($document, JSON_THROW_ON_ERROR));

            $existing = CourseRelease::query()
                ->where('course_id', $course->id)
                ->where('hash', $hash)
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            $revision = (int) $course->content_revision + 1;

            $this->applyProjection($course, $document, $revision);
            $this->reserveIds($course, $document);

            $release = CourseRelease::create([
                'course_id' => $course->id,
                'revision' => $revision,
                'document' => $document,
                'hash' => $hash,
                'published_at' => now(),
                'actor_id' => $actor->id,
            ]);

            $this->audit($actor, 'course.published', $course->id, ['revision' => $revision - 1], ['revision' => $revision]);

            return $release;
        }, 3);
    }

    public function archive(Course $course, User $actor): Course
    {
        return $this->setStatus($course, $actor, 'archived', 'course.archived');
    }

    public function restore(Course $course, User $actor): Course
    {
        return $this->setStatus($course, $actor, 'published', 'course.restored');
    }

    public function delete(Course $course, User $actor): void
    {
        DB::transaction(function () use ($course, $actor): void {
            if (CourseRelease::query()->where('course_id', $course->id)->exists()) {
                throw new LearningException('locked_structure', 'Course yang pernah dipublikasikan tidak boleh dihapus.', 409);
            }

            $this->audit($actor, 'course.deleted', $course->id, ['title' => $course->title], null);
            $course->delete();
        }, 3);
    }

    /**
     * @return array<string, mixed>
     */
    public function preview(Course $course): array
    {
        $draft = CourseDraft::query()->where('course_id', $course->id)->first();

        if ($draft === null) {
            throw new LearningException('no_draft', 'Belum ada draft untuk dipratinjau.', 404);
        }

        return $draft->document;
    }

    private function setStatus(Course $course, User $actor, string $status, string $action): Course
    {
        return DB::transaction(function () use ($course, $actor, $status, $action): Course {
            $before = ['status' => $course->status];
            $course->forceFill(['status' => $status])->save();
            $this->audit($actor, $action, $course->id, $before, ['status' => $status]);

            return $course->refresh();
        }, 3);
    }

    /**
     * @param  array<string, mixed>  $document
     */
    private function assertStructureUnchanged(Course $course, array $document): void
    {
        $existing = DB::table('lesson_steps')
            ->join('lessons', 'lessons.id', '=', 'lesson_steps.lesson_id')
            ->join('units', 'units.id', '=', 'lessons.unit_id')
            ->where('units.course_id', $course->id)
            ->select([
                'lesson_steps.id',
                'lesson_steps.type',
                'lesson_steps.lesson_id',
                'lesson_steps.sort_order',
            ])
            ->get();

        if ($existing->isEmpty()) {
            return;
        }

        $documentSteps = [];

        foreach ($this->units($document) as $unit) {
            foreach ($this->lessons($unit) as $lesson) {
                foreach ($this->steps($lesson) as $index => $step) {
                    $documentSteps[(string) ($step['id'] ?? '')] = [
                        'type' => (string) ($step['type'] ?? ''),
                        'lesson_id' => (string) ($lesson['id'] ?? ''),
                        'sort_order' => $index,
                    ];
                }
            }
        }

        foreach ($existing as $step) {
            $doc = $documentSteps[(string) $step->id] ?? null;

            if ($doc === null
                || $doc['type'] !== (string) $step->type
                || $doc['lesson_id'] !== (string) $step->lesson_id
                || $doc['sort_order'] !== (int) $step->sort_order
            ) {
                throw LearningException::lockedStructure();
            }
        }
    }

    /**
     * @param  array<string, mixed>  $document
     */
    private function assertNewIdsUnused(Course $course, array $document): void
    {
        foreach ($this->allIds($document) as $id) {
            $reserved = ReservedContentId::query()->where('content_id', $id)->where('course_id', '!=', $course->id)->exists();

            if ($reserved) {
                throw LearningException::lockedStructure();
            }
        }
    }

    /**
     * @param  array<string, mixed>  $document
     */
    private function applyProjection(Course $course, array $document, int $revision): void
    {
        $course->forceFill([
            'title' => (string) $document['title'],
            'description' => (string) $document['description'],
            'level' => (string) $document['level'],
            'status' => 'published',
            'content_revision' => $revision,
            'planned_lesson_ids' => $document['plannedLessonIds'] ?? null,
        ])->save();

        foreach ($this->units($document) as $unitIndex => $unitData) {
            $unit = Unit::updateOrCreate(['id' => (string) $unitData['id']], [
                'course_id' => $course->id,
                'title' => (string) $unitData['title'],
                'description' => (string) $unitData['description'],
                'sort_order' => $unitIndex,
            ]);

            foreach ($this->lessons($unitData) as $lessonIndex => $lessonData) {
                $lesson = Lesson::updateOrCreate(['id' => (string) $lessonData['id']], [
                    'unit_id' => $unit->id,
                    'title' => (string) $lessonData['title'],
                    'description' => (string) $lessonData['description'],
                    'completion_reward_xp' => (int) ($lessonData['completionRewardXp'] ?? 0),
                    'sort_order' => $lessonIndex,
                ]);

                foreach ($this->steps($lessonData) as $stepIndex => $stepData) {
                    LessonStep::updateOrCreate(['id' => (string) $stepData['id']], [
                        'lesson_id' => $lesson->id,
                        'type' => (string) $stepData['type'],
                        'reward_xp' => (int) ($stepData['reward']['xp'] ?? 0),
                        'content' => is_array($stepData['content'] ?? null) ? $stepData['content'] : [],
                        'validation' => is_array($stepData['validation'] ?? null) ? $stepData['validation'] : null,
                        'challenge' => is_array($stepData['challenge'] ?? null) ? $stepData['challenge'] : null,
                        'sort_order' => $stepIndex,
                    ]);
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $document
     */
    private function reserveIds(Course $course, array $document): void
    {
        $rows = [];

        foreach ($this->units($document) as $unit) {
            $rows[] = ['kind' => 'unit', 'id' => (string) $unit['id']];

            foreach ($this->lessons($unit) as $lesson) {
                $rows[] = ['kind' => 'lesson', 'id' => (string) $lesson['id']];

                foreach ($this->steps($lesson) as $step) {
                    $rows[] = ['kind' => 'step', 'id' => (string) $step['id']];
                }
            }
        }

        foreach ($rows as $row) {
            ReservedContentId::firstOrCreate([
                'course_id' => $course->id,
                'content_id' => $row['id'],
            ], ['kind' => $row['kind']]);
        }
    }

    /**
     * @param  array<string, mixed>  $document
     * @return array<int, string>
     */
    private function allIds(array $document): array
    {
        $ids = [];

        foreach ($this->units($document) as $unit) {
            $ids[] = (string) $unit['id'];

            foreach ($this->lessons($unit) as $lesson) {
                $ids[] = (string) $lesson['id'];

                foreach ($this->steps($lesson) as $step) {
                    $ids[] = (string) $step['id'];
                }
            }
        }

        return $ids;
    }

    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    private function audit(User $actor, string $action, string $subjectId, ?array $before, ?array $after): void
    {
        AdminAudit::create([
            'actor_id' => $actor->id,
            'action' => $action,
            'subject_type' => Course::class,
            'subject_id' => $subjectId,
            'before' => $before,
            'after' => $after,
        ]);
    }

    /**
     * @param  array<string, mixed>  $document
     * @return array<int, array<string, mixed>>
     */
    private function units(array $document): array
    {
        return $this->list($document['units'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $unit
     * @return array<int, array<string, mixed>>
     */
    private function lessons(array $unit): array
    {
        return $this->list($unit['lessons'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $lesson
     * @return array<int, array<string, mixed>>
     */
    private function steps(array $lesson): array
    {
        return $this->list($lesson['steps'] ?? null);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function list(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter($value, 'is_array'));
    }
}
