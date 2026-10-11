<?php

namespace App\Http\Controllers;

use App\Services\Billing\Entitlement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function show(Request $request, Entitlement $entitlement): JsonResponse
    {
        return response()->json($entitlement->forUser($request->user()), 200, ['Cache-Control' => 'no-store']);
    }
}
