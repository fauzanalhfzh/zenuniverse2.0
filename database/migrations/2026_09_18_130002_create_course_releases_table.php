<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_releases', function (Blueprint $table) {
            $table->id();
            SchemaBinary::string($table, 'course_id');
            $table->unsignedInteger('revision');
            $table->json('document');
            $table->string('hash', 64);
            $table->timestamp('published_at');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['course_id', 'revision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_releases');
    }
};
