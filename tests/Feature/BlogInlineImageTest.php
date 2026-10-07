<?php

namespace Tests\Feature;

use App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle;
use App\Models\User;
use Filament\Forms\Components\MarkdownEditor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;
use Livewire\Livewire;
use Tests\TestCase;

class BlogInlineImageTest extends TestCase
{
    use RefreshDatabase;

    private function editor(): MarkdownEditor
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $page = Livewire::test(CreateBlogArticle::class);
        $editor = $page->instance()->form->getComponentByStatePath('body');
        $this->assertInstanceOf(MarkdownEditor::class, $editor);

        return $editor;
    }

    private function attachment(string $contents, string $name = 'inline.png'): TemporaryUploadedFile
    {
        Storage::disk('local')->put('livewire-tmp/'.$name, $contents);

        return new TemporaryUploadedFile($name, 'local');
    }

    public function test_save_callback_rejects_disguised_svg_php_and_oversize_bytes(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $editor = $this->editor();
        $image = UploadedFile::fake()->image('inline.png');
        $png = file_get_contents($image->getPathname());
        foreach (['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>', '<?php echo "evil";', $png.str_repeat('x', 2048 * 1024)] as $index => $contents) {
            // Livewire's test metadata advertises PNG even though the underlying bytes are hostile.
            $file = $this->attachment($contents, 'invalid-'.$index.'-mimeType=image_png-.png');
            $this->assertSame('image/png', $file->getMimeType());
            if ($index < 2) {
                $this->assertSame($file, $editor->getUploadedFileAttachment($file));
            }
            try {
                // Bypass the frontend and preliminary MIME checks: the persistence callback must protect itself.
                $editor->saveUploadedFileAttachment($file);
                $this->fail('Unsafe attachment was saved.');
            } catch (\Illuminate\Validation\ValidationException $exception) {
                $this->assertArrayHasKey('file', $exception->errors());
            }
            $this->assertSame([], Storage::disk('public')->allFiles());
        }
    }

    public function test_public_detail_renders_safe_inline_markdown_images_with_bounded_styles(): void
    {
        $this->withoutVite();
        $article = \App\Models\BlogArticle::create([
            'title' => 'Inline image', 'slug' => 'inline-image', 'category' => 'Logika', 'excerpt' => 'Summary',
            'status' => 'published', 'published_at' => now()->subMinute(),
            'body' => "![Diagram](/storage/blog/content/diagram.png)\n\n![Unsafe](javascript:alert%281%29)\n\n<img src=x onerror=alert(1)>",
        ]);
        $html = $article->publicData()['body_html'];
        $this->assertStringContainsString('<img src="/storage/blog/content/diagram.png" alt="Diagram"', $html);
        $this->assertStringNotContainsString('src="javascript:', $html);
        $this->assertStringNotContainsString('onerror', $html);
        $this->get('/blog/inline-image')->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('blog-article')->where('article.body_html', $html));
        $source = file_get_contents(resource_path('js/pages/blog-article.tsx'));
        foreach (['[&_img]:max-w-full', '[&_img]:max-h-[32rem]', '[&_img]:h-auto', '[&_img]:object-contain'] as $style) {
            $this->assertStringContainsString($style, $source);
        }
    }

    public function test_real_body_editor_saves_png_attachment_on_public_disk(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $editor = $this->editor();
        $this->assertSame('public', $editor->getFileAttachmentsDiskName());
        $this->assertSame('blog/content', $editor->getFileAttachmentsDirectory());
        $this->assertSame('public', $editor->getFileAttachmentsVisibility());
        $this->assertSame(2048, $editor->getFileAttachmentsMaxSize());
        $this->assertSame(['image/jpeg', 'image/png', 'image/webp'], $editor->getFileAttachmentsAcceptedFileTypes());
        $image = UploadedFile::fake()->image('inline.png');
        $png = file_get_contents($image->getPathname());
        $path = $editor->saveUploadedFileAttachment($this->attachment($png));
        $this->assertStringStartsWith('blog/content/', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertSame($png, Storage::disk('public')->get($path));
        $this->assertStringContainsString('/storage/blog/content/', $editor->getFileAttachmentUrl($path));
    }
}
