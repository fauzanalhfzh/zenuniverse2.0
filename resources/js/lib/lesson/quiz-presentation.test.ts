import assert from 'node:assert/strict';
import { test } from 'node:test';
import { quizPresentation } from './quiz-presentation';

void test('authored code preserves indentation and question without inference', () => {
    const code = 'nilai = 75\nif nilai >= 60:\n    print("Lulus")';
    assert.deepEqual(
        quizPresentation('Apa output kode berikut?', 'python', code),
        { question: 'Apa output kode berikut?', code },
    );
});

void test('separates sequential assignments without changing their order', () => {
    assert.deepEqual(
        quizPresentation(
            'Apa nilai akhir score setelah score = 10 lalu score = 20?',
            'python',
        ),
        {
            question: 'Apa nilai akhir score setelah kode berikut dijalankan?',
            code: 'score = 10\nscore = 20',
        },
    );
});

void test('keeps Python snippets intact when extracting context, strings and output', () => {
    for (const [question, code] of [
        [
            'Pada total = score + bonus, apa yang disimpan dalam total?',
            'total = score + bonus',
        ],
        ['Pada score = 50, manakah nama variabelnya?', 'score = 50'],
        ['Apa output dari print("Halo, Zen!")?', 'print("Halo, Zen!")'],
        ['Apa tipe data dari "Python"?', '"Python"'],
        ['Berapa hasil 10 - 4?', '10 - 4'],
        ['Berapa kali isi for i in range(3) dijalankan?', 'for i in range(3):'],
        ['Apa nilai pertama dari range(4)?', 'range(4)'],
    ])
        assert.equal(quizPresentation(question, 'python').code, code);
});

void test('leaves conceptual questions, ambiguous prose and other courses unchanged', () => {
    for (const question of [
        'Apa kegunaan variabel?',
        'Apa nilai akhir score setelah pengguna memasukkan angka?',
        'Pada layar awal, manakah nama variabelnya?',
        'Apa tipe data dari sebuah nama pengguna?',
    ])
        assert.deepEqual(quizPresentation(question, 'python'), {
            question,
            code: null,
        });
    const question = 'Apa output dari print(7)?';
    assert.deepEqual(quizPresentation(question), { question, code: null });
    assert.deepEqual(quizPresentation(undefined, 'python'), {
        question: 'Cek pemahaman',
        code: null,
    });
});
