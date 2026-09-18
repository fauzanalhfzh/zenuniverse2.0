<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdjustPlayerHeartsRequest;
use App\Models\User;
use App\Services\Learning\HeartSettingsService;
use Illuminate\Http\JsonResponse;

class PlayerHeartsController extends Controller
{
    public function __construct(private readonly HeartSettingsService $service) {}

    public function adjust(AdjustPlayerHeartsRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        $result = $this->service->adjust(
            $request->user(),
            $user,
            (int) $data['delta'],
            (string) $data['reason'],
            (string) $data['adjustment_id'],
            isset($data['expected_hearts']) ? (int) $data['expected_hearts'] : null,
        );

        return response()->json($result);
    }
}
