<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class LearnerToken
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless($request->bearerToken() && $request->user()?->currentAccessToken() instanceof PersonalAccessToken, 401);
        abort_unless($request->user()->tokenCan('learner'), 403);
        return $next($request);
    }
}
