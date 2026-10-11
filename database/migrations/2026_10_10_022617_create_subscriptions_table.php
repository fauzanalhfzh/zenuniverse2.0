<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('provider', ['mayar', 'google_play']);
            $table->string('provider_subscription_id');
            $table->enum('plan', ['monthly', 'yearly']);
            $table->string('provider_status')->nullable();
            $table->enum('status', ['pending', 'active', 'grace', 'canceled', 'hold', 'paused', 'expired', 'revoked', 'unknown'])->default('unknown');
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->dateTime('canceled_at')->nullable();
            $table->dateTime('verified_at')->nullable();
            $table->unsignedBigInteger('entitlement_revision')->default(1);
            $table->timestamps();
            $table->unique(['provider', 'provider_subscription_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
