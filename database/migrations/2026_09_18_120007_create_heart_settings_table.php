<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('heart_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('capacity')->default(5);
            $table->unsignedInteger('regen_minutes')->default(5);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('heart_settings');
    }
};
