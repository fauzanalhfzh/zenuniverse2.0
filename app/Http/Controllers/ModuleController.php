<?php

namespace App\Http\Controllers;

use App\Services\Content\PublishedContent;
use App\Support\PublicSeo;
use Inertia\Inertia;
use Inertia\Response;

class ModuleController extends Controller
{
    public function index(PublishedContent $content): Response
    {
        return Inertia::render('modul', [
            'seo' => PublicSeo::page('modul'),
            'courses' => $content->catalog(),
        ]);
    }
}
