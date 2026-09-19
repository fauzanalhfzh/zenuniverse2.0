<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OauthAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
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

    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $subject = $googleUser->getId();
        $email = $googleUser->getEmail();

        if (blank($subject) || blank($email)) {
            return redirect('/login')->with('error', 'Akun Google tidak memiliki identitas yang lengkap.');
        }

        $account = OauthAccount::query()
            ->where('provider', 'google')
            ->where('provider_subject', $subject)
            ->first();

        if ($account !== null) {
            $this->syncProviderAvatar($account->user, $googleUser->getAvatar());
            $this->login($request, $account->user);

            return redirect('/');
        }

        if (User::query()->where('email', $email)->exists()) {
            return redirect('/login')->with('error', 'Email ini sudah terdaftar. Masuk dengan metode sebelumnya.');
        }

        $user = User::create([
            'name' => $googleUser->getName() ?? $email,
            'email' => $email,
            'password' => null,
        ]);
        $user->forceFill([
            'email_verified_at' => now(),
            'provider_avatar_url' => $googleUser->getAvatar(),
        ])->save();

        $user->oauthAccounts()->create([
            'provider' => 'google',
            'provider_subject' => $subject,
        ]);

        $this->login($request, $user);

        return redirect('/');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function login(Request $request, User $user): void
    {
        Auth::login($user);

        $request->session()->regenerate();
    }

    private function syncProviderAvatar(User $user, ?string $avatarUrl): void
    {
        if ($user->avatar_path !== null || $avatarUrl === null || $user->provider_avatar_url === $avatarUrl) {
            return;
        }

        $user->forceFill(['provider_avatar_url' => $avatarUrl])->save();
    }
}
