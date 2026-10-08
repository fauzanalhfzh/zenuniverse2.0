import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { appEnv, phpBin } from './env';

test('raw SSR and hydrated social graph remain unique and XSS-safe across navigation', async ({ page, request }) => {
    const title = 'SEO </script><script>window.seoXss=1</script> & "judul"';
    const description = 'Ringkasan </script><script>window.seoXss=1</script> & aman';
    const payload = Buffer.from(JSON.stringify({ title, excerpt: description })).toString('base64');
    execFileSync(phpBin, ['artisan', 'tinker', `--execute=$data=json_decode(base64_decode('${payload}'),true); $article=App\\Models\\BlogArticle::updateOrCreate(['slug'=>'structured-data-test'],array_merge($data,['category'=>'Logika','body'=>'Isi artikel uji.','cover_image'=>'/images/course-icon/html.png','status'=>'published','published_at'=>'2025-01-02 03:04:05'])); $article->forceFill(['updated_at'=>'2025-03-04 05:06:07'])->save();`], { env: appEnv() });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    async function verify(path: string) {
        const html = await (await request.get(path)).text();
        // Proves the Node renderer supplied page body, not just Blade's head fallback.
        expect(html).toMatch(/<div[^>]*id="app"[^>]*>[\s\S]*<main/);
        const raw = await page.evaluate((source) => {
            const dom = new DOMParser().parseFromString(source, 'text/html');
            const scripts = dom.head.querySelectorAll('script[type="application/ld+json"]');
            const properties = ['title', 'description', 'url', 'type', 'image'];
            return {
                count: scripts.length,
                json: scripts[0]?.textContent,
                og: Object.fromEntries(properties.map(key => [key, Array.from(dom.head.querySelectorAll(`meta[property="og:${key}"]`)).map(el => el.getAttribute('content'))])),
                card: Array.from(dom.head.querySelectorAll('meta[name="twitter:card"]')).map(el => el.getAttribute('content')),
            };
        }, html);
        expect(raw.count).toBe(1);
        expect(raw.json).not.toContain('<');
        const graph = JSON.parse(raw.json!)['@graph'];
        expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual(path.includes('/blog/') ? ['Organization', 'WebSite', 'BlogPosting'] : ['Organization', 'WebSite']);
        expect(raw.card).toEqual(['summary_large_image']);
        for (const [key, values] of Object.entries(raw.og)) {
            expect(values).toHaveLength(1);
            const node = page.locator(`head meta[property="og:${key}"]`);
            await expect(node).toHaveCount(1);
            await expect(node).toHaveAttribute('content', values[0]!);
        }
        expect(raw.og.url).toEqual([`https://zenuniverse.id${path}`]);
        expect(raw.og.image[0]).toMatch(/^https:\/\/zenuniverse\.id\//);
        await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(1);
        await expect(page.locator('head script[type="application/ld+json"]')).toHaveText(raw.json!);
        await expect(page.locator('head meta[name="twitter:card"]')).toHaveCount(1);
        if (path.includes('/blog/')) {
            expect(graph[2]).toMatchObject({ headline: title, description, datePublished: '2025-01-02T03:04:05+00:00', dateModified: '2025-03-04T05:06:07+00:00', image: 'https://zenuniverse.id/images/course-icon/html.png' });
            for (const key of ['author', 'aggregateRating', 'offers', 'price']) expect(graph[2]).not.toHaveProperty(key);
        }
        expect(await page.evaluate(() => (window as unknown as { seoXss?: number }).seoXss)).toBeUndefined();
    }
    await page.goto('/');
    await verify('/');
    await page.evaluate(() => { (window as unknown as { seoMarker: boolean }).seoMarker = true; });
    await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Harga', exact: true }).click();
    await expect(page).toHaveURL(/\/price$/);
    await verify('/price');
    await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Blog', exact: true }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await verify('/blog');
    await page.locator('main a[href="/blog/structured-data-test"]').first().click();
    await expect(page).toHaveURL(/\/blog\/structured-data-test$/);
    await verify('/blog/structured-data-test');
    await page.goBack();
    await expect(page).toHaveURL(/\/blog$/);
    await verify('/blog');
    await page.getByRole('link', { name: 'Beranda', exact: true }).first().click();
    await verify('/');
    expect(await page.evaluate(() => (window as unknown as { seoMarker: boolean }).seoMarker)).toBe(true);
    await page.goto('/blog/structured-data-test');
    await verify('/blog/structured-data-test');
    await page.goto('/login');
    await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(0);
    await expect(page.locator('head meta[property^="og:"]')).toHaveCount(0);
    expect(errors).toEqual([]);
});
