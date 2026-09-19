<?php

namespace App\Filament\Admin\Resources\HeartSettings\Pages;

use App\Filament\Admin\Resources\HeartSettings\HeartSettingResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListHeartSettings extends ListRecords
{
    protected static string $resource = HeartSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
