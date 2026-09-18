<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('step_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            SchemaBinary::string($table, 'step_id');
            SchemaBinary::string($table, 'lesson_id');
            $table->unsignedInteger('content_revision');
            $table->unsignedInteger('reward_xp')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'step_id']);
            $table->index('lesson_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('step_completions');
    }
};
