import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { appEnv, phpBin } from './env';

test('public metadata stays unique and correct on Inertia navigation and back', async ({ page, request }) => {
    execFileSync(phpBin, ['artisan', 'tinker', '--execute=App\\Models\\BlogArticle::updateOrCreate(["slug"=>"seo-test-article"],["title"=>"Artikel SEO","category"=>"Logika","excerpt"=>"Ringkasan artikel SEO.","body"=>"Isi artikel uji.","status"=>"published","published_at"=>now()]);'], { env: appEnv() });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    async function metadata(path: string) {
        const response = await request.get(path);
        const html = await response.text();
        const title = html.match(/<title[^>]*>([^<]*)<\/title>/)![1];
        const description = html.match(/<meta name="description" content="([^"]*)"/)![1];
        await expect(page).toHaveTitle(title);
        await expect(page.locator('head title')).toHaveCount(1);
        await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
        await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', description);
        await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
        await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://zenuniverse.id${path}`);
    }
    await page.goto('/');
    await metadata('/');
    await page.evaluate(() => { (window as unknown as { seoNavigationMarker: boolean }).seoNavigationMarker = true; });
    await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Harga', exact: true }).click();
    await expect(page).toHaveURL(/\/price$/);
    await metadata('/price');
    await expect(page.locator('main h1')).toHaveCount(1);
    await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Blog', exact: true }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await metadata('/blog');
    const article = page.locator('main a[href^="/blog/"]').first();
    const articlePath = await article.getAttribute('href');
    expect(articlePath).toBeTruthy();
    await article.click();
    await metadata(articlePath!);
    await page.goBack();
    await expect(page).toHaveURL(/\/blog$/);
    await metadata('/blog');
    expect(await page.evaluate(() => (window as unknown as { seoNavigationMarker: boolean }).seoNavigationMarker)).toBe(true);
    await page.getByRole('link', { name: 'Beranda', exact: true }).first().click();
    await metadata('/');
    expect(errors).toEqual([]);
});
