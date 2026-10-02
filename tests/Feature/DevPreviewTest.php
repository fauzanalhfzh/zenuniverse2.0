<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DevPreviewTest extends TestCase
{
    public function test_preview_is_available_locally_without_login(): void
    {
        $this->app->instance('env', 'local');

        $this->get('/dev')->assertOk()->assertInertia(fn (Assert $page) => $page->component('dev'));
        $this->assertGuest();
    }

    public function test_preview_is_hidden_in_production(): void
    {
        $this->app->instance('env', 'production');

        $this->get('/dev')->assertNotFound();
    }
}
