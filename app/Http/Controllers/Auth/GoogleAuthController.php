<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\LearningException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\ResolveGoogleAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleAuthController extends Controller
{
    public function showLogin(Request $request): InertiaResponse
    {
        return Inertia::render('auth/login', [
            'next' => $request->query('next'),
            'signedOut' => $request->query('signedOut') === '1',
        ]);
    }

    public function redirect(Request $request): SymfonyRedirectResponse
    {
        $next = $request->query('next');

        $request->session()->put(
            'auth.google.next',
            is_string($next) && ($next === '/dashboard' || str_starts_with($next, '/dashboard?'))
                ? $next
                : '/dashboard',
        );

        return $this->provider()->redirect();
    }

    public function callback(Request $request, ResolveGoogleAccount $accounts): RedirectResponse
    {
        $googleUser = $this->provider()->user();

        $subject = $googleUser->getId();
        $email = $googleUser->getEmail();

        if (blank($subject) || strlen($subject) > 255
            || ! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
            return redirect('/login')->with('error', 'Akun Google tidak memiliki identitas yang lengkap.');
        }

        try {
            $user = $accounts->resolve([
                'sub' => $subject,
                'email' => $email,
                'name' => $googleUser->getName() ?? $email,
            ]);
        } catch (LearningException $exception) {
            if ($exception->errorCode !== 'account_link_required') {
                throw $exception;
            }

            return redirect('/login')->with('error', 'Email ini sudah terdaftar. Masuk dengan metode sebelumnya.');
        }

        $this->syncProviderAvatar($user, $googleUser->getAvatar());
        $this->login($request, $user);

        return redirect($this->nextPath($request));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Redirect URI selalu mengikuti host request (localhost vs 127.0.0.1),
     * supaya cookie sesi state tidak hilang karena beda host. Kedua URI tetap
     * harus terdaftar di Google Cloud Console.
     */
    private function provider(): Provider
    {
        config(['services.google.redirect' => url('/auth/google/callback')]);

        return Socialite::driver('google');
    }

    private function login(Request $request, User $user): void
    {
        Auth::login($user);

        $request->session()->regenerate();
    }

    private function nextPath(Request $request): string
    {
        return $request->session()->pull('auth.google.next', '/dashboard');
    }

    private function syncProviderAvatar(User $user, ?string $avatarUrl): void
    {
        if ($user->avatar_path !== null || $avatarUrl === null || $user->provider_avatar_url === $avatarUrl) {
            return;
        }

        $user->forceFill(['provider_avatar_url' => $avatarUrl])->save();
    }
}
