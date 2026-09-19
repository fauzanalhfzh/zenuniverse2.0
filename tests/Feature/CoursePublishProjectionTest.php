<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseRelease;
use App\Models\ReservedContentId;
use App\Models\User;
use App\Services\Content\CoursePublisher;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoursePublishProjectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ContentSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        return $user;
    }

    public function test_publishes_current_projection_as_release(): void
    {
        $course = Course::where('status', 'published')->orderBy('sort_order')->firstOrFail();
        $previousRevision = (int) $course->content_revision;

        $release = app(CoursePublisher::class)->publishProjection($course, $this->admin());

        $this->assertSame($previousRevision + 1, (int) $release->revision);
        $this->assertSame($previousRevision + 1, (int) $course->refresh()->content_revision);
        $this->assertGreaterThan(0, ReservedContentId::where('course_id', $course->id)->count());
        $this->assertDatabaseHas('admin_audits', ['action' => 'course.published', 'subject_id' => $course->id]);
    }

    public function test_republishing_unchanged_projection_is_idempotent(): void
    {
        $course = Course::where('status', 'published')->orderBy('sort_order')->firstOrFail();
        $publisher = app(CoursePublisher::class);
        $admin = $this->admin();

        $first = $publisher->publishProjection($course, $admin);
        $second = $publisher->publishProjection($course->refresh(), $admin);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, CourseRelease::where('course_id', $course->id)->count());
    }
}
