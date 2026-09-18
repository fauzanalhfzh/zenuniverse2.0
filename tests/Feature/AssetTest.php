<?php

namespace Tests\Feature;

use App\Models\CmsAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AssetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        return $user;
    }

    private function upload(UploadedFile $file): TestResponse
    {
        return $this->actingAs($this->admin())->post('/admin/assets', ['file' => $file], [
            'Accept' => 'application/json',
        ]);
    }

    public function test_non_admin_is_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/admin/assets', [
            'file' => UploadedFile::fake()->image('logo.png'),
        ], ['Accept' => 'application/json'])->assertStatus(403);
    }

    public function test_uploads_valid_image(): void
    {
        $response = $this->upload(UploadedFile::fake()->image('logo.png', 120, 120));

        $response->assertStatus(201)->assertJsonStructure(['id', 'path', 'url', 'mime', 'size']);

        $asset = CmsAsset::findOrFail($response->json('id'));
        Storage::disk('public')->assertExists($asset->path);
        $this->assertSame('image/png', $asset->mime);
    }

    public function test_rejects_fake_extension(): void
    {
        $response = $this->upload(UploadedFile::fake()->create('evil.png', 10, 'text/plain'));

        $response->assertStatus(422)->assertJsonPath('error.code', 'invalid_asset');
        $this->assertDatabaseCount('cms_assets', 0);
    }

    public function test_rejects_svg(): void
    {
        $response = $this->upload(UploadedFile::fake()->create('icon.svg', 10, 'image/svg+xml'));

        $response->assertStatus(422);
        $this->assertDatabaseCount('cms_assets', 0);
    }

    public function test_rejects_oversized_file(): void
    {
        $response = $this->upload(UploadedFile::fake()->create('big.png', 3000, 'image/png'));

        $response->assertStatus(422);
    }

    public function test_delete_removes_file_and_record(): void
    {
        $upload = $this->upload(UploadedFile::fake()->image('logo.png'));
        $asset = CmsAsset::findOrFail($upload->json('id'));
        $path = $asset->path;

        $this->actingAs($this->admin())->deleteJson("/admin/assets/{$asset->id}")->assertOk();

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('cms_assets', ['id' => $asset->id]);
    }
}
