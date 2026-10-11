import { readFileSync, writeFileSync } from 'node:fs';
import {
    assertUniqueIds,
    summarize,
    type ContentDump,
    type ExportedStep,
} from './export-content.mts';

type Topic = { pairs: [string, string][]; sentence: string[] };
const topics: Topic[] = [
    {
        pairs: [
            ['AI', 'Sistem yang melakukan tugas seperti mengenali pola'],
            ['Aturan tetap', 'Instruksi eksplisit yang ditulis manusia'],
            ['Prediksi', 'Perkiraan berdasarkan pola dalam data'],
        ],
        sentence: [
            'AI',
            'mengenali pola',
            'dalam data',
            'untuk membuat',
            'prediksi.',
        ],
    },
    {
        pairs: [
            ['Data latih', 'Contoh yang digunakan untuk mempelajari pola'],
            ['Label', 'Keterangan target pada sebuah contoh'],
            ['Data uji', 'Contoh terpisah untuk menilai hasil model'],
        ],
        sentence: [
            'Pisahkan',
            'data uji',
            'dari data latih',
            'sebelum',
            'menilai model.',
        ],
    },
    {
        pairs: [
            [
                'AI generatif',
                'Menghasilkan konten baru berdasarkan pola yang dipelajari',
            ],
            ['Draf', 'Hasil awal yang masih perlu diperiksa'],
            [
                'Halusinasi',
                'Respons yang meyakinkan tetapi keliru atau tidak berdasar',
            ],
        ],
        sentence: [
            'Jawaban AI',
            'dapat terdengar meyakinkan',
            'meskipun keliru,',
            'jadi',
            'periksa faktanya.',
        ],
    },
    {
        pairs: [
            ['Data uji', 'Contoh terpisah untuk menilai hasil model'],
            [
                'Bias',
                'Kecenderungan hasil yang dapat merugikan kelompok tertentu',
            ],
            [
                'Evaluasi',
                'Pengukuran hasil model dengan kriteria yang ditetapkan',
            ],
        ],
        sentence: [
            'Uji model',
            'pada contoh beragam,',
            'bandingkan hasilnya,',
            'lalu',
            'periksa potensi bias.',
        ],
    },
    {
        pairs: [
            ['Tujuan', 'Tugas yang ingin diselesaikan oleh AI'],
            [
                'Konteks prompt',
                'Latar belakang yang membantu menjelaskan tugas',
            ],
            ['Format keluaran', 'Bentuk jawaban yang diminta, seperti tabel'],
        ],
        sentence: [
            'Jelaskan tujuan,',
            'berikan konteks,',
            'tentukan format,',
            'lalu',
            'tinjau respons.',
        ],
    },
    {
        pairs: [
            ['Contoh keluaran', 'Contoh bentuk jawaban yang diinginkan'],
            ['Umpan balik', 'Penjelasan bagian respons yang perlu diperbaiki'],
            [
                'Revisi prompt',
                'Perubahan instruksi agar tugas menjadi lebih jelas',
            ],
        ],
        sentence: [
            'Tinjau respons,',
            'sebutkan kekurangannya,',
            'perbaiki prompt,',
            'lalu',
            'coba kembali.',
        ],
    },
    {
        pairs: [
            ['Data pribadi', 'Informasi yang dapat mengidentifikasi seseorang'],
            [
                'Verifikasi',
                'Memeriksa klaim dengan sumber yang dapat dipercaya',
            ],
            [
                'Sumber primer',
                'Dokumen atau bukti asli yang mendukung sebuah klaim',
            ],
        ],
        sentence: [
            'Hapus',
            'data pribadi',
            'sebelum mengirim prompt',
            'dan',
            'tinjau hasil AI.',
        ],
    },
    {
        pairs: [
            ['Bahan sumber', 'Teks asli yang menjadi dasar ringkasan'],
            ['Draf AI', 'Hasil awal yang masih perlu ditinjau'],
            [
                'Ringkasan terverifikasi',
                'Ringkasan yang telah dicocokkan dengan bahan sumber',
            ],
        ],
        sentence: [
            'Baca bahan sumber,',
            'minta draf ringkasan,',
            'cocokkan fakta,',
            'lalu',
            'tulis hasil akhir.',
        ],
    },
];

const path = new URL(
    '../database/seeders/data/content-dump.json',
    import.meta.url,
);
const dump: ContentDump = JSON.parse(readFileSync(path, 'utf8'));
const course = dump.courses.find((course) => course.id === 'ai-fundamentals');
if (!course) throw new Error('Tambahkan modul AI terlebih dahulu.');
const lessons = course.units.flatMap((unit) => unit.lessons);
if (lessons.length !== topics.length)
    throw new Error('Jumlah pelajaran AI berubah.');
lessons.forEach((lesson, index) => {
    const topic = topics[index];
    const steps: ExportedStep[] = [
        {
            id: `${lesson.id}-flashcard`,
            type: 'flashcard',
            reward: { xp: 0 },
            content: {
                title: 'Ingat kembali istilah penting',
                instructions:
                    'Pikirkan arti istilah di setiap kartu, lalu buka jawabannya. Ulas semua kartu untuk melanjutkan.',
                cards: topic.pairs.map(([front, back], i) => ({
                    id: `card-${i + 1}`,
                    front,
                    back,
                })),
            },
        },
        {
            id: `${lesson.id}-matching`,
            type: 'matching',
            reward: { xp: 5 },
            content: {
                title: 'Pasangkan istilah dan artinya',
                instructions:
                    'Pilih satu istilah di kiri, lalu pilih arti yang sesuai di kanan.',
                left: topic.pairs.map(([label], i) => ({
                    id: `term-${i + 1}`,
                    label,
                })),
                right: topic.pairs.map(([, label], i) => ({
                    id: `meaning-${i + 1}`,
                    label,
                })),
            },
            validation: {
                pairs: Object.fromEntries(
                    topic.pairs.map((_, i) => [
                        `term-${i + 1}`,
                        `meaning-${i + 1}`,
                    ]),
                ),
            },
        },
        {
            id: `${lesson.id}-unjumble`,
            type: 'unjumble',
            reward: { xp: 5 },
            content: {
                title: 'Susun gagasan utama',
                instructions:
                    'Klik potongan teks untuk menyusun kalimat yang utuh. Klik potongan di kotak jawaban untuk mengembalikannya.',
                tokens: topic.sentence.map((label, i) => ({
                    id: `piece-${i + 1}`,
                    label,
                })),
            },
            validation: {
                correctOrder: topic.sentence.map((_, i) => `piece-${i + 1}`),
            },
        },
    ];
    for (const step of steps) {
        const existing = lesson.steps.find((item) => item.id === step.id);
        if (existing && JSON.stringify(existing) !== JSON.stringify(step))
            throw new Error(`Latihan ${step.id} memiliki perubahan lokal.`);
        if (!existing) lesson.steps.push(step);
    }
});
assertUniqueIds(dump.courses);
writeFileSync(path, JSON.stringify(dump, null, 2) + '\n');
writeFileSync(
    new URL('../database/seeders/data/content-dump.meta.json', import.meta.url),
    JSON.stringify(summarize(dump), null, 2) + '\n',
);
console.log(
    'AI: 8 flash card, 8 matching pairs, 8 unjumble; total 72 langkah.',
);
