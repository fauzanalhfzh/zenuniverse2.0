import { defineConfig, devices } from '@playwright/test';
import { appEnv, baseUrl, phpBin, port } from './tests/e2e/env';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    globalSetup: './tests/e2e/global-setup.ts',
    use: {
        baseURL: baseUrl,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `${phpBin} artisan serve --host=127.0.0.1 --port=${port}`,
        url: `${baseUrl}/up`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: appEnv(),
    },
});
