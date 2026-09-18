<?php

namespace Tests\Unit;

use App\Enums\StepType;
use App\Models\LessonStep;
use App\Services\Learning\BlocklyVerifier;
use App\Services\Learning\StepVerifier;
use Tests\TestCase;

class StepVerifierTest extends TestCase
{
    private StepVerifier $verifier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->verifier = new StepVerifier;
    }

    /**
     * @param  array<string, mixed>  $content
     * @param  array<string, mixed>|null  $validation
     * @param  array<string, mixed>|null  $challenge
     */
    private function step(
        StepType $type,
        int $rewardXp,
        array $content,
        ?array $validation = null,
        ?array $challenge = null,
    ): LessonStep {
        return new LessonStep([
            'id' => 'step-1',
            'lesson_id' => 'lesson-1',
            'type' => $type->value,
            'reward_xp' => $rewardXp,
            'content' => $content,
            'validation' => $validation,
            'challenge' => $challenge,
            'sort_order' => 0,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function challenge(array $overrides = []): array
    {
        return array_merge([
            'board' => ['width' => 3, 'height' => 3],
            'start' => ['x' => 0, 'y' => 0, 'direction' => 'east'],
            'goal' => ['x' => 2, 'y' => 0],
            'maxExecutionSteps' => 100,
            'hint' => 'coba lagi',
        ], $overrides);
    }

    public function test_concept_is_always_correct(): void
    {
        $result = $this->verifier->verify(
            $this->step(StepType::Concept, 5, ['title' => 'x']),
            ['type' => 'concept', 'acknowledged' => true],
        );

        $this->assertTrue($result->correct);
        $this->assertSame(5, $result->rewardXp);
        $this->assertFalse($result->consumeHeart);
    }

    public function test_answer_type_mismatch_does_not_consume_heart(): void
    {
        $result = $this->verifier->verify(
            $this->step(StepType::Quiz, 10, ['question' => 'q', 'options' => [], 'explanation' => 'e'], ['correctOptionId' => 'a']),
            ['type' => 'code', 'code' => 'x'],
        );

        $this->assertFalse($result->correct);
        $this->assertFalse($result->consumeHeart);
    }

    public function test_quiz_checks_option_and_explains(): void
    {
        $step = $this->step(
            StepType::Quiz,
            10,
            ['question' => 'q', 'options' => [], 'explanation' => 'Karena X.'],
            ['correctOptionId' => 'log'],
        );

        $correct = $this->verifier->verify($step, ['type' => 'quiz', 'optionId' => 'log']);
        $this->assertTrue($correct->correct);
        $this->assertSame(10, $correct->rewardXp);
        $this->assertSame('Karena X.', $correct->feedback);

        $wrong = $this->verifier->verify($step, ['type' => 'quiz', 'optionId' => 'print']);
        $this->assertFalse($wrong->correct);
        $this->assertTrue($wrong->consumeHeart);
        $this->assertSame('Belum tepat. Karena X.', $wrong->feedback);
    }

    public function test_code_arrange_states(): void
    {
        $step = $this->step(
            StepType::CodeArrange,
            7,
            ['title' => 't', 'instructions' => 'i', 'language' => 'javascript', 'tokens' => [['id' => 'a'], ['id' => 'b'], ['id' => 'c']], 'hint' => 'h'],
            ['correctOrder' => ['a', 'b', 'c']],
        );

        $incomplete = $this->verifier->verify($step, ['type' => 'code-arrange', 'tokenIds' => ['a']]);
        $this->assertFalse($incomplete->correct);
        $this->assertFalse($incomplete->consumeHeart);
        $this->assertSame('Susunanmu belum lengkap. Tambahkan 2 potongan code lagi.', $incomplete->feedback);

        $wrong = $this->verifier->verify($step, ['type' => 'code-arrange', 'tokenIds' => ['b', 'a', 'c']]);
        $this->assertFalse($wrong->correct);
        $this->assertTrue($wrong->consumeHeart);

        $correct = $this->verifier->verify($step, ['type' => 'code-arrange', 'tokenIds' => ['a', 'b', 'c']]);
        $this->assertTrue($correct->correct);
        $this->assertSame(7, $correct->rewardXp);
    }

    public function test_code_fill_states_are_trimmed_and_case_sensitive(): void
    {
        $step = $this->step(
            StepType::CodeFill,
            6,
            ['title' => 't', 'instructions' => 'i', 'language' => 'python', 'parts' => ['x'], 'blanks' => [['id' => 'b1']], 'hint' => 'h'],
            ['acceptedAnswers' => ['b1' => ['Halo']]],
        );

        $empty = $this->verifier->verify($step, ['type' => 'code-fill', 'answers' => ['b1' => '   ']]);
        $this->assertFalse($empty->correct);
        $this->assertFalse($empty->consumeHeart);

        $wrong = $this->verifier->verify($step, ['type' => 'code-fill', 'answers' => ['b1' => 'halo']]);
        $this->assertFalse($wrong->correct);
        $this->assertTrue($wrong->consumeHeart);

        $correct = $this->verifier->verify($step, ['type' => 'code-fill', 'answers' => ['b1' => '  Halo  ']]);
        $this->assertTrue($correct->correct);
        $this->assertSame(6, $correct->rewardXp);
    }

    public function test_code_blank_is_free_but_wrong_costs_heart(): void
    {
        $step = $this->step(
            StepType::Code,
            8,
            ['title' => 't', 'prompt' => 'p', 'language' => 'javascript', 'starterCode' => '', 'expectedCode' => "console.log('hi');", 'mockOutput' => 'hi'],
        );

        $blank = $this->verifier->verify($step, ['type' => 'code', 'code' => '   ']);
        $this->assertFalse($blank->correct);
        $this->assertFalse($blank->consumeHeart);

        $wrong = $this->verifier->verify($step, ['type' => 'code', 'code' => 'print("hi")']);
        $this->assertFalse($wrong->correct);
        $this->assertTrue($wrong->consumeHeart);

        $correct = $this->verifier->verify(
            $step,
            ['type' => 'code', 'code' => "  console.log(\"hi\")\n// komentar"],
        );
        $this->assertTrue($correct->correct);
        $this->assertSame(8, $correct->rewardXp);
    }

    public function test_code_normalizes_quotes_and_semicolons(): void
    {
        $js = $this->step(
            StepType::Code,
            5,
            ['language' => 'javascript', 'expectedCode' => "console.log('halo');", 'mockOutput' => 'halo'],
        );
        $this->assertTrue($this->verifier->verify($js, ['type' => 'code', 'code' => 'console.log("halo")'])->correct);

        $python = $this->step(
            StepType::Code,
            5,
            ['language' => 'python', 'expectedCode' => 'print("halo")', 'mockOutput' => 'halo'],
        );
        $this->assertTrue($this->verifier->verify($python, ['type' => 'code', 'code' => "print('halo')"])->correct);

        $cpp = $this->step(
            StepType::Code,
            5,
            ['language' => 'cpp', 'expectedCode' => "int main() {\n  return 0;\n}", 'mockOutput' => ''],
        );
        $this->assertTrue($this->verifier->verify($cpp, ['type' => 'code', 'code' => "int main() {\n\treturn 0;\n}"])->correct);
    }

    public function test_blockly_success_reaches_goal(): void
    {
        $step = $this->step(
            StepType::Blockly,
            20,
            ['title' => 't', 'objective' => 'o', 'availableBlocks' => ['move_forward']],
            null,
            $this->challenge(),
        );

        $result = $this->verifier->verify(
            $step,
            ['type' => 'blockly', 'commands' => [['type' => 'move_forward'], ['type' => 'move_forward']]],
        );

        $this->assertTrue($result->correct);
        $this->assertSame(20, $result->rewardXp);
    }

    public function test_blockly_failure_uses_hint_and_consumes_heart(): void
    {
        $step = $this->step(
            StepType::Blockly,
            20,
            ['title' => 't', 'objective' => 'o', 'availableBlocks' => ['move_forward']],
            null,
            $this->challenge(),
        );

        $result = $this->verifier->verify(
            $step,
            ['type' => 'blockly', 'commands' => [['type' => 'move_forward']]],
        );

        $this->assertFalse($result->correct);
        $this->assertTrue($result->consumeHeart);
        $this->assertSame('coba lagi', $result->feedback);
    }

    public function test_blockly_verifier_reasons(): void
    {
        $base = $this->challenge();

        $this->assertSame('empty_program', BlocklyVerifier::evaluate([], $base, 10)['reason']);
        $this->assertSame(
            'too_many_blocks',
            BlocklyVerifier::evaluate(
                [['type' => 'move_forward'], ['type' => 'move_forward']],
                $this->challenge(['maxBlocks' => 1]),
                10,
            )['reason'],
        );
        $this->assertSame(
            'out_of_bounds',
            BlocklyVerifier::evaluate(
                [['type' => 'move_forward']],
                $this->challenge([
                    'start' => ['x' => 0, 'y' => 0, 'direction' => 'north'],
                    'goal' => ['x' => 0, 'y' => 2],
                ]),
                10,
            )['reason'],
        );
        $this->assertSame(
            'obstacle_hit',
            BlocklyVerifier::evaluate(
                [['type' => 'move_forward']],
                $this->challenge(['obstacles' => [['x' => 1, 'y' => 0]]]),
                10,
            )['reason'],
        );
        $this->assertSame(
            'goal_not_reached',
            BlocklyVerifier::evaluate(
                [['type' => 'turn_right']],
                $this->challenge(),
                10,
            )['reason'],
        );
        $this->assertSame(
            'step_limit',
            BlocklyVerifier::evaluate(
                [['type' => 'move_forward']],
                $this->challenge(['maxExecutionSteps' => 0]),
                10,
            )['reason'],
        );
    }

    public function test_blockly_repeat_and_turn(): void
    {
        $repeat = BlocklyVerifier::evaluate(
            [[
                'type' => 'repeat',
                'count' => 3,
                'children' => [['type' => 'move_forward']],
            ]],
            $this->challenge([
                'board' => ['width' => 4, 'height' => 4],
                'goal' => ['x' => 3, 'y' => 0],
            ]),
            15,
        );
        $this->assertTrue($repeat['success']);
        $this->assertSame(15, $repeat['xp']);

        $turn = BlocklyVerifier::evaluate(
            [['type' => 'turn_right'], ['type' => 'move_forward']],
            $this->challenge([
                'start' => ['x' => 0, 'y' => 0, 'direction' => 'north'],
                'goal' => ['x' => 1, 'y' => 0],
            ]),
            15,
        );
        $this->assertTrue($turn['success']);
    }
}
