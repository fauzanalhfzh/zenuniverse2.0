<?php

namespace App\Filament\Admin\Resources\Courses;

use App\Exceptions\LearningException;
use App\Filament\Admin\Resources\Courses\Pages\CreateCourse;
use App\Filament\Admin\Resources\Courses\Pages\EditCourse;
use App\Filament\Admin\Resources\Courses\Pages\ListCourses;
use App\Filament\Admin\Resources\Courses\RelationManagers\ReleasesRelationManager;
use App\Filament\Admin\Resources\Courses\RelationManagers\UnitsRelationManager;
use App\Models\Course;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use App\Services\Content\PublishedContent;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CourseResource extends Resource
{
    protected static ?string $model = Course::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?string $navigationLabel = 'Kursus';

    protected static ?string $modelLabel = 'Kursus';

    protected static ?string $pluralModelLabel = 'Kursus';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('id')
                    ->label('ID')
                    ->required()
                    ->maxLength(160)
                    ->unique(ignoreRecord: true)
                    ->disabledOn('edit')
                    ->dehydrated(),
                TextInput::make('title')
                    ->label('Judul')
                    ->required()
                    ->maxLength(255),
                Textarea::make('description')
                    ->label('Deskripsi')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('level')
                    ->label('Level')
                    ->required()
                    ->maxLength(255),
                Select::make('status')
                    ->label('Status')
                    ->options([
                        'draft' => 'Draft',
                        'published' => 'Published',
                        'archived' => 'Archived',
                    ])
                    ->required()
                    ->default('draft'),
                TagsInput::make('planned_lesson_ids')
                    ->label('Lesson wajib (planned)')
                    ->columnSpanFull(),
                TextInput::make('content_revision')
                    ->label('Revisi konten')
                    ->numeric()
                    ->disabled()
                    ->dehydrated()
                    ->default(1),
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
            ->recordTitleAttribute('title')
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->searchable(),
                TextColumn::make('title')
                    ->label('Judul')
                    ->searchable(),
                TextColumn::make('level')
                    ->label('Level')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'published' => 'success',
                        'archived' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('content_revision')
                    ->label('Revisi')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('units_count')
                    ->label('Unit')
                    ->counts('units')
                    ->numeric(),
                TextColumn::make('sort_order')
                    ->label('Urutan')
                    ->numeric()
                    ->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
                Action::make('preview')
                    ->label('Pratinjau')
                    ->icon(Heroicon::OutlinedEye)
                    ->modalHeading(fn (Course $record): string => "Pratinjau: {$record->title}")
                    ->modalContent(fn (Course $record) => view('filament.course-preview', [
                        'lesson' => self::previewLesson($record),
                    ]))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Tutup'),
                Action::make('duplicate')
                    ->label('Duplikat')
                    ->icon(Heroicon::OutlinedDocumentDuplicate)
                    ->schema([
                        TextInput::make('new_id')
                            ->label('ID kursus baru')
                            ->required()
                            ->regex('/^[a-z0-9][a-z0-9-]*$/')
                            ->maxLength(120),
                        TextInput::make('title')
                            ->label('Judul (opsional)')
                            ->maxLength(255),
                    ])
                    ->action(fn (Course $record, array $data) => self::duplicate($record, $data)),
                Action::make('publish')
                    ->label('Terbitkan')
                    ->icon(Heroicon::OutlinedRocketLaunch)
                    ->requiresConfirmation()
                    ->action(fn (Course $record) => self::publish($record))
                    ->visible(fn (Course $record): bool => $record->status !== 'published'),
                Action::make('archive')
                    ->label('Arsipkan')
                    ->icon(Heroicon::OutlinedArchiveBox)
                    ->requiresConfirmation()
                    ->action(fn (Course $record) => self::archive($record))
                    ->visible(fn (Course $record): bool => $record->status === 'published'),
                Action::make('restore')
                    ->label('Pulihkan')
                    ->icon(Heroicon::OutlinedArrowPath)
                    ->requiresConfirmation()
                    ->action(fn (Course $record) => self::archive($record, restore: true))
                    ->visible(fn (Course $record): bool => $record->status === 'archived'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    private static function actor(): User
    {
        return User::query()->findOrFail(auth()->id());
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function previewLesson(Course $course): ?array
    {
        $lesson = $course->units()->with('lessons')->get()->flatMap->lessons->first();

        if ($lesson === null) {
            return null;
        }

        return app(PublishedContent::class)->lessonPayload($lesson, [], []);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function duplicate(Course $course, array $data): void
    {
        try {
            $copy = app(CoursePublisher::class)->duplicate(
                $course,
                (string) $data['new_id'],
                self::actor(),
                isset($data['title']) ? (string) $data['title'] : null,
            );

            Notification::make()->success()->title("Duplikat dibuat: {$copy->id}")->send();
        } catch (LearningException $exception) {
            Notification::make()->danger()->title($exception->getMessage())->send();
        }
    }

    private static function publish(Course $course): void
    {
        try {
            $release = app(CoursePublisher::class)->publishProjection($course, self::actor());

            Notification::make()
                ->success()
                ->title("Kursus diterbitkan (revisi {$release->revision})")
                ->send();
        } catch (LearningException $exception) {
            Notification::make()->danger()->title($exception->getMessage())->send();
        }
    }

    private static function archive(Course $course, bool $restore = false): void
    {
        try {
            $service = app(CoursePublisher::class);
            $restore
                ? $service->restore($course, self::actor())
                : $service->archive($course, self::actor());

            Notification::make()->success()->title($restore ? 'Kursus dipulihkan' : 'Kursus diarsipkan')->send();
        } catch (LearningException $exception) {
            Notification::make()->danger()->title($exception->getMessage())->send();
        }
    }

    public static function getRelations(): array
    {
        return [
            UnitsRelationManager::class,
            ReleasesRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCourses::route('/'),
            'create' => CreateCourse::route('/create'),
            'edit' => EditCourse::route('/{record}/edit'),
        ];
    }
}
