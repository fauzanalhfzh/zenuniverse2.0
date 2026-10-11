import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';
import type { SubscriptionSnapshot } from '../../resources/js/lib/subscription/state';

const fixture = '/tests/browser/subscription.html';
const endpoint = '**/me/subscription';
const snapshot = (
    plusActive = false,
    duration = 60_000,
): SubscriptionSnapshot => ({
    plusActive,
    accessUntil: plusActive
        ? new Date(Date.now() + duration).toISOString()
        : null,
    revision: 1,
    evaluatedAt: new Date().toISOString(),
    checkoutAvailable: false,
});

test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
        throw error;
    });
});

test('loading fails closed, free stays locked, keyboard refresh unlocks Plus', async ({
    page,
}) => {
    let pending: Route | undefined;
    await page.route(endpoint, (route) => {
        pending = route;
    });
    await page.goto(fixture);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'loading:free',
    );
    await expect(
        page.getByRole('link', { name: 'Misi uji Plus, mulai misi' }),
    ).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Perbarui status Plus' }),
    ).toBeDisabled();
    await expect.poll(() => pending !== undefined).toBe(true);
    expect(pending!.request().method()).toBe('GET');
    await pending!.fulfill({ json: snapshot() });
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:free',
    );
    await expect(
        page.getByRole('img', { name: 'Misi uji Plus, memerlukan Plus aktif' }),
    ).toBeVisible();
    await page.unroute(endpoint);
    await page.route(endpoint, (route) =>
        route.fulfill({ json: snapshot(true) }),
    );
    await page.keyboard.press('Tab');
    await expect(
        page.getByRole('button', { name: 'Perbarui status Plus' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:plus',
    );
    await expect(
        page.getByRole('link', { name: 'Misi uji Plus, mulai misi' }),
    ).toBeVisible();
});

test('failed request stays locked and retry recovers', async ({ page }) => {
    let failed = true;
    await page.route(endpoint, (route) =>
        route.fulfill(
            failed
                ? { status: 503, json: { message: 'Unavailable' } }
                : { json: snapshot(true) },
        ),
    );
    await page.goto(fixture);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'error:free',
    );
    await expect(page.getByRole('link')).toHaveCount(0);
    failed = false;
    await page.getByRole('button', { name: 'Coba periksa lagi' }).click();
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:plus',
    );
});

test('focus refresh and offline invalidate previously active Plus', async ({
    page,
    context,
}) => {
    let active = true;
    let requests = 0;
    await page.route(endpoint, (route) => {
        requests++;
        return route.fulfill({ json: snapshot(active) });
    });
    await page.goto(fixture);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:plus',
    );
    active = false;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:free',
    );
    active = true;
    await page.getByRole('button', { name: 'Perbarui status Plus' }).click();
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:plus',
    );
    const beforeOffline = requests;
    await context.setOffline(true);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'error:free',
    );
    await expect(page.getByRole('link')).toHaveCount(0);
    await page.getByRole('button', { name: 'Coba periksa lagi' }).click();
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'error:free',
    );
    expect(requests).toBe(beforeOffline);
    await context.setOffline(false);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:plus',
    );
});

test('expiry locks missions before failed renewal', async ({ page }) => {
    await page.clock.install();
    let requests = 0;
    let renewal: Route | undefined;
    await page.route(endpoint, (route) => {
        requests++;
        if (requests === 1)
            return route.fulfill({ json: snapshot(true, 10_000) });
        renewal = route;
    });
    await page.goto(fixture);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'ready:plus',
    );
    await page.clock.fastForward(11_000);
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'loading:free',
    );
    await expect(page.getByRole('link')).toHaveCount(0);
    await expect.poll(() => renewal !== undefined).toBe(true);
    await renewal!.abort('failed');
    await expect(page.getByTestId('subscription-state')).toHaveText(
        'error:free',
    );
});

for (const width of [360, 1024]) {
    test(`mission map has no horizontal overflow at ${width}px`, async ({
        page,
    }) => {
        await page.setViewportSize({ width, height: 800 });
        let active = false;
        await page.route(endpoint, (route) =>
            route.fulfill({ json: snapshot(active) }),
        );
        await page.goto(fixture);
        await expect(page.getByTestId('subscription-state')).toHaveText(
            'ready:free',
        );
        for (const plus of [false, true]) {
            if (plus) {
                active = true;
                await page
                    .getByRole('button', { name: 'Perbarui status Plus' })
                    .click();
                await expect(page.getByTestId('subscription-state')).toHaveText(
                    'ready:plus',
                );
            }
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth,
                ),
            ).toBe(true);
        }
    });
}
