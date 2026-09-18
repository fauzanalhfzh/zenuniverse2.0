<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Illuminate\Support\Facades\DB;

/**
 * Content identifiers keep their case across databases, so MySQL columns use a
 * binary collation while SQLite (tests) keeps its default.
 */
class SchemaBinary
{
    public static function string(Blueprint $table, string $column, int $length = 191): ColumnDefinition
    {
        $definition = $table->string($column, $length);

        if (DB::getDriverName() === 'mysql') {
            $definition->collation('utf8mb4_bin');
        }

        return $definition;
    }
}
