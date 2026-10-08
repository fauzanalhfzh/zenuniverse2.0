<?php

namespace App\Support;

use App\Models\BlogArticle;

final class PublicSeo
{
    public const ORIGIN = 'https://zenuniverse.id';

    public static function page(string $page): array
    {
        [$path, $title, $description] = match ($page) {
            'home' => ['/', 'Belajar Coding untuk Anak | ZenUniverse', 'Belajar coding untuk anak lewat misi interaktif di ZenUniverse. Jelajahi logika, kreativitas, dan pemrograman sambil bermain.'],
            'price' => ['/price', 'Harga Paket Belajar Coding | ZenUniverse', 'Temukan paket belajar coding ZenUniverse untuk anak. Bandingkan pilihan dan mulai petualangan belajar sesuai kebutuhan keluarga.'],
            'blog' => ['/blog', 'Cerita dari Bumi Zen | ZenUniverse', 'Baca cerita, tips belajar coding untuk anak, dan panduan orang tua dari Bumi Zen. Temukan ide belajar logika bersama ZenUniverse.'],
        };

        return self::metadata($title, $description, self::ORIGIN.$path);
    }

    private static function metadata(string $title, string $description, string $canonical, string $type = 'website', ?string $image = null, array $extraGraph = []): array
    {
        $image ??= self::ORIGIN.'/images/favicon/favicon-512x512.png';
        $graph = [
            ['@type' => 'Organization', '@id' => self::ORIGIN.'/#organization', 'name' => 'ZenUniverse', 'url' => self::ORIGIN.'/', 'logo' => self::ORIGIN.'/images/favicon/favicon-512x512.png'],
            ['@type' => 'WebSite', '@id' => self::ORIGIN.'/#website', 'name' => 'ZenUniverse', 'url' => self::ORIGIN.'/', 'publisher' => ['@id' => self::ORIGIN.'/#organization']],
            ...$extraGraph,
        ];

        return [
            'title' => $title, 'description' => $description, 'canonical' => $canonical, 'type' => $type, 'image' => $image,
            // Serialize once on the server: Blade and React emit the exact same safe payload.
            'jsonLd' => json_encode(['@context' => 'https://schema.org', '@graph' => $graph], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        ];
    }

    public static function article(BlogArticle $article): array
    {
        $canonical = self::ORIGIN.'/blog/'.rawurlencode($article->slug);
        $imagePath = parse_url($article->publicData()['image'], PHP_URL_PATH);
        $image = self::ORIGIN.'/'.ltrim($imagePath ?: '/illustrations/hero-coding-explorers.svg', '/');
        $post = [
            '@type' => 'BlogPosting', '@id' => $canonical.'#article',
            'headline' => $article->title, 'description' => $article->excerpt,
            'url' => $canonical, 'mainEntityOfPage' => ['@id' => $canonical], 'image' => $image,
            'publisher' => ['@id' => self::ORIGIN.'/#organization'],
        ];
        if ($article->published_at !== null) {
            $post['datePublished'] = $article->published_at->toIso8601String();
        }
        if ($article->updated_at !== null) {
            $post['dateModified'] = $article->updated_at->toIso8601String();
        }

        return self::metadata($article->title.' | ZenUniverse', $article->excerpt, $canonical, 'article', $image, [$post]);
    }
}
