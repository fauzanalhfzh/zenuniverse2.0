<?php

namespace Tests\Feature;

use App\Models\BlogArticle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BlogPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_due_published_articles_are_public(): void
    {
        $this->withoutVite();
        $this->get('/blog')->assertOk()->assertInertia(fn (Assert $page) => $page->component('blog')->has('articles', 0));
        foreach (['draft', 'future', 'live'] as $slug) {
            BlogArticle::create(['title' => $slug, 'slug' => $slug, 'category' => 'Logika', 'excerpt' => 'Excerpt', 'body' => 'Body', 'status' => $slug === 'draft' ? 'draft' : 'published', 'published_at' => $slug === 'future' ? now()->addDay() : now()->subDay()]);
        }
        $this->get('/blog')->assertInertia(fn (Assert $page) => $page->has('articles', 1)->where('articles.0.slug', 'live'));
        $this->get('/blog/draft')->assertNotFound();
        $this->get('/blog/future')->assertNotFound();
        $this->get('/blog/live')->assertOk();
        $this->get('/blog/tidak-ada')->assertNotFound();
    }
}
