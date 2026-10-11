import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: '.',
    testMatch: 'activities.spec.ts',
    outputDir: '../../test-results/activities',
    workers: 1,
    timeout: 60_000,
    use: { baseURL: 'http://127.0.0.1:5206', browserName: 'chromium' },
    webServer: {
        command: 'npx vite --config tests/browser/activities.vite.config.ts',
        cwd: '../..',
        url: 'http://127.0.0.1:5206/tests/browser/activities.html',
        reuseExistingServer: false,
    },
});
