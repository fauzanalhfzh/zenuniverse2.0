<?php

namespace App\Filament\Admin\Resources\BlogArticles;

use App\Filament\Admin\Resources\BlogArticles\Pages\CreateBlogArticle;
use App\Filament\Admin\Resources\BlogArticles\Pages\EditBlogArticle;
use App\Filament\Admin\Resources\BlogArticles\Pages\ListBlogArticles;
use App\Models\BlogArticle;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class BlogArticleResource extends Resource
{
    protected static ?string $model = BlogArticle::class;
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-newspaper';
    protected static ?string $navigationLabel = 'Blog';
    protected static ?string $modelLabel = 'artikel blog';
    protected static ?string $pluralModelLabel = 'Artikel blog';
    protected static ?string $recordTitleAttribute = 'title';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() === true;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('title')->label('Judul')->required()->maxLength(255),
            TextInput::make('slug')->required()->maxLength(255)->regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/')->unique(ignoreRecord: true)
                ->helperText('URL unik, huruf kecil, angka, tanda hubung. Mengubah slug memutus tautan lama.'),
            Select::make('category')->label('Kategori')->options(array_combine(BlogArticle::CATEGORIES, BlogArticle::CATEGORIES))->required(),
            Textarea::make('excerpt')->label('Ringkasan')->required()->maxLength(1000)->rows(3),
            FileUpload::make('cover_image')->label('Sampul')->disk('public')->directory('blog')->visibility('public')->preventFilePathTampering()
                ->fetchFileInformation(false)
                ->getUploadedFileUsing(static function (FileUpload $component, string $file): ?array {
                    if (in_array($file, ['/illustrations/hero-coding-explorers.svg', '/images/course-icon/html.png', '/images/languages/code-block.png'], true)) {
                        return ['name' => basename($file), 'size' => 0, 'type' => null, 'url' => $file];
                    }

                    return $component->getUploadedFile($file, null);
                })
                ->image()->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])->rules(['mimes:jpg,jpeg,png,webp', new \App\Rules\RasterCoverImage])->maxSize(2048)
                ->helperText('JPEG, PNG atau WebP, maksimal 2 MB dan 20 megapiksel. SVG tidak diizinkan.')->columnSpanFull(),
            MarkdownEditor::make('body')->label('Isi (Markdown)')->required()->maxLength(100000)->columnSpanFull()
                ->fileAttachmentsDisk('public')->fileAttachmentsDirectory('blog/content')
                ->fileAttachmentsAcceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])->fileAttachmentsMaxSize(2048)
                ->saveUploadedFileAttachmentUsing(static function (\Livewire\Features\SupportFileUploads\TemporaryUploadedFile $file): string {
                    // Validate again at the persistence boundary, even if the client bypasses MIME checks.
                    \Illuminate\Support\Facades\Validator::validate(['file' => $file], [
                        'file' => ['required', 'file', 'max:2048', 'mimetypes:image/jpeg,image/png,image/webp', new \App\Rules\RasterCoverImage],
                    ]);

                    return $file->storePublicly('blog/content', 'public');
                })
                ->helperText('Gunakan ## Judul, **tebal**, daftar dan tautan. Sisipkan gambar melalui tombol lampiran: JPEG, PNG atau WebP asli, maksimal 2 MB dan 20 megapiksel. HTML mentah dan tautan berbahaya tidak ditampilkan.'),
            Select::make('status')->options(['draft' => 'Draf', 'published' => 'Terbit'])->default('draft')->required(),
            Toggle::make('is_featured')->label('Artikel pilihan')->default(false),
            DateTimePicker::make('published_at')->label('Tanggal terbit (WIB)')->timezone('Asia/Jakarta')->seconds(false)->requiredIf('status', 'published')
                ->helperText('Hanya status Terbit dengan tanggal yang sudah tiba tampil di publik. Zona waktu aplikasi.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('title')->label('Judul')->searchable(),
            TextColumn::make('category')->label('Kategori'),
            TextColumn::make('status')->badge(),
            TextColumn::make('is_featured')->label('Pilihan')->formatStateUsing(fn ($state) => $state ? 'Ya' : 'Tidak'),
            TextColumn::make('published_at')->label('Terbit')->dateTime()->sortable(),
        ])->defaultSort('updated_at', 'desc')
            ->filters([SelectFilter::make('status')->options(['draft' => 'Draf', 'published' => 'Terbit'])])
            ->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index' => ListBlogArticles::route('/'), 'create' => CreateBlogArticle::route('/create'), 'edit' => EditBlogArticle::route('/{record}/edit')];
    }
}
