<?php

use App\Models\LessonStep;
use App\Models\User;
use App\Services\Learning\SubmitAttempt;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

[$script, $userId, $stepId, $lessonId, $revision, $attemptId, $optionId] = $argv;

$user = User::query()->findOrFail((int) $userId);
$step = LessonStep::query()->findOrFail($stepId);

$outcome = app(SubmitAttempt::class)->handle(
    $user,
    $step,
    $lessonId,
    (int) $revision,
    $attemptId,
    ['type' => 'quiz', 'optionId' => $optionId],
);

echo json_encode($outcome, JSON_THROW_ON_ERROR);
