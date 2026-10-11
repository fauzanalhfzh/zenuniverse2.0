<?php

namespace Tests\Feature;

use App\Exceptions\LearningException;
use App\Models\Course;
use App\Models\CourseDraft;
use App\Models\CourseRelease;
use App\Models\LessonStep;
use App\Models\User;
use App\Services\Content\ContentImporter;
use App\Services\Content\ContentValidator;
use App\Services\Content\CoursePublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class CourseAccessTierTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function document(): array
    {
        return [
            'id' => 'synthetic-course',
            'title' => 'Course',
            'description' => 'Description',
            'level' => 'Pemula',
            'status' => 'published',
            'units' => [[
                'id' => 'synthetic-unit',
                'title' => 'Unit',
                'description' => 'Description',
                'lessons' => [[
                    'id' => 'synthetic-lesson',
                    'title' => 'Lesson',
                    'description' => 'Description',
                    'steps' => [[
                        'id' => 'synthetic-step',
                        'type' => 'concept',
                        'reward' => ['xp' => 5],
                        'content' => [],
                    ]],
                ]],
            ]],
        ];
    }

    private function course(): Course
    {
        app(ContentImporter::class)->import(['courses' => [$this->document()]]);

        return Course::findOrFail('synthetic-course');
    }

    public function test_import_defaults_new_courses_and_preserves_existing_tier_when_missing(): void
    {
        $course = $this->course();
        $this->assertSame('free', $course->access_tier);
        $document = $this->document();
        $document['accessTier'] = 'plus';
        app(ContentImporter::class)->import(['courses' => [$document]]);
        app(ContentImporter::class)->import(['courses' => [$this->document()]]);
        $this->assertSame('plus', $course->refresh()->access_tier);
        $document['accessTier'] = 'free';
        app(ContentImporter::class)->import(['courses' => [$document]]);
        $this->assertSame('free', $course->refresh()->access_tier);
    }

    public function test_invalid_explicit_tiers_are_rejected_without_writes(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $publisher = app(CoursePublisher::class);
        foreach ([null, '', 'PLUS', 'paid', 0, ['plus']] as $tier) {
            $document = $this->document();
            $document['accessTier'] = $tier;
            $this->assertSame('course.accessTier', app(ContentValidator::class)->validate($document)[0]['path']);
            try {
                $publisher->saveDraft($course, $document, $actor, 0);
                $this->fail('Invalid draft tier accepted.');
            } catch (LearningException $exception) {
                $this->assertSame('invalid_content', $exception->errorCode);
            }
            try {
                app(ContentImporter::class)->import(['courses' => [$document]]);
                $this->fail('Invalid import tier accepted.');
            } catch (InvalidArgumentException $exception) {
                $this->assertSame('accessTier must be free or plus.', $exception->getMessage());
            }
        }
        $this->assertDatabaseCount('course_drafts', 0);
        $this->assertSame('free', $course->refresh()->access_tier);
    }

    public function test_staging_preserves_draft_and_checks_revision_without_changing_projection(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $publisher = app(CoursePublisher::class);
        $draft = $publisher->saveAccessTier($actor, $course, 'plus', 0);
        $this->assertSame('plus', $draft->document['accessTier']);
        $this->assertSame('synthetic-step', $draft->document['units'][0]['lessons'][0]['steps'][0]['id']);
        $this->assertSame('free', $course->refresh()->access_tier);
        $document = $draft->document;
        $document['title'] = 'Unpublished title';
        $draft = $publisher->saveDraft($course, $document, $actor, 1);
        $staged = $publisher->saveAccessTier($actor, $course, 'free', 2);
        $document['accessTier'] = 'free';
        $this->assertSame($document, $staged->document);
        $this->assertSame(3, $staged->revision);
        try {
            $publisher->saveAccessTier($actor, $course, 'plus', $draft->revision);
            $this->fail('Stale revision accepted.');
        } catch (LearningException $exception) {
            $this->assertSame('revision_conflict', $exception->errorCode);
        }
        $this->assertSame($document, $staged->refresh()->document);
    }

    public function test_retained_tier_draft_cannot_overwrite_live_edits_after_publication(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $publisher = app(CoursePublisher::class);
        $draft = $publisher->saveAccessTier($actor, $course, 'plus', 0);
        $publisher->publish($course, $actor, $draft->revision);
        $baseline = $draft->refresh()->projection_hash;
        $this->assertNotNull($baseline);
        $course->refresh()->forceFill(['title' => 'Live title'])->save();
        LessonStep::findOrFail('synthetic-step')->forceFill(['content' => ['text' => 'Live step']])->save();

        $draft = $publisher->saveAccessTier($actor, $course, 'free', $draft->revision);
        $this->assertSame($baseline, $draft->projection_hash);
        try {
            $publisher->publish($course, $actor, $draft->revision);
            $this->fail('Stale retained draft overwrote live edits.');
        } catch (LearningException $exception) {
            $this->assertSame('revision_conflict', $exception->errorCode);
        }
        $this->assertSame('Live title', $course->refresh()->title);
        $this->assertSame(['text' => 'Live step'], LessonStep::findOrFail('synthetic-step')->content);
        $this->assertSame('plus', $course->access_tier);
        $this->assertDatabaseCount('course_releases', 1);
    }

    public function test_pending_tier_draft_and_idempotent_publish_reject_live_projection_drift(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $publisher = app(CoursePublisher::class);
        $draft = $publisher->saveAccessTier($actor, $course, 'plus', 0);
        $baseline = $draft->projection_hash;
        LessonStep::findOrFail('synthetic-step')->forceFill(['content' => ['text' => 'Live step']])->save();
        $draft = $publisher->saveDraft($course, $draft->document, $actor, $draft->revision);
        $this->assertSame($baseline, $draft->projection_hash);
        try {
            $publisher->publish($course, $actor, $draft->revision);
            $this->fail('Pending draft overwrote live step.');
        } catch (LearningException $exception) {
            $this->assertSame('revision_conflict', $exception->errorCode);
        }
        $this->assertSame('free', $course->refresh()->access_tier);
        $this->assertSame(['text' => 'Live step'], LessonStep::findOrFail('synthetic-step')->content);
        $this->assertDatabaseCount('course_releases', 0);

        LessonStep::findOrFail('synthetic-step')->forceFill(['content' => []])->save();
        $release = $publisher->publish($course, $actor, $draft->revision);
        $this->assertSame($release->id, $publisher->publish($course, $actor, $draft->revision)->id);
        $baseline = $draft->refresh()->projection_hash;
        $this->assertNotSame($baseline, null);
        $course->refresh()->forceFill(['title' => 'Live title'])->save();
        try {
            $publisher->publish($course, $actor, $draft->revision);
            $this->fail('Idempotent publish accepted live drift.');
        } catch (LearningException $exception) {
            $this->assertSame('revision_conflict', $exception->errorCode);
        }
        $this->assertSame($baseline, $draft->refresh()->projection_hash);
        $this->assertSame('Live title', $course->refresh()->title);
        $this->assertDatabaseCount('course_releases', 1);
    }

    public function test_publication_normalizes_legacy_and_a_b_a_creates_immutable_releases(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $publisher = app(CoursePublisher::class);
        $document = $this->document();
        $draft = $publisher->saveDraft($course, $document, $actor, 0);
        $first = $publisher->publish($course, $actor, $draft->revision);
        $historical = $first->refresh()->getRawOriginal();
        $this->assertSame('free', $first->document['accessTier']);
        $this->assertSame(hash('sha256', json_encode($first->document, JSON_THROW_ON_ERROR)), $first->hash);
        $this->assertSame($first->id, $publisher->publish($course, $actor, $draft->revision)->id);
        $draft = $publisher->saveAccessTier($actor, $course, 'plus', 1);
        $second = $publisher->publish($course, $actor, $draft->revision);
        $this->assertSame('plus', $course->refresh()->access_tier);
        $draft = $publisher->saveDraft($course, $document, $actor, 2);
        $third = $publisher->publish($course, $actor, $draft->revision);
        $this->assertSame($first->hash, $third->hash);
        $this->assertSame($second->revision + 1, $third->revision);
        $this->assertNotSame($first->id, $third->id);
        $this->assertSame($historical, $first->refresh()->getRawOriginal());
        $publisher->archive($course->refresh(), $actor);
        $restored = $publisher->publish($course, $actor, $draft->revision);
        $this->assertSame($third->revision + 1, $restored->revision);
        $this->assertSame('published', $course->refresh()->status);
        $this->assertSame('free', $course->access_tier);
    }

    public function test_legacy_release_stays_unchanged_and_missing_tier_normalizes_before_hashing(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $document = $this->document();
        $legacy = CourseRelease::create([
            'course_id' => $course->id,
            'revision' => 1,
            'document' => $document,
            'hash' => hash('sha256', json_encode($document, JSON_THROW_ON_ERROR)),
            'published_at' => now(),
            'actor_id' => $actor->id,
        ]);
        $before = $legacy->refresh()->getRawOriginal();
        $publisher = app(CoursePublisher::class);
        $draft = $publisher->saveDraft($course, $document, $actor, 0);
        $release = $publisher->publish($course, $actor, $draft->revision);
        $this->assertSame('free', $release->document['accessTier']);
        $this->assertNotSame($legacy->hash, $release->hash);
        $this->assertSame($before, $legacy->refresh()->getRawOriginal());
        $document['accessTier'] = 'free';
        $draft = $publisher->saveDraft($course, $document, $actor, 1);
        $this->assertSame($release->id, $publisher->publish($course, $actor, $draft->revision)->id);
    }

    public function test_legacy_draft_gets_projection_baseline_on_next_save(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $draft = CourseDraft::create([
            'course_id' => $course->id,
            'document' => $this->document(),
            'revision' => 1,
            'updated_by' => $actor->id,
        ]);
        $this->assertNull($draft->projection_hash);
        $publisher = app(CoursePublisher::class);
        $draft = $publisher->saveAccessTier($actor, $course, 'plus', $draft->revision);
        $this->assertNotNull($draft->projection_hash);
        $course->forceFill(['title' => 'Live title'])->save();
        try {
            $publisher->publish($course, $actor, $draft->revision);
            $this->fail('Legacy saved draft overwrote live title.');
        } catch (LearningException $exception) {
            $this->assertSame('revision_conflict', $exception->errorCode);
        }
        $this->assertSame('Live title', $course->refresh()->title);
        $this->assertDatabaseCount('course_releases', 0);
    }

    public function test_publication_rejects_invalid_tier_in_existing_draft(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $document = $this->document();
        $document['accessTier'] = null;
        CourseDraft::create([
            'course_id' => $course->id,
            'document' => $document,
            'revision' => 1,
            'updated_by' => $actor->id,
        ]);
        try {
            app(CoursePublisher::class)->publish($course, $actor, 1);
            $this->fail('Invalid publication tier accepted.');
        } catch (LearningException $exception) {
            $this->assertSame('invalid_content', $exception->errorCode);
        }
        $this->assertDatabaseCount('course_releases', 0);
        $this->assertSame('free', $course->refresh()->access_tier);
        $this->assertSame(1, $course->content_revision);
    }

    public function test_projection_publication_and_duplicate_preserve_tier(): void
    {
        $course = $this->course();
        $actor = User::factory()->create();
        $publisher = app(CoursePublisher::class);
        $course->forceFill(['access_tier' => 'plus'])->save();
        $first = $publisher->publishProjection($course, $actor);
        $this->assertSame('plus', $first->document['accessTier']);
        $this->assertSame($first->id, $publisher->publishProjection($course, $actor)->id);
        $copy = $publisher->duplicate($course, 'synthetic-copy', $actor);
        $this->assertSame('plus', $copy->access_tier);
        $this->assertSame('plus', $publisher->preview($copy)['accessTier']);
        $course->forceFill(['access_tier' => 'free'])->save();
        $publisher->publishProjection($course, $actor);
        $course->forceFill(['access_tier' => 'plus'])->save();
        $third = $publisher->publishProjection($course, $actor);
        $this->assertSame($first->hash, $third->hash);
        $this->assertSame($first->revision + 2, $third->revision);
        $publisher->archive($course, $actor);
        $fourth = $publisher->publishProjection($course, $actor);
        $this->assertSame($third->revision + 1, $fourth->revision);
        $this->assertSame('published', $course->refresh()->status);
        $this->assertSame('plus', $course->access_tier);
        $this->assertSame('plus', $first->refresh()->document['accessTier']);
        $this->assertDatabaseCount('course_releases', 4);
        $this->assertSame(2, CourseRelease::where('hash', $first->hash)->where('revision', '<', $fourth->revision)->count());
    }
}
