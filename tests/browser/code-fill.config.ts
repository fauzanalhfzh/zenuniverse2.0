import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'code-fill.spec.ts',
    outputDir: '../../test-results/code-fill',
    workers: 1,
    timeout: 60_000,
    use: { baseURL: 'http://127.0.0.1:5205', browserName: 'chromium' },
    webServer: {
        command: 'npx vite --config tests/browser/code-fill.vite.config.ts',
        cwd: '../..',
        url: 'http://127.0.0.1:5205/tests/browser/code-fill.html',
        reuseExistingServer: false,
    },
});
