<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_steps', function (Blueprint $table) {
            SchemaBinary::string($table, 'id')->primary();
            SchemaBinary::string($table, 'lesson_id');
            $table->string('type');
            $table->unsignedInteger('reward_xp')->default(0);
            $table->json('content');
            $table->json('validation')->nullable();
            $table->json('challenge')->nullable();
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_steps');
    }
};
