import { expect, test } from '@playwright/test';

for (const mobile of [false, true]) {
    test(`loading misi terlihat sampai lesson siap (${mobile ? 'mobile reduced motion' : 'desktop'})`, async ({
        page,
    }, testInfo) => {
        if (mobile) {
            await page.setViewportSize({ width: 320, height: 740 });
            await page.emulateMedia({
                reducedMotion: 'reduce',
                colorScheme: 'dark',
            });
        }

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
            `/e2e/login?email=e2e-loading-${mobile}@zenuniverse.test`,
        );
        if (mobile) {
            await page.evaluate(() =>
                document.documentElement.classList.add('dark'),
            );
        }
        const lesson = page.locator('a[href^="/lesson/"]').first();
        await expect(lesson).toBeVisible();
        const lessonUrl = await lesson.getAttribute('href');
        let release!: () => void;
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });
        await page.route(`**${lessonUrl}`, async (route) => {
            await pending;
            await route.continue();
        });

        await lesson.focus();
        await page.keyboard.press('Enter');
        const loading = page.getByRole('dialog', {
            name: 'Menyiapkan misi...',
        });
        try {
            await expect(loading).toBeVisible();
            await expect(loading.getByRole('status')).toContainText(
                'Memuat pelajaran',
            );
            await expect(
                loading.getByRole('button', { name: 'Batal' }),
            ).toBeFocused();
            await expect(loading).toHaveCSS(
                'background-color',
                mobile ? 'rgb(14, 25, 49)' : 'rgb(255, 255, 255)',
            );
            const bounds = await loading.boundingBox();
            expect(bounds?.x).toBeGreaterThanOrEqual(0);
            expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
                page.viewportSize()!.width,
            );
            if (mobile) {
                await expect(loading.locator('[data-loading-orbit]')).toHaveCSS(
                    'transform',
                    'none',
                );
            } else {
                await expect
                    .poll(() =>
                        loading
                            .locator('[data-loading-orbit]')
                            .evaluate(
                                (node) => getComputedStyle(node).transform,
                            ),
                    )
                    .not.toBe('none');
            }
            await page.screenshot({
                path: testInfo.outputPath('lesson-loading.png'),
            });
        } finally {
            release();
        }

        await expect(page).toHaveURL(/\/lesson\//);
        await expect(loading).not.toBeVisible();
        await expect(page.getByTestId('player-continue-button')).toBeVisible();
        expect(errors).toEqual([]);
    });
}

test('Batal dan Escape membatalkan loading dan node misi bisa ditekan lagi', async ({
    page,
}) => {
    await page.goto('/e2e/login?email=e2e-loading-cancel@zenuniverse.test');
    const lesson = page.locator('a[href^="/lesson/"]').first();
    await expect(lesson).toBeVisible();
    const lessonUrl = await lesson.getAttribute('href');
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route(`**${lessonUrl}`, async (route) => {
        await pending;
        await route.continue().catch(() => {});
    });
    await lesson.click();
    const loading = page.getByRole('dialog', { name: 'Menyiapkan misi...' });
    try {
        await expect(loading).toBeVisible();
        await loading.getByRole('button', { name: 'Batal' }).click();
        await expect(loading).not.toBeVisible();
        await expect(lesson).toBeFocused();
        await lesson.click();
        await expect(loading).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(loading).not.toBeVisible();
        await expect(lesson).toBeFocused();
        await expect(page).toHaveURL(/\/dashboard/);
    } finally {
        release();
        await page.unroute(`**${lessonUrl}`);
    }
    await lesson.click();
    await expect(page).toHaveURL(/\/lesson\//);
});

test('koneksi gagal menutup loading dan pengguna bisa mencoba lagi', async ({
    page,
}) => {
    await page.goto('/e2e/login?email=e2e-loading-error@zenuniverse.test');
    const lesson = page.locator('a[href^="/lesson/"]').first();
    await expect(lesson).toBeVisible();
    const lessonUrl = await lesson.getAttribute('href');
    await page.route(`**${lessonUrl}`, (route) => route.abort('failed'));
    await lesson.click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Koneksi bermasalah');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.unroute(`**${lessonUrl}`);
    await lesson.click();
    await expect(page).toHaveURL(/\/lesson\//);
});
