<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reserved_content_ids', function (Blueprint $table) {
            $table->id();
            SchemaBinary::string($table, 'course_id');
            SchemaBinary::string($table, 'content_id')->unique();
            $table->string('kind');
            $table->timestamps();

            $table->index('course_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reserved_content_ids');
    }
};
