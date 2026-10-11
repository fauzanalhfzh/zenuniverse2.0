import { expect, test } from '@playwright/test';

const fixture = '/tests/browser/code-fill.html';

test('authored Python snippets keep indentation and remain separate from the prompt', async ({
    page,
}, testInfo) => {
    await page.goto(`${fixture}?quiz&authored`);
    await expect(page.getByRole('heading')).toHaveText(
        'Apa output kode berikut?',
    );
    const rows = page.locator('.lesson-player__code-fill-line');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(2).locator('span').last()).toHaveText(
        '    print("Lulus")',
        { normalizeWhiteSpace: false },
    );
    await page.screenshot({
        path: testInfo.outputPath('authored-python.png'),
        fullPage: true,
    });
});

test('Python quiz shows readable code above selectable answers on mobile', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${fixture}?quiz`);
    await expect(page.getByRole('heading')).toHaveText(
        'Apa nilai akhir score setelah kode berikut dijalankan?',
    );
    const editor = page.getByRole('region', {
        name: 'Potongan kode Python, hanya baca',
    });
    await expect(editor).toContainText('soal.py');
    await expect(editor.locator('.lesson-player__code-fill-line')).toHaveCount(
        2,
    );
    await expect(
        editor.locator('.lesson-player__code-fill-line').nth(0),
    ).toContainText('score = 10');
    await expect(
        editor.locator('.lesson-player__code-fill-line').nth(1),
    ).toContainText('score = 20');
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await page.getByRole('listitem').filter({ hasText: /^20$/ }).click();
    await expect(
        page.getByRole('listitem').filter({ hasText: /^20$/ }),
    ).toHaveClass(/--selected/);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('python-quiz-mobile.png'),
        fullPage: true,
    });
    await page.goto(`${fixture}?quiz&plain`);
    await expect(page.getByRole('heading')).toHaveText(
        'Apa kegunaan variabel?',
    );
    await expect(
        page.getByRole('region', { name: 'Potongan kode Python, hanya baca' }),
    ).toHaveCount(0);
});

test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
        throw error;
    });
});

test('select, return, reset and submit a choice without typing', async ({
    page,
}) => {
    await page.goto(fixture);
    const submit = page.getByRole('button', { name: 'Periksa jawaban' });
    await expect(submit).toBeDisabled();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await page.getByRole('button', { name: 'Pilih 100', exact: true }).click();
    await expect(
        page.getByRole('button', { name: '100 sudah dipakai', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
    await page
        .getByRole('button', { name: 'Bagian 1: 100.', exact: false })
        .click();
    await expect(
        page.getByRole('button', { name: 'Pilih 100', exact: true }),
    ).toBeFocused();
    await expect(submit).toBeDisabled();
    await page.getByRole('button', { name: 'Pilih True', exact: true }).click();
    await page.getByRole('button', { name: 'Atur ulang' }).click();
    await expect(
        page.getByRole('button', { name: 'Pilih bagian kosong 1' }),
    ).toHaveText('...');
    await page.getByRole('button', { name: 'Pilih 100', exact: true }).click();
    await submit.click();
    await expect(page.getByTestId('submitted')).toHaveText('{"blank-1":"100"}');
    await page.getByRole('button', { name: 'Materi berikutnya' }).click();
    await expect(submit).toBeDisabled();
    await expect(
        page.getByRole('button', { name: 'Pilih bagian kosong 1' }),
    ).toHaveText('...');
});

test('auto advance, choose a target, repeated tokens and text fallback', async ({
    page,
}) => {
    await page.goto(`${fixture}?multiple`);
    await page.getByRole('button', { name: 'Pilih bagian kosong 2' }).click();
    await page
        .getByRole('button', { name: 'Pilih False', exact: true })
        .click();
    await expect(
        page.getByRole('button', { name: 'Bagian 2: False.' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Pilih True', exact: true }).click();
    await expect(
        page.getByRole('button', { name: 'Bagian 1: True.' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Atur ulang' }).click();
    await page
        .getByRole('button', { name: 'Pilih 100', exact: true })
        .first()
        .click();
    await page.getByRole('button', { name: 'Pilih 100', exact: true }).click();
    await expect(
        page.getByRole('button', { name: '100 sudah dipakai', exact: true }),
    ).toHaveCount(2);
    await page
        .getByRole('textbox', { name: 'Isi bagian kosong 3' })
        .fill('"Zen"');
    await page.getByRole('button', { name: 'Periksa jawaban' }).click();
    await expect(page.getByTestId('submitted')).toHaveText(
        '{"blank-1":"100","blank-2":"100","blank-3":"\\"Zen\\""}',
    );
});

test('keyboard, pending lock and mobile layout', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(fixture);
    const token = page.getByRole('button', { name: 'Pilih 100', exact: true });
    await token.focus();
    await page.keyboard.press('Enter');
    const slot = page.getByRole('button', { name: 'Bagian 1: 100.' });
    await expect(slot).toHaveText('100');
    await page.getByRole('button', { name: 'Ubah pending' }).click();
    await expect(slot).toBeDisabled();
    await page.getByRole('button', { name: 'Pilih True', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(slot).toHaveText('100');
    await expect(
        page.getByRole('button', { name: 'Memeriksa...' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Ubah pending' }).click();
    await expect(
        page.getByRole('button', { name: 'Periksa jawaban' }),
    ).toBeEnabled();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('mobile.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
        path: testInfo.outputPath('desktop.png'),
        fullPage: true,
    });
});
