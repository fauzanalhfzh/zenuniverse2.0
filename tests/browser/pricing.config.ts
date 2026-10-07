import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: '.',
    testMatch: 'pricing.spec.ts',
    outputDir: '/tmp/zenuniverse-pricing-results',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:5199', browserName: 'chromium' },
    webServer: {
        command: 'npx vite --config pricing.vite.config.ts',
        url: 'http://127.0.0.1:5199/tests/browser/pricing.html',
        reuseExistingServer: true,
    },
});
