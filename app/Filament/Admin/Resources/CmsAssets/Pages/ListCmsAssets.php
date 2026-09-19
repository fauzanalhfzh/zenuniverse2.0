<?php

namespace App\Filament\Admin\Resources\CmsAssets\Pages;

use App\Filament\Admin\Resources\CmsAssets\CmsAssetResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCmsAssets extends ListRecords
{
    protected static string $resource = CmsAssetResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
