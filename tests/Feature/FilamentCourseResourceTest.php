<?php

namespace Tests\Feature;

use App\Filament\Admin\Resources\Courses\Pages\EditCourse;
use App\Filament\Admin\Resources\Courses\Pages\ListCourses;
use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Database\Seeders\ContentSeeder;
use Filament\Actions\Testing\TestAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class FilamentCourseResourceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ContentSeeder::class);
        $this->actingAs($this->admin());
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        return $user;
    }

    private function course(): Course
    {
        return Course::query()->where('status', 'published')->orderBy('sort_order')->firstOrFail();
    }

    public function test_admin_can_edit_course_title(): void
    {
        $course = $this->course();

        Livewire::test(EditCourse::class, ['record' => $course->id])
            ->fillForm(['title' => 'Judul Baru'])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->assertSame('Judul Baru', $course->refresh()->title);
    }

    public function test_publish_action_creates_release(): void
    {
        $course = Course::query()->where('status', 'draft')->firstOrFail();
        $previousRevision = (int) $course->content_revision;

        Livewire::test(ListCourses::class)
            ->callAction(TestAction::make('publish')->table($course));

        $this->assertSame($previousRevision + 1, (int) $course->refresh()->content_revision);
        $this->assertSame(1, CourseRelease::query()->where('course_id', $course->id)->count());
    }

    public function test_access_tier_is_staged_until_published_without_overwriting_draft(): void
    {
        $course = $this->syntheticCourse();
        $document = $this->syntheticDocument();
        $draft = app(CoursePublisher::class)->saveDraft($course, $document, User::query()->findOrFail(auth()->id()), 0);

        Livewire::test(ListCourses::class)
            ->mountAction(TestAction::make('stageAccessTier')->table($course))
            ->assertSchemaStateSet(['access_tier' => 'free', 'expected_revision' => $draft->revision])
            ->fillForm(['access_tier' => 'plus'])
            ->callMountedAction()
            ->assertHasNoFormErrors()
            ->assertNotified('Akses kursus disimpan ke draft');

        $this->assertSame('free', $course->refresh()->access_tier);
        $this->assertSame([...$document, 'accessTier' => 'plus'], $draft->refresh()->document);
        $this->assertSame(2, $draft->revision);
        $this->assertSame(0, $course->releases()->count());

        Livewire::test(ListCourses::class)
            ->assertActionVisible(TestAction::make('publish')->table($course))
            ->callAction(TestAction::make('publish')->table($course))
            ->assertNotified();

        $this->assertSame('plus', $course->refresh()->access_tier);
        $this->assertSame('Judul dalam draft', $course->title);
        $this->assertSame('plus', $course->releases()->firstOrFail()->document['accessTier']);
    }

    public function test_invalid_access_tier_does_not_mutate_existing_draft(): void
    {
        $course = $this->syntheticCourse();
        $document = $this->syntheticDocument();
        $draft = app(CoursePublisher::class)->saveDraft($course, $document, User::query()->findOrFail(auth()->id()), 0);

        Livewire::test(ListCourses::class)
            ->callAction(TestAction::make('stageAccessTier')->table($course), ['access_tier' => 'premium'])
            ->assertHasFormErrors(['access_tier'])
            ->assertNotNotified();

        $this->assertSame('free', $course->refresh()->access_tier);
        $this->assertSame($document, $draft->refresh()->document);
        $this->assertSame(1, $draft->revision);
        $this->assertSame(0, $course->releases()->count());
    }

    public function test_access_tier_can_be_staged_without_existing_draft(): void
    {
        $course = $this->syntheticCourse();

        Livewire::test(ListCourses::class)
            ->mountAction(TestAction::make('stageAccessTier')->table($course))
            ->assertSchemaStateSet(['access_tier' => 'free', 'expected_revision' => 0])
            ->fillForm(['access_tier' => 'plus'])
            ->callMountedAction()
            ->assertHasNoFormErrors()
            ->assertNotified('Akses kursus disimpan ke draft');

        $draft = CourseDraft::query()->where('course_id', $course->id)->firstOrFail();
        $this->assertSame('free', $course->refresh()->access_tier);
        $this->assertSame('plus', $draft->document['accessTier']);
        $this->assertSame($course->title, $draft->document['title']);
    }

    public function test_stale_access_tier_modal_does_not_overwrite_newer_draft(): void
    {
        $course = $this->syntheticCourse();
        $document = $this->syntheticDocument();
        $actor = User::query()->findOrFail(auth()->id());
        $publisher = app(CoursePublisher::class);
        $publisher->saveDraft($course, $document, $actor, 0);
        $page = Livewire::test(ListCourses::class)
            ->mountAction(TestAction::make('stageAccessTier')->table($course));
        $newDocument = [...$document, 'description' => 'Perubahan terbaru'];
        $draft = $publisher->saveDraft($course, $newDocument, $actor, 1);

        $page->fillForm(['access_tier' => 'plus'])
            ->callMountedAction()
            ->assertNotified();

        $this->assertSame('free', $course->refresh()->access_tier);
        $this->assertSame($newDocument, $draft->refresh()->document);
        $this->assertSame(2, $draft->revision);
    }

    private function syntheticCourse(): Course
    {
        return Course::query()->create([
            'id' => 'tier-staging-course',
            'title' => 'Judul terbit',
            'description' => 'Deskripsi terbit',
            'level' => 'Pemula',
            'status' => 'published',
            'access_tier' => 'free',
            'content_revision' => 1,
            'sort_order' => 999,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function syntheticDocument(): array
    {
        return [
            'id' => 'tier-staging-course',
            'title' => 'Judul dalam draft',
            'description' => 'Deskripsi dalam draft',
            'level' => 'Pemula',
            'accessTier' => 'free',
            'units' => [[
                'id' => 'tier-staging-unit',
                'title' => 'Unit draft',
                'description' => 'Deskripsi unit',
                'lessons' => [[
                    'id' => 'tier-staging-lesson',
                    'title' => 'Lesson draft',
                    'description' => 'Deskripsi lesson',
                    'steps' => [[
                        'id' => 'tier-staging-step',
                        'type' => 'concept',
                        'title' => 'Konsep draft',
                        'content' => ['body' => 'Isi konsep'],
                        'reward' => ['xp' => 10],
                    ]],
                ]],
            ]],
        ];
    }

    public function test_duplicate_action_creates_draft_copy(): void
    {
        $course = $this->course();

        Livewire::test(ListCourses::class)
            ->callAction(TestAction::make('duplicate')->table($course), [
                'new_id' => 'salinan-kursus',
                'title' => 'Salinan',
            ]);

        $this->assertDatabaseHas('courses', ['id' => 'salinan-kursus', 'status' => 'draft']);
        $this->assertDatabaseHas('course_drafts', ['course_id' => 'salinan-kursus']);
    }

    public function test_archive_action_changes_status(): void
    {
        $course = $this->course();

        Livewire::test(ListCourses::class)
            ->callAction(TestAction::make('archive')->table($course));

        $this->assertSame('archived', $course->refresh()->status);
    }
}
