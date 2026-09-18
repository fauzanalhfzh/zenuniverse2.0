<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\ProgressController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
Route::post('/logout', [GoogleAuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function (): void {
    Route::get('/me/progress', [ProgressController::class, 'show'])->name('progress.show');
    Route::post('/learning/attempts', [ProgressController::class, 'attempt'])
        ->middleware('throttle:120,1')
        ->name('learning.attempts.store');
    Route::post('/learning/lessons/{lesson}/complete', [ProgressController::class, 'complete'])
        ->middleware('throttle:60,1')
        ->name('learning.lessons.complete');
});
