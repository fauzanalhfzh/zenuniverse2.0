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
];
