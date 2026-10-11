<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_drafts', function (Blueprint $table) {
            $table->string('projection_hash', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('course_drafts', function (Blueprint $table) {
            $table->dropColumn('projection_hash');
        });
    }
};
