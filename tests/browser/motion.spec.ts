import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/tests/browser/motion.html');
});

test('all six animations can replay and settle without browser errors', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const name of [
        'Fill heart',
        'Unfill heart',
        'Unlimited Heart',
        'Main Mascot',
        'Stars',
        'Streaks',
    ]) {
        await page
            .getByRole('button', { name: `Putar ${name}`, exact: true })
            .click();
        const asset = page.getByRole('img', { name, exact: true });
        await expect(asset).toHaveAttribute('data-motion-state', 'done');
        await expect(asset.locator('.motion-asset__body')).toHaveCSS(
            'opacity',
            '1',
        );
    }
    expect(errors).toEqual([]);
});

test('heart slots survive rapid changes, including empty and unlimited states', async ({
    page,
}) => {
    const meter = page.locator('.motion-preview__meter');
    await page
        .getByRole('button', { name: 'Kurangi nyawa' })
        .click({ clickCount: 2, delay: 30 });
    await expect(meter.locator('[data-filled=true]')).toHaveCount(1);
    await expect(meter.locator('[data-filled=false]')).toHaveCount(4);
    await page.getByRole('button', { name: 'Isi nyawa' }).click();
    await expect(meter.locator('[data-filled=true]')).toHaveCount(2);
    await expect(meter.locator('[data-filled=true]').last()).toHaveAttribute(
        'data-motion-state',
        'done',
    );
    await expect(
        meter.locator('[data-filled=true] .motion-asset__fill').last(),
    ).toHaveCSS('clip-path', 'inset(0% 0px 0px)');
    await page
        .getByRole('button', { name: 'Kurangi nyawa' })
        .click({ clickCount: 2, delay: 30 });
    await expect(
        meter.getByRole('img', { name: '0 dari 5 nyawa' }),
    ).toBeVisible();
    await expect(meter.locator('[data-kind=heart]')).toHaveCount(5);
    await expect(
        page.getByRole('button', { name: 'Kurangi nyawa' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Unlimited nonaktif' }).click();
    await expect(meter.locator('[data-kind=unlimited-heart]')).toHaveCount(1);
    await expect(meter.locator('[data-kind=heart]')).toHaveCount(0);
});

test('reduced motion remains static and reacts to runtime preference changes', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page
        .getByRole('button', { name: 'Putar Fill heart', exact: true })
        .click();
    const asset = page.getByRole('img', { name: 'Fill heart', exact: true });
    await expect(asset).toHaveAttribute('data-motion-state', 'idle');
    await expect(asset.locator('.motion-asset__fill')).toHaveCSS(
        'clip-path',
        'inset(0% 0px 0px)',
    );
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(asset).toHaveAttribute('data-motion-state', 'playing');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(asset).toHaveAttribute('data-motion-state', 'idle');
    await expect(asset.locator('.motion-asset__body')).toHaveCSS(
        'transform',
        'none',
    );
});

test('mobile and dark preview fit the viewport with usable keyboard controls', async ({
    page,
}) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.getByLabel('Latar gelap').check();
    await page.getByLabel('Animasi aktif').uncheck();
    const button = page.getByRole('button', { name: 'Putar Main Mascot' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(
        page.getByRole('img', { name: 'Main Mascot' }),
    ).toHaveAttribute('data-motion-state', 'idle');
    await expect(button).toBeFocused();
    expect(
        await button.evaluate(
            (element) => getComputedStyle(element).outlineStyle,
        ),
    ).toBe('solid');
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: 'test-results/motion/mobile-dark.png',
        fullPage: true,
    });
});
