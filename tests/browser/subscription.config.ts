import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'subscription.spec.ts',
    outputDir:
        'C:/Users/LENOVO/AppData/Local/Temp/opencode/zenuniverse-subscription-results',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:5201', browserName: 'chromium' },
    webServer: {
        command: 'npx vite --config tests/browser/subscription.vite.config.ts',
        cwd: '../..',
        url: 'http://127.0.0.1:5201/tests/browser/subscription.html',
        reuseExistingServer: false,
    },
});
