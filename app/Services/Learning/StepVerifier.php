<?php

namespace App\Services\Learning;

use App\Enums\StepType;
use App\Models\LessonStep;

/**
 * Server-side verification for every lesson step type. Answers are compared
 * against the private content stored on the published revision. Submitted code
 * is executed only inside the CodeRunner sandbox, never on this host.
 */
class StepVerifier
{
    public function __construct(private readonly CodeRunner $runner = new CodeRunner) {}

    /**
     * Result of JALANKAN: not graded and costs no heart.
     *
     * @return array{matches: bool, output: ?string}
     */
    public function previewCode(LessonStep $step, string $code): array
    {
        $target = (string) ($step->content['mockOutput'] ?? '');
        $run = $this->runCode($step, $code);

        if ($run !== null) {
            return ['matches' => $run->matches($target), 'output' => $run->display()];
        }

        // No sandbox for this language: only the answer key can vouch for the output.
        $matches = $this->matchesAnswerKey($step, $code);

        return ['matches' => $matches, 'output' => $matches ? $target : null];
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    public function verify(LessonStep $step, array $answer): StepVerificationResult
    {
        if ($step->type->value !== ($answer['type'] ?? null)) {
            return StepVerificationResult::incorrect(false, 'Tipe jawaban tidak cocok dengan langkah pelajaran.');
        }

        return match ($step->type) {
            StepType::Concept => $this->verifyConcept($step),
            StepType::Quiz => $this->verifyQuiz($step, $answer),
            StepType::Blockly => $this->verifyBlockly($step, $answer),
            StepType::CodeFill => $this->verifyFill($step, $answer),
            StepType::Code => $this->verifyCode($step, $answer),
            StepType::Unjumble => $this->verifyUnjumble($step, $answer),
            StepType::Matching => $this->verifyMatching($step, $answer),
            StepType::Flashcard => $this->verifyFlashcard($step, $answer),
        };
    }

    /** @param array<string, mixed> $answer */
    private function verifyUnjumble(LessonStep $step, array $answer): StepVerificationResult
    {
        $expected = $step->validation['correctOrder'] ?? [];
        $order = $answer['order'] ?? [];
        if (! is_array($expected) || $expected === [] || ! is_array($order) || count($order) !== count($expected)) {
            return StepVerificationResult::incorrect(false, 'Susun semua token sebelum memeriksa jawaban.');
        }

        return array_values($order) === array_values($expected)
            ? StepVerificationResult::correct((int) $step->reward_xp, 'Urutan sudah tepat.')
            : StepVerificationResult::incorrect(true, 'Urutan belum tepat. Baca kembali hubungan antarkata.');
    }

    /** @param array<string, mixed> $answer */
    private function verifyMatching(LessonStep $step, array $answer): StepVerificationResult
    {
        $expected = $step->validation['pairs'] ?? [];
        $pairs = $answer['pairs'] ?? [];
        if (! is_array($expected) || $expected === [] || ! is_array($pairs) || count($pairs) !== count($expected)) {
            return StepVerificationResult::incorrect(false, 'Lengkapi semua pasangan terlebih dahulu.');
        }
        ksort($expected);
        ksort($pairs);

        return $pairs === $expected
            ? StepVerificationResult::correct((int) $step->reward_xp, 'Semua pasangan sudah tepat.')
            : StepVerificationResult::incorrect(true, 'Ada pasangan yang belum sesuai. Periksa kembali sebelum mencoba lagi.');
    }

    /** @param array<string, mixed> $answer */
    private function verifyFlashcard(LessonStep $step, array $answer): StepVerificationResult
    {
        $expected = array_column($step->content['cards'] ?? [], 'id');
        $reviewed = $answer['reviewedIds'] ?? [];
        if (! is_array($reviewed) || $expected === [] || count($reviewed) !== count($expected) || array_diff($expected, $reviewed) !== [] || array_diff($reviewed, $expected) !== []) {
            return StepVerificationResult::incorrect(false, 'Buka jawaban pada semua kartu sebelum menyelesaikan ulasan.');
        }

        return StepVerificationResult::correct((int) $step->reward_xp, 'Semua kartu sudah diulas.');
    }

    private function verifyConcept(LessonStep $step): StepVerificationResult
    {
        return StepVerificationResult::correct((int) $step->reward_xp, 'Materi sudah dipahami.');
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    private function verifyQuiz(LessonStep $step, array $answer): StepVerificationResult
    {
        $selected = (string) ($answer['optionId'] ?? '');
        $correct = ($step->validation['correctOptionId'] ?? null) === $selected;
        $explanation = (string) ($step->content['explanation'] ?? '');

        return $correct
            ? StepVerificationResult::correct((int) $step->reward_xp, $explanation)
            : StepVerificationResult::incorrect(true, "Belum tepat. {$explanation}");
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    private function verifyBlockly(LessonStep $step, array $answer): StepVerificationResult
    {
        $challenge = $step->challenge ?? [];

        if (! isset($challenge['start'], $challenge['goal'], $challenge['board'])) {
            return StepVerificationResult::incorrect(false, 'Konfigurasi tantangan tidak tersedia.');
        }

        $commands = is_array($answer['commands'] ?? null) ? $answer['commands'] : [];
        $challenge['availableBlocks'] = is_array($step->content['availableBlocks'] ?? null) ? $step->content['availableBlocks'] : [];
        $result = BlocklyVerifier::evaluate($commands, $challenge, (int) $step->reward_xp);

        return $result['success']
            ? StepVerificationResult::correct($result['xp'], 'Program Blockly mencapai tujuan.')
            : StepVerificationResult::incorrect(true, $result['hint']);
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    private function verifyFill(LessonStep $step, array $answer): StepVerificationResult
    {
        $blanks = is_array($step->content['blanks'] ?? null) ? $step->content['blanks'] : [];
        $accepted = is_array($step->validation['acceptedAnswers'] ?? null) ? $step->validation['acceptedAnswers'] : [];
        $answers = is_array($answer['answers'] ?? null) ? $answer['answers'] : [];

        $empty = 0;

        foreach ($blanks as $blank) {
            $id = (string) ($blank['id'] ?? '');

            if (trim((string) ($answers[$id] ?? '')) === '') {
                $empty++;
            }
        }

        if ($empty > 0) {
            return StepVerificationResult::incorrect(
                false,
                "Masih ada {$empty} bagian kosong yang perlu diisi.",
            );
        }

        $correct = true;

        foreach ($blanks as $blank) {
            $id = (string) ($blank['id'] ?? '');
            $given = trim((string) ($answers[$id] ?? ''));
            $allowed = $accepted[$id] ?? [];

            if (! is_array($allowed) || ! in_array($given, $allowed, true)) {
                $correct = false;
                break;
            }
        }

        return $correct
            ? StepVerificationResult::correct((int) $step->reward_xp, 'Semua bagian code sudah terisi dengan tepat.')
            : StepVerificationResult::incorrect(
                true,
                'Ada isian yang belum cocok. Periksa ejaan, huruf besar, dan tanda baca.',
            );
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    private function verifyCode(LessonStep $step, array $answer): StepVerificationResult
    {
        $code = (string) ($answer['code'] ?? '');

        if (trim($code) === '') {
            return StepVerificationResult::incorrect(false, 'Tulis kode terlebih dahulu sebelum diperiksa.');
        }

        $language = (string) ($step->content['language'] ?? '');
        $run = $this->runCode($step, $code);

        if ($run !== null && $run->matches((string) ($step->content['mockOutput'] ?? ''))) {
            return StepVerificationResult::correct((int) $step->reward_xp, 'Output kode sesuai target.');
        }

        // The answer key stays accepted even when the sandbox disagrees with the authored output.
        if ($this->matchesAnswerKey($step, $code)) {
            $feedback = $run !== null ? 'Kode sesuai dengan latihan.' : ($language === 'cpp'
                ? 'Kode sesuai dengan latihan. Output yang ditampilkan adalah simulasi.'
                : 'Kode menghasilkan output mock yang sesuai.');

            return StepVerificationResult::correct((int) $step->reward_xp, $feedback);
        }

        return match (true) {
            $run === null => StepVerificationResult::incorrect(true, 'Kode belum cocok dengan jawaban yang diharapkan.'),
            $run->failed() => StepVerificationResult::incorrect(true, 'Kode berhenti dengan error. Perbaiki lalu jalankan lagi.'),
            default => StepVerificationResult::incorrect(true, 'Output kode belum sesuai target.'),
        };
    }

    private function runCode(LessonStep $step, string $code): ?CodeRunResult
    {
        return $this->runner->run(
            (string) ($step->content['language'] ?? ''),
            $code,
            (string) ($step->content['sampleInput'] ?? ''),
        );
    }

    private function matchesAnswerKey(LessonStep $step, string $code): bool
    {
        return CodeVerifier::matches(
            (string) ($step->content['language'] ?? ''),
            (string) ($step->content['expectedCode'] ?? ''),
            $code,
        );
    }
}
