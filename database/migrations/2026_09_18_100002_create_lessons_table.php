<?php

use App\Support\SchemaBinary;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            SchemaBinary::string($table, 'id')->primary();
            SchemaBinary::string($table, 'unit_id');
            $table->string('title');
            $table->text('description');
            $table->unsignedInteger('completion_reward_xp')->default(0);
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->foreign('unit_id')->references('id')->on('units')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
