<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\LearningController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use App\Http\Middleware\LearnerToken;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/google', [AuthController::class, 'google'])->middleware('throttle:10,1');
    Route::middleware(['auth:sanctum', LearnerToken::class])->group(function (): void {
        Route::get('courses', [LearningController::class, 'courses']);
        Route::get('courses/{course}', [LearningController::class, 'course']);
        Route::get('lessons/{lesson}', [LearningController::class, 'lesson']);
        Route::get('me/subscription', [SubscriptionController::class, 'show']);
        Route::get('me/progress', [LearningController::class, 'progress']);
        Route::get('leaderboard', [LearningController::class, 'leaderboard']);
        Route::post('learning/attempts', [LearningController::class, 'attempt'])->middleware('throttle:60,1');
        Route::post('learning/lessons/{lesson}/complete', [LearningController::class, 'complete'])->middleware('throttle:60,1');
        Route::get('me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
    });
});
