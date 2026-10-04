import { test, expect } from '@playwright/test';

test.use({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
});

async function open(page: import('@playwright/test').Page) {
    await page.goto('/tests/browser/blockly.html');
    await page.getByRole('button', { name: 'Mulai coding' }).click();
    await expect(
        page.locator('.blocklyFlyout .blocklyDraggable').first(),
    ).toBeVisible();
    await page.locator('.blockly-lesson__canvas').scrollIntoViewIfNeeded();
}

test('360px: all three palette blocks fit without horizontal scrolling', async ({
    page,
}) => {
    await open(page);
    const metrics = await page.evaluate(() =>
        (window as any).Blockly.getMainWorkspace()
            .getFlyout()
            .getWorkspace()
            .getMetrics(),
    );
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewWidth);
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(360);
});

for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 800 },
    { width: 430, height: 800 },
    { width: 360, height: 640 },
]) {
    test(`touch ${viewport.width}x${viewport.height}: upward drag inserts on movement; hidden flyouts never intercept blocks`, async ({
        page,
        context,
    }) => {
        await page.setViewportSize(viewport);
        await open(page);
        const block = await page
            .locator('.blocklyFlyout .blocklyDraggable')
            .first()
            .boundingBox();
        const x = block!.x + 30,
            y = block!.y + 15;
        // CDP expects viewport coordinates, just like boundingBox/elementFromPoint.
        // Check the actual hit target after scrolling, not merely SVG visibility.
        expect(
            await page.evaluate(
                ({ x, y }) =>
                    Boolean(
                        document
                            .elementFromPoint(x, y)
                            ?.closest('.blocklyDraggable'),
                    ),
                { x, y },
            ),
        ).toBe(true);
        const scrollBefore = await page.evaluate(() => window.scrollY);
        await page.evaluate(() => {
            (window as any).touchProbe = {
                start: 0,
                move: 0,
                create: 0,
                cancels: 0,
            };
            document.addEventListener(
                'pointercancel',
                () => (window as any).touchProbe.cancels++,
            );
            document.addEventListener(
                'pointerdown',
                () => ((window as any).touchProbe.start = performance.now()),
                { once: true, capture: true },
            );
            document.addEventListener(
                'pointermove',
                () => ((window as any).touchProbe.move = performance.now()),
                { once: true, capture: true },
            );
            (window as any).Blockly.getMainWorkspace().addChangeListener(
                (e: any) => {
                    if (e.type === 'create')
                        (window as any).touchProbe.create = performance.now();
                },
            );
        });
        const client = await context.newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }],
        });
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y: y - 20 }],
        });
        const countDuringDrag = await page.evaluate(
            () =>
                (window as any).Blockly.getMainWorkspace().getAllBlocks(false)
                    .length,
        );
        expect(countDuringDrag).toBe(1);

        await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: x + 25, y: y - 150 }],
        });
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
        });
        await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
            '1 / 3 blok',
        );
        const timing = await page.evaluate(() => (window as any).touchProbe);
        expect(timing.cancels).toBe(0);
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
        console.log(
            'CDP touch insertion milliseconds',
            timing.create - timing.start,
        );
        expect(timing.create - timing.start).toBeLessThan(500);
        await page.getByRole('button', { name: 'Jalankan program' }).click();
        await expect(page.locator('#submitted')).toHaveText(
            '[{"type":"move_forward"}]',
        );
        await page.getByRole('button', { name: 'Atur ulang' }).click();
        await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
            '0 / 3 blok',
        );
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
}
