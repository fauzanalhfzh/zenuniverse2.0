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

    public static function revisionConflict(): self
    {
        return new self('revision_conflict', 'Dokumen sudah berubah. Muat ulang sebelum menyimpan.', 409);
    }

    public static function lockedStructure(): self
    {
        return new self('locked_structure', 'Struktur konten yang sudah dipublikasikan tidak boleh diubah.', 422);
    }

    /**
     * @param  array<int, array{path: string, message: string}>  $issues
     */
    public static function invalidContent(array $issues): self
    {
        return new self('invalid_content', 'Dokumen konten belum valid: '.count($issues).' masalah.', 422);
    }
}
