import { test, expect, type Page } from '@playwright/test';

async function expectActorCentered(page: Page, x: number, y: number) {
    await expect
        .poll(async () => {
            const actor = await page
                .locator('.challenge-board__actor')
                .boundingBox();
            const cell = await page
                .locator('.challenge-board__cell')
                .nth(y * 5 + x)
                .boundingBox();
            return Math.max(
                Math.abs(
                    actor!.x + actor!.width / 2 - cell!.x - cell!.width / 2,
                ),
                Math.abs(
                    actor!.y + actor!.height / 2 - cell!.y - cell!.height / 2,
                ),
            );
        })
        .toBeLessThan(1);
}

for (const viewport of [
    { width: 360, height: 640 },
    { width: 1280, height: 900 },
]) {
    test(`zero-based axes and aligned robot at ${viewport.width}x${viewport.height}`, async ({
        page,
    }) => {
        await page.setViewportSize(viewport);
        await page.goto('/tests/browser/blockly.html');
        if (viewport.width < 768)
            await page.getByRole('button', { name: 'Mulai coding' }).click();
        await expect(page.locator('.challenge-board__axis--x')).toHaveText(
            'X→',
        );
        await expect(page.locator('.challenge-board__axis--y')).toHaveText(
            'Y↓',
        );
        await expect(page.locator('.challenge-board__column-label')).toHaveText(
            ['0', '1', '2', '3', '4'],
        );
        await expect(page.locator('.challenge-board__row-label')).toHaveText([
            '0',
            '1',
            '2',
            '3',
            '4',
        ]);
        await expect(page.getByRole('img')).toHaveAttribute(
            'aria-label',
            /X=2, Y=4.*X ke kanan, Y ke bawah/,
        );
        for (let i = 0; i < 5; i++) {
            const column = await page
                .locator('.challenge-board__column-label')
                .nth(i)
                .boundingBox();
            const row = await page
                .locator('.challenge-board__row-label')
                .nth(i)
                .boundingBox();
            const topCell = await page
                .locator('.challenge-board__cell')
                .nth(i)
                .boundingBox();
            const leftCell = await page
                .locator('.challenge-board__cell')
                .nth(i * 5)
                .boundingBox();
            expect(
                Math.abs(
                    column!.x +
                        column!.width / 2 -
                        topCell!.x -
                        topCell!.width / 2,
                ),
            ).toBeLessThan(1);
            expect(
                Math.abs(
                    row!.y +
                        row!.height / 2 -
                        leftCell!.y -
                        leftCell!.height / 2,
                ),
            ).toBeLessThan(1);
            expect(column!.y + column!.height).toBeLessThanOrEqual(topCell!.y);
            expect(row!.x + row!.width).toBeLessThanOrEqual(leftCell!.x);
        }
        await expectActorCentered(page, 2, 4);
        const frame = await page
            .locator('.challenge-board-frame')
            .boundingBox();
        const stage = await page
            .locator('.blockly-lesson__stage-body')
            .boundingBox();
        expect(frame!.y).toBeGreaterThanOrEqual(stage!.y);
        expect(frame!.y + frame!.height).toBeLessThanOrEqual(
            stage!.y + stage!.height,
        );
        if (viewport.width === 360) {
            expect(
                await page.evaluate(
                    () => document.documentElement.scrollHeight,
                ),
            ).toBeLessThanOrEqual(640);
            expect(
                await page.evaluate(() => document.documentElement.scrollWidth),
            ).toBe(360);
        }
        const block = await page
            .locator('.blocklyFlyout .blocklyDraggable')
            .first()
            .boundingBox();
        const canvas = await page
            .locator('.blockly-lesson__canvas')
            .boundingBox();
        await page.mouse.move(block!.x + 30, block!.y + 15);
        await page.mouse.down();
        await page.mouse.move(canvas!.x + canvas!.width / 2, canvas!.y + 100, {
            steps: 20,
        });
        await page.mouse.up();
        await expect(page.locator('.blockly-lesson__block-count')).toHaveText(
            '1 / 3 blok',
        );
        await page.getByRole('button', { name: 'Jalankan program' }).click();
        await expect(page.locator('#submitted')).toHaveText(
            '[{"type":"move_forward"}]',
        );
        await expect(page.getByRole('img')).toHaveAttribute(
            'aria-label',
            /X=2, Y=3/,
        );
        await expectActorCentered(page, 2, 3);
        await page.screenshot({
            path: `/tmp/zen-coordinates-${viewport.width}x${viewport.height}.png`,
            fullPage: true,
        });
    });
}
