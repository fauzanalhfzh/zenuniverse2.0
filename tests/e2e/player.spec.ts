import { expect, test } from '@playwright/test';

test.describe('learner flow', () => {
    test('seam login, catalog, course path, and first lesson answer', async ({
        page,
    }) => {
        await page.goto('/e2e/login?email=e2e-play@zenuniverse.test');
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto('/learn');
        await expect(
            page.getByRole('heading', { name: 'Pilih planetmu' }),
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
        await expect(page.getByTestId('player-hearts')).toBeVisible();

        const next = page.getByTestId('player-continue-button');

        await expect(next).toBeEnabled();
        await next.click();
        await expect(
            page.getByRole('heading', {
                name: 'Apa arti coding dalam latihan ini?',
                level: 1,
            }),
        ).toBeVisible();
    });

    test('jawaban salah dan benar tampil dalam modal', async ({ page }) => {
        await page.goto('/e2e/login?email=e2e-result@zenuniverse.test');
        await page.goto('/lesson/blockly-basics-lesson-01');
        await page.getByTestId('player-continue-button').click();

        await page.locator('.lesson-player__quiz-option', { hasText: 'Menggambar robot' }).click();
        const wrong = page.getByRole('dialog');
        await expect(
            wrong.getByRole('heading', { name: 'Belum tepat, coba lagi' }),
        ).toBeVisible();
        await expect(
            wrong.getByRole('button', { name: 'Coba lagi' }),
        ).toBeFocused();
        await expect(wrong.getByRole('button', { name: 'Baca ulang materi' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(wrong).not.toBeVisible();
        await expect(page.locator('.lesson-player__quiz-option', { hasText: 'Menggambar robot' })).toBeFocused();

        await page
            .locator('.lesson-player__quiz-option', { hasText: 'Menyusun instruksi untuk robot' })
            .click();
        const correct = page.getByRole('dialog');
        await expect(
            correct.getByRole('heading', { name: 'Jawabanmu benar!' }),
        ).toBeVisible();
        await correct
            .getByRole('button', { name: 'Lanjut ke materi berikutnya' })
            .click();
        await expect(correct).not.toBeVisible();
        await expect(
            page.getByRole('heading', {
                name: 'Program adalah kumpulan instruksi.',
            }),
        ).toBeVisible();
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

        await page.getByTestId('player-continue-button').click();
        await expect(
            page.getByRole('heading', {
                name: 'Apa arti coding dalam latihan ini?',
                level: 1,
            }),
        ).toBeVisible();

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
