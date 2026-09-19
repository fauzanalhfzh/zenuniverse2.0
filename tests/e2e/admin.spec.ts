import { expect, test } from '@playwright/test';
import { adminEmail, adminPassword } from './env';

test.describe('admin CMS', () => {
    test('admin signs in with email and password', async ({ page }) => {
        await page.goto('/admin/login');

        await page.locator('input[type="email"]').fill(adminEmail);
        await page.locator('input[type="password"]').fill(adminPassword);
        await page.locator('button[type="submit"]').first().click();

        await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20_000 });
        await expect(page.getByRole('link', { name: 'Kursus' })).toBeVisible();

        await page.goto('/admin/courses');
        await expect(
            page.getByRole('heading', { name: /Kursus/ }),
        ).toBeVisible();
    });

    test('wrong password is rejected', async ({ page }) => {
        await page.goto('/admin/login');

        await page.locator('input[type="email"]').fill(adminEmail);
        await page
            .locator('input[type="password"]')
            .fill('definitely-wrong-password');
        await page.locator('button[type="submit"]').first().click();

        await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 });
    });

    test('student cannot open the panel', async ({ page }) => {
        await page.goto('/e2e/login?email=e2e-student@zenuniverse.test');

        const response = await page.goto('/admin');

        expect(response?.status()).toBe(403);
    });
});
