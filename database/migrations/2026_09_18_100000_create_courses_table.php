<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            SchemaBinary::string($table, 'id')->primary();
            $table->string('title');
            $table->text('description');
            $table->string('level');
            $table->string('status')->default('draft');
            $table->json('planned_lesson_ids')->nullable();
            $table->unsignedInteger('sort_order');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
