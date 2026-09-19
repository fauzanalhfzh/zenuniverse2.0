<?php

namespace App\Filament\Admin\Resources\CmsAssets\Pages;

use App\Filament\Admin\Resources\CmsAssets\CmsAssetResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCmsAsset extends EditRecord
{
    protected static string $resource = CmsAssetResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
