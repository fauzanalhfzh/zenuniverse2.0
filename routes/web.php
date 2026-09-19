<?php

use App\Http\Controllers\Admin\AssetController as AdminAssetController;
use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\HeartSettingsController as AdminHeartSettingsController;
use App\Http\Controllers\Admin\PlayerHeartsController as AdminPlayerHeartsController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LearnController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgressController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/login', [GoogleAuthController::class, 'showLogin'])->name('login');
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
Route::post('/logout', [GoogleAuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function (): void {
    Route::get('/learn', [LearnController::class, 'index'])->name('learn.index');
    Route::get('/dashboard', [LearnController::class, 'dashboard'])->name('dashboard');
    Route::get('/lesson/{lesson}', [LessonController::class, 'show'])->name('lesson.show');
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');

    Route::get('/me/progress', [ProgressController::class, 'show'])->name('progress.show');
    Route::post('/learning/attempts', [ProgressController::class, 'attempt'])
        ->middleware('throttle:120,1')
        ->name('learning.attempts.store');
    Route::post('/learning/lessons/{lesson}/complete', [ProgressController::class, 'complete'])
        ->middleware('throttle:60,1')
        ->name('learning.lessons.complete');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->group(function (): void {
    Route::get('/courses', [AdminCourseController::class, 'index'])->name('admin.courses.index');
    Route::get('/courses/{course}', [AdminCourseController::class, 'show'])->name('admin.courses.show');
    Route::put('/courses/{course}', [AdminCourseController::class, 'updateDraft'])->name('admin.courses.draft');
    Route::post('/courses/{course}/publish', [AdminCourseController::class, 'publish'])->name('admin.courses.publish');
    Route::get('/courses/{course}/preview', [AdminCourseController::class, 'preview'])->name('admin.courses.preview');
    Route::post('/courses/{course}/archive', [AdminCourseController::class, 'archive'])->name('admin.courses.archive');
    Route::post('/courses/{course}/restore', [AdminCourseController::class, 'restore'])->name('admin.courses.restore');
    Route::delete('/courses/{course}', [AdminCourseController::class, 'destroy'])->name('admin.courses.destroy');
    Route::post('/courses/{course}/duplicate', [AdminCourseController::class, 'duplicate'])->name('admin.courses.duplicate');

    Route::post('/assets', [AdminAssetController::class, 'store'])->name('admin.assets.store');
    Route::delete('/assets/{asset}', [AdminAssetController::class, 'destroy'])->name('admin.assets.destroy');

    Route::get('/settings/hearts', [AdminHeartSettingsController::class, 'show'])->name('admin.hearts.show');
    Route::put('/settings/hearts', [AdminHeartSettingsController::class, 'update'])->name('admin.hearts.update');
    Route::post('/players/{user}/hearts', [AdminPlayerHeartsController::class, 'adjust'])->name('admin.players.hearts.adjust');
});
