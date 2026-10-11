<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\Subscription;
use App\Models\Unit;
use App\Models\User;
use App\Services\Content\PublicId;
use App\Services\Learning\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Course::create(['id' => 'course', 'title' => 'Course', 'description' => '', 'level' => 'beginner', 'status' => 'published', 'content_revision' => 1, 'sort_order' => 0]);
        Unit::create(['id' => 'unit', 'course_id' => 'course', 'title' => 'Unit', 'description' => '', 'sort_order' => 0]);
        foreach (['lesson', 'other-lesson'] as $index => $id) {
            Lesson::create(['id' => $id, 'unit_id' => 'unit', 'title' => 'Lesson', 'description' => '', 'completion_reward_xp' => 10, 'sort_order' => $index]);
        }
        LessonStep::create(['id' => 'quiz', 'lesson_id' => 'lesson', 'type' => 'quiz', 'reward_xp' => 5, 'sort_order' => 0,
            'content' => ['question' => 'Pick yes', 'options' => [['id' => 'yes', 'text' => 'Yes'], ['id' => 'no', 'text' => 'No']]],
            'validation' => ['correctOptionId' => 'yes'],
        ]);
        LessonStep::create(['id' => 'concept', 'lesson_id' => 'lesson', 'type' => 'concept', 'reward_xp' => 5, 'sort_order' => 1, 'content' => ['text' => 'Read']]);
    }

    private function publishedQuiz(): LessonStep
    {
        return LessonStep::query()
            ->where('type', 'quiz')
            ->whereHas('lesson.unit.course', fn ($query) => $query->where('status', 'published'))
            ->firstOrFail();
    }

    private function publicOptionId(LessonStep $quiz, string $rawId, int $revision = 1): string
    {
        return PublicId::option($revision, $quiz->id, $rawId);
    }

    private function publicWrongOptionId(LessonStep $quiz, int $revision = 1): string
    {
        return $this->publicOptionId($quiz, 'no', $revision);
    }

    /**
     * @param  array<string, mixed>  $answer
     * @return array<string, mixed>
     */
    private function payload(LessonStep $step, array $answer, string $attemptId, int $revision = 1): array
    {
        return [
            'lesson_id' => $step->lesson_id,
            'step_id' => $step->id,
            'attempt_id' => $attemptId,
            'content_revision' => $revision,
            'answer' => $answer,
        ];
    }

    public function test_correct_quiz_awards_xp_once(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $optionId = $this->publicOptionId($quiz, $quiz->validation['correctOptionId']);

        $response = $this->actingAs($user)->postJson('/learning/attempts', $this->payload(
            $quiz,
            ['type' => 'quiz', 'optionId' => $optionId],
            '11111111-1111-4111-8111-111111111111',
        ));

        $response->assertOk()
            ->assertJsonPath('result.correct', true)
            ->assertJsonPath('xpAwarded', (int) $quiz->reward_xp);

        $this->assertDatabaseHas('step_completions', [
            'user_id' => $user->id,
            'step_id' => $quiz->id,
        ]);
        $this->assertDatabaseCount('xp_transactions', 1);
    }

    public function test_replayed_attempt_does_not_award_twice(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $optionId = $this->publicOptionId($quiz, $quiz->validation['correctOptionId']);
        $attempt = '22222222-2222-4222-8222-222222222222';

        $this->actingAs($user)->postJson('/learning/attempts', $this->payload($quiz, ['type' => 'quiz', 'optionId' => $optionId], $attempt))->assertOk();
        $second = $this->actingAs($user)->postJson('/learning/attempts', $this->payload($quiz, ['type' => 'quiz', 'optionId' => $optionId], $attempt));

        $second->assertOk()->assertJsonPath('result.correct', true);

        $this->assertDatabaseCount('xp_transactions', 1);
        $this->assertDatabaseCount('lesson_attempts', 1);
    }

    public function test_reused_attempt_id_with_other_answer_conflicts(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $optionId = $this->publicOptionId($quiz, $quiz->validation['correctOptionId']);
        $attempt = '33333333-3333-4333-8333-333333333333';

        $this->actingAs($user)->postJson('/learning/attempts', $this->payload($quiz, ['type' => 'quiz', 'optionId' => $optionId], $attempt))->assertOk();

        $this->actingAs($user)
            ->postJson('/learning/attempts', $this->payload($quiz, ['type' => 'quiz', 'optionId' => 'other'], $attempt))
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'attempt_conflict');
    }

    public function test_wrong_answer_consumes_heart_without_xp(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $wrong = $this->publicWrongOptionId($quiz);

        $response = $this->actingAs($user)->postJson('/learning/attempts', $this->payload(
            $quiz,
            ['type' => 'quiz', 'optionId' => $wrong],
            '44444444-4444-4444-8444-444444444444',
        ));

        $response->assertOk()
            ->assertJsonPath('result.correct', false)
            ->assertJsonPath('result.consumeHeart', true)
            ->assertJsonPath('xpAwarded', 0);

        $this->assertDatabaseCount('heart_events', 1);
        $this->assertSame(4, $response->json('progress.hearts'));
    }

    public function test_zero_hearts_blocks_heart_consuming_step(): void
    {
        $user = User::factory()->create();
        $gamification = app(GamificationService::class);

        for ($i = 0; $i < 5; $i++) {
            $gamification->consumeHeart($user, "drain:{$i}");
        }

        $quiz = $this->publishedQuiz();

        $this->actingAs($user)->postJson('/learning/attempts', $this->payload(
            $quiz,
            ['type' => 'quiz', 'optionId' => $this->publicOptionId($quiz, $quiz->validation['correctOptionId'])],
            '55555555-5555-4555-8555-555555555555',
        ))->assertStatus(409)->assertJsonPath('error.code', 'no_hearts');
    }

    public function test_content_revision_mismatch_conflicts(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();

        $this->actingAs($user)->postJson('/learning/attempts', $this->payload(
            $quiz,
            ['type' => 'quiz', 'optionId' => $this->publicOptionId($quiz, $quiz->validation['correctOptionId'])],
            '66666666-6666-4666-8666-666666666666',
            revision: 99,
        ))->assertStatus(409)->assertJsonPath('error.code', 'content_changed');
    }

    public function test_step_from_another_lesson_is_rejected(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $otherLesson = Lesson::where('id', '!=', $quiz->lesson_id)->firstOrFail();

        $payload = $this->payload(
            $quiz,
            ['type' => 'quiz', 'optionId' => $this->publicOptionId($quiz, $quiz->validation['correctOptionId'])],
            '77777777-7777-4777-8777-777777777777',
        );
        $payload['lesson_id'] = $otherLesson->id;

        $this->actingAs($user)->postJson('/learning/attempts', $payload)->assertStatus(422);
    }

    public function test_completion_endpoint_awards_lesson_bonus(): void
    {
        $user = User::factory()->create();
        $gamification = app(GamificationService::class);
        $lesson = Lesson::query()
            ->whereHas('unit.course', fn ($query) => $query->where('status', 'published'))
            ->with('steps')
            ->firstOrFail();

        foreach ($lesson->steps as $step) {
            $gamification->completeStep($user, $lesson->id, $step->id, 1, (int) $step->reward_xp);
        }

        $response = $this->actingAs($user)->postJson("/learning/lessons/{$lesson->id}/complete", [
            'content_revision' => 1,
        ]);

        $response->assertOk()->assertJsonPath('completed', true);
        $this->assertDatabaseHas('lesson_completions', [
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
        ]);
    }

    public function test_progress_endpoint_shape(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/me/progress');

        $response->assertOk()
            ->assertJsonStructure([
                'totalXp',
                'hearts',
                'currentStreak',
                'badges',
                'level' => ['current' => ['name'], 'percent'],
                'dailyGoal' => ['progress', 'percent', 'claimed', 'remaining'],
                'completedLessonIds',
                'completedStepIds',
                'courseProgress' => [['courseId', 'title', 'completed', 'total', 'percent']],
            ]);
    }

    private function plus(User $user): Subscription
    {
        $subscription = new Subscription;
        $subscription->forceFill([
            'user_id' => $user->id, 'provider' => 'mayar', 'provider_subscription_id' => 'member-'.$user->id,
            'plan' => 'monthly', 'status' => 'active', 'starts_at' => now()->subDay(),
            'ends_at' => now()->addMinute(), 'verified_at' => now()->subDay(),
        ])->save();

        return $subscription;
    }

    public function test_plus_correct_and_wrong_answers_at_zero_hearts(): void
    {
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create();
        $this->plus($user);
        $state = app(GamificationService::class)->current($user);
        $state->forceFill(['hearts' => 0, 'hearts_updated_at' => now()])->save();
        $quiz = $this->publishedQuiz();

        $this->actingAs($user)->postJson('/learning/attempts', $this->payload($quiz,
            ['type' => 'quiz', 'optionId' => $this->publicWrongOptionId($quiz)],
            '88888888-8888-4888-8888-888888888888',
        ))->assertOk()->assertJsonPath('result.correct', false)->assertJsonPath('result.consumeHeart', false)
            ->assertJsonPath('xpAwarded', 0)->assertJsonPath('progress.hearts', 0)->assertJsonPath('progress.heartsUnlimited', true);
        $this->assertDatabaseCount('step_completions', 0);

        $this->postJson('/learning/attempts', $this->payload($quiz,
            ['type' => 'quiz', 'optionId' => $this->publicOptionId($quiz, 'yes')],
            '99999999-9999-4999-8999-999999999999',
        ))->assertOk()->assertJsonPath('result.correct', true)->assertJsonPath('result.consumeHeart', false)
            ->assertJsonPath('xpAwarded', 5)->assertJsonPath('progress.hearts', 0);
        $this->assertDatabaseCount('heart_events', 0);
        $this->assertDatabaseCount('xp_transactions', 1);
        $this->assertSame(0, $state->fresh()->hearts);
        $this->assertTrue($state->fresh()->hearts_updated_at->equalTo(now()));
    }

    public function test_free_mistake_replay_after_upgrade_keeps_original_deduction(): void
    {
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $payload = $this->payload($quiz, ['type' => 'quiz', 'optionId' => $this->publicWrongOptionId($quiz)], 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
        $this->actingAs($user)->postJson('/learning/attempts', $payload)->assertOk()->assertJsonPath('result.consumeHeart', true);
        $this->plus($user);
        $this->postJson('/learning/attempts', $payload)->assertOk()->assertJsonPath('result.consumeHeart', true)
            ->assertJsonPath('progress.hearts', 4)->assertJsonPath('progress.heartsUnlimited', true);
        $this->assertDatabaseCount('heart_events', 1);
        $this->assertDatabaseCount('lesson_attempts', 1);
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_plus_mistake_replay_after_expiry_keeps_original_result_and_conflict_check(): void
    {
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create();
        $this->plus($user);
        $state = app(GamificationService::class)->current($user);
        $state->forceFill(['hearts' => 0, 'hearts_updated_at' => now()])->save();
        $quiz = $this->publishedQuiz();
        $payload = $this->payload($quiz, ['type' => 'quiz', 'optionId' => $this->publicWrongOptionId($quiz)], 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
        $this->actingAs($user)->postJson('/learning/attempts', $payload)->assertOk()->assertJsonPath('result.consumeHeart', false);
        $this->travel(1)->minutes();
        $this->postJson('/learning/attempts', $payload)->assertOk()->assertJsonPath('result.consumeHeart', false)
            ->assertJsonPath('progress.hearts', 0)->assertJsonPath('progress.heartsUnlimited', false);
        $conflict = $payload;
        $conflict['answer']['optionId'] = $this->publicOptionId($quiz, 'yes');
        $this->postJson('/learning/attempts', $conflict)->assertStatus(409)->assertJsonPath('error.code', 'attempt_conflict');
        $payload['attempt_id'] = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
        $this->postJson('/learning/attempts', $payload)->assertStatus(409)->assertJsonPath('error.code', 'no_hearts');
        $this->assertDatabaseCount('heart_events', 0);
        $this->assertDatabaseCount('lesson_attempts', 1);
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_guest_cannot_submit_or_read_progress(): void
    {
        $this->getJson('/me/progress')->assertStatus(401);
        $this->postJson('/learning/attempts', [])->assertStatus(401);
    }
}
