<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateHeartSettingsRequest;
use App\Models\HeartSetting;
use App\Services\Learning\HeartSettingsService;
use Illuminate\Http\JsonResponse;

class HeartSettingsController extends Controller
{
    public function __construct(private readonly HeartSettingsService $service) {}

    public function show(): JsonResponse
    {
        $settings = HeartSetting::current();

        return response()->json([
            'capacity' => (int) $settings->capacity,
            'regenMinutes' => (int) $settings->regen_minutes,
            'version' => (int) $settings->version,
        ]);
    }

    public function update(UpdateHeartSettingsRequest $request): JsonResponse
    {
        $data = $request->validated();

        $settings = $this->service->update(
            $request->user(),
            (int) $data['capacity'],
            (int) $data['regen_minutes'],
            (int) $data['version'],
        );

        return response()->json([
            'capacity' => (int) $settings->capacity,
            'regenMinutes' => (int) $settings->regen_minutes,
            'version' => (int) $settings->version,
        ]);
    }
}
