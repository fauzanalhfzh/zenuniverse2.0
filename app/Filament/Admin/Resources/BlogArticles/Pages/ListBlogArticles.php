<?php

namespace App\Filament\Admin\Resources\BlogArticles\Pages;

use App\Filament\Admin\Resources\BlogArticles\BlogArticleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBlogArticles extends ListRecords
{
    protected static string $resource = BlogArticleResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
