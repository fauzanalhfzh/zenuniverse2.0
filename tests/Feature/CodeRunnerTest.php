<?php

namespace Tests\Feature;

use App\Enums\StepType;
use App\Models\LessonCompletion;
use App\Models\LessonStep;
use App\Models\User;
use App\Services\Content\PublishedContent;
use App\Services\Learning\StepVerifier;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CodeRunnerTest extends TestCase
{
    use RefreshDatabase;

    private const EXECUTE = 'https://runner.test/api/v2/execute';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.piston.url' => 'https://runner.test', 'services.piston.token' => 'secret']);
    }

    private function robotStep(): LessonStep
    {
        return new LessonStep([
            'id' => 'step-robot',
            'lesson_id' => 'lesson-1',
            'type' => StepType::Code->value,
            'reward_xp' => 10,
            'content' => [
                'language' => 'python',
                'expectedCode' => "jumlah = 0\nfor c in \"robot\":\n    if c == \"o\":\n        jumlah += 1\nprint(jumlah)",
                'mockOutput' => '2',
            ],
        ]);
    }

    /**
     * Replaces any earlier stub so each call defines the next Piston reply.
     *
     * @param  array<string, mixed>  $run
     */
    private function fakeRun(array $run, ?array $compile = null): void
    {
        Http::swap(new Factory(app('events')));
        Http::fake([self::EXECUTE => Http::response(array_filter(['language' => 'python', 'version' => '3.10.0', 'run' => $run + ['stdout' => '', 'stderr' => '', 'code' => 0, 'signal' => null], 'compile' => $compile]))]);
    }

    public function test_correct_code_with_other_variable_names_passes_by_real_output(): void
    {
        $this->fakeRun(['stdout' => "2\n"]);
        $code = "jumlah = 0\nfor huruf in \"robot\":\n    if huruf == \"o\":\n        jumlah += 1\nprint(jumlah)";

        $result = app(StepVerifier::class)->verify($this->robotStep(), ['type' => 'code', 'code' => $code]);

        $this->assertTrue($result->correct);
        $this->assertSame(10, $result->rewardXp);
        Http::assertSent(fn (Request $request): bool => $request->url() === self::EXECUTE
            && $request->hasHeader('Authorization', 'Bearer secret')
            && $request['language'] === 'python'
            && $request['files'][0]['content'] === $code
            && $request['run_timeout'] === 3000);
    }

    public function test_wrong_output_and_runtime_errors_cost_a_heart(): void
    {
        $verifier = app(StepVerifier::class);

        $this->fakeRun(['stdout' => "1\n"]);
        $wrong = $verifier->verify($this->robotStep(), ['type' => 'code', 'code' => 'print(1)']);
        $this->assertFalse($wrong->correct);
        $this->assertTrue($wrong->consumeHeart);

        $this->fakeRun(['stderr' => "Traceback (most recent call last):\n  File \"/piston/jobs/x/main.py\", line 1\nNameError: name 'x' is not defined\n", 'code' => 1]);
        $preview = $verifier->previewCode($this->robotStep(), 'print(x)');
        $this->assertSame(['matches' => false, 'output' => "NameError: name 'x' is not defined"], $preview);
    }

    public function test_killed_and_uncompilable_programs_report_a_short_error(): void
    {
        $verifier = app(StepVerifier::class);

        $this->fakeRun(['stdout' => '1', 'code' => null, 'signal' => 'SIGKILL']);
        $timeout = $verifier->previewCode($this->robotStep(), 'while True: print(1)');
        $this->assertFalse($timeout['matches']);
        $this->assertStringContainsString('Waktu habis', (string) $timeout['output']);

        $this->fakeRun([], ['stdout' => '', 'stderr' => "main.cpp:1:1: error: expected ';'\n", 'code' => 1, 'signal' => null]);
        $cpp = new LessonStep(['id' => 's', 'lesson_id' => 'l', 'type' => 'code', 'reward_xp' => 1, 'content' => ['language' => 'cpp', 'expectedCode' => 'x', 'mockOutput' => 'hi']]);
        $this->assertSame("main.cpp:1:1: error: expected ';'", $verifier->previewCode($cpp, 'int main() {}')['output']);
    }

    public function test_answer_key_still_works_when_the_sandbox_is_unavailable(): void
    {
        Http::fake([self::EXECUTE => Http::response('down', 503)]);
        $verifier = app(StepVerifier::class);
        $step = $this->robotStep();

        $this->assertTrue($verifier->verify($step, ['type' => 'code', 'code' => $step->content['expectedCode']])->correct);
        $this->assertSame(['matches' => false, 'output' => null], $verifier->previewCode($step, 'print(2)'));
    }

    public function test_languages_without_a_runtime_are_never_sent_to_the_sandbox(): void
    {
        Http::fake();
        $html = new LessonStep(['id' => 's', 'lesson_id' => 'l', 'type' => 'code', 'reward_xp' => 1, 'content' => ['language' => 'html', 'expectedCode' => '<p>Hai</p>', 'mockOutput' => 'Hai']]);

        $this->assertTrue(app(StepVerifier::class)->verify($html, ['type' => 'code', 'code' => '<p>Hai</p>'])->correct);
        Http::assertNothingSent();
    }

    public function test_run_endpoint_returns_sandbox_output_for_unlocked_code_steps_only(): void
    {
        $this->seed(ContentSeeder::class);
        $step = LessonStep::query()->where('type', StepType::Code->value)
            ->whereHas('lesson.unit.course', fn ($query) => $query->where('status', 'published')->where('access_tier', '!=', 'plus'))
            ->get()
            ->first(fn (LessonStep $step): bool => ! app(PublishedContent::class)->isUnlocked($step->lesson->unit->course, $step->lesson_id, []));
        $this->assertNotNull($step);
        $user = User::factory()->create();
        $this->withToken($user->createToken('test', ['learner'], now()->addDays(30))->plainTextToken);
        $payload = ['lesson_id' => $step->lesson_id, 'step_id' => $step->id, 'code' => 'print("hai")'];
        $this->fakeRun(['stdout' => "hai\n"]);

        $this->postJson('/api/v1/learning/run', $payload)->assertForbidden()->assertJsonPath('error.code', 'lesson_locked');

        foreach ($step->lesson->unit->course->units->flatMap(fn ($unit) => $unit->lessons) as $lesson) {
            LessonCompletion::create(['user_id' => $user->id, 'lesson_id' => $lesson->id, 'content_revision' => 1, 'reward_xp' => 0]);
        }

        $this->postJson('/api/v1/learning/run', $payload)->assertOk()
            ->assertJsonPath('data.output', 'hai')
            ->assertJsonPath('data.matches', trim((string) $step->content['mockOutput']) === 'hai');

        $other = LessonStep::query()->where('lesson_id', $step->lesson_id)->where('type', '!=', StepType::Code->value)->firstOrFail();
        $this->postJson('/api/v1/learning/run', [...$payload, 'step_id' => $other->id])->assertStatus(422);
        $this->assertDatabaseCount('lesson_attempts', 0);
    }
}
