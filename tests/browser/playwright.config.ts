import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: '.',
    testMatch: 'blockly-*.spec.ts',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:5199', browserName: 'chromium' },
    webServer: {
        command: 'npx vite --config vite.config.ts',
        url: 'http://127.0.0.1:5199/tests/browser/blockly.html',
        reuseExistingServer: true,
    },
});
