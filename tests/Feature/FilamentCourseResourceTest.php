<?php

namespace Tests\Feature;

use App\Filament\Admin\Resources\Courses\Pages\EditCourse;
use App\Filament\Admin\Resources\Courses\Pages\ListCourses;
use App\Models\Course;
use App\Models\CourseRelease;
use App\Models\User;
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
