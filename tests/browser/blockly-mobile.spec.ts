import { test, expect } from '@playwright/test';

for (const { width, height } of [
    { width: 360, height: 800 },
    { width: 390, height: 800 },
    { width: 430, height: 800 },
    { width: 360, height: 640 },
]) {
    test(`mobile ${width}x${height}: compact stage, largest workspace, bottom palette in one viewport`, async ({
        page,
    }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/tests/browser/blockly.html');
        await expect(page.locator('.blocklySvg').first()).toBeVisible();
        await page.getByRole('button', { name: 'Mulai coding' }).click();
        const stage = await page
            .locator('.blockly-lesson__stage')
            .boundingBox();
        const editor = await page
            .locator('.blockly-lesson__editor')
            .boundingBox();
        expect(stage!.width).toBeGreaterThan(width - 20);
        await expect(page.locator('.blockly-lesson__mission')).toBeHidden();
        expect(stage!.y + stage!.height).toBeLessThanOrEqual(editor!.y);
        expect(stage!.height).toBeLessThanOrEqual(200);
        const board = await page.locator('.challenge-board').boundingBox();
        expect(board!.y + board!.height).toBeLessThanOrEqual(
            stage!.y + stage!.height,
        );
        await expect(page.locator('.blockly-lesson__tab')).toBeHidden();
        const labels = await page
            .locator('.blocklyFlyout')
            .first()
            .locator('.blocklyText')
            .allTextContents();
        expect(labels.join(' ')).toContain('MAJU');
        expect(labels.join(' ').replace(/\s+/g, ' ')).toContain('BELOK KANAN');
        expect(labels.join(' ')).toContain('ULANGI');
        const metrics = await page.evaluate(() =>
            (window as any).Blockly.getMainWorkspace().getMetrics(),
        );
        expect(metrics.toolboxPosition).toBe(1); // Blockly.TOOLBOX_AT_BOTTOM
        expect(metrics.viewHeight).toBeGreaterThan(stage!.height);
        const palette = await page
            .locator('.blocklyFlyout')
            .first()
            .boundingBox();
        expect(palette!.y).toBeGreaterThan(editor!.y + 100);
        expect(palette!.y + palette!.height).toBeLessThanOrEqual(height);
        expect(
            await page.evaluate(() => document.documentElement.scrollHeight),
        ).toBeLessThanOrEqual(height);
        expect(metrics.viewWidth).toBeGreaterThan(width - 60);
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
        for (const label of ['Atur ulang', 'Jalankan program']) {
            const box = await page
                .getByRole('button', { name: label })
                .boundingBox();
            expect(box!.height).toBeGreaterThanOrEqual(48);
            expect(box!.y + box!.height).toBeLessThanOrEqual(height);
        }
        await page.screenshot({
            path: `/tmp/zen-blockly-${width}x${height}.png`,
            fullPage: true,
        });
        await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight),
        );
        const actions = await page
            .locator('.blockly-lesson__toolbar-actions')
            .boundingBox();
        expect(actions!.y + actions!.height).toBeLessThanOrEqual(height);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
}

test('real flyout drag, robot execution, reset and desktop resize retain program', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/tests/browser/blockly.html');
    await page.getByRole('button', { name: 'Mulai coding' }).click();
    await expect(
        page.locator('.blocklyFlyout .blocklyDraggable').first(),
    ).toBeVisible();
    await page.locator('.blockly-lesson__canvas').scrollIntoViewIfNeeded();
    const block = await page
        .locator('.blocklyFlyout .blocklyDraggable')
        .first()
        .boundingBox();
    const canvas = await page.locator('.blockly-lesson__canvas').boundingBox();
    await page.mouse.move(block!.x + 30, block!.y + 15);
    await page.mouse.down();
    await page.mouse.move(canvas!.x + 50, canvas!.y + 150, { steps: 20 });
    await page.mouse.up();
    await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
        '1 / 3 blok',
    );
    await page.getByRole('button', { name: 'Jalankan program' }).click();
    await expect(page.locator('#submitted')).toHaveText(
        '[{"type":"move_forward"}]',
    );
    await expect(page.locator('.challenge-board__actor')).toHaveCSS(
        '--robot-y',
        '3',
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
        '1 / 3 blok',
    );
    expect(
        await page.evaluate(
            () =>
                (window as any).Blockly.getMainWorkspace().getMetrics()
                    .toolboxPosition,
        ),
    ).toBe(2);
    const editor = await page.locator('.blockly-lesson__editor').boundingBox();
    const stage = await page.locator('.blockly-lesson__stage').boundingBox();
    expect(stage!.x).toBeGreaterThan(editor!.x + editor!.width);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
        '1 / 3 blok',
    );
    await page.getByRole('button', { name: 'Atur ulang' }).click();
    await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
        '0 / 3 blok',
    );
    await expect(page.locator('.challenge-board__actor')).toHaveCSS(
        '--robot-y',
        '4',
    );
});
