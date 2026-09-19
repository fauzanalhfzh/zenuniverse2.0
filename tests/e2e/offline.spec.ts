import { expect, test } from '@playwright/test';

const OUTBOX_PREFIX = 'zenuniverse.outbox.v1';

async function pendingJobs(
    page: import('@playwright/test').Page,
): Promise<number> {
    return page.evaluate((prefix) => {
        const key = Object.keys(localStorage).find((item) =>
            item.startsWith(prefix),
        );

        if (!key) {
            return 0;
        }

        const raw = localStorage.getItem(key);

        if (!raw) {
            return 0;
        }

        const parsed: unknown = JSON.parse(raw);

        return Array.isArray(parsed) ? parsed.length : 0;
    }, OUTBOX_PREFIX);
}

test.describe('offline replay', () => {
    test('queues an answer offline and replays it exactly once', async ({
        context,
        page,
    }) => {
        const stepId = 'blockly-basics-lesson-01-step-1';

        await page.goto('/e2e/login?email=e2e-offline@zenuniverse.test');
        await page.goto('/lesson/blockly-basics-lesson-01');

        await expect(page.getByTestId('player-xp')).toBeVisible();

        await context.setOffline(true);

        const understand = page.getByRole('button', {
            name: 'Saya paham, lanjut',
            exact: true,
        });

        await understand.click();
        await expect(page.getByRole('alert')).toContainText(/Koneksi/);

        await expect.poll(() => pendingJobs(page)).toBe(1);

        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event('online')));

        await expect.poll(() => pendingJobs(page), { timeout: 15_000 }).toBe(0);

        await expect
            .poll(
                async () => {
                    const snapshot = (await (
                        await page.request.get('/me/progress')
                    ).json()) as { completedStepIds: string[] };

                    return snapshot.completedStepIds.filter(
                        (id) => id === stepId,
                    ).length;
                },
                { timeout: 15_000 },
            )
            .toBe(1);

        await page.reload();
        await expect(page.getByTestId('player-xp')).toBeVisible();

        const afterReload = (await (
            await page.request.get('/me/progress')
        ).json()) as { completedStepIds: string[] };

        expect(
            afterReload.completedStepIds.filter((id) => id === stepId),
        ).toHaveLength(1);
    });
});
