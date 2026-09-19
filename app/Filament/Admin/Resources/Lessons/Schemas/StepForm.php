<?php

namespace App\Filament\Admin\Resources\Lessons\Schemas;

use App\Enums\StepType;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;

/**
 * Typed step editor. Common fields are first-class; complex nested values
 * (e.g. code-fill parts) stay editable as JSON to avoid lossy round trips.
 */
class StepForm
{
    public const LANGUAGES = [
        'python' => 'Python',
        'javascript' => 'JavaScript',
        'cpp' => 'C++',
        'html' => 'HTML',
        'css' => 'CSS',
    ];

    /**
     * @return array<int, mixed>
     */
    public static function make(): array
    {
        return [
            Select::make('type')
                ->label('Tipe')
                ->options(StepType::class)
                ->required()
                ->live(),
            TextInput::make('reward_xp')
                ->label('Reward XP')
                ->required()
                ->numeric()
                ->default(0),
            TextInput::make('sort_order')
                ->label('Urutan')
                ->required()
                ->numeric()
                ->default(0),

            Section::make('Concept')
                ->visible(fn (Get $get): bool => $get('type') === 'concept')
                ->schema([
                    TextInput::make('content.title')->label('Judul')->required(),
                    TextInput::make('content.eyebrow')->label('Eyebrow'),
                    Textarea::make('content.body')->label('Isi materi')->required()->columnSpanFull(),
                    Textarea::make('content.code')->label('Contoh kode')->columnSpanFull(),
                    TextInput::make('content.illustration.src')->label('Ilustrasi (URL)'),
                    TextInput::make('content.illustration.alt')->label('Alt ilustrasi'),
                ])->columns(2),

            Section::make('Quiz')
                ->visible(fn (Get $get): bool => $get('type') === 'quiz')
                ->schema([
                    Textarea::make('content.question')->label('Pertanyaan')->required()->columnSpanFull(),
                    Repeater::make('content.options')
                        ->label('Opsi')
                        ->schema([
                            TextInput::make('id')->required(),
                            TextInput::make('label')->required(),
                        ])
                        ->columns(2)
                        ->minItems(2)
                        ->columnSpanFull(),
                    Select::make('validation.correctOptionId')
                        ->label('Opsi benar')
                        ->options(function (Get $get): array {
                            $options = $get('content.options');
                            $options = is_array($options) ? $options : [];

                            return collect($options)
                                ->filter(fn ($option): bool => is_array($option) && isset($option['id']))
                                ->mapWithKeys(fn (array $option): array => [(string) $option['id'] => (string) ($option['label'] ?? $option['id'])])
                                ->all();
                        })
                        ->required(),
                    Textarea::make('content.explanation')
                        ->label('Penjelasan (ditampilkan setelah menjawab)')
                        ->required()
                        ->columnSpanFull(),
                ]),

            Section::make('Blockly')
                ->visible(fn (Get $get): bool => $get('type') === 'blockly')
                ->schema([
                    TextInput::make('content.title')->label('Judul')->required(),
                    TextInput::make('content.objective')->label('Tujuan')->required(),
                    CheckboxList::make('content.availableBlocks')
                        ->label('Blok tersedia')
                        ->options([
                            'move_forward' => 'Maju',
                            'turn_right' => 'Belok kanan',
                            'repeat' => 'Ulangi',
                        ])
                        ->columnSpanFull(),
                    Grid::make(2)->schema([
                        TextInput::make('challenge.board.width')->label('Papan lebar')->numeric()->required(),
                        TextInput::make('challenge.board.height')->label('Papan tinggi')->numeric()->required(),
                        TextInput::make('challenge.start.x')->label('Start X')->numeric()->required(),
                        TextInput::make('challenge.start.y')->label('Start Y')->numeric()->required(),
                        Select::make('challenge.start.direction')
                            ->label('Arah awal')
                            ->options(['north' => 'Utara', 'east' => 'Timur', 'south' => 'Selatan', 'west' => 'Barat'])
                            ->required(),
                        TextInput::make('challenge.goal.x')->label('Goal X')->numeric()->required(),
                        TextInput::make('challenge.goal.y')->label('Goal Y')->numeric()->required(),
                        TextInput::make('challenge.maxExecutionSteps')->label('Batas langkah')->numeric()->required(),
                        TextInput::make('challenge.maxBlocks')->label('Batas blok')->numeric(),
                    ]),
                    Textarea::make('challenge.hint')->label('Hint')->required()->columnSpanFull(),
                ]),

            Section::make('Code arrange')
                ->visible(fn (Get $get): bool => $get('type') === 'code-arrange')
                ->schema([
                    TextInput::make('content.title')->label('Judul')->required(),
                    Select::make('content.language')->label('Bahasa')->options(self::LANGUAGES)->required(),
                    Textarea::make('content.instructions')->label('Instruksi')->required()->columnSpanFull(),
                    Repeater::make('content.tokens')
                        ->label('Token')
                        ->schema([
                            TextInput::make('id')->required(),
                            TextInput::make('text')->required(),
                        ])
                        ->columns(2)
                        ->minItems(2)
                        ->columnSpanFull(),
                    TagsInput::make('validation.correctOrder')
                        ->label('Urutan benar (ID token, berurutan)')
                        ->required()
                        ->columnSpanFull(),
                    Textarea::make('content.hint')->label('Hint')->columnSpanFull(),
                ]),

            Section::make('Code fill')
                ->visible(fn (Get $get): bool => $get('type') === 'code-fill')
                ->schema([
                    TextInput::make('content.title')->label('Judul')->required(),
                    Select::make('content.language')->label('Bahasa')->options(self::LANGUAGES)->required(),
                    Textarea::make('content.instructions')->label('Instruksi')->required()->columnSpanFull(),
                    Textarea::make('content.parts')
                        ->label('Parts (JSON array string)')
                        ->formatStateUsing(fn ($state): string => is_array($state) ? (string) json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : (string) $state)
                        ->dehydrateStateUsing(fn ($state): array => is_array($state) ? $state : (array) json_decode((string) $state, true))
                        ->rules(['required', 'json'])
                        ->columnSpanFull(),
                    Repeater::make('content.blanks')
                        ->label('Blank')
                        ->schema([
                            TextInput::make('id')->required(),
                            Select::make('mode')->options(['text' => 'Teks', 'choice' => 'Pilihan'])->required(),
                            TagsInput::make('options')->label('Opsi (mode pilihan)'),
                        ])
                        ->columns(3)
                        ->columnSpanFull(),
                    Repeater::make('validation.acceptedAnswers')
                        ->label('Jawaban diterima')
                        ->schema([
                            TextInput::make('id')->label('ID blank')->required(),
                            TagsInput::make('answers')->label('Jawaban')->required(),
                        ])
                        ->mutateDehydratedStateUsing(fn (?array $state): array => collect($state ?? [])
                            ->filter(fn ($row): bool => is_array($row) && isset($row['id']))
                            ->mapWithKeys(fn (array $row): array => [(string) $row['id'] => array_values($row['answers'] ?? [])])
                            ->all())
                        ->formatStateUsing(fn ($state): array => collect(is_array($state) ? $state : [])
                            ->map(fn ($answers, $id): array => ['id' => $id, 'answers' => array_values((array) $answers)])
                            ->values()
                            ->all())
                        ->columnSpanFull(),
                    Textarea::make('content.hint')->label('Hint')->columnSpanFull(),
                ]),

            Section::make('Code editor')
                ->visible(fn (Get $get): bool => $get('type') === 'code')
                ->schema([
                    TextInput::make('content.title')->label('Judul')->required(),
                    Select::make('content.language')->label('Bahasa')->options(self::LANGUAGES)->required(),
                    Textarea::make('content.prompt')->label('Prompt')->required()->columnSpanFull(),
                    Textarea::make('content.starterCode')->label('Starter code')->columnSpanFull(),
                    Textarea::make('content.expectedCode')->label('Expected code (privat)')->required()->columnSpanFull(),
                    Textarea::make('content.mockOutput')->label('Mock output')->required()->columnSpanFull(),
                    TextInput::make('content.sampleInput')->label('Sample input'),
                    TextInput::make('content.hint')->label('Hint'),
                ])->columns(2),
        ];
    }
}
