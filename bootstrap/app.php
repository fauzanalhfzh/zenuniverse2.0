<?php

use App\Exceptions\LearningException;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [\App\Http\Middleware\MobileApi::class]);
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\Throwable $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $status = match (true) {
                $exception instanceof LearningException => $exception->status,
                $exception instanceof \Illuminate\Auth\AuthenticationException => 401,
                $exception instanceof \Illuminate\Validation\ValidationException => 422,
                $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface => $exception->getStatusCode(),
                default => 500,
            };
            $code = $exception instanceof LearningException ? $exception->errorCode : match ($status) {
                400 => 'bad_request', 401 => 'unauthenticated', 403 => 'forbidden',
                404 => 'not_found', 409 => 'conflict', 422 => 'validation_failed',
                429 => 'rate_limited', default => 'server_error',
            };
            $message = $exception instanceof LearningException ? $exception->getMessage() : match ($status) {
                401 => 'Token tidak valid atau kedaluwarsa.', 403 => 'Akses ditolak.',
                404 => 'Konten tidak tersedia.', 422 => 'Permintaan tidak valid.',
                429 => 'Terlalu banyak permintaan.', default => 'Permintaan tidak dapat diproses.',
            };
            $id = $request->attributes->get('requestId') ?? (string) \Illuminate\Support\Str::uuid();
            $headers = $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface ? $exception->getHeaders() : [];
            return response()->json([
                'error' => ['code' => $code, 'message' => $message, 'fields' => $exception instanceof \Illuminate\Validation\ValidationException ? (object) $exception->errors() : (object) []],
                'meta' => ['requestId' => $id],
            ], $status, array_merge($headers, ['Cache-Control' => 'no-store', 'X-Request-ID' => $id]));
        });

        $exceptions->render(
            fn (LearningException $exception) => response()->json([
                'error' => [
                    'code' => $exception->errorCode,
                    'message' => $exception->getMessage(),
                ],
            ], $exception->status),
        );
    })->create();
