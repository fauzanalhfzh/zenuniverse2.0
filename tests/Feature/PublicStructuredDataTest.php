<?php

namespace Tests\Feature;

use App\Models\BlogArticle;
use App\Support\PublicSeo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicStructuredDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_expose_truthful_brand_graph_and_https_social_metadata(): void
    {
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        foreach (['home' => '/', 'price' => '/price', 'blog' => '/blog'] as $name => $path) {
            $seo = PublicSeo::page($name);
            $this->assertSame('website', $seo['type']);
            $this->assertStringStartsWith('https://', $seo['image']);
            $graph = json_decode($seo['jsonLd'], true, flags: JSON_THROW_ON_ERROR);
            $this->assertSame(['Organization', 'WebSite'], array_column($graph['@graph'], '@type'));
            $this->assertSame('ZenUniverse', $graph['@graph'][0]['name']);
            $this->assertSame(PublicSeo::ORIGIN.'/', $graph['@graph'][1]['url']);
            $this->assertSocialHead($this->get($path.'?utm_source=test')->assertOk()->getContent(), $seo);
        }
        $this->get('/login')->assertDontSee('application/ld+json', false)->assertDontSee('property="og:', false);
    }

    public function test_article_uses_real_dates_cover_and_safe_json_without_invented_claims(): void
    {
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        $title = 'Judul </script><script>window.seoXss=1</script> & "kutip"';
        $article = BlogArticle::create(['title' => $title, 'slug' => 'safe-article', 'category' => 'Logika', 'excerpt' => 'Ringkasan </script><script>window.seoXss=1</script>', 'cover_image' => 'blog/cover.png', 'body' => 'Body', 'status' => 'published', 'published_at' => '2025-01-02 03:04:05']);
        $article->forceFill(['updated_at' => '2025-03-04 05:06:07'])->save();
        $seo = PublicSeo::article($article);
        $this->assertSame('article', $seo['type']);
        $this->assertSame('https://zenuniverse.id/storage/blog/cover.png', $seo['image']);
        $this->assertStringNotContainsString('<', $seo['jsonLd']);
        $this->assertStringNotContainsString('>', $seo['jsonLd']);
        $graph = json_decode($seo['jsonLd'], true, flags: JSON_THROW_ON_ERROR)['@graph'];
        $post = $graph[2];
        $this->assertSame('BlogPosting', $post['@type']);
        $this->assertSame($title, $post['headline']);
        $this->assertSame($article->excerpt, $post['description']);
        $this->assertSame($seo['canonical'], $post['url']);
        $this->assertSame($seo['canonical'], $post['mainEntityOfPage']['@id']);
        $this->assertSame($seo['image'], $post['image']);
        $this->assertSame($article->published_at->toIso8601String(), $post['datePublished']);
        $this->assertSame($article->updated_at->toIso8601String(), $post['dateModified']);
        foreach (['author', 'aggregateRating', 'review', 'offers', 'price'] as $key) {
            $this->assertArrayNotHasKey($key, $post);
        }
        $this->assertSocialHead($this->get('/blog/safe-article')->assertOk()->getContent(), $seo);
        foreach (['/illustrations/hero-coding-explorers.svg', null] as $cover) {
            $article->cover_image = $cover;
            $this->assertSame(PublicSeo::ORIGIN.'/illustrations/hero-coding-explorers.svg', PublicSeo::article($article)['image']);
        }
    }

    private function assertSocialHead(string $html, array $seo): void
    {
        $dom = new \DOMDocument;
        @$dom->loadHTML($html);
        $xpath = new \DOMXPath($dom);
        foreach (['title', 'description', 'url', 'type', 'image'] as $property) {
            $nodes = $xpath->query('//head/meta[@property="og:'.$property.'"]');
            $this->assertSame(1, $nodes->length);
            $this->assertSame($seo[$property === 'url' ? 'canonical' : $property], $nodes->item(0)->getAttribute('content'));
        }
        $this->assertSame(1, $xpath->query('//head/meta[@name="twitter:card"]')->length);
        $this->assertSame('summary_large_image', $xpath->query('//head/meta[@name="twitter:card"]')->item(0)->getAttribute('content'));
        $scripts = $xpath->query('//head/script[@type="application/ld+json"]');
        $this->assertSame(1, $scripts->length);
        $this->assertSame(json_decode($seo['jsonLd'], true), json_decode($scripts->item(0)->textContent, true, flags: JSON_THROW_ON_ERROR));
        $this->assertSame(1, $xpath->query('//head/script')->length);
    }
}
