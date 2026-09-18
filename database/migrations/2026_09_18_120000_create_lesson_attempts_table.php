<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('attempt_id');
            SchemaBinary::string($table, 'lesson_id');
            SchemaBinary::string($table, 'step_id');
            $table->unsignedInteger('content_revision');
            $table->string('payload_hash', 64);
            $table->boolean('correct');
            $table->boolean('consume_heart');
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'attempt_id']);
            $table->index(['user_id', 'created_at']);
            $table->index('lesson_id');
            $table->index('step_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_attempts');
    }
};
