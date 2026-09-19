import { expect, test } from '@playwright/test';

test.describe('learner flow', () => {
    test('seam login, catalog, course path, and first lesson answer', async ({
        page,
    }) => {
        await page.goto('/e2e/login?email=e2e-play@zenuniverse.test');
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/learn');
        await expect(
            page.getByRole('heading', { name: 'Jalur belajar' }),
        ).toBeVisible();

        await page
            .getByRole('link', { name: /Code Block/ })
            .first()
            .click();
        await expect(page).toHaveURL(/dashboard\?course=/);

        const firstLesson = page.locator('a[href^="/lesson/"]').first();
        await expect(firstLesson).toBeVisible();
        await firstLesson.click();
        await expect(page).toHaveURL(/\/lesson\//);

        await expect(page.getByRole('progressbar')).toBeVisible();
        await expect(page.getByText(/❤️/)).toBeVisible();

        const understand = page.getByRole('button', {
            name: 'Saya paham, lanjut',
            exact: true,
        });

        if ((await understand.count()) > 0) {
            await understand.click();
            await expect(
                page.getByText('Materi sudah dipahami.'),
            ).toBeVisible();
            await expect(
                page.getByRole('button', { name: 'Lanjut', exact: true }),
            ).toBeVisible();
        }
    });

    test('progress API stays private', async ({ page }) => {
        await page.goto('/e2e/login?email=e2e-progress@zenuniverse.test');

        const response = await page.request.get('/me/progress');
        expect(response.ok()).toBeTruthy();

        const body = await response.text();
        expect(body).not.toContain('correctOptionId');
        expect(body).not.toContain('expectedCode');
        expect(body).not.toContain('e2e-progress@zenuniverse.test');
    });
});
