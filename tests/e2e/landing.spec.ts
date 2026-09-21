import { expect, test } from '@playwright/test';

for (const width of [320, 768, 1440]) {
    test(`landing follows the reference without overflow at ${width}px`, async ({
        page,
    }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/');

        await expect(
            page.getByRole('heading', {
                level: 1,
                name: 'Belajar coding jadi seru, satu misi setiap hari!',
            }),
        ).toBeVisible();
        await expect(
            page.getByRole('heading', {
                name: 'Lahir dari kebingungan. Tumbuh dari kebersamaan.',
            }),
        ).toBeVisible();
        await expect(page.getByRole('banner')).toBeVisible();
        await expect(page.getByRole('contentinfo')).toBeVisible();
        await expect(page.getByText('Python', { exact: true })).toBeVisible();
        await expect(page.getByText('Segera hadir').first()).toBeVisible();
        await expect(page.locator('a[href="#"]')).toHaveCount(0);
        await expect(page.locator('canvas')).toHaveCount(0);
        await expect(page.locator('#jalur-belajar')).toHaveCount(0);
        await expect(
            page.getByRole('link', { name: 'Mulai Belajar', exact: true }),
        ).toHaveCount(2);
        await expect(
            page.getByRole('link', { name: 'Aku Sudah Punya Akun' }),
        ).toHaveAttribute('href', '/login');
        await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(
                Array.from(document.images, (image) => image.decode()),
            );
        });
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        ).toBe(true);
        expect(errors).toEqual([]);
    });
}

test('guest can navigate from landing to Google login', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /Lewati/ })).toBeFocused();
    await page
        .getByRole('link', { name: 'Mulai Belajar', exact: true })
        .first()
        .click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
        page.getByRole('heading', { name: 'Masuk untuk lanjut belajar' }),
    ).toBeVisible();
});

test('signed-in learner goes directly to the course catalog', async ({
    page,
}) => {
    await page.goto('/e2e/login?email=e2e-landing@zenuniverse.test');
    await page.goto('/');
    await page
        .getByRole('link', { name: 'Mulai Belajar', exact: true })
        .first()
        .click();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(
        page.getByRole('heading', { name: 'Jalur belajar' }),
    ).toBeVisible();
});
