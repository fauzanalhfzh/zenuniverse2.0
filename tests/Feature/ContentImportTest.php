<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonStep;
use App\Models\Unit;
use App\Services\Content\ContentImporter;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class ContentImportTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function meta(): array
    {
        $path = database_path('seeders/data/content-dump.meta.json');

        return json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    }

    public function test_imports_dump_matching_manifest(): void
    {
        $this->seed(ContentSeeder::class);
        $totals = $this->meta()['totals'];

        $this->assertSame($totals['courses'], Course::count());
        $this->assertSame($totals['units'], Unit::count());
        $this->assertSame($totals['lessons'], Lesson::count());
        $this->assertSame($totals['steps'], LessonStep::count());
        $this->assertSame($totals['published'], Course::where('status', 'published')->count());
        $this->assertSame($totals['draft'], Course::where('status', 'draft')->count());
    }

    public function test_cpp_is_draft(): void
    {
        $this->seed(ContentSeeder::class);

        $this->assertSame('draft', Course::find('cpp-fundamentals')?->status);
    }

    public function test_private_answers_are_stored_but_hidden(): void
    {
        $this->seed(ContentSeeder::class);

        $quiz = LessonStep::where('type', 'quiz')->firstOrFail();
        $this->assertIsArray($quiz->validation);
        $this->assertArrayHasKey('correctOptionId', $quiz->validation);
        $this->assertArrayNotHasKey('validation', $quiz->toArray());

        $code = LessonStep::where('type', 'code')->firstOrFail();
        $this->assertArrayHasKey('expectedCode', $code->content);

        $blockly = LessonStep::where('type', 'blockly')->firstOrFail();
        $this->assertIsArray($blockly->challenge);
    }

    public function test_reimport_is_idempotent(): void
    {
        $this->seed(ContentSeeder::class);
        $this->seed(ContentSeeder::class);

        $totals = $this->meta()['totals'];

        $this->assertSame($totals['steps'], LessonStep::count());
        $this->assertSame($totals['lessons'], Lesson::count());
        $this->assertSame($totals['units'], Unit::count());
    }

    public function test_rejects_malformed_dump(): void
    {
        $this->expectException(InvalidArgumentException::class);

        app(ContentImporter::class)->import(['courses' => [['id' => 'broken']]]);
    }

    public function test_rejects_unknown_step_type(): void
    {
        $this->expectException(InvalidArgumentException::class);

        app(ContentImporter::class)->import(['courses' => [[
            'id' => 'x',
            'title' => 'x',
            'description' => 'x',
            'level' => 'x',
            'status' => 'draft',
            'units' => [[
                'id' => 'u',
                'title' => 'u',
                'description' => 'u',
                'lessons' => [[
                    'id' => 'l',
                    'title' => 'l',
                    'description' => 'l',
                    'completionRewardXp' => 0,
                    'steps' => [['id' => 's', 'type' => 'nope', 'reward' => ['xp' => 1], 'content' => []]],
                ]],
            ]],
        ]]]);
    }
}
