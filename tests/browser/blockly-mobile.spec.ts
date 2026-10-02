import { test, expect } from '@playwright/test';

for (const width of [360, 390, 430]) {
    test(`mobile ${width}: mission and stage above full-width workspace, sticky actions`, async ({
        page,
    }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/tests/browser/blockly.html');
        await expect(page.locator('.blocklySvg').first()).toBeVisible();
        const mission = await page
            .locator('.blockly-lesson__mission')
            .boundingBox();
        const stage = await page
            .locator('.blockly-lesson__stage')
            .boundingBox();
        const editor = await page
            .locator('.blockly-lesson__editor')
            .boundingBox();
        expect(mission!.y + mission!.height).toBeLessThanOrEqual(stage!.y);
        expect(stage!.y + stage!.height).toBeLessThanOrEqual(editor!.y);
        expect(stage!.y + stage!.height).toBeLessThan(600);
        const metrics = await page.evaluate(() =>
            (window as any).Blockly.getMainWorkspace().getMetrics(),
        );
        expect(metrics.toolboxPosition).toBe(0); // Blockly.TOOLBOX_AT_TOP
        expect(metrics.viewWidth).toBeGreaterThan(width - 60);
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
        for (const label of ['Atur ulang', 'Jalankan program']) {
            const box = await page
                .getByRole('button', { name: label })
                .boundingBox();
            expect(box!.height).toBeGreaterThanOrEqual(48);
            expect(box!.y + box!.height).toBeLessThanOrEqual(800);
        }
        await page.screenshot({
            path: `/tmp/zen-blockly-${width}.png`,
            fullPage: true,
        });
        await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight),
        );
        const actions = await page
            .locator('.blockly-lesson__toolbar-actions')
            .boundingBox();
        expect(actions!.y + actions!.height).toBeLessThanOrEqual(800);
    });
}

test('real flyout drag, robot execution, reset and desktop resize retain program', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/tests/browser/blockly.html');
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
