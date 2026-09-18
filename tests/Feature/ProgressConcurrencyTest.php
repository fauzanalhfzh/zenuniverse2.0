<?php

namespace Tests\Feature;

use App\Models\HeartEvent;
use App\Models\LessonAttempt;
use App\Models\LessonStep;
use App\Models\StepCompletion;
use App\Models\User;
use App\Models\UserGamification;
use App\Models\XpTransaction;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Symfony\Component\Process\Process;
use Tests\TestCase;

/**
 * Runs real parallel processes against a dedicated MySQL test database to prove
 * that row locks and unique event keys keep rewards idempotent.
 */
class ProgressConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        $connection = getenv('DB_CONNECTION') ?: 'sqlite';
        $database = getenv('DB_DATABASE') ?: '';

        if ($connection !== 'mysql' || ! str_ends_with($database, '_test')) {
            $this->markTestSkipped('Requires a dedicated MySQL *_test database.');
        }

        parent::setUp();

        $this->seed(ContentSeeder::class);
    }

    private function publishedQuiz(): LessonStep
    {
        return LessonStep::query()
            ->where('type', 'quiz')
            ->whereHas('lesson.unit.course', fn ($query) => $query->where('status', 'published'))
            ->firstOrFail();
    }

    /**
     * @param  array<int, array{user: User, step: LessonStep, attempt: string, optionId: string}>  $calls
     */
    private array $lastOutputs = [];

    private function runConcurrently(array $calls): void
    {
        $processes = [];

        foreach ($calls as $call) {
            $process = new Process([
                PHP_BINARY,
                base_path('tests/Support/concurrent-submit.php'),
                (string) $call['user']->id,
                $call['step']->id,
                $call['step']->lesson_id,
                '1',
                $call['attempt'],
                $call['optionId'],
            ]);
            $process->setTimeout(60);
            $process->start();
            $processes[] = $process;
        }

        foreach ($processes as $process) {
            $process->wait();
            $this->lastOutputs[] = trim($process->getOutput().$process->getErrorOutput());
            $this->assertTrue($process->isSuccessful(), $process->getErrorOutput().$process->getOutput());
        }
    }

    public function test_same_attempt_concurrently_awards_once(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $optionId = $quiz->validation['correctOptionId'];

        $this->runConcurrently([
            ['user' => $user, 'step' => $quiz, 'attempt' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'optionId' => $optionId],
            ['user' => $user, 'step' => $quiz, 'attempt' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'optionId' => $optionId],
        ]);

        $this->assertDatabaseCount('lesson_attempts', 1);
        $this->assertDatabaseCount('step_completions', 1);
        $this->assertSame(1, XpTransaction::query()->where('reason', 'step')->count());
    }

    public function test_two_attempts_for_same_step_award_step_once(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $optionId = $quiz->validation['correctOptionId'];

        $this->runConcurrently([
            ['user' => $user, 'step' => $quiz, 'attempt' => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'optionId' => $optionId],
            ['user' => $user, 'step' => $quiz, 'attempt' => 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'optionId' => $optionId],
        ]);

        $this->assertSame(2, LessonAttempt::query()->count(), implode(' || ', $this->lastOutputs));
        $this->assertSame(1, StepCompletion::query()->where('step_id', $quiz->id)->count());
        $this->assertSame(1, XpTransaction::query()->where('event_key', "step:{$quiz->id}")->count());
    }

    public function test_concurrent_mistakes_consume_one_heart(): void
    {
        $user = User::factory()->create();
        $quiz = $this->publishedQuiz();
        $wrong = collect($quiz->content['options'])->pluck('id')->first(fn ($id) => $id !== $quiz->validation['correctOptionId']);

        $this->runConcurrently([
            ['user' => $user, 'step' => $quiz, 'attempt' => 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'optionId' => $wrong],
            ['user' => $user, 'step' => $quiz, 'attempt' => 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'optionId' => $wrong],
        ]);

        $this->assertSame(1, HeartEvent::query()->where('user_id', $user->id)->count());
        $this->assertSame(4, (int) UserGamification::query()->where('user_id', $user->id)->value('hearts'));
    }
}
