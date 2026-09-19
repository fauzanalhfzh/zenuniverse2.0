<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Test-only login seam for browser E2E. Always returns 404 unless the E2E flag
 * is enabled and the app runs in local/testing.
 */
class E2eLoginController extends Controller
{
    public function login(Request $request): RedirectResponse
    {
        abort_unless(
            config('zenuniverse.e2e.enabled') === true
                && app()->environment(['local', 'testing']),
            404,
        );

        $email = (string) $request->query('email', 'e2e-player@zenuniverse.test');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => 'E2E Player',
                'password' => Str::random(40),
            ],
        );

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/dashboard');
    }
}
