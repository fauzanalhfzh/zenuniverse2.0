<?php

namespace App\Filament\Admin\Resources\HeartSettings\Pages;

use App\Filament\Admin\Resources\HeartSettings\HeartSettingResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditHeartSetting extends EditRecord
{
    protected static string $resource = HeartSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
