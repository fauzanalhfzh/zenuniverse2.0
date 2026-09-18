<?php

namespace App\Services\Learning;

use App\Enums\StepType;
use App\Models\LessonStep;

/**
 * Server-side verification for every lesson step type. Answers are compared
 * against the private content stored on the published revision; submitted code
 * is never executed.
 */
class StepVerifier
{
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
            StepType::CodeArrange => $this->verifyArrange($step, $answer),
            StepType::CodeFill => $this->verifyFill($step, $answer),
            StepType::Code => $this->verifyCode($step, $answer),
        };
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
        $result = BlocklyVerifier::evaluate($commands, $challenge, (int) $step->reward_xp);

        return $result['success']
            ? StepVerificationResult::correct($result['xp'], 'Program Blockly mencapai tujuan.')
            : StepVerificationResult::incorrect(true, $result['hint']);
    }

    /**
     * @param  array<string, mixed>  $answer
     */
    private function verifyArrange(LessonStep $step, array $answer): StepVerificationResult
    {
        $tokens = is_array($step->content['tokens'] ?? null) ? $step->content['tokens'] : [];
        $correctOrder = is_array($step->validation['correctOrder'] ?? null) ? $step->validation['correctOrder'] : [];
        $tokenIds = is_array($answer['tokenIds'] ?? null) ? array_values($answer['tokenIds']) : [];

        if (count($tokenIds) < count($tokens)) {
            $remaining = count($tokens) - count($tokenIds);

            return StepVerificationResult::incorrect(
                false,
                "Susunanmu belum lengkap. Tambahkan {$remaining} potongan code lagi.",
            );
        }

        $matches = count($tokenIds) === count($correctOrder);

        if ($matches) {
            foreach ($correctOrder as $index => $expected) {
                if (($tokenIds[$index] ?? null) !== $expected) {
                    $matches = false;
                    break;
                }
            }
        }

        if ($matches) {
            $language = (string) ($step->content['language'] ?? '');
            $feedback = in_array($language, ['cpp', 'html', 'css'], true)
                ? 'Susunan kode sesuai dengan latihan.'
                : 'Susunan code sudah tepat dan siap dijalankan.';

            return StepVerificationResult::correct((int) $step->reward_xp, $feedback);
        }

        return StepVerificationResult::incorrect(
            true,
            'Urutannya belum tepat. Geser atau keluarkan potongan yang perlu diperbaiki.',
        );
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
        $expected = (string) ($step->content['expectedCode'] ?? '');

        if (! CodeVerifier::matches($language, $expected, $code)) {
            return StepVerificationResult::incorrect(true, 'Kode belum cocok dengan jawaban yang diharapkan.');
        }

        $feedback = $language === 'cpp'
            ? 'Kode sesuai dengan latihan. Output yang ditampilkan adalah simulasi.'
            : 'Kode menghasilkan output mock yang sesuai.';

        return StepVerificationResult::correct((int) $step->reward_xp, $feedback);
    }
}
