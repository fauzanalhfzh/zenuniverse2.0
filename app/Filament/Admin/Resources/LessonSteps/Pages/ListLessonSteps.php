<?php

namespace App\Filament\Admin\Resources\LessonSteps\Pages;

use App\Filament\Admin\Resources\LessonSteps\LessonStepResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListLessonSteps extends ListRecords
{
    protected static string $resource = LessonStepResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
