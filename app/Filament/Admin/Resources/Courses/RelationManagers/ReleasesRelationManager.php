<?php

namespace App\Filament\Admin\Resources\Courses\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReleasesRelationManager extends RelationManager
{
    protected static string $relationship = 'releases';

    protected static ?string $title = 'Riwayat terbit';

    public function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('revision')
            ->columns([
                TextColumn::make('revision')
                    ->label('Revisi')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('hash')
                    ->label('Hash')
                    ->limit(16)
                    ->copyable(),
                TextColumn::make('published_at')
                    ->label('Diterbitkan')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('actor_id')
                    ->label('Oleh (ID)')
                    ->numeric(),
            ])
            ->headerActions([])
            ->recordActions([])
            ->toolbarActions([]);
    }
}
