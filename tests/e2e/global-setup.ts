import { execFileSync } from 'node:child_process';
import { appEnv, phpBin } from './env';

/**
 * Menyiapkan database E2E terpisah supaya test tidak menyentuh DB development.
 * Default: SQLite /tmp/zen-e2e.sqlite. Bisa diarahkan ke MySQL lewat E2E_DB_*.
 */
export default function globalSetup(): void {
    execFileSync(phpBin, ['artisan', 'migrate:fresh', '--seed', '--force'], {
        env: appEnv(),
        stdio: 'inherit',
    });
}
