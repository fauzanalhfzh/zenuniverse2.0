import { test, expect } from '@playwright/test';

for (const width of [360, 390, 768, 1440]) {
    test(`blog layout and interactions ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('/blog');
        await expect(page.getByRole('heading', { name: 'Cerita dari Bumi Zen' })).toBeVisible();
        await expect(page.locator('[data-blog-card]')).toHaveCount(2);
        await expect(page.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('aria-current', 'page');
        await expect(page.locator('header').getByText('Segera hadir', { exact: true })).toHaveCount(0);
        const columns = await page.locator('[data-blog-grid]').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(width >= 1024 ? 3 : width >= 640 ? 2 : 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        for (const category of ['Coding untuk anak', 'Orang tua', 'Tips belajar', 'Logika', 'Cerita komunitas']) {
            await page.getByRole('button', { name: category, exact: true }).click();
            await expect(page.getByRole('button', { name: category, exact: true })).toHaveAttribute('aria-pressed', 'true');
            const cards = page.locator('[data-blog-card]');
            if (await cards.count() === 0) await expect(page.getByText("Belum ada artikel contoh dalam kategori ini.")).toBeVisible();
            for (const card of await cards.all()) await expect(card).toContainText(category);
        }
        await page.getByRole('button', { name: 'Semua', exact: true }).click();
        await expect(page.locator('[data-blog-card]')).toHaveCount(2);
        for (const image of await page.locator('main img').all()) expect(await image.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
        const cta = page.getByRole('link', { name: 'Mulai Belajar', exact: true });
        await expect(cta).toHaveAttribute('href', '/login');
        expect(await cta.evaluate(el => getComputedStyle(el).boxShadow)).toContain('10px');
        await page.screenshot({ path: `/tmp/zenuniverse-blog-${width}.png`, fullPage: true });
        await page.getByRole('link', { name: 'Baca pratinjau', exact: true }).first().click();
        await expect(page).toHaveURL(/\/blog\/kapan-anak-siap-coding$/);
        await expect(page.getByRole('heading', { name: 'Mulai dari rasa ingin tahu' })).toBeVisible();
        await expect(page.getByText('Draf editorial · demo', { exact: true })).toBeVisible();
        await page.screenshot({ path: `/tmp/zenuniverse-blog-detail-${width}.png`, fullPage: true });
        await page.getByRole('link', { name: 'Kembali ke blog' }).click();
        await expect(page).toHaveURL(/\/blog$/);
        await page.getByRole('link', { name: 'Mulai Belajar', exact: true }).click();
        await expect(page).toHaveURL(/\/login$/);
        expect(errors).toEqual([]);
    });
}
