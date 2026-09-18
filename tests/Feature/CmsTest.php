<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\ReservedContentId;
use App\Models\StepCompletion;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CmsTest extends TestCase
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

    private function publishedCourse(): Course
    {
        return Course::query()
            ->where('status', 'published')
            ->with('units.lessons.steps')
            ->orderBy('sort_order')
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function document(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'level' => $course->level,
            'plannedLessonIds' => $course->planned_lesson_ids,
            'units' => $course->units->map(fn ($unit): array => [
                'id' => $unit->id,
                'title' => $unit->title,
                'description' => $unit->description,
                'lessons' => $unit->lessons->map(fn (Lesson $lesson): array => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'description' => $lesson->description,
                    'completionRewardXp' => $lesson->completion_reward_xp,
                    'steps' => $lesson->steps->map(fn ($step): array => [
                        'id' => $step->id,
                        'type' => $step->type->value,
                        'reward' => ['xp' => $step->reward_xp],
                        'content' => $step->content,
                        'validation' => $step->validation,
                        'challenge' => $step->challenge,
                    ])->all(),
                ])->all(),
            ])->all(),
        ];
    }

    public function test_non_admin_is_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/admin/courses')->assertStatus(403);
        $this->actingAs($user)->getJson('/admin/courses/'.$this->publishedCourse()->id)->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/admin/courses')->assertStatus(401);
    }

    public function test_draft_save_uses_optimistic_revision(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();
        $document = $this->document($course);

        $first = $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", [
            'document' => $document,
        ]);
        $first->assertOk()->assertJsonPath('revision', 1);

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", [
            'document' => $document,
            'expected_revision' => 99,
        ])->assertStatus(409)->assertJsonPath('error.code', 'revision_conflict');

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", [
            'document' => $document,
            'expected_revision' => 1,
        ])->assertOk()->assertJsonPath('revision', 2);
    }

    public function test_publish_rejects_invalid_document(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", [
            'document' => [
                'id' => $course->id,
                'title' => 'Judul',
                'description' => 'Deskripsi',
                'level' => 'Pemula',
                'units' => [],
            ],
        ])->assertOk();

        $this->actingAs($admin)->postJson("/admin/courses/{$course->id}/publish", [
            'expected_revision' => 1,
        ])->assertStatus(422)->assertJsonPath('error.code', 'invalid_content');
    }

    public function test_publish_updates_projection_release_and_reservations(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();
        $document = $this->document($course);

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", ['document' => $document])->assertOk();

        $response = $this->actingAs($admin)->postJson("/admin/courses/{$course->id}/publish", [
            'expected_revision' => 1,
        ]);

        $response->assertOk()->assertJsonPath('revision', 2);

        $this->assertSame(2, (int) $course->refresh()->content_revision);
        $this->assertDatabaseHas('course_releases', ['course_id' => $course->id, 'revision' => 2]);
        $this->assertGreaterThan(0, ReservedContentId::query()->where('course_id', $course->id)->count());
        $this->assertDatabaseHas('admin_audits', ['action' => 'course.published', 'subject_id' => $course->id]);
    }

    public function test_publish_rejects_changing_published_structure(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();
        $document = $this->document($course);

        $document['units'][0]['lessons'][0]['steps'][0]['type'] = 'quiz';

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", ['document' => $document])->assertOk();

        $this->actingAs($admin)->postJson("/admin/courses/{$course->id}/publish", [
            'expected_revision' => 1,
        ])->assertStatus(422)->assertJsonPath('error.code', 'locked_structure');
    }

    public function test_preview_returns_draft_without_progress(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();
        $document = $this->document($course);

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", ['document' => $document])->assertOk();

        $response = $this->actingAs($admin)->getJson("/admin/courses/{$course->id}/preview");

        $response->assertOk()->assertJsonPath('document.id', $course->id);
        $this->assertSame(0, StepCompletion::query()->count());
    }

    public function test_archive_and_restore_keep_progress(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();

        StepCompletion::create([
            'user_id' => $admin->id,
            'step_id' => 'reserved-progress-step',
            'lesson_id' => 'reserved-progress-lesson',
            'content_revision' => 1,
            'reward_xp' => 5,
        ]);

        $this->actingAs($admin)->postJson("/admin/courses/{$course->id}/archive")->assertOk();
        $this->assertSame('archived', $course->refresh()->status);

        $this->actingAs($admin)->postJson("/admin/courses/{$course->id}/restore")->assertOk();
        $this->assertSame('published', $course->refresh()->status);

        $this->assertDatabaseHas('step_completions', ['step_id' => 'reserved-progress-step']);
    }

    public function test_delete_is_blocked_once_published(): void
    {
        $admin = $this->admin();
        $course = $this->publishedCourse();
        $document = $this->document($course);

        $this->actingAs($admin)->putJson("/admin/courses/{$course->id}", ['document' => $document])->assertOk();
        $this->actingAs($admin)->postJson("/admin/courses/{$course->id}/publish", ['expected_revision' => 1])->assertOk();

        $this->actingAs($admin)->deleteJson("/admin/courses/{$course->id}")
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'locked_structure');

        $this->assertDatabaseCount('course_releases', 1);
    }

    public function test_delete_works_for_never_published_course(): void
    {
        $admin = $this->admin();
        $course = Course::where('status', 'draft')->firstOrFail();

        $this->actingAs($admin)->deleteJson("/admin/courses/{$course->id}")->assertOk();

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
        $this->assertDatabaseMissing('course_drafts', ['course_id' => $course->id]);
    }
}
