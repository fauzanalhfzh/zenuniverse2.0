export const port = 8123;
export const baseUrl = `http://127.0.0.1:${port}`;
export const phpBin = process.env.PHP_BIN ?? 'php';

/**
 * Environment untuk server E2E. Default SQLite terisolasi; set E2E_DB_CONNECTION
 * untuk memakai MySQL (mis. saat dijalankan lewat PHP Windows Laragon).
 */
export function appEnv(): Record<string, string> {
    const env = { ...process.env } as Record<string, string>;

    env.APP_ENV = 'local';
    env.APP_URL = baseUrl;
    env.E2E_LOGIN_ENABLED = 'true';

    if (process.env.E2E_DB_CONNECTION) {
        env.DB_CONNECTION = process.env.E2E_DB_CONNECTION;
        env.DB_HOST = process.env.E2E_DB_HOST ?? '127.0.0.1';
        env.DB_PORT = process.env.E2E_DB_PORT ?? '3306';
        env.DB_DATABASE = process.env.E2E_DB_DATABASE ?? 'zenuniverse_e2e';
        env.DB_USERNAME = process.env.E2E_DB_USERNAME ?? 'root';
        env.DB_PASSWORD = process.env.E2E_DB_PASSWORD ?? '';
    } else {
        env.DB_CONNECTION = 'sqlite';
        env.DB_DATABASE = '/tmp/zen-e2e.sqlite';
    }

    return env;
}
