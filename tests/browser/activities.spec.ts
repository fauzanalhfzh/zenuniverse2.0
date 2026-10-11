import { expect, test } from '@playwright/test';

test('unjumble supports keyboard, returning tokens, reset and pending state', async ({
    page,
}) => {
    await page.goto('/tests/browser/activities.html');
    const bank = page.getByRole('region', { name: 'Pilihan token' });
    const submit = page.getByRole('button', { name: 'Periksa urutan' });
    await expect(submit).toBeDisabled();
    await bank.getByRole('button', { name: 'AI', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page
        .getByRole('button', {
            name: 'Posisi 1: AI. Kembalikan token',
            exact: true,
        })
        .click();
    await expect(
        bank.getByRole('button', { name: 'AI', exact: true }),
    ).toBeFocused();
    await bank.getByRole('button', { name: 'AI', exact: true }).click();
    await page.getByRole('button', { name: 'Atur ulang' }).click();
    await expect(page.getByText('0 dari 3 token tersusun')).toBeVisible();
    for (const name of ['AI', 'mengenali pola', 'dalam data.'])
        await bank.getByRole('button', { name, exact: true }).click();
    await submit.click();
    await expect(page.getByLabel('Jawaban terkirim')).toHaveText(
        '["a","b","c"]',
    );
    await expect(
        page.getByRole('button', { name: 'Memeriksa…' }),
    ).toBeDisabled();
});

test('matching allows corrections and submits a complete bijection', async ({
    page,
}) => {
    await page.goto('/tests/browser/activities.html?mode=matching');
    const left = page.getByRole('region', { name: 'Istilah', exact: true });
    const right = page.getByRole('region', { name: 'Arti atau contoh' });
    await expect(
        page.getByRole('button', { name: 'Periksa pasangan' }),
    ).toBeDisabled();
    await left
        .getByRole('button', { name: '1 Data latih', exact: true })
        .click();
    await right
        .getByRole('button', {
            name: 'Contoh terpisah untuk evaluasi model',
            exact: true,
        })
        .click();
    await left.getByRole('button', { name: /1 Data latih/ }).click();
    await right
        .getByRole('button', {
            name: 'Contoh untuk mempelajari pola',
            exact: true,
        })
        .click();
    await left.getByRole('button', { name: '2 Data uji', exact: true }).click();
    await right
        .getByRole('button', {
            name: 'Contoh terpisah untuk evaluasi model',
            exact: true,
        })
        .click();
    await page.getByRole('button', { name: 'Periksa pasangan' }).click();
    await expect(page.getByLabel('Jawaban terkirim')).toHaveText(
        '{"a":"x","b":"y"}',
    );
});

test('flashcards require opening every answer and reset the visible side on navigation', async ({
    page,
}) => {
    await page.goto('/tests/browser/activities.html?mode=flashcard');
    await expect(
        page.getByRole('button', { name: 'Selesai mengulas' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Kartu berikutnya' }).click();
    await expect(
        page.getByText('Apa itu data uji?', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Buka jawaban kartu' }).click();
    await page.getByRole('button', { name: 'Kartu sebelumnya' }).click();
    await expect(
        page.getByText('Apa itu data latih?', { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Selesai mengulas' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Buka jawaban kartu' }).click();
    await page.getByRole('button', { name: 'Selesai mengulas' }).click();
    await expect(page.getByLabel('Jawaban terkirim')).toHaveText(
        '["two","one"]',
    );
});

for (const mode of ['unjumble', 'matching', 'flashcard'])
    test(`${mode} fits a mobile viewport`, async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await page.goto(`/tests/browser/activities.html?mode=${mode}`);
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
            ),
        ).toBe(true);
        await page.screenshot({
            path: `test-results/activities/${mode}-mobile.png`,
            fullPage: true,
        });
    });
