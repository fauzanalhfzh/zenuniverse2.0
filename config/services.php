<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
        'mobile_audiences' => array_values(array_filter(array_map('trim', explode(',', (string) env('GOOGLE_MOBILE_AUDIENCES', ''))))),
    ],

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Sandbox for learner code (docs/code-runner.md). Empty URL keeps the answer-key comparison only.
    'piston' => [
        'url' => env('PISTON_URL', ''),
        'token' => env('PISTON_TOKEN'),
        'http_timeout' => (int) env('PISTON_HTTP_TIMEOUT', 15),
        'compile_timeout_ms' => (int) env('PISTON_COMPILE_TIMEOUT_MS', 10000),
        'run_timeout_ms' => (int) env('PISTON_RUN_TIMEOUT_MS', 3000),
        'memory_bytes' => (int) env('PISTON_MEMORY_BYTES', 128 * 1024 * 1024),
        'runtimes' => [
            'python' => ['language' => 'python', 'version' => env('PISTON_PYTHON_VERSION', '*'), 'file' => 'main.py'],
            'javascript' => ['language' => 'javascript', 'version' => env('PISTON_JAVASCRIPT_VERSION', '*'), 'file' => 'main.js'],
            'cpp' => ['language' => 'c++', 'version' => env('PISTON_CPP_VERSION', '*'), 'file' => 'main.cpp'],
        ],
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
