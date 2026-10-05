<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MobileApi
{
    public function handle(Request $request, Closure $next)
    {
        $request->attributes->set('requestId', (string) Str::uuid());
        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store');
        $response->headers->set('X-Request-ID', $request->attributes->get('requestId'));
        return $response;
    }
}
