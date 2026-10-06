<?php

namespace App\Services\Auth;

use App\Exceptions\LearningException;
use Google\AccessToken\Verify;

class GoogleIdentityVerifier
{
    public function __construct(private readonly Verify $verifier) {}

    public function verify(string $token): array
    {
        try {
            $claims = $this->verifier->verifyIdToken($token);
            $audiences = config('services.google.mobile_audiences', []);
            if (! is_array($claims)
                || ! is_string($claims['aud'] ?? null) || ! in_array($claims['aud'], $audiences, true)
                || ! in_array($claims['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)
                || ! is_numeric($claims['exp'] ?? null) || (int) $claims['exp'] <= time()
                || ! is_string($claims['sub'] ?? null) || $claims['sub'] === '' || strlen($claims['sub']) > 255
                || ! is_string($claims['email'] ?? null) || ! filter_var($claims['email'], FILTER_VALIDATE_EMAIL) || strlen($claims['email']) > 255
                || ($claims['email_verified'] ?? false) !== true) {
                throw new \UnexpectedValueException('Invalid identity');
            }
            return $claims;
        } catch (\Throwable) {
            // Do not leak provider exceptions or any token/claim material.
            throw new LearningException('invalid_google_token', 'Identitas Google tidak valid.', 401);
        }
    }
}
