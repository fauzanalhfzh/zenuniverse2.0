<?php

namespace App\Filament\Admin\Resources\LessonSteps\Pages;

use App\Filament\Admin\Resources\LessonSteps\LessonStepResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditLessonStep extends EditRecord
{
    protected static string $resource = LessonStepResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
