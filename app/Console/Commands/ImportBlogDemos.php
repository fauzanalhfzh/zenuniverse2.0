<?php

namespace App\Console\Commands;

use App\Models\BlogArticle;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportBlogDemos extends Command
{
    protected $signature = 'blog:import-demos';
    protected $description = 'Import contoh blog sebagai draf saja; artikel yang sudah ada tidak diubah.';

    public function handle(): int
    {
        $articles = json_decode(file_get_contents(resource_path('content/blog.json')), true, 512, JSON_THROW_ON_ERROR);
        $created = DB::transaction(function () use ($articles): int {
            $count = 0;
            foreach ($articles as $article) {
                $record = BlogArticle::firstOrCreate(['slug' => $article['slug']], [
                    'title' => $article['title'], 'category' => $article['category'], 'excerpt' => $article['excerpt'],
                    'cover_image' => $article['image'],
                    'body' => collect($article['sections'])->map(fn ($section) => '## '.$section['title']."\n\n".str_replace(['<', '>'], ['&lt;', '&gt;'], $section['body']))->implode("\n\n"),
                    'status' => 'draft', 'is_featured' => false, 'published_at' => null,
                ]);
                $count += (int) $record->wasRecentlyCreated;
            }
            return $count;
        });
        $this->info("{$created} draf dibuat; artikel yang sudah ada dilewati.");
        return self::SUCCESS;
    }
}
