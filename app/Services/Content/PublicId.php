<?php

namespace App\Services\Content;

/**
 * Maps private content identifiers (quiz options, arrange tokens) to opaque
 * public identifiers so option order and naming cannot reveal the answer.
 * Deterministic per content revision, so a stable step keeps stable public IDs.
 */
class PublicId
{
    public static function option(int $revision, string $stepId, string $rawId): string
    {
        return self::for('option', $revision, $stepId, $rawId);
    }

    public static function token(int $revision, string $stepId, string $rawId): string
    {
        return self::for('token', $revision, $stepId, $rawId);
    }

    public static function for(string $kind, int $revision, string $stepId, string $rawId): string
    {
        return substr(
            hash_hmac('sha256', "{$kind}|{$revision}|{$stepId}|{$rawId}", (string) config('app.key')),
            0,
            16,
        );
    }
}
