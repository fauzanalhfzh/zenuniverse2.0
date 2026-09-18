<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            SchemaBinary::string($table, 'id')->primary();
            SchemaBinary::string($table, 'course_id');
            $table->string('title');
            $table->text('description');
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
