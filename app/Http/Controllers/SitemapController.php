<?php

namespace App\Http\Controllers;

use App\Models\BlogArticle;
use App\Support\PublicSeo;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = new \XMLWriter;
        $xml->openMemory();
        $xml->startDocument('1.0', 'UTF-8');
        $xml->startElementNS(null, 'urlset', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        foreach (['home', 'price', 'blog'] as $page) {
            $xml->startElement('url');
            $xml->writeElement('loc', PublicSeo::page($page)['canonical']);
            $xml->endElement();
        }
        foreach (BlogArticle::published()->orderBy('id')->cursor() as $article) {
            $xml->startElement('url');
            $xml->writeElement('loc', PublicSeo::article($article)['canonical']);
            $xml->endElement();
        }
        $xml->endElement();
        $xml->endDocument();

        return response($xml->outputMemory(), 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
