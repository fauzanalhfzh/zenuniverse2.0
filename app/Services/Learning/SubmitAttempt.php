<?php

namespace App\Services\Learning;

use App\Enums\StepType;
use App\Exceptions\LearningException;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAttempt;
use App\Models\LessonCompletion;
use App\Models\LessonStep;
use App\Models\StepCompletion;
use App\Models\User;
use App\Models\UserGamification;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use JsonException;

/**
 * Orchestrates a single step submission: verifies the answer, applies
 * idempotent rewards, and records the attempt. Serialized per user through a
 * row lock on their gamification state.
 */
class SubmitAttempt
{
    public function __construct(
        private readonly StepVerifier $verifier,
        private readonly GamificationService $gamification,
    ) {}

    /**
     * @param  array<string, mixed>  $answer
     * @return array{correct: bool, consumeHeart: bool, feedback: string, xpAwarded: int, completed: bool}
     *
     * @throws JsonException
     */
    public function handle(
        User $user,
        LessonStep $step,
        string $lessonId,
        int $contentRevision,
        string $attemptId,
        array $answer,
    ): array {
        $lesson = Lesson::query()->with('unit.course')->findOrFail($lessonId);

        if ($step->lesson_id !== $lesson->id) {
            throw new LearningException('invalid_step', 'Langkah tidak termasuk pelajaran ini.', 422);
        }

        $course = $lesson->unit->course;

        if ($course->status !== 'published') {
            throw new LearningException('not_found', 'Pelajaran tidak tersedia.', 404);
        }

        if ($contentRevision !== (int) $course->content_revision) {
            throw LearningException::contentChanged();
        }

        $payloadHash = hash('sha256', json_encode([
            'lesson' => $lesson->id,
            'step' => $step->id,
            'revision' => $contentRevision,
            'answer' => $answer,
        ], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($user, $step, $lesson, $course, $contentRevision, $attemptId, $answer, $payloadHash): array {
            $state = $this->lockState($user);

            $existing = LessonAttempt::query()
                ->where('user_id', $user->id)
                ->where('attempt_id', $attemptId)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $this->replay($existing, $step, $answer, $user, $lesson->id, $payloadHash);
            }

            if ($this->costsHeart($step) && $this->gamification->effectiveHearts($state)['hearts'] <= 0) {
                throw LearningException::noHearts();
            }

            $verification = $this->verifier->verify($step, $answer);
            $consumeHeart = false;
            $xpAwarded = 0;
            $date = $this->gamification->today();

            if ($verification->correct) {
                if ($this->gamification->completeStep($user, $lesson->id, $step->id, $contentRevision, (int) $step->reward_xp)) {
                    $xpAwarded += $this->gamification->award($user, (int) $step->reward_xp, 'step', "step:{$step->id}", $lesson->id);
                    $this->gamification->addDailyXp($user, $date, (int) $step->reward_xp);
                }

                $xpAwarded += $this->awardLessonAndCourse($user, $lesson, $course, $contentRevision, $date);

                $this->gamification->touchStreak($user, $date);
                $this->gamification->claimDailyBonus($user, $date);
                $this->gamification->syncBadges($user);
            } elseif ($verification->consumeHeart) {
                $consumeHeart = $this->gamification->consumeHeart($user, "mistake:{$attemptId}");
            }

            try {
                LessonAttempt::create([
                    'user_id' => $user->id,
                    'attempt_id' => $attemptId,
                    'lesson_id' => $lesson->id,
                    'step_id' => $step->id,
                    'content_revision' => $contentRevision,
                    'payload_hash' => $payloadHash,
                    'correct' => $verification->correct,
                    'consume_heart' => $consumeHeart,
                    'xp_awarded' => $xpAwarded,
                ]);
            } catch (QueryException $exception) {
                $raced = LessonAttempt::query()
                    ->where('user_id', $user->id)
                    ->where('attempt_id', $attemptId)
                    ->lockForUpdate()
                    ->first();

                if ($raced !== null) {
                    return $this->replay($raced, $step, $answer, $user, $lesson->id, $payloadHash);
                }

                throw $exception;
            }

            return [
                'correct' => $verification->correct,
                'consumeHeart' => $consumeHeart,
                'feedback' => $verification->feedback,
                'xpAwarded' => $xpAwarded,
                'completed' => $this->lessonCompleted($user, $lesson->id),
            ];
        }, 3);
    }

    /**
     * @return array{xpAwarded: int, completed: bool}
     */
    public function completeLesson(User $user, Lesson $lesson, int $contentRevision): array
    {
        $lesson->loadMissing('unit.course');
        $course = $lesson->unit->course;

        if ($course->status !== 'published') {
            throw new LearningException('not_found', 'Pelajaran tidak tersedia.', 404);
        }

        if ($contentRevision !== (int) $course->content_revision) {
            throw LearningException::contentChanged();
        }

        return DB::transaction(function () use ($user, $lesson, $course, $contentRevision): array {
            $this->lockState($user);
            $date = $this->gamification->today();
            $xpAwarded = $this->awardLessonAndCourse($user, $lesson, $course, $contentRevision, $date);

            if ($xpAwarded > 0) {
                $this->gamification->touchStreak($user, $date);
                $this->gamification->claimDailyBonus($user, $date);
                $this->gamification->syncBadges($user);
            }

            return [
                'xpAwarded' => $xpAwarded,
                'completed' => $this->lessonCompleted($user, $lesson->id),
            ];
        }, 3);
    }

    /**
     * @param  array<string, mixed>  $answer
     * @return array{correct: bool, consumeHeart: bool, feedback: string, xpAwarded: int, completed: bool}
     */
    private function replay(LessonAttempt $attempt, LessonStep $step, array $answer, User $user, string $lessonId, string $payloadHash): array
    {
        if ($attempt->payload_hash !== $payloadHash) {
            throw LearningException::attemptConflict();
        }

        $replay = $this->verifier->verify($step, $answer);

        return [
            'correct' => (bool) $attempt->correct,
            'consumeHeart' => (bool) $attempt->consume_heart,
            'feedback' => $replay->feedback,
            'xpAwarded' => (int) $attempt->xp_awarded,
            'completed' => $this->lessonCompleted($user, $lessonId),
        ];
    }

    private function awardLessonAndCourse(User $user, Lesson $lesson, Course $course, int $contentRevision, string $date): int
    {
        $stepIds = $lesson->steps()->pluck('id')->all();

        if ($stepIds === []) {
            return 0;
        }

        $completedSteps = StepCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('step_id', $stepIds)
            ->count();

        if ($completedSteps < count($stepIds)) {
            return 0;
        }

        $xp = 0;

        if ($this->gamification->completeLesson($user, $lesson->id, $contentRevision, (int) $lesson->completion_reward_xp)) {
            $xp += $this->gamification->award($user, (int) $lesson->completion_reward_xp, 'lesson', "lesson:{$lesson->id}", $lesson->id);
            $this->gamification->addDailyXp($user, $date, (int) $lesson->completion_reward_xp);
        }

        $planned = $course->planned_lesson_ids;

        if ($planned === null || $planned === []) {
            $planned = $course->units()->with('lessons')->get()
                ->flatMap(fn ($unit) => $unit->lessons->pluck('id'))
                ->all();
        }

        if ($planned === []) {
            return $xp;
        }

        $completedLessons = LessonCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $planned)
            ->count();

        if ($completedLessons >= count($planned)) {
            $bonus = $this->gamification->award(
                $user,
                GamificationRules::COURSE_COMPLETE_REWARD_XP,
                'course',
                "course:{$course->id}",
                $course->id,
            );

            if ($bonus > 0) {
                $xp += $bonus;
                $this->gamification->addDailyXp($user, $date, $bonus);
            }
        }

        return $xp;
    }

    private function lockState(User $user): UserGamification
    {
        $state = UserGamification::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->first();

        if ($state !== null) {
            return $state;
        }

        try {
            $this->gamification->current($user);
        } catch (QueryException) {
            // Another request created the row first; fall through to a locked read.
        }

        return UserGamification::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function costsHeart(LessonStep $step): bool
    {
        return $step->type !== StepType::Concept;
    }

    private function lessonCompleted(User $user, string $lessonId): bool
    {
        return LessonCompletion::query()
            ->where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->exists();
    }
}
