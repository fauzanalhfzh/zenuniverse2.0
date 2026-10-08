<?php

namespace Tests\Feature;

use App\Models\BlogArticle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_contains_only_public_due_articles_and_robots_declares_it(): void
    {
        foreach (['live', 'draft', 'future', 'undated'] as $slug) {
            BlogArticle::create(['title' => $slug, 'slug' => $slug, 'category' => 'Logika', 'excerpt' => 'Excerpt', 'body' => 'Body', 'status' => $slug === 'draft' ? 'draft' : 'published', 'published_at' => match ($slug) { 'future' => now()->addDay(), 'undated' => null, default => now()->subDay() }]);
        }
        $response = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $xml = simplexml_load_string($response->getContent());
        $this->assertNotFalse($xml);
        $this->assertSame('http://www.sitemaps.org/schemas/sitemap/0.9', $xml->getDocNamespaces()['']);
        $this->assertSame(['https://zenuniverse.id/', 'https://zenuniverse.id/price', 'https://zenuniverse.id/blog', 'https://zenuniverse.id/blog/live'], array_map(fn ($url) => (string) $url->loc, iterator_to_array($xml->url, false)));
        foreach (['draft', 'future', 'undated'] as $slug) {
            $this->get('/blog/'.$slug)->assertNotFound();
        }
        $robots = file_get_contents(public_path('robots.txt'));
        $this->assertStringContainsString('Sitemap: https://zenuniverse.id/sitemap.xml', $robots);
        $this->assertDoesNotMatchRegularExpression('/Disallow:.*(?:build|assets|\\.js)/', $robots);
    }

    public function test_public_pages_have_unique_escaped_server_metadata(): void
    {
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        BlogArticle::create(['title' => 'Logika <script>alert("x")</script> & anak', 'slug' => 'logika-anak', 'category' => 'Logika', 'excerpt' => 'Belajar "aman" <b>bersama</b> & bermain.', 'body' => 'Body', 'status' => 'published', 'published_at' => now()->subDay()]);
        foreach (['/' => 'Belajar Coding untuk Anak | ZenUniverse', '/price' => 'Harga Paket Belajar Coding | ZenUniverse', '/blog' => 'Cerita dari Bumi Zen | ZenUniverse', '/blog/logika-anak' => 'Logika <script>alert("x")</script> & anak | ZenUniverse'] as $path => $title) {
            $html = $this->get($path.'?utm_source=test')->assertOk()->getContent();
            $dom = new \DOMDocument;
            @$dom->loadHTML($html);
            $xpath = new \DOMXPath($dom);
            $this->assertSame(1, $xpath->query('//head/title')->length);
            $this->assertSame($title, $xpath->query('//head/title')->item(0)->textContent);
            $this->assertSame(1, $xpath->query('//head/meta[@name="description"]')->length);
            $this->assertNotEmpty($xpath->query('//head/meta[@name="description"]')->item(0)->getAttribute('content'));
            $this->assertSame(1, $xpath->query('//head/link[@rel="canonical"]')->length);
            $this->assertSame('https://zenuniverse.id'.$path, $xpath->query('//head/link[@rel="canonical"]')->item(0)->getAttribute('href'));
            $this->assertSame(1, $xpath->query('//head/script')->length);
            $this->assertSame(1, $xpath->query('//head/script[@type="application/ld+json"]')->length);
        }
        $this->get('/blog/logika-anak')->assertSee('&lt;script&gt;', false)->assertSee('&quot;aman&quot;', false);
        $this->get('/blog/not-a-slug')->assertNotFound();
        $this->get('/login')->assertDontSee('rel="canonical"', false);
    }
}
