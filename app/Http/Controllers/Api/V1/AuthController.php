<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\V1\ApiResource;
use Illuminate\Http\Request;

class AuthController
{
    public function google(Request $request, \App\Services\Auth\GoogleIdentityVerifier $verifier, \App\Services\Auth\ResolveGoogleAccount $accounts): ApiResource
    {
        $data = $request->validate(['id_token' => ['required', 'string', 'max:16384'], 'device_name' => ['required', 'string', 'max:100']]);
        $user = $accounts->resolve($verifier->verify($data['id_token']));
        $expiry = now()->addDays(30);
        $token = $user->createToken($data['device_name'], ['learner'], $expiry);
        return new ApiResource(['token' => $token->plainTextToken, 'tokenType' => 'Bearer', 'expiresAt' => $expiry->toIso8601String(), 'user' => ['id' => $user->id, 'displayName' => $user->name, 'email' => $user->email]]);
    }

    public function me(Request $request): ApiResource
    {
        $user = $request->user();
        return new ApiResource(['id' => $user->id, 'displayName' => $user->name, 'email' => $user->email]);
    }

    public function logout(Request $request): ApiResource
    {
        $request->user()->currentAccessToken()->delete();
        return new ApiResource(['loggedOut' => true]);
    }
}
