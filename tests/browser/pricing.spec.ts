import { expect, test } from '@playwright/test';

for (const width of [360, 768, 1440]) {
    test(`landing pricing and billing choices at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/tests/browser/pricing.html');
        const section = page.getByRole('region', { name: 'Mulai gratis. Lanjutkan dengan Plus.' });
        await expect(section).toBeVisible();
        await expect(section.getByText('Rp0', { exact: true })).toBeVisible();
        await expect(section.getByText('Rp35.000', { exact: true })).toBeVisible();
        await expect(section.getByText('Rp300.000', { exact: true })).toBeVisible();
        await expect(section.getByText('Setara Rp25.000 per bulan.')).toBeVisible();
        await expect(section.getByText('Setahun belajar, lebih hemat Rp120.000.')).toBeVisible();
        await expect(section.getByText('12 × Rp35.000 = Rp420.000')).toBeVisible();
        const free = section.getByRole('article', { name: 'Free', exact: true });
        const plus = section.getByRole('group', { name: 'ZenUniverse Plus', exact: true });
        const monthly = plus.getByRole('article', { name: 'Bulanan', exact: true });
        const annual = plus.getByRole('article', { name: 'Tahunan', exact: true });
        const [f, p, m, a] = await Promise.all([free.boundingBox(), plus.boundingBox(), monthly.boundingBox(), annual.boundingBox()]);
        expect(f && p && m && a).toBeTruthy();
        if (width >= 1024) {
            expect(Math.abs(f!.y - p!.y)).toBeLessThan(2);
            expect(p!.x).toBeGreaterThan(f!.x + f!.width);
            expect(Math.abs(m!.y - a!.y)).toBeLessThan(2);
            expect(a!.x).toBeGreaterThan(m!.x + m!.width);
        } else if (width === 360) {
            expect(p!.y).toBeGreaterThanOrEqual(f!.y + f!.height);
            expect(a!.y).toBeGreaterThanOrEqual(m!.y + m!.height);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
        const links = section.getByRole('link', { name: /^Pilih/ });
        await expect(links).toHaveCount(3);
        for (const link of await links.all()) {
            await expect(link).toHaveAttribute('href', '/login');
            await link.focus();
            await expect(link).toBeFocused();
            const box = await link.boundingBox();
            expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        await expect(section.getByText('Pilihan paket belum melakukan pembayaran. Masuk untuk melanjutkan.')).toBeVisible();
        await section.screenshot({ path: `/tmp/zenuniverse-pricing-${width}.png` });
    });
}
