<?php

namespace App\Services\Learning;

/**
 * Deterministic comparison of submitted code against the expected code. The
 * submitted program is never executed.
 */
class CodeVerifier
{
    public static function matches(string $language, string $expectedCode, string $submittedCode): bool
    {
        return self::normalize($language, $submittedCode) === self::normalize($language, $expectedCode);
    }

    private static function normalize(string $language, string $code): string
    {
        $lines = explode("\n", str_replace("\r\n", "\n", $code));

        if ($language === 'cpp') {
            $normalized = array_map(
                static fn (string $line): string => (string) preg_replace('/^[\t ]+|[\t ]+$/', '', $line),
                $lines,
            );

            return implode("\n", $normalized);
        }

        $normalized = [];

        foreach ($lines as $line) {
            $trimmed = self::trim($line);

            if ($trimmed === '') {
                continue;
            }

            if ($language === 'python' && str_starts_with($trimmed, '#')) {
                continue;
            }

            if ($language === 'javascript' && str_starts_with($trimmed, '//')) {
                continue;
            }

            $trimmed = (string) preg_replace("/'([^']*)'/", '"$1"', $trimmed);
            $trimmed = (string) preg_replace('/;$/', '', $trimmed);

            $normalized[] = $trimmed;
        }

        return self::trim(implode("\n", $normalized));
    }

    private static function trim(string $value): string
    {
        return (string) preg_replace('/^\s+|\s+$/u', '', $value);
    }
}
