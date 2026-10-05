<?php

namespace App\Services\Auth;

use App\Exceptions\LearningException;
use App\Models\OauthAccount;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class ResolveGoogleAccount
{
    public function resolve(array $claims): User
    {
        try {
            return DB::transaction(function () use ($claims): User {
                $account = $this->account($claims['sub']);
                if ($account) {
                    return $account->user;
                }
                if (User::query()->whereRaw('LOWER(email) = ?', [strtolower($claims['email'])])->exists()) {
                    throw new LearningException('account_link_required', 'Masuk dengan metode sebelumnya untuk menautkan akun.', 409);
                }
                $name = is_string($claims['name'] ?? null) ? mb_substr($claims['name'], 0, 255) : 'Learner';
                $user = User::create(['name' => $name, 'email' => $claims['email'], 'password' => null]);
                $user->forceFill(['email_verified_at' => now(), 'is_admin' => false])->save();
                $user->oauthAccounts()->create(['provider' => 'google', 'provider_subject' => $claims['sub']]);
                return $user;
            }, 3);
        } catch (QueryException $exception) {
            // Unique provider+subject/email constraints arbitrate concurrent first login.
            // The failed transaction has rolled back, including any orphan user.
            $account = $this->account($claims['sub']);
            if ($account) {
                return $account->user;
            }
            if (User::query()->whereRaw('LOWER(email) = ?', [strtolower($claims['email'])])->exists()) {
                throw new LearningException('account_link_required', 'Masuk dengan metode sebelumnya untuk menautkan akun.', 409);
            }
            throw $exception;
        }
    }

    private function account(string $subject): ?OauthAccount
    {
        return OauthAccount::query()->with('user')->where('provider', 'google')->where('provider_subject', $subject)->first();
    }
}
