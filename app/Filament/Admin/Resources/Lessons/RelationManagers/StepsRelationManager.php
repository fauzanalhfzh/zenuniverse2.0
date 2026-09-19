<?php

namespace App\Filament\Admin\Resources\Lessons\RelationManagers;

use App\Enums\StepType;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class StepsRelationManager extends RelationManager
{
    protected static string $relationship = 'steps';

    public function form(Schema $schema): Schema
    {
        $json = fn (Textarea $field): Textarea => $field
            ->formatStateUsing(fn ($state): string => is_array($state) ? (string) json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : (string) $state)
            ->dehydrateStateUsing(fn ($state): ?array => blank($state) ? null : (is_array($state) ? $state : json_decode((string) $state, true)))
            ->rules(['nullable', 'json']);

        return $schema
            ->components([
                TextInput::make('id')
                    ->label('ID')
                    ->required()
                    ->maxLength(160)
                    ->unique(ignoreRecord: true)
                    ->disabledOn('edit')
                    ->dehydrated(),
                Select::make('type')
                    ->label('Tipe')
                    ->options(StepType::class)
                    ->required(),
                TextInput::make('reward_xp')
                    ->label('Reward XP')
                    ->required()
                    ->numeric()
                    ->default(0),
                $json(Textarea::make('content')
                    ->label('Content (JSON)')
                    ->required()
                    ->columnSpanFull()),
                $json(Textarea::make('validation')
                    ->label('Validation privat (JSON)')
                    ->columnSpanFull()),
                $json(Textarea::make('challenge')
                    ->label('Challenge Blockly (JSON)')
                    ->columnSpanFull()),
                TextInput::make('sort_order')
                    ->label('Urutan')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->searchable(),
                TextColumn::make('type')
                    ->label('Tipe')
                    ->badge()
                    ->searchable(),
                TextColumn::make('reward_xp')
                    ->label('Reward XP')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('sort_order')
                    ->label('Urutan')
                    ->numeric()
                    ->sortable(),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
