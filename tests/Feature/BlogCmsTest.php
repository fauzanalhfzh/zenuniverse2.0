<?php

namespace Tests\Feature;

use App\Models\BlogArticle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BlogCmsTest extends TestCase
{
    use RefreshDatabase;

    public function test_blog_resource_is_admin_only_and_admin_can_create_edit_delete(): void
    {
        $this->withoutVite();
        $this->actingAs(User::factory()->create(['is_admin' => false]));
        $this->get('/admin/blog-articles')->assertForbidden();
        $this->get('/admin/blog-articles/create')->assertForbidden();
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $this->get('/admin/blog-articles')->assertOk();
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
            ->fillForm(['title' => 'New article', 'slug' => 'new-article', 'category' => 'Logika', 'excerpt' => 'Summary', 'body' => '## Hello', 'status' => 'draft', 'is_featured' => false])
            ->call('create')->assertHasNoFormErrors();
        $record = BlogArticle::firstOrFail();
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\EditBlogArticle::class, ['record' => $record->id])
            ->fillForm(['title' => 'Updated', 'status' => 'published', 'published_at' => now()->subMinute()->format('Y-m-d H:i:s')])
            ->call('save')->assertHasNoFormErrors();
        $this->assertSame('Updated', $record->fresh()->title);
        $this->assertSame(1, BlogArticle::published()->count());
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\EditBlogArticle::class, ['record' => $record->id])->callAction('delete');
        $this->assertDatabaseCount('blog_articles', 0);
    }

    public function test_cover_upload_accepts_raster_and_rejects_svg_and_disguised_script(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        foreach ([\Illuminate\Http\UploadedFile::fake()->createWithContent('evil.svg', '<svg onload="alert(1)"></svg>'), \Illuminate\Http\UploadedFile::fake()->createWithContent('evil.png', '<?php echo 1;'), \Illuminate\Http\UploadedFile::fake()->createWithContent('disguised.png', '<svg onload="alert(1)"></svg>'), \Illuminate\Http\UploadedFile::fake()->image('animation.gif')] as $file) {
            \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
                ->fillForm(['title' => 'Image', 'slug' => 'image', 'category' => 'Logika', 'excerpt' => 'Summary', 'body' => 'Text', 'status' => 'draft'])
                ->set('data.cover_image', [$file])->assertSet('data.cover_image', fn ($value) => count($value) === 1)->call('create')->assertHasFormErrors(['cover_image']);
        }
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
            ->fillForm(['title' => 'Image', 'slug' => 'image', 'category' => 'Logika', 'excerpt' => 'Summary', 'body' => 'Text', 'status' => 'draft', 'cover_image' => \Illuminate\Http\UploadedFile::fake()->image('cover.png')])
            ->call('create')->assertHasNoFormErrors();
        $article = BlogArticle::firstOrFail();
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($article->cover_image);
        $this->assertStringContainsString('/storage/blog/', $article->publicData()['image']);
        foreach (['jpg', 'webp'] as $extension) {
            \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
                ->fillForm(['title' => 'Image', 'slug' => 'image-'.$extension, 'category' => 'Logika', 'excerpt' => 'Summary', 'body' => 'Text', 'status' => 'draft', 'cover_image' => \Illuminate\Http\UploadedFile::fake()->image('cover.'.$extension)])
                ->call('create')->assertHasNoFormErrors();
            $record = BlogArticle::where('slug', 'image-'.$extension)->firstOrFail();
            \Illuminate\Support\Facades\Storage::disk('public')->assertExists($record->cover_image);
        }
    }

    public function test_cover_paths_cannot_be_injected_on_create_or_changed_to_another_records_path(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        \Illuminate\Support\Facades\Storage::disk('public')->put('blog/other.png', 'other');
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        foreach (['blog/other.png', '../private.png', 'https://example.com/cover.svg', '/illustrations/hero-coding-explorers.svg'] as $path) {
            \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
                ->fillForm(['title' => 'Image', 'slug' => 'image', 'category' => 'Logika', 'excerpt' => 'Summary', 'body' => 'Text', 'status' => 'draft'])
                ->set('data.cover_image', [$path])->call('create')->assertHasFormErrors(['cover_image']);
        }
        $this->assertDatabaseCount('blog_articles', 0);

        $this->artisan('blog:import-demos')->assertSuccessful();
        $article = BlogArticle::firstOrFail();
        $original = $article->cover_image;
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\EditBlogArticle::class, ['record' => $article->id])
            ->set('data.cover_image', ['blog/other.png'])->call('save')->assertHasFormErrors(['cover_image']);
        $this->assertSame($original, $article->fresh()->cover_image);
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\EditBlogArticle::class, ['record' => $article->id])
            ->fillForm(['title' => 'Unchanged cover'])->call('save')->assertHasNoFormErrors();
        $this->assertSame($original, $article->fresh()->cover_image);
    }

    public function test_imported_cover_paths_are_preserved(): void
    {
        $this->artisan('blog:import-demos')->assertSuccessful();
        $this->assertSame('/illustrations/hero-coding-explorers.svg', BlogArticle::where('slug', 'kapan-anak-siap-coding')->firstOrFail()->publicData()['image']);
    }

    public function test_markdown_is_safe_and_featured_order_has_newest_fallback(): void
    {
        $this->withoutVite();
        $base = ['category' => 'Logika', 'excerpt' => 'Summary', 'status' => 'published', 'published_at' => now()->subDay()];
        $first = BlogArticle::create($base + ['title' => 'Older', 'slug' => 'older', 'body' => "<script>alert(1)</script><img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29) **Safe**"]);
        $second = BlogArticle::create(array_merge($base, ['title' => 'Newer', 'slug' => 'newer', 'body' => 'Text', 'published_at' => now()->subHour()]));
        $html = $first->publicData()['body_html'];
        $this->assertStringNotContainsString('<script', $html);
        $this->assertStringNotContainsString('<img', $html);
        $this->assertStringNotContainsString('href="javascript:', $html);
        $this->assertStringContainsString('<strong>Safe</strong>', $html);
        $this->get('/blog')->assertInertia(fn (Assert $page) => $page->where('articles.0.slug', 'newer'));
        $first->update(['is_featured' => true]);
        $this->get('/blog')->assertInertia(fn (Assert $page) => $page->where('articles.0.slug', 'older'));
    }

    public function test_form_rejects_bad_slug_duplicate_category_and_missing_publish_date(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $form = \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
            ->fillForm(['title' => 'Title', 'slug' => '../bad', 'category' => 'Bad', 'excerpt' => 'Summary', 'body' => 'Text', 'status' => 'published']);
        $form->call('create')->assertHasFormErrors(['slug', 'category', 'published_at']);
        $form->fillForm(['slug' => 'valid-slug', 'category' => 'Logika', 'status' => 'draft'])->call('create')->assertHasNoFormErrors();
        \Livewire\Livewire::test(\App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle::class)
            ->fillForm(['title' => 'Other', 'slug' => 'valid-slug', 'category' => 'Logika', 'excerpt' => 'Summary', 'body' => 'Text', 'status' => 'draft'])
            ->call('create')->assertHasFormErrors(['slug' => 'unique']);
    }

    public function test_import_is_explicit_idempotent_and_never_overwrites_editorial_changes(): void
    {
        $this->artisan('blog:import-demos')->assertSuccessful();
        $this->assertDatabaseCount('blog_articles', 3);
        $this->assertSame(0, BlogArticle::published()->count());
        $article = BlogArticle::first();
        $article->update(['title' => 'Edited', 'status' => 'published', 'published_at' => now()]);
        $this->artisan('blog:import-demos')->assertSuccessful();
        $this->assertDatabaseCount('blog_articles', 3);
        $this->assertSame('Edited', $article->fresh()->title);
        $this->assertSame('published', $article->fresh()->status);
    }
}
