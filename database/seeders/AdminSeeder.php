<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) config('zenuniverse.admin.email', '');
        $password = (string) config('zenuniverse.admin.password', '');

        if ($email === '' || $password === '') {
            // Tanpa kredensial eksplisit, jangan buat akun admin.
            return;
        }

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->name = $user->name ?: 'Admin ZenUniverse';
        $user->password = $password;
        $user->is_admin = true;
        $user->email_verified_at = Carbon::now();
        $user->save();
    }
}
