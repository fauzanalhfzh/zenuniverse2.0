<?php

namespace App\Services\Profile;

use App\Exceptions\LearningException;
use App\Models\User;
use finfo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AvatarService
{
    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function update(User $user, UploadedFile $file): string
    {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file->getRealPath());

        if (! is_string($mime) || ! isset(self::ALLOWED_MIME[$mime])) {
            throw new LearningException('invalid_avatar', 'Format avatar harus JPEG, PNG, atau WebP.', 422);
        }

        if ($file->getSize() === 0 || $file->getSize() === false) {
            throw new LearningException('invalid_avatar', 'File avatar kosong.', 422);
        }

        $path = $file->store("avatars/{$user->id}", 'public');

        if (! is_string($path)) {
            throw new LearningException('invalid_avatar', 'Avatar gagal disimpan.', 422);
        }

        $previous = $user->avatar_path;

        try {
            $user->forceFill(['avatar_path' => $path])->save();
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($path);

            throw $exception;
        }

        if ($previous !== null && $previous !== $path) {
            Storage::disk('public')->delete($previous);
        }

        return $path;
    }
}
