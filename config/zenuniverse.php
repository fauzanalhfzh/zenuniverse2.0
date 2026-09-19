<?php

return [
    /*
    | Kredensial admin CMS yang di-seed. Kosongkan di produksi dan buat admin
    | lewat seeder/CLI dengan kredensial eksplisit.
    */
    'admin' => [
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],

    /*
    | Seam login untuk Playwright. Hanya aktif bila flag di-set DAN environment
    | local/testing, sehingga route selalu 404 di produksi.
    */
    'e2e' => [
        'enabled' => env('E2E_LOGIN_ENABLED', false),
    ],

    /*
    | Interval polling snapshot progress (ms) yang dibagikan ke klien. Ini
    | pengganti Realtime push; latensi antar perangkat dibatasi polling ini.
    */
    'progress' => [
        'poll_ms' => env('PROGRESS_POLL_MS', 15_000),
    ],
];
