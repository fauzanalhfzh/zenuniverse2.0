<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

class RasterCoverImage implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof TemporaryUploadedFile) {
            $fail('Sampul harus berupa unggahan gambar.');

            return;
        }

        $stream = $value->readStream();
        if (! is_resource($stream)) {
            $fail('Sampul tidak dapat dibaca.');

            return;
        }

        try {
            $contents = stream_get_contents($stream, 2048 * 1024 + 1);
        } finally {
            fclose($stream);
        }

        $dimensions = $contents ? @getimagesizefromstring($contents) : false;
        $mime = $contents ? (new \finfo(FILEINFO_MIME_TYPE))->buffer($contents) : false;
        if (! $contents || strlen($contents) > 2048 * 1024 || ! $dimensions
            || ! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)
            || ($dimensions['mime'] ?? null) !== $mime
            || $dimensions[0] * $dimensions[1] > 20000000) {
            $fail('Sampul harus JPEG, PNG atau WebP asli, maksimal 2 MB dan 20 megapiksel.');

            return;
        }

        // Decode the actual bytes, rather than trusting a filename, MIME claim or header alone.
        $image = @imagecreatefromstring($contents);
        if ($image === false) {
            $fail('Isi gambar sampul tidak valid.');

            return;
        }

        imagedestroy($image);
    }
}
