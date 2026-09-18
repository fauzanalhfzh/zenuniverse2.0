<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\LearningException;
use App\Http\Controllers\Controller;
use App\Http\Requests\UploadAssetRequest;
use App\Models\AdminAudit;
use App\Models\CmsAsset;
use finfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AssetController extends Controller
{
    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function store(UploadAssetRequest $request): JsonResponse
    {
        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            throw new LearningException('invalid_asset', 'Berkas aset tidak valid.', 422);
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file->getRealPath());

        if (! is_string($mime) || ! isset(self::ALLOWED_MIME[$mime])) {
            throw new LearningException('invalid_asset', 'Format aset harus JPEG, PNG, atau WebP.', 422);
        }

        $path = $file->store('cms', 'public');

        if (! is_string($path)) {
            throw new LearningException('invalid_asset', 'Aset gagal disimpan.', 422);
        }

        $asset = CmsAsset::create([
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime' => $mime,
            'size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        AdminAudit::create([
            'actor_id' => $request->user()->id,
            'action' => 'asset.uploaded',
            'subject_type' => CmsAsset::class,
            'subject_id' => (string) $asset->id,
            'before' => null,
            'after' => ['path' => $asset->path, 'mime' => $asset->mime, 'size' => $asset->size],
        ]);

        return response()->json([
            'id' => $asset->id,
            'path' => $asset->path,
            'url' => Storage::disk('public')->url($asset->path),
            'mime' => $asset->mime,
            'size' => $asset->size,
        ], 201);
    }

    public function destroy(Request $request, CmsAsset $asset): JsonResponse
    {
        Storage::disk('public')->delete($asset->path);

        AdminAudit::create([
            'actor_id' => $request->user()->id,
            'action' => 'asset.deleted',
            'subject_type' => CmsAsset::class,
            'subject_id' => (string) $asset->id,
            'before' => ['path' => $asset->path],
            'after' => null,
        ]);

        $asset->delete();

        return response()->json(['deleted' => true]);
    }
}
