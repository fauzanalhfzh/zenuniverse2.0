<?php

namespace App\Filament\Admin\Resources\BlogArticles\Pages;

use App\Filament\Admin\Resources\BlogArticles\BlogArticleResource;
use Filament\Resources\Pages\CreateRecord;

class CreateBlogArticle extends CreateRecord
{
    protected static string $resource = BlogArticleResource::class;
}
