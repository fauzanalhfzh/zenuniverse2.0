<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the public surface (Inertia HTML props and JSON) against leaking
 * private answer material or account data.
 */
class ContentLeakTest extends TestCase
{
    use RefreshDatabase;

    private const PRIVATE_MARKERS = [
        'correctOptionId',
        'correctOrder',
        'acceptedAnswers',
        'expectedCode',
        'validation',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ContentSeeder::class);
    }

    public function test_lesson_page_html_has_no_private_answers_or_email(): void
    {
        $user = User::factory()->create(['name' => 'Siswa', 'email' => 'siswa-rahasia@zen.id']);
        $lesson = Lesson::query()
            ->whereHas('unit.course', fn ($query) => $query->where('status', 'published'))
            ->with('steps')
            ->firstOrFail();

        $response = $this->actingAs($user)->get("/lesson/{$lesson->id}");

        $response->assertOk();
        $html = $response->getContent();

        foreach (self::PRIVATE_MARKERS as $marker) {
            $this->assertStringNotContainsString($marker, $html, "Private marker leaked into lesson HTML: {$marker}");
        }

        $this->assertStringNotContainsString('siswa-rahasia@zen.id', $html);
    }

    public function test_progress_json_has_no_email_or_answers(): void
    {
        $user = User::factory()->create(['email' => 'progress-rahasia@zen.id']);

        $response = $this->actingAs($user)->getJson('/me/progress');

        $response->assertOk();
        $body = $response->getContent();

        $this->assertStringNotContainsString('progress-rahasia@zen.id', $body);

        foreach (self::PRIVATE_MARKERS as $marker) {
            $this->assertStringNotContainsString($marker, $body);
        }
    }

    public function test_lesson_page_carries_content_revision(): void
    {
        $user = User::factory()->create();
        $lesson = Lesson::query()
            ->whereHas('unit.course', fn ($query) => $query->where('status', 'published'))
            ->firstOrFail();

        $this->actingAs($user)->get("/lesson/{$lesson->id}")
            ->assertOk()
            ->assertSee('contentRevision', false);
    }
}
