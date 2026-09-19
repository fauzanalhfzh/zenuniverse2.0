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
];
