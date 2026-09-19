<?php

namespace App\Filament\Admin\Resources\CmsAssets;

use App\Filament\Admin\Resources\CmsAssets\Pages\CreateCmsAsset;
use App\Filament\Admin\Resources\CmsAssets\Pages\EditCmsAsset;
use App\Filament\Admin\Resources\CmsAssets\Pages\ListCmsAssets;
use App\Models\CmsAsset;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CmsAssetResource extends Resource
{
    protected static ?string $model = CmsAsset::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPhoto;

    protected static ?string $recordTitleAttribute = 'original_name';

    protected static ?string $navigationLabel = 'Aset';

    protected static ?string $pluralModelLabel = 'Aset';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                FileUpload::make('path')
                    ->label('Gambar')
                    ->disk('public')
                    ->directory('cms')
                    ->visibility('public')
                    ->image()
                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                    ->maxSize(2048)
                    ->storeFileNamesIn('original_name')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('original_name')
                    ->label('Nama asli')
                    ->disabled()
                    ->dehydrated(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('original_name')
            ->columns([
                ImageColumn::make('path')
                    ->label('Pratinjau')
                    ->disk('public')
                    ->height(40),
                TextColumn::make('original_name')
                    ->label('Nama')
                    ->searchable(),
                TextColumn::make('mime')
                    ->label('MIME')
                    ->badge(),
                TextColumn::make('size')
                    ->label('Ukuran (byte)')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Diunggah')
                    ->dateTime()
                    ->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCmsAssets::route('/'),
            'create' => CreateCmsAsset::route('/create'),
            'edit' => EditCmsAsset::route('/{record}/edit'),
        ];
    }
}
