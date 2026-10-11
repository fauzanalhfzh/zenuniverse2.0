import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'motion.spec.ts',
    outputDir: '../../test-results/motion',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:5201', browserName: 'chromium' },
    webServer: {
        command: 'npx vite --config tests/browser/motion.vite.config.ts',
        cwd: '../..',
        url: 'http://127.0.0.1:5201/tests/browser/motion.html',
        reuseExistingServer: true,
    },
});
