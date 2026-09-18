<?php

use App\Exceptions\LearningException;
use App\Models\Course;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

[$script, $courseId, $revision, $actorId] = $argv;

try {
    $release = app(CoursePublisher::class)->publish(
        Course::query()->findOrFail($courseId),
        User::query()->findOrFail((int) $actorId),
        (int) $revision,
    );

    echo json_encode(['ok' => true, 'revision' => (int) $release->revision], JSON_THROW_ON_ERROR);
} catch (LearningException $exception) {
    echo json_encode(['ok' => false, 'code' => $exception->errorCode], JSON_THROW_ON_ERROR);
}
