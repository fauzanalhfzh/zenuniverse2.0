import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 800 }]) {
    test(`mission once, reopen, optional hint and focus ${viewport.width}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/tests/browser/blockly.html');
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('heading', { name: 'Misi' })).toBeVisible();
        await expect(dialog).toContainText('Gerakkan robot tiga petak');
        await expect(dialog.getByText('Ulangi gerakan maju tiga kali.')).toBeHidden();
        await expect(dialog.getByRole('button', { name: 'Mulai coding' })).toBeFocused();
        await page.screenshot({ path: `/tmp/zen-mission-${viewport.width}.png` });
        await dialog.getByRole('button', { name: 'Mulai coding' }).click();
        await expect(dialog).toBeHidden();
        await page.reload();
        await expect(page.locator('.blocklySvg').first()).toBeVisible();
        await expect(dialog).toBeHidden();
        await page.getByRole('button', { name: 'Misi', exact: true }).click();
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Lihat petunjuk' }).click();
        await expect(dialog.getByText('Ulangi gerakan maju tiga kali.')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page.getByRole('button', { name: 'Misi', exact: true })).toBeFocused();
    });
}

test('storage denial does not crash mission or coding', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('denied'); } });
    });
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/tests/browser/blockly.html');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Mulai coding' }).click();
    await expect(page.locator('.blocklySvg').first()).toBeVisible();
});

test('mission closes while lesson feedback is active', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/tests/browser/blockly.html');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('fixture:feedback', { detail: true })));
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Misi', exact: true })).toBeDisabled();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('fixture:feedback', { detail: false })));
    await expect(page.getByRole('dialog')).toBeHidden();
});

test('each challenge gets one introduction, revisiting does not reopen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/tests/browser/blockly.html');
    await page.getByRole('button', { name: 'Mulai coding' }).click();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('fixture:challenge', { detail: 'another-challenge' })));
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Mulai coding' }).click();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('fixture:challenge', { detail: 'mobile-layout' })));
    await expect(page.getByRole('dialog')).toBeHidden();
});

test('desktop mission remains inline and no sheet auto-opens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/tests/browser/blockly.html');
    await expect(page.locator('.blockly-lesson__mission')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Misi', exact: true })).toBeHidden();
    await page.screenshot({ path: '/tmp/zen-blockly-desktop.png' });
});
