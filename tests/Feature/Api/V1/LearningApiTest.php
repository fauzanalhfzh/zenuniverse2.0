<?php

namespace Tests\Feature\Api\V1;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\User;
use App\Services\Content\PublicId;
use App\Services\Learning\GamificationService;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LearningApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ContentSeeder::class);
    }

    private function learner(): User
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('test', ['learner'], now()->addDays(30))->plainTextToken);

        return $user;
    }

    private function lesson(): Lesson
    {
        $course = Course::where('status', 'published')->orderBy('sort_order')->firstOrFail();

        return $course->units()->orderBy('sort_order')->firstOrFail()->lessons()->orderBy('sort_order')->firstOrFail();
    }

    private function payload(LessonStep $step, array $answer): array
    {
        return ['lesson_id' => $step->lesson_id, 'step_id' => $step->id, 'attempt_id' => (string) Str::uuid(), 'content_revision' => 1, 'answer' => $answer];
    }

    public function test_catalog_lesson_and_progress_use_safe_published_allowlists(): void
    {
        $this->learner();
        $this->getJson('/api/v1/courses?per_page=1')->assertOk()->assertJsonCount(1, 'data')->assertJsonStructure(['meta' => ['requestId', 'pagination' => ['total', 'perPage', 'currentPage', 'lastPage']]]);
        $lesson = $this->lesson();
        $course = $lesson->unit->course;
        $this->getJson('/api/v1/courses/'.$course->id)->assertOk()->assertJsonPath('data.contentRevision', 1);
        $response = $this->getJson('/api/v1/lessons/'.$lesson->id)->assertOk();
        foreach (['validation', 'correctOptionId', 'expectedCode', 'acceptedAnswers'] as $private) {
            $this->assertStringNotContainsString('"'.$private.'"', $response->getContent());
        }
        $this->getJson('/api/v1/me/progress')->assertOk()->assertJsonPath('data.completedStepIds', []);
        $course->update(['status' => 'draft']);
        $this->getJson('/api/v1/courses/'.$course->id)->assertNotFound();
        $this->getJson('/api/v1/lessons/'.$lesson->id)->assertNotFound();
    }

    public function test_locked_reads_and_both_write_paths_are_rejected_with_no_rewards(): void
    {
        $this->learner();
        $first = $this->lesson();
        $locked = $first->unit->course->units->flatMap(fn ($unit) => $unit->lessons)->first(fn ($lesson) => $lesson->id !== $first->id);
        $this->assertNotNull($locked);
        $this->getJson('/api/v1/lessons/'.$locked->id)->assertForbidden()->assertJsonPath('error.code', 'lesson_locked');
        $step = $locked->steps()->firstOrFail();
        $this->postJson('/api/v1/learning/attempts', $this->payload($step, ['type' => $step->type->value]))->assertForbidden();
        $this->postJson('/api/v1/learning/lessons/'.$locked->id.'/complete', ['content_revision' => 1])->assertForbidden();
        $this->assertDatabaseCount('lesson_attempts', 0);
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_attempts_are_idempotent_revision_checked_and_owned(): void
    {
        $user = $this->learner();
        $quiz = $this->lesson()->steps()->where('type', 'quiz')->firstOrFail();
        $payload = $this->payload($quiz, ['type' => 'quiz', 'optionId' => PublicId::option(1, $quiz->id, $quiz->validation['correctOptionId'])]);
        $first = $this->postJson('/api/v1/learning/attempts', $payload)->assertOk()->assertJsonPath('data.result.correct', true);
        $this->postJson('/api/v1/learning/attempts', $payload)->assertOk()->assertJsonPath('data.progress.totalXp', $first->json('data.progress.totalXp'));
        $this->assertDatabaseCount('lesson_attempts', 1);
        $payload['answer']['optionId'] = 'other';
        $this->postJson('/api/v1/learning/attempts', $payload)->assertConflict()->assertJsonPath('error.code', 'attempt_conflict');
        $payload['content_revision'] = 99;
        $this->postJson('/api/v1/learning/attempts', $payload)->assertConflict()->assertJsonPath('error.code', 'content_changed');
        $other = $this->learner();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/me/progress')->assertOk()->assertJsonPath('data.completedStepIds', []);
        $this->assertNotSame($user->id, $other->id);
    }

    public function test_malformed_blockly_programs_are_rejected_without_side_effects(): void
    {
        $this->learner();
        $step = $this->lesson()->steps()->firstOrFail();
        $deep = ['type' => 'move_forward'];
        for ($i = 0; $i < 10; $i++) {
            $deep = ['type' => 'repeat', 'count' => 1, 'children' => [$deep]];
        }
        foreach ([[42], [['type' => 'repeat', 'count' => 1, 'children' => [42]]], [['type' => 'evil']], [['type' => 'repeat', 'count' => 101, 'children' => []]], [$deep]] as $commands) {
            $this->postJson('/api/v1/learning/attempts', $this->payload($step, ['type' => 'blockly', 'commands' => $commands]))->assertUnprocessable();
        }
        $this->assertDatabaseCount('lesson_attempts', 0);
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_private_quiz_option_ids_cannot_grant_rewards(): void
    {
        $this->learner();
        $quiz = $this->lesson()->steps()->where('type', 'quiz')->firstOrFail();
        $this->postJson('/api/v1/learning/attempts', $this->payload($quiz, [
            'type' => 'quiz', 'optionId' => $quiz->validation['correctOptionId'],
        ]))->assertOk()->assertJsonPath('data.result.correct', false)->assertJsonPath('data.xpAwarded', 0);
        $this->assertDatabaseCount('step_completions', 0);
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_incomplete_complete_cannot_grant_rewards_and_drafts_cannot_be_written(): void
    {
        $this->learner();
        $lesson = $this->lesson();
        $this->postJson('/api/v1/learning/lessons/'.$lesson->id.'/complete', ['content_revision' => 1])->assertOk()->assertJsonPath('data.completed', false)->assertJsonPath('data.xpAwarded', 0);
        $lesson->unit->course->update(['status' => 'draft']);
        $this->postJson('/api/v1/learning/lessons/'.$lesson->id.'/complete', ['content_revision' => 1])->assertNotFound();
        $step = $lesson->steps()->firstOrFail();
        $this->postJson('/api/v1/learning/attempts', $this->payload($step, ['type' => $step->type->value]))->assertNotFound();
        $this->assertDatabaseCount('xp_transactions', 0);
    }

    public function test_leaderboard_excludes_email_and_is_bounded(): void
    {
        $user = $this->learner();
        app(GamificationService::class)->current($user);
        $this->getJson('/api/v1/leaderboard?per_page=1')->assertOk()->assertJsonPath('data.0.displayName', $user->name)->assertJsonMissingPath('data.0.email')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/leaderboard?per_page=101')->assertUnprocessable();
        $this->getJson('/api/v1/courses?per_page=101')->assertUnprocessable();
    }
}
