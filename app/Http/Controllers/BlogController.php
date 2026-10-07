<?php

namespace App\Http\Controllers;

use App\Models\BlogArticle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $category = in_array($request->query('category'), BlogArticle::CATEGORIES, true) ? $request->query('category') : 'Semua';
        $articles = BlogArticle::published()
            ->when($category !== 'Semua', fn ($query) => $query->where('category', $category))
            ->orderByDesc('is_featured')->orderByDesc('published_at')->orderByDesc('id')
            ->paginate(12)->withQueryString();

        return Inertia::render('blog', [
            'articles' => $articles->getCollection()->map(fn (BlogArticle $article) => $article->publicData()),
            'category' => $category,
            'pagination' => ['previous' => $articles->previousPageUrl(), 'next' => $articles->nextPageUrl()],
        ]);
    }

    public function show(string $slug): Response
    {
        $article = BlogArticle::published()->where('slug', $slug)->firstOrFail();

        return Inertia::render('blog-article', ['article' => $article->publicData()]);
    }
}
