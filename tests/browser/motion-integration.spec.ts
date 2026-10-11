import { expect, test } from '@playwright/test';
import type { ProgressSnapshot } from '../../resources/js/types/lesson';

const fixture = '/tests/browser/motion-integration.html';
const initial: ProgressSnapshot = {
    totalXp: 100,
    updatedAt: 1,
    dailyXp: 0,
    currentStreak: 1,
    longestStreak: 1,
    lastActivityDate: null,
    hearts: 3,
    heartsUnlimited: false,
    heartsCapacity: 5,
    heartsRegenMinutes: 30,
    nextHeartInMs: null,
    badges: [],
    level: {
        current: { level: 1, name: 'Pemula', minXp: 0, nextXp: 200 },
        currentXp: 100,
        xpIntoLevel: 100,
        xpToNextLevel: 100,
        percent: 50,
    },
    dailyGoal: { progress: 0, percent: 0, claimed: false, remaining: 50 },
    completedLessonIds: [],
    completedStepIds: [],
    courseProgress: [],
};

test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
        throw error;
    });
    await page.route('**/me/subscription', (route) =>
        route.fulfill({
            json: {
                plusActive: false,
                accessUntil: null,
                revision: 1,
                evaluatedAt: new Date().toISOString(),
                checkoutAvailable: false,
            },
        }),
    );
});

test('dashboard refresh animates existing statistics and rejects stale snapshots', async ({
    page,
}) => {
    let snapshot = initial;
    await page.route('**/me/progress', (route) =>
        route.fulfill({ json: snapshot }),
    );
    await page.goto(fixture);
    const stats = page.locator('.dashboard-stat-totals');
    const star = stats.locator('[data-kind=star]');
    await expect(star).toHaveAttribute('data-motion-state', 'idle');
    const original = await star.elementHandle();
    snapshot = { ...initial, totalXp: 120, currentStreak: 2, updatedAt: 2 };
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(stats).toContainText('120');
    await expect(star).toHaveAttribute('data-motion-state', 'done');
    expect(await original!.evaluate((element) => element.isConnected)).toBe(
        true,
    );
    await expect(stats.locator('[data-kind=streak]')).toHaveAttribute(
        'data-motion-state',
        'done',
    );
    snapshot = { ...initial, totalXp: 999, updatedAt: 1 };
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(stats).toContainText('120');
    await expect(
        page.locator('.dashboard-unlock [data-kind=mascot]'),
    ).toBeVisible();
    await page.screenshot({
        path: 'test-results/motion-integration/dashboard.png',
        fullPage: true,
    });
});

test('lesson mobile keeps every heart visible and drains only after server confirmation', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let snapshot = initial;
    await page.route('**/me/progress', (route) =>
        route.fulfill({ json: snapshot }),
    );
    await page.route('**/learning/attempts', async (route) => {
        await route.fulfill({
            json: {
                result: {
                    correct: false,
                    consumeHeart: true,
                    feedback: 'Coba lagi.',
                },
                xpAwarded: 0,
                completed: false,
                progress: { ...initial, hearts: 2, updatedAt: 2 },
            },
        });
    });
    await page.goto(`${fixture}?lesson`);
    const hearts = page.getByTestId('player-hearts');
    await expect(hearts.locator('[data-kind=heart]')).toHaveCount(5);
    for (const body of await hearts.locator('.motion-asset__body').all())
        await expect(body).toBeVisible();
    await page.getByText('Jawaban salah', { exact: true }).click();
    await expect(hearts).toHaveAttribute('aria-label', 'Hati tersisa: 2');
    await expect(hearts.locator('[data-filled=true]')).toHaveCount(2);
    await expect(hearts.locator('[data-kind=heart]').nth(2)).toHaveAttribute(
        'data-motion-state',
        'done',
    );
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: 'test-results/motion-integration/lesson-mobile.png',
        fullPage: true,
    });
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
    snapshot = { ...initial, hearts: 3, updatedAt: 3 };
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(hearts.locator('[data-filled=true]')).toHaveCount(3);
    await expect(hearts.locator('[data-kind=heart]').nth(2)).toHaveAttribute(
        'data-motion-state',
        'done',
    );
    await page.route('**/me/subscription', (route) =>
        route.fulfill({
            json: {
                plusActive: true,
                accessUntil: new Date(Date.now() + 60_000).toISOString(),
                revision: 2,
                evaluatedAt: new Date().toISOString(),
                checkoutAvailable: false,
            },
        }),
    );
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(hearts).toHaveAttribute('aria-label', 'Nyawa tanpa batas');
    await expect(
        hearts.locator('[data-kind=unlimited-heart] .motion-asset__body'),
    ).toBeVisible();
    await expect(hearts.locator('[data-kind=heart]')).toHaveCount(0);
});

test('lesson XP and streak use response data and respect reduced motion', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/me/progress', (route) =>
        route.fulfill({ json: initial }),
    );
    await page.route('**/learning/attempts', (route) =>
        route.fulfill({
            json: {
                result: {
                    correct: true,
                    consumeHeart: false,
                    feedback: 'Benar.',
                },
                xpAwarded: 10,
                completed: false,
                progress: {
                    ...initial,
                    totalXp: 110,
                    currentStreak: 2,
                    updatedAt: 2,
                },
            },
        }),
    );
    await page.goto(`${fixture}?lesson`);
    await expect(page.getByTestId('player-xp')).toContainText('100');
    await page.getByText('Jawaban benar', { exact: true }).click();
    await expect(page.getByTestId('player-xp')).toContainText('110');
    await expect(page.locator('.lesson-player__streak')).toHaveAttribute(
        'aria-label',
        'Streak 2 hari',
    );
    await expect(
        page.locator('.lesson-player__streak [data-kind=streak]'),
    ).toHaveAttribute('data-motion-state', 'idle');
    await page.route('**/learning/lessons/quiz/complete', (route) =>
        route.fulfill({
            json: {
                progress: {
                    ...initial,
                    totalXp: 110,
                    currentStreak: 2,
                    updatedAt: 3,
                    completedLessonIds: ['quiz'],
                },
            },
        }),
    );
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Selesaikan pelajaran' })
        .click();
    await expect(
        page.locator('.lesson-player__completion [data-kind=mascot]'),
    ).toBeVisible();
    await expect(
        page.locator('.lesson-player__completion [data-kind=star]'),
    ).toHaveAttribute('data-motion-state', 'idle');
});
