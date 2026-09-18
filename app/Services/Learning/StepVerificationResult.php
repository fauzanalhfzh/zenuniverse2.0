<?php

namespace App\Services\Learning;

final readonly class StepVerificationResult
{
    private function __construct(
        public bool $correct,
        public int $rewardXp,
        public bool $consumeHeart,
        public string $feedback,
    ) {}

    public static function correct(int $rewardXp, string $feedback): self
    {
        return new self(true, $rewardXp, false, $feedback);
    }

    public static function incorrect(bool $consumeHeart, string $feedback): self
    {
        return new self(false, 0, $consumeHeart, $feedback);
    }
}
