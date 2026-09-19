<?php

namespace App\Filament\Admin\Resources\HeartSettings;

use App\Filament\Admin\Resources\HeartSettings\Pages\EditHeartSetting;
use App\Filament\Admin\Resources\HeartSettings\Pages\ListHeartSettings;
use App\Models\HeartSetting;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HeartSettingResource extends Resource
{
    protected static ?string $model = HeartSetting::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedHeart;

    protected static ?string $recordTitleAttribute = 'id';

    protected static ?string $navigationLabel = 'Pengaturan Hearts';

    protected static ?string $pluralModelLabel = 'Pengaturan Hearts';

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canDelete(mixed $record): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('capacity')
                    ->label('Kapasitas hearts')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(100),
                TextInput::make('regen_minutes')
                    ->label('Regenerasi (menit)')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(1440),
                TextInput::make('version')
                    ->label('Versi')
                    ->numeric()
                    ->disabled()
                    ->dehydrated(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                TextColumn::make('capacity')
                    ->label('Kapasitas')
                    ->numeric(),
                TextColumn::make('regen_minutes')
                    ->label('Regen (menit)')
                    ->numeric(),
                TextColumn::make('version')
                    ->label('Versi')
                    ->numeric(),
                TextColumn::make('updated_at')
                    ->label('Diubah')
                    ->dateTime()
                    ->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListHeartSettings::route('/'),
            'edit' => EditHeartSetting::route('/{record}/edit'),
        ];
    }
}
