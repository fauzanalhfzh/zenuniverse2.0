<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\LearnController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\ProgressController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
Route::post('/logout', [GoogleAuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function (): void {
    Route::get('/learn', [LearnController::class, 'index'])->name('learn.index');
    Route::get('/dashboard', [LearnController::class, 'dashboard'])->name('dashboard');
    Route::get('/lesson/{lesson}', [LessonController::class, 'show'])->name('lesson.show');

    Route::get('/me/progress', [ProgressController::class, 'show'])->name('progress.show');
    Route::post('/learning/attempts', [ProgressController::class, 'attempt'])
        ->middleware('throttle:120,1')
        ->name('learning.attempts.store');
    Route::post('/learning/lessons/{lesson}/complete', [ProgressController::class, 'complete'])
        ->middleware('throttle:60,1')
        ->name('learning.lessons.complete');
});
