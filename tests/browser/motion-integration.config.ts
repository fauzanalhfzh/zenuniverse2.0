import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'motion-integration.spec.ts',
    outputDir: '../../test-results/motion-integration',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:5204', browserName: 'chromium' },
    webServer: {
        command:
            'npx vite --config tests/browser/motion-integration.vite.config.ts',
        cwd: '../..',
        url: 'http://127.0.0.1:5204/tests/browser/motion-integration.html',
        reuseExistingServer: false,
    },
});
