<?php

namespace App\Exceptions;

use Exception;

class LearningException extends Exception
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status,
    ) {
        parent::__construct($message);
    }

    public static function noHearts(): self
    {
        return new self('no_hearts', 'Hearts kamu habis. Tunggu sampai hearts pulih kembali.', 409);
    }

    public static function contentChanged(): self
    {
        return new self('content_changed', 'Konten pelajaran sudah diperbarui. Muat ulang halaman.', 409);
    }

    public static function attemptConflict(): self
    {
        return new self('attempt_conflict', 'Attempt ini sudah dipakai untuk jawaban lain.', 409);
    }
}
