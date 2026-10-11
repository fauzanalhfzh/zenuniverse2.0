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

        const firstLesson = page.locator('.mission-node').first();
        await expect(firstLesson).toBeVisible();
        await firstLesson.click();
        await page.getByRole('link', { name: 'Mulai pelajaran' }).click();
        await expect(page).toHaveURL(/\/lesson\//);

        await expect(page.getByRole('progressbar')).toBeVisible();
        await expect(page.getByTestId('player-hearts')).toBeVisible();

        const next = page.getByTestId('player-continue-button');

        await expect(next).toBeEnabled();
        await next.click();
        await expect(
            page.getByRole('heading', {
                name: 'Kegiatan mana yang termasuk coding?',
                level: 1,
            }),
        ).toBeVisible();
    });

    test('pratinjau pelajaran mendukung keyboard, terkunci, dan layar kecil', async ({
        page,
    }) => {
        await page.goto('/e2e/login?email=e2e-preview@zenuniverse.test');
        await page.goto('/dashboard?course=blockly-basics');
        const first = page.locator('.mission-node').first();
        const preview = page.locator('.mission-preview:popover-open');
        await first.focus();
        await page.keyboard.press('Enter');
        await expect(first).toHaveAttribute('aria-expanded', 'true');
        await expect(preview.getByRole('heading')).toHaveText(
            (await first.getAttribute('aria-label'))!.split(',')[0],
        );
        await expect(preview.locator('p')).toHaveCount(0);
        await expect(preview).toHaveCSS(
            'background-color',
            'rgb(255, 138, 61)',
        );
        await expect(
            preview.getByRole('link', { name: 'Mulai pelajaran' }),
        ).toBeVisible();
        await expect(page).toHaveURL(/dashboard/);
        await page.keyboard.press('Escape');
        await expect(preview).toHaveCount(0);
        await expect(first).toBeFocused();
        await page.keyboard.press('Space');
        await expect(preview).toHaveCount(1);
        await page.locator('.mission-header h1').click();
        await expect(preview).toHaveCount(0);

        const locked = page.locator('.is-locked .mission-node').first();
        await locked.click();
        await expect(preview).toContainText('terlebih dahulu');
        await expect(preview.getByRole('link')).toHaveCount(0);
        await first.click();
        await expect(preview).toHaveCount(1);
        await expect(locked).toHaveAttribute('aria-expanded', 'false');
        await preview
            .getByRole('button', { name: 'Tutup pratinjau pelajaran' })
            .click();
        await expect(first).toBeFocused();

        await page.setViewportSize({ width: 320, height: 568 });
        await first.click();
        await expect(preview).toBeVisible();
        const bounds = await preview.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(12);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(308);
        expect(bounds!.y).toBeGreaterThanOrEqual(12);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(556);
        await page.locator('.mission-viewport').evaluate((node) => {
            node.scrollTop += 106;
        });
        await expect(preview).toBeVisible();
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
            ),
        ).toBeTruthy();
    });

    test('judul section mengikuti node saat peta digulir', async ({ page }) => {
        await page.goto('/e2e/login?email=e2e-sections@zenuniverse.test');
        await page.goto('/dashboard?course=blockly-basics');

        const heading = page.locator('.mission-header h1');
        const divider = page.locator('.mission-section-divider');
        await expect(heading).toHaveText('Pengenalan Coding');

        await page.locator('[data-lesson-index="8"]').evaluate((node) => {
            node.scrollIntoView({ block: 'center' });
        });
        await expect(heading).toHaveText('Menggerakkan Karakter');
        await expect(divider).toHaveText('Menggerakkan Karakter');
        await expect(
            page.locator('.mission-header .mission-eyebrow'),
        ).toContainText('Bagian 2, Unit 2');

        await page.locator('[data-lesson-index="0"]').evaluate((node) => {
            node.scrollIntoView({ block: 'center' });
        });
        await expect(heading).toHaveText('Pengenalan Coding');
        await expect(divider).toHaveText('Pengenalan Coding');
        await expect(
            page.locator('.mission-header .mission-eyebrow'),
        ).toContainText('Bagian 1, Unit 1');
    });

    test('jawaban salah dan benar tampil dalam modal', async ({ page }) => {
        await page.goto('/e2e/login?email=e2e-result@zenuniverse.test');
        await page.goto('/lesson/blockly-intro-lesson-01');
        await page.getByTestId('player-continue-button').click();

        await page
            .locator('.lesson-player__quiz-option', {
                hasText: 'Memilih warna casing komputer',
            })
            .click();
        const wrong = page.getByRole('dialog');
        await expect(
            wrong.getByRole('heading', { name: 'Belum tepat, coba lagi' }),
        ).toBeVisible();
        await expect(
            wrong.getByRole('button', { name: 'Coba lagi' }),
        ).toBeFocused();
        await expect(
            wrong.getByRole('button', { name: 'Baca ulang materi' }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(wrong).not.toBeVisible();
        await expect(
            page.locator('.lesson-player__quiz-option', {
                hasText: 'Memilih warna casing komputer',
            }),
        ).toBeFocused();

        await page
            .locator('.lesson-player__quiz-option', {
                hasText: 'Menyusun perintah untuk menampilkan Halo',
            })
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
                name: 'Mulai dari hasil yang ingin dibuat.',
            }),
        ).toBeVisible();
    });

    test('progress syncs to a second tab through polling', async ({
        context,
        page,
    }) => {
        await page.goto('/e2e/login?email=e2e-sync@zenuniverse.test');
        await page.goto('/lesson/blockly-intro-lesson-01');

        await expect(page.getByTestId('player-xp')).toBeVisible();

        const second = await context.newPage();
        await second.goto(page.url());
        await expect(second.getByTestId('player-xp')).toBeVisible();

        const before = await second.getByTestId('player-xp').textContent();

        await page.getByTestId('player-continue-button').click();
        await expect(
            page.getByRole('heading', {
                name: 'Kegiatan mana yang termasuk coding?',
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
