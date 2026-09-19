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

    test('progress syncs to a second tab through polling', async ({
        context,
        page,
    }) => {
        await page.goto('/e2e/login?email=e2e-sync@zenuniverse.test');
        await page.goto('/lesson/blockly-basics-lesson-01');

        await expect(page.getByTestId('player-xp')).toBeVisible();

        const second = await context.newPage();
        await second.goto(page.url());
        await expect(second.getByTestId('player-xp')).toBeVisible();

        const before = await second.getByTestId('player-xp').textContent();

        const understand = page.getByRole('button', {
            name: 'Saya paham, lanjut',
            exact: true,
        });

        if ((await understand.count()) > 0) {
            await understand.click();
            await expect(
                page.getByText('Materi sudah dipahami.'),
            ).toBeVisible();
        }

        await expect(second.getByTestId('player-xp')).not.toHaveText(
            before ?? '',
            { timeout: 15_000 },
        );

        await second.close();
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
