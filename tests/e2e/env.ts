export const port = 8123;
export const baseUrl = `http://127.0.0.1:${port}`;
export const phpBin = process.env.PHP_BIN ?? 'php';
export const adminEmail = 'e2e-admin@zenuniverse.test';
export const adminPassword = 'E2e-Only-Not-For-Production-2026!';

/**
 * Environment untuk server E2E. Default SQLite terisolasi; set E2E_DB_CONNECTION
 * untuk memakai MySQL (mis. saat dijalankan lewat PHP Windows Laragon).
 */
export function appEnv(): Record<string, string> {
    const env = { ...process.env } as Record<string, string>;

    env.APP_ENV = 'local';
    env.APP_URL = baseUrl;
    env.E2E_LOGIN_ENABLED = 'true';
    env.PROGRESS_POLL_MS = process.env.PROGRESS_POLL_MS ?? '1000';
    env.ADMIN_EMAIL = adminEmail;
    env.ADMIN_PASSWORD = adminPassword;
    env.DB_URL = '';
    env.APP_CONFIG_CACHE = 'bootstrap/cache/e2e-config.php';

    if (process.env.E2E_DB_CONNECTION) {
        env.DB_CONNECTION = process.env.E2E_DB_CONNECTION;
        env.DB_HOST = process.env.E2E_DB_HOST ?? '127.0.0.1';
        env.DB_PORT = process.env.E2E_DB_PORT ?? '3306';
        env.DB_DATABASE = process.env.E2E_DB_DATABASE ?? 'zenuniverse_e2e';
        env.DB_USERNAME = process.env.E2E_DB_USERNAME ?? 'root';
        env.DB_PASSWORD = process.env.E2E_DB_PASSWORD ?? '';
    } else {
        env.DB_CONNECTION = 'sqlite';
        env.DB_DATABASE = '/tmp/opencode/zenuniverse-e2e.sqlite';
    }

    if (
        (env.DB_CONNECTION === 'mysql' &&
            env.DB_DATABASE !== 'zenuniverse_e2e') ||
        (env.DB_CONNECTION === 'sqlite' &&
            env.DB_DATABASE !== '/tmp/opencode/zenuniverse-e2e.sqlite') ||
        !['mysql', 'sqlite'].includes(env.DB_CONNECTION)
    ) {
        throw new Error(
            'E2E requires its dedicated database; refusing to reset another database.',
        );
    }

    return env;
}
