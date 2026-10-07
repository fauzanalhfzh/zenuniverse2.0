<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BlogArticle extends Model
{
    public const CATEGORIES = ['Coding untuk anak', 'Orang tua', 'Tips belajar', 'Logika', 'Cerita komunitas'];

    protected $fillable = ['title', 'slug', 'category', 'excerpt', 'cover_image', 'body', 'status', 'is_featured', 'published_at'];

    protected function casts(): array
    {
        return ['is_featured' => 'boolean', 'published_at' => 'datetime'];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function publicData(): array
    {
        return [
            'slug' => $this->slug, 'title' => $this->title, 'category' => $this->category,
            'excerpt' => $this->excerpt, 'status' => $this->status, 'is_featured' => $this->is_featured,
            'image' => in_array($this->cover_image, ['/illustrations/hero-coding-explorers.svg', '/images/course-icon/html.png', '/images/languages/code-block.png'], true)
                ? $this->cover_image
                : ($this->cover_image ? Storage::disk('public')->url($this->cover_image) : '/illustrations/hero-coding-explorers.svg'),
            'body_html' => Str::markdown($this->body, ['html_input' => 'strip', 'allow_unsafe_links' => false]),
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
