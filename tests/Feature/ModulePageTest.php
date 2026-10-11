<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Services\Content\PublishedContent;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ModulePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_catalog_uses_only_published_allowlisted_content_with_access_tiers(): void
    {
        $this->seed(ContentSeeder::class);
        Course::query()->where('id', 'python-fundamentals')->update(['access_tier' => 'plus']);
        $catalog = app(PublishedContent::class)->catalog();

        $this->get('/modul')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('modul')
            ->where('courses', $catalog)
            ->where('seo.canonical', 'https://zenuniverse.id/modul'));

        $this->assertNotContains('cpp-fundamentals', array_column($catalog, 'id'));
        $this->assertContains('plus', array_column($catalog, 'accessTier'));
        $this->assertContains('free', array_column($catalog, 'accessTier'));
        foreach ($catalog as $course) {
            $this->assertSame(['id', 'title', 'description', 'level', 'accessTier', 'lessonCount'], array_keys($course));
        }
        $this->get('/dashboard?course=python-fundamentals')->assertRedirect('/login');
    }

    public function test_empty_catalog_remains_public(): void
    {
        $this->get('/modul')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('modul')
            ->has('courses', 0));
    }
}
