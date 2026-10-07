import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: '.', testMatch: 'blog.spec.ts', outputDir: '/tmp/zenuniverse-blog-results', workers: 1,
    use: { baseURL: 'http://127.0.0.1:8198', browserName: 'chromium' },
    webServer: { cwd: '../..', command: 'APP_ENV=testing APP_DEBUG=false DB_CONNECTION=sqlite DB_DATABASE=:memory: DB_URL= SESSION_DRIVER=array CACHE_STORE=array php artisan serve --host=127.0.0.1 --port=8198', url: 'http://127.0.0.1:8198/blog', reuseExistingServer: false },
});
