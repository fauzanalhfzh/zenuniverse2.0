<?php

namespace App\Filament\Admin\Resources\LessonSteps;

use App\Enums\StepType;
use App\Filament\Admin\Resources\LessonSteps\Pages\CreateLessonStep;
use App\Filament\Admin\Resources\LessonSteps\Pages\EditLessonStep;
use App\Filament\Admin\Resources\LessonSteps\Pages\ListLessonSteps;
use App\Models\LessonStep;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class LessonStepResource extends Resource
{
    protected static ?string $model = LessonStep::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPuzzlePiece;

    protected static ?string $recordTitleAttribute = 'id';

    protected static ?string $navigationLabel = 'Step';

    protected static ?string $pluralModelLabel = 'Step';

    public static function form(Schema $schema): Schema
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
                Select::make('lesson_id')
                    ->label('Lesson')
                    ->relationship('lesson', 'title')
                    ->searchable()
                    ->preload()
                    ->required(),
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

    public static function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->searchable(),
                TextColumn::make('lesson.title')
                    ->label('Lesson')
                    ->searchable(),
                TextColumn::make('type')
                    ->label('Tipe')
                    ->badge(),
                TextColumn::make('reward_xp')
                    ->label('Reward XP')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('sort_order')
                    ->label('Urutan')
                    ->numeric()
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
            'index' => ListLessonSteps::route('/'),
            'create' => CreateLessonStep::route('/create'),
            'edit' => EditLessonStep::route('/{record}/edit'),
        ];
    }
}
