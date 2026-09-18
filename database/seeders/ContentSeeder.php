<?php

namespace Database\Seeders;

use App\Services\Content\ContentImporter;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(ContentImporter $importer): void
    {
        $importer->importFile(database_path('seeders/data/content-dump.json'));
    }
}
