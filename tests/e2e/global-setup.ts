import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { appEnv, phpBin } from './env';

/**
 * Menyiapkan database E2E terpisah supaya test tidak menyentuh DB development.
 * Default: SQLite /tmp/zen-e2e.sqlite. Bisa diarahkan ke MySQL lewat E2E_DB_*.
 */
export default function globalSetup(): void {
    // Paksa pakai aset hasil build: file "hot" membuat Blade menunjuk dev server.
    rmSync(join(process.cwd(), 'public', 'hot'), { force: true });

    execFileSync(phpBin, ['artisan', 'migrate:fresh', '--seed', '--force'], {
        env: appEnv(),
        stdio: 'inherit',
    });
}
