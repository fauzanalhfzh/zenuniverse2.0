<?php

namespace App\Http\Controllers;

use App\Services\Content\PublishedContent;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(PublishedContent $content): Response
    {
        return Inertia::render('home', [
            'courses' => $content->catalog(),
        ]);
    }
}
