<?php

namespace App\Support;

use Illuminate\Http\Request;
use Inertia\Ssr\HttpGateway;
use Inertia\Ssr\Response;

/** Never send learner/private page props to the Node renderer. */
class PublicSsrGateway extends HttpGateway
{
    public function dispatch(array $page, ?Request $request = null): ?Response
    {
        if (! in_array($page['component'] ?? null, ['home', 'price', 'blog', 'blog-article'], true)) {
            return null;
        }

        return parent::dispatch($page, $request);
    }
}
