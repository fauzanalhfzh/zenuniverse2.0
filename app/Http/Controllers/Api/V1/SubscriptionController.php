<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\V1\ApiResource;
use App\Services\Billing\Entitlement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController
{
    public function show(Request $request, Entitlement $entitlement): JsonResponse
    {
        return (new ApiResource($entitlement->forUser($request->user())))->response()->header('Cache-Control', 'no-store');
    }
}
