<?php

namespace App\Services\Learning;

final readonly class CodeRunResult
{
    public function __construct(
        public string $stdout,
        public ?string $error,
    ) {}

    public function failed(): bool
    {
        return $this->error !== null;
    }

    /** What the learner sees under OUTPUT: stdout, followed by the error line when the program failed. */
    public function display(): string
    {
        return trim(implode("\n", array_filter([rtrim($this->stdout), $this->error], fn (?string $part): bool => $part !== null && $part !== '')), "\n");
    }

    public function matches(string $expectedOutput): bool
    {
        return ! $this->failed() && self::normalize($this->stdout) === self::normalize($expectedOutput);
    }

    /** Line endings and trailing whitespace are not part of the answer. */
    private static function normalize(string $output): string
    {
        $lines = explode("\n", str_replace("\r\n", "\n", $output));

        return trim(implode("\n", array_map('rtrim', $lines)), "\n");
    }
}
