<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\Gateway;
use Tests\TestCase;

class PublicSsrTest extends TestCase
{
    public function test_only_public_components_are_dispatched_to_ssr(): void
    {
        config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
        Http::fake(['*' => Http::response(['head' => [], 'body' => '<div>Rendered</div>'])]);
        $gateway = app(Gateway::class);
        foreach (['dashboard', 'lesson', 'auth/login', 'admin/blog', 'unknown'] as $component) {
            $this->assertNull($gateway->dispatch(['component' => $component, 'props' => ['secret' => 'private']], Request::create('/')));
        }
        Http::assertNothingSent();
        foreach (['home', 'price', 'blog', 'blog-article'] as $component) {
            $this->assertNotNull($gateway->dispatch(['component' => $component, 'props' => []], Request::create('/')));
        }
        Http::assertSentCount(4);
    }

    public function test_ssr_connection_failure_falls_back_to_html_with_metadata(): void
    {
        $this->withoutVite();
        config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
        Http::fake(['*' => Http::failedConnection()]);
        $this->get('/price')->assertOk()->assertSee('Harga Paket Belajar Coding | ZenUniverse', false)->assertSee('data-page', false);
    }
}
