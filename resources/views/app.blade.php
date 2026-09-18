<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" href="/images/favicon/favicon-16x16.png" sizes="16x16">
        <link rel="icon" href="/images/favicon/favicon-32x32.png" sizes="32x32">
        <link rel="icon" href="/images/favicon/favicon-192x192.png" sizes="192x192">
        <link rel="icon" href="/images/favicon/favicon-512x512.png" sizes="512x512">

        <link rel="icon" href="/images/favicon/favicon.ico" type="image/x-icon">
        <link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>ZenUniverse Academy</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
