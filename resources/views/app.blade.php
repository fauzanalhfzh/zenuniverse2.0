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
            @if(in_array($page['component'], ['home', 'price', 'blog', 'blog-article'], true) && isset($page['props']['seo']))
                <title data-inertia="">{{ $page['props']['seo']['title'] }}</title>
                <meta name="description" content="{{ $page['props']['seo']['description'] }}" data-inertia="description">
                <link rel="canonical" href="{{ $page['props']['seo']['canonical'] }}" data-inertia="canonical">
                @foreach(['title', 'description', 'url', 'type', 'image'] as $property)
                    <meta property="og:{{ $property }}" content="{{ $page['props']['seo'][$property === 'url' ? 'canonical' : $property] }}" data-inertia="og:{{ $property }}">
                @endforeach
                <meta name="twitter:card" content="summary_large_image" data-inertia="twitter:card">
                <script type="application/ld+json" data-inertia="structured-data">{!! $page['props']['seo']['jsonLd'] !!}</script>
            @else
                <title>ZenUniverse Academy</title>
            @endif
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
