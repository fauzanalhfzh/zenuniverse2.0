<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Middleware\LearnerToken;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/google', [AuthController::class, 'google'])->middleware('throttle:10,1');
    Route::middleware(['auth:sanctum', LearnerToken::class])->group(function (): void {
        Route::get('courses', [\App\Http\Controllers\Api\V1\LearningController::class, 'courses']);
        Route::get('courses/{course}', [\App\Http\Controllers\Api\V1\LearningController::class, 'course']);
        Route::get('lessons/{lesson}', [\App\Http\Controllers\Api\V1\LearningController::class, 'lesson']);
        Route::get('me/progress', [\App\Http\Controllers\Api\V1\LearningController::class, 'progress']);
        Route::get('leaderboard', [\App\Http\Controllers\Api\V1\LearningController::class, 'leaderboard']);
        Route::post('learning/attempts', [\App\Http\Controllers\Api\V1\LearningController::class, 'attempt'])->middleware('throttle:60,1');
        Route::post('learning/lessons/{lesson}/complete', [\App\Http\Controllers\Api\V1\LearningController::class, 'complete'])->middleware('throttle:60,1');
        Route::get('me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
    });
});
