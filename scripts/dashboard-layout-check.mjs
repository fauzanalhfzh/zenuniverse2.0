import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from '@playwright/test';

// Isolated UI fixture: no Laravel login, database writes, or E2E migrations.
const manifest = JSON.parse(
    await readFile('public/build/manifest.json', 'utf8'),
);
const course = {
    id: 'layout-check',
    title: 'Dasar Pemrograman Web',
    description: '',
    level: 'Pemula',
    contentRevision: 1,
    units: Array.from({ length: 22 }, (_, unit) => ({
        id: `unit-${unit}`,
        title: 'Dasar Pemrograman Web',
        description: '',
        lessons: Array.from({ length: 1 }, (_, index) => ({
            id: `lesson-${unit}-${index}`,
            title: `Pelajaran ${index + 1}`,
            description: 'Lanjutkan perjalanan coding-mu.',
            completed: unit < 4,
            unlocked: unit <= 4,
        })),
    })),
};
const pageData = JSON.stringify({
    component: 'dashboard',
    props: {
        courses: [course],
        active: course,
        errors: {},
        auth: { user: { id: 1 } },
    },
    url: '/dashboard',
    version: null,
}).replaceAll('<', '\\u003c');
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/build/${manifest['resources/css/app.css'].file}"></head><body><script data-page="app" type="application/json">${pageData}</script><div id="app"></div><script type="module" src="/build/${manifest['resources/js/app.tsx'].file}"></script></body></html>`;
const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/dashboard') {
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
        return;
    }
    if (pathname === '/me/progress') {
        res.setHeader('Content-Type', 'application/json');
        res.end(
            JSON.stringify({
                totalXp: 1200,
                currentStreak: 4,
                hearts: 5,
                heartsCapacity: 5,
                level: {
                    percent: 40,
                    current: { level: 2, name: 'Penjelajah' },
                },
                dailyGoal: {
                    percent: 40,
                    progress: 20,
                    remaining: 30,
                    claimed: false,
                },
            }),
        );
        return;
    }
    const file = resolve('public', `.${pathname}`);
    if (
        !file.startsWith(
            resolve('public') +
                '/'.replace('/', process.platform === 'win32' ? '\\' : '/'),
        )
    ) {
        res.writeHead(403).end();
        return;
    }
    try {
        const content = await readFile(file);
        res.setHeader(
            'Content-Type',
            {
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.png': 'image/png',
                '.jpeg': 'image/jpeg',
                '.woff2': 'font/woff2',
            }[extname(file)] ?? 'application/octet-stream',
        );
        res.end(content);
    } catch {
        res.writeHead(404).end();
    }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => {
        errors.push(error.message);
        console.error(error.message);
    });
    for (const [width, height] of [
        [1440, 900],
        [1280, 720],
        [390, 844],
        [844, 390],
    ]) {
        await page.setViewportSize({ width, height });
        await page.goto(`http://127.0.0.1:${server.address().port}/dashboard`);
        await page.locator('.mission-node').first().waitFor();
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollHeight <= innerHeight,
            ),
            true,
            `${width}x${height}: vertical overflow`,
        );
        assert.equal(
            await page.locator('.mission-node[aria-current="step"]').count(),
            1,
        );
        assert.equal(await page.locator('a.mission-node').count(), 5);
        assert.deepEqual(
            await page
                .locator('.mission-panel')
                .evaluateAll((panels) =>
                    panels.map(
                        (panel) =>
                            panel.querySelectorAll('.mission-node').length,
                    ),
                ),
            [10, 10, 2],
            'Group lessons across unit boundaries, ten per section',
        );
        assert.deepEqual(
            await page.locator('.mission-node-label').allTextContents(),
            Array.from(
                { length: 22 },
                (_, index) =>
                    `${String(index + 1).padStart(2, '0')}${index < 4 ? ' · Selesai' : index === 4 ? ' · Siap dimulai' : ''}`,
            ),
        );
        if (width >= 1280) {
            assert.equal(
                await page
                    .locator('.mission-panel')
                    .first()
                    .evaluate((panel) =>
                        [...panel.querySelectorAll('.mission-node')].every(
                            (node) => {
                                const rect = node.getBoundingClientRect();
                                return (
                                    rect.left >= 0 &&
                                    rect.right <= innerWidth &&
                                    rect.top >= 0 &&
                                    rect.bottom <= innerHeight
                                );
                            },
                        ),
                    ),
                true,
                'All ten nodes fit on the same screen',
            );
        }
        assert.equal(
            await page.locator('.mission-start').first().getAttribute('href'),
            '/lesson/lesson-4-0',
        );
        if (process.env.DASHBOARD_SCREENSHOT && width === 1440)
            await page.screenshot({ path: process.env.DASHBOARD_SCREENSHOT });
        await page
            .getByRole('button', { name: 'Bagian berikutnya' })
            .first()
            .click();
        await page.waitForFunction(
            () => document.querySelector('.mission-track').scrollLeft > 0,
        );
        assert.equal(
            await page.locator('.mission-stop.is-locked a').count(),
            0,
        );
        console.log(
            `PASS ${width}x${height}: viewport, horizontal paging, lesson states and CTA`,
        );
    }
    assert.deepEqual(errors, []);
} finally {
    await browser.close();
    await new Promise((done) => server.close(done));
}
