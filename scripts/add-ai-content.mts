import { readFileSync, writeFileSync } from 'node:fs';
import {
    assertUniqueIds,
    summarize,
    type ContentDump,
    type ExportedCourse,
    type ExportedStep,
} from './export-content.mts';

type Concept = [title: string, body: string];
type Quiz = [question: string, options: string[], explanation: string];
type Lesson = {
    title: string;
    description: string;
    concepts: Concept[];
    quizzes: Quiz[];
};
const lessons: Lesson[] = [
    {
        title: 'Mengenal AI dalam Kehidupan Sehari-hari',
        description:
            'Membedakan AI, machine learning, dan aturan program biasa.',
        concepts: [
            [
                'AI adalah bidang, bukan satu aplikasi',
                'Kecerdasan buatan atau AI adalah bidang yang membangun sistem untuk tugas seperti mengenali pola, membuat prediksi, dan menghasilkan konten. Contohnya penyaring spam dan pengenal suara. Tidak semua AI berbentuk chatbot, dan sistem yang tampak pintar tetap memiliki batas sesuai rancangan serta datanya.',
            ],
            [
                'Machine learning belajar pola dari data',
                'Machine learning adalah bagian dari AI. Model dilatih menggunakan contoh untuk mempelajari pola yang membantu membuat prediksi pada masukan baru. Program berbasis aturan, seperti diskon tetap jika belanja melewati batas, bisa dibuat tanpa machine learning. Pilih pendekatan berdasarkan tugas, bukan karena nama AI terdengar menarik.',
            ],
            [
                'Tentukan tugas sebelum memilih alat',
                'Bayangkan kamu mengelompokkan email spam. Tugasnya ialah memberi label spam atau bukan spam berdasarkan isi pesan. Berbeda dengan itu, kalkulator perkalian cukup mengikuti operasi yang sudah jelas. AI tidak selalu diperlukan, terutama jika aturan sederhana sudah akurat dan mudah diperiksa.',
            ],
        ],
        quizzes: [
            [
                'Contoh mana yang menggunakan pola dari data untuk membuat prediksi?',
                [
                    'Model mengenali email spam dari contoh berlabel',
                    'Kalkulator menghitung 2 × 3',
                    'Timer berbunyi setelah 10 menit',
                    'Tombol mengganti tema sesuai pilihan',
                ],
                'Model penyaring spam dapat dilatih dengan contoh pesan. Tiga pilihan lain dapat memakai aturan tetap.',
            ],
            [
                'Apa hubungan machine learning dengan AI?',
                [
                    'Machine learning merupakan bagian dari AI',
                    'AI hanya nama lain chatbot',
                    'Semua program adalah machine learning',
                    'Machine learning tidak membutuhkan data',
                ],
                'AI adalah bidang yang lebih luas; machine learning merupakan salah satu pendekatannya.',
            ],
            [
                'Toko memberi diskon 10% jika total belanja minimal Rp100.000. Pendekatan awal yang sesuai?',
                [
                    'Gunakan aturan kondisi yang jelas',
                    'Wajib melatih model besar',
                    'Minta AI menebak diskon setiap saat',
                    'Acak diskon tanpa melihat total',
                ],
                'Aturan diskon sudah pasti dan dapat diterapkan langsung dengan kondisi program.',
            ],
        ],
    },
    {
        title: 'Dari Data ke Model',
        description:
            'Memahami fitur, label, pelatihan, dan inferensi melalui contoh sederhana.',
        concepts: [
            [
                'Contoh berlabel mengajarkan hubungan',
                'Dalam supervised learning, fitur adalah informasi masukan dan label adalah hasil yang ingin diprediksi. Untuk penyaring spam, fitur bisa berasal dari isi pesan dan labelnya spam atau bukan spam. Kualitas label penting: contoh yang salah diberi label dapat mengajarkan pola yang keliru.',
            ],
            [
                'Training berbeda dari inferensi',
                'Training atau pelatihan menyesuaikan model dengan data contoh. Inferensi menggunakan model untuk memprediksi masukan baru. Membaca satu prediksi tidak berarti model dilatih ulang saat itu. Cara layanan menyimpan percakapan atau memakai data untuk pelatihan bergantung pada kebijakan dan pengaturannya.',
            ],
            [
                'Data harus sesuai dengan penggunaan',
                'Model yang hanya melihat foto kucing dalam ruangan mungkin kesulitan mengenali kucing di luar ruangan. Kumpulkan contoh yang mewakili keadaan penggunaan dan pisahkan data evaluasi dari data latihan. Lebih banyak data tidak otomatis lebih baik jika isinya salah, berulang, atau tidak relevan.',
            ],
        ],
        quizzes: [
            [
                'Pada data pesan dengan kategori spam atau bukan spam, kategorinya disebut apa?',
                ['Label', 'Prompt', 'Token', 'Parameter input pengguna'],
                'Label adalah jawaban target yang dipakai dalam supervised learning.',
            ],
            [
                'Model yang sudah dilatih memprediksi kategori pesan baru. Tahap apa ini?',
                [
                    'Inferensi',
                    'Pelabelan ulang seluruh dataset',
                    'Training dari awal',
                    'Menghapus fitur',
                ],
                'Inferensi menggunakan model untuk memproses masukan baru.',
            ],
            [
                'Model pengenal kucing dilatih hanya dengan foto terang. Apa perbaikan yang masuk akal untuk penggunaan malam hari?',
                [
                    'Tambahkan contoh relevan dan uji dengan foto gelap yang terpisah',
                    'Anggap semua foto gelap pasti kucing',
                    'Uji hanya foto yang sudah dihafal model',
                    'Hilangkan seluruh label',
                ],
                'Contoh relevan membantu, sementara data evaluasi terpisah menunjukkan kinerja pada keadaan yang dituju.',
            ],
        ],
    },
    {
        title: 'AI Generatif dan Batas Jawabannya',
        description:
            'Memahami pembuatan konten, konteks, dan jawaban yang tampak benar tetapi keliru.',
        concepts: [
            [
                'Menghasilkan konten berbeda dari mencari fakta',
                'AI generatif dapat membuat teks, gambar, atau konten lain dari pola yang dipelajari. Model bahasa menghasilkan kelanjutan teks berdasarkan konteks. Jawaban yang lancar tidak membuktikan bahwa informasinya benar. Kemampuan mencari web, membaca dokumen, atau menjalankan alat harus tersedia pada layanan yang dipakai.',
            ],
            [
                'Jawaban bisa meyakinkan tetapi salah',
                'AI dapat menghasilkan nama sumber, kutipan, atau angka yang tidak sesuai kenyataan. Kejadian ini sering disebut halusinasi atau konfabulasi. Meminta jawaban lebih yakin tidak memperbaiki bukti. Untuk klaim faktual, buka sumber aslinya dan periksa apakah sumber tersebut benar-benar mendukung jawaban.',
            ],
            [
                'Konteks memiliki batas',
                'Konteks adalah informasi yang tersedia saat model merespons, seperti instruksi dan potongan dokumen yang diberikan. Layanan memiliki batas jumlah informasi yang dapat diproses sekaligus. Jangan berasumsi AI selalu mengingat semua percakapan, memiliki akses internet, atau mengetahui kejadian terbaru.',
            ],
        ],
        quizzes: [
            [
                'AI memberi jawaban rapi beserta judul artikel. Apa yang perlu dilakukan sebelum mengutipnya?',
                [
                    'Buka artikel asli dan cocokkan klaimnya',
                    'Percaya karena bahasanya meyakinkan',
                    'Anggap judul yang diberikan pasti ada',
                    'Hapus sumber agar tidak perlu diperiksa',
                ],
                'Sumber bisa keliru atau tidak mendukung klaim. Bukti harus diperiksa langsung.',
            ],
            [
                'Apa contoh halusinasi AI?',
                [
                    'Menyebut penelitian yang ternyata tidak ada',
                    'Mengatakan belum memiliki informasi cukup',
                    'Meminta dokumen sumber',
                    'Menyajikan kutipan yang cocok dengan sumber asli',
                ],
                'Membuat referensi yang tidak ada adalah contoh informasi keliru yang tampak faktual.',
            ],
            [
                'Tanpa fitur pencarian atau dokumen tambahan, apa asumsi yang aman?',
                [
                    'AI belum tentu dapat memeriksa informasi terbaru',
                    'AI pasti terhubung ke semua website',
                    'Semua jawaban otomatis merupakan fakta terbaru',
                    'AI mengetahui semua file di komputer',
                ],
                'Akses informasi bergantung pada fitur dan konteks yang tersedia, bukan pada kelancaran jawaban.',
            ],
        ],
    },
    {
        title: 'Menguji Kualitas dan Mengenali Bias',
        description:
            'Menilai hasil dengan contoh baru dan melihat kesalahan pada kelompok yang berbeda.',
        concepts: [
            [
                'Uji dengan contoh yang belum dipakai latihan',
                'Model dapat bekerja baik pada contoh latihan tetapi buruk pada contoh baru. Kondisi ini disebut overfitting. Gunakan data evaluasi terpisah yang mewakili penggunaan sebenarnya. Jika ada data validasi untuk memilih pengaturan model, simpan data tes akhir untuk penilaian akhir, bukan untuk penyesuaian berulang.',
            ],
            [
                'Angka akurasi saja bisa menyesatkan',
                'Jika 95 dari 100 pesan bukan spam, sistem yang selalu menjawab bukan spam mendapat akurasi 95%, tetapi melewatkan semua spam. Periksa jenis kesalahan yang penting untuk tugasmu. Dalam contoh ini, hitung juga berapa spam yang terlewat dan pesan normal yang salah diblokir.',
            ],
            [
                'Periksa hasil pada kelompok yang relevan',
                'Data yang tidak mewakili pengguna dapat menghasilkan kinerja yang berbeda antar kelompok atau kondisi. Contohnya pengenal suara yang lebih sering salah pada aksen tertentu. Bandingkan hasil evaluasi, cari penyebab, dan perbaiki data serta prosesnya. Menghapus satu kolom sensitif saja tidak menjamin bias hilang.',
            ],
        ],
        quizzes: [
            [
                'Model menghafal latihan tetapi sering salah pada contoh baru. Masalah apa yang mungkin terjadi?',
                [
                    'Overfitting',
                    'Inferensi yang selalu sempurna',
                    'Tidak adanya konteks prompt',
                    'Semua label pasti benar',
                ],
                'Overfitting berarti model terlalu menyesuaikan pola latihan sehingga generalisasi pada contoh baru buruk.',
            ],
            [
                '95% pesan bukan spam. Model selalu menebak bukan spam. Mengapa akurasi 95% belum cukup?',
                [
                    'Semua pesan spam masih terlewat',
                    'Model sudah mengenali setiap spam',
                    'Akurasi tinggi berarti tidak ada kesalahan',
                    'Jumlah pesan tidak berpengaruh pada evaluasi',
                ],
                'Akurasi keseluruhan menyembunyikan kegagalan pada kategori spam yang jumlahnya lebih sedikit.',
            ],
            [
                'Pengenal suara sering salah pada satu aksen. Apa langkah evaluasi yang tepat?',
                [
                    'Bandingkan hasil per aksen dengan data uji yang mewakili pengguna',
                    'Abaikan pengguna dengan aksen tersebut',
                    'Anggap satu angka rata-rata sudah cukup',
                    'Ganti nama model tanpa menguji ulang',
                ],
                'Evaluasi per kelompok membantu menemukan kesenjangan yang tidak tampak pada nilai rata-rata.',
            ],
        ],
    },
    {
        title: 'Menulis Prompt yang Jelas',
        description:
            'Menyampaikan tujuan, konteks, batasan, dan bentuk jawaban yang dibutuhkan.',
        concepts: [
            [
                'Mulai dari tujuan yang dapat diperiksa',
                'Prompt adalah masukan atau instruksi kepada model. Tulis tugas yang jelas, misalnya ringkas teks menjadi tiga poin, bukan sekadar buat bagus. Tentukan siapa pembacanya dan informasi apa yang harus dipertahankan. Kejelasan membantu menilai apakah jawaban memenuhi kebutuhan.',
            ],
            [
                'Sertakan konteks dan batasan',
                'Jika meminta ringkasan, berikan teks sumber. Jika meminta penjelasan untuk pemula, sebutkan tingkat pembacanya. Batasan seperti gunakan hanya teks ini atau maksimal tiga poin memperjelas tugas, tetapi model tetap dapat gagal mengikutinya. Instruksi yang baik membantu; ia tidak menjamin fakta atau format selalu benar.',
            ],
            [
                'Tentukan format keluaran',
                'Sebutkan apakah hasil perlu berbentuk daftar, tabel, atau paragraf. Contoh prompt: Ringkas teks berikut menjadi tiga poin untuk siswa SMP. Gunakan hanya informasi dalam teks. Jika informasi tidak tersedia, tulis tidak disebutkan. Lalu tempelkan teks sumber dengan penanda yang jelas.',
            ],
        ],
        quizzes: [
            [
                'Prompt mana yang paling jelas untuk merangkum bahan belajar?',
                [
                    'Ringkas teks berikut menjadi tiga poin untuk pemula; gunakan hanya teks sumber',
                    'Buat bagus',
                    'Jelaskan semuanya',
                    'Tulis sesuatu yang pasti benar',
                ],
                'Prompt tersebut menyebut tugas, pembaca, batas informasi, dan bentuk hasil.',
            ],
            [
                'Kamu meminta ringkasan suatu artikel. Konteks apa yang paling dibutuhkan?',
                [
                    'Isi artikel yang akan diringkas',
                    'Kata sandi akun pembaca',
                    'Nomor telepon seluruh siswa',
                    'Perintah agar AI selalu yakin',
                ],
                'Ringkasan perlu sumber yang akan diringkas, bukan data pribadi yang tidak relevan.',
            ],
            [
                'Setelah meminta maksimal tiga poin, model memberi enam. Apa yang tepat dilakukan?',
                [
                    'Periksa dan minta revisi sesuai batas tiga poin',
                    'Anggap format pasti sudah benar',
                    'Hapus instruksi awal agar makin tidak jelas',
                    'Publikasikan tanpa membaca hasil',
                ],
                'Format keluaran tetap harus diperiksa dan dapat diperbaiki dengan instruksi revisi yang spesifik.',
            ],
        ],
    },
    {
        title: 'Memberi Contoh dan Memperbaiki Prompt',
        description:
            'Menggunakan contoh keluaran, memecah tugas, dan melakukan revisi terarah.',
        concepts: [
            [
                'Contoh membantu menunjukkan pola keluaran',
                'Berikan satu atau beberapa contoh bila format sulit dijelaskan. Misalnya contoh label kategori untuk dua kalimat, lalu minta model memberi label kalimat baru. Ini sering disebut few-shot prompting. Contoh di dalam prompt tidak sama dengan melatih ulang parameter model.',
            ],
            [
                'Pisahkan pekerjaan yang terlalu besar',
                'Alih-alih meminta seluruh laporan sekaligus, mulai dari kerangka, periksa cakupannya, lalu minta draf per bagian. Cara ini membuat kesalahan lebih mudah ditemukan. Pada tugas faktual, setiap tahap tetap memerlukan sumber yang sesuai; membagi tugas tidak otomatis membuat hasil benar.',
            ],
            [
                'Ubah bagian yang jelas belum sesuai',
                'Revisi yang berguna menyebut masalah tertentu: ringkasan melewatkan tanggal, bahasanya terlalu sulit, atau ada klaim yang tidak muncul di sumber. Pertahankan bagian yang sudah sesuai dan minta perbaikan terbatas. Bandingkan beberapa prompt pada contoh tugas yang sama agar penilaian tidak hanya berdasarkan selera.',
            ],
        ],
        quizzes: [
            [
                'Apa tujuan memberi contoh keluaran dalam prompt?',
                [
                    'Memperjelas pola atau format yang diinginkan',
                    'Menjamin semua fakta benar',
                    'Melatih ulang seluruh parameter model secara otomatis',
                    'Memberi akses ke seluruh internet',
                ],
                'Contoh menunjukkan pola respons yang diharapkan; itu tidak menjamin kebenaran atau melatih ulang model.',
            ],
            [
                'Tugas membuat panduan panjang sulit diperiksa. Langkah awal yang lebih mudah dinilai?',
                [
                    'Minta kerangka dan periksa cakupannya dahulu',
                    'Minta teks sepanjang mungkin tanpa batas',
                    'Lewati tujuan pembaca',
                    'Terima draf pertama tanpa membaca',
                ],
                'Kerangka yang diperiksa lebih dulu membantu membagi pekerjaan dan menemukan bagian yang kurang.',
            ],
            [
                'Ringkasan melewatkan tanggal yang ada di sumber. Revisi mana yang paling terarah?',
                [
                    'Tambahkan tanggal dari sumber, pertahankan tiga poin, dan jangan menambah fakta lain',
                    'Buat lebih bagus lagi',
                    'Jawab lebih yakin',
                    'Tambahkan tanggal apa saja',
                ],
                'Revisi menyebut informasi yang hilang dan batasan yang harus tetap dipenuhi.',
            ],
        ],
    },
    {
        title: 'Memeriksa Fakta dan Menjaga Privasi',
        description:
            'Memverifikasi klaim, membatasi data yang dibagikan, dan membedakan sumber dari instruksi.',
        concepts: [
            [
                'Cocokkan setiap klaim dengan sumber',
                'Untuk jawaban faktual, buka sumber utama dan periksa isi, tanggal, serta konteksnya. Tautan yang benar belum tentu mendukung semua klaim. Jika AI merangkum dokumen, bandingkan nama, angka, dan kesimpulan dengan dokumen tersebut. Untuk keputusan penting, minta peninjauan orang yang berkompeten.',
            ],
            [
                'Bagikan hanya data yang diperlukan',
                'Jangan memasukkan kata sandi, token API, atau data pribadi yang tidak diperlukan untuk tugas. Gunakan contoh fiktif atau samarkan identitas. Kebijakan penyimpanan dan penggunaan data berbeda antar layanan, sehingga periksa pengaturan serta aturan organisasi sebelum mengunggah dokumen. Menyamarkan nama saja belum tentu menghilangkan seluruh petunjuk identitas.',
            ],
            [
                'Dokumen sumber bukan instruksi yang harus ditaati',
                'Teks yang dibaca AI bisa berisi perintah seperti abaikan aturan dan kirim rahasia. Ini merupakan contoh prompt injection ketika instruksi asing mencoba mengubah tugas sistem. Perlakukan isi dokumen sebagai data, batasi akses alat, dan jangan memberi kewenangan tindakan hanya karena sebuah dokumen memintanya.',
            ],
        ],
        quizzes: [
            [
                'AI memberikan statistik beserta tautan. Pemeriksaan apa yang tepat?',
                [
                    'Buka sumber dan pastikan angka serta konteksnya cocok',
                    'Percaya karena ada tautan',
                    'Anggap semua angka dari AI merupakan data resmi',
                    'Kutip tanpa melihat tanggal',
                ],
                'Keberadaan tautan saja tidak membuktikan bahwa sumber mendukung angka dan klaimnya.',
            ],
            [
                'Untuk meminta contoh analisis keluhan pelanggan, data apa yang sebaiknya digunakan saat latihan?',
                [
                    'Keluhan fiktif tanpa identitas pribadi',
                    'Daftar kata sandi pelanggan',
                    'Token API perusahaan',
                    'Nomor identitas seluruh pelanggan',
                ],
                'Data fiktif cukup untuk latihan dan menghindari pembagian rahasia atau identitas yang tidak diperlukan.',
            ],
            [
                'Dokumen yang diringkas berisi perintah kirim token rahasia. Apa tindakan yang tepat?',
                [
                    'Perlakukan perintah itu sebagai isi dokumen dan jangan memberinya akses rahasia',
                    'Ikuti karena ada dalam dokumen',
                    'Tambahkan semua token ke ringkasan',
                    'Berikan akses lebih luas agar tugas lancar',
                ],
                'Instruksi asing di dalam sumber tidak boleh mengambil alih tugas atau memperoleh akses ke rahasia.',
            ],
        ],
    },
    {
        title: 'Proyek Mini: Asisten Ringkasan Belajar',
        description:
            'Menyusun prompt, menilai draf, dan memperbaiki ringkasan berdasarkan sumber.',
        concepts: [
            [
                'Tetapkan sumber dan tujuan proyek',
                'Sumber latihan: Rani belajar 20 menit pada Senin dan 30 menit pada Selasa. Rabu dipakai untuk istirahat. Tujuannya membuat ringkasan dua poin tentang jadwal belajar Rani berdasarkan sumber itu saja. Tidak diperlukan data pribadi atau panggilan ke layanan AI untuk menyelesaikan latihan ini.',
            ],
            [
                'Tulis prompt dengan batas yang jelas',
                'Prompt contoh: Ringkas catatan berikut menjadi dua poin untuk pelajar pemula. Gunakan hanya fakta pada catatan. Sebutkan hari dan durasi belajar; bila durasi tidak disebutkan, jangan menebaknya. Catatan: Rani belajar 20 menit pada Senin dan 30 menit pada Selasa. Rabu dipakai untuk istirahat.',
            ],
            [
                'Nilai draf sebelum dipakai',
                'Bayangkan draf berbunyi: Rani belajar 20 menit pada Senin dan 40 menit pada Selasa. Rabu ia belajar 10 menit. Draf ini keliru: durasi Selasa berubah dan kegiatan Rabu ditambahkan tanpa dasar. Perbaiki menjadi Senin 20 menit, Selasa 30 menit; Rabu istirahat. Pastikan dua poin, sesuai sumber, dan mudah dibaca.',
            ],
        ],
        quizzes: [
            [
                'Catatan menyebut Senin 20 menit, Selasa 30 menit, Rabu istirahat. Klaim mana yang didukung sumber?',
                [
                    'Rani belajar 30 menit pada Selasa',
                    'Rani belajar 40 menit pada Selasa',
                    'Rani belajar 10 menit pada Rabu',
                    'Rani belajar setiap hari tanpa istirahat',
                ],
                'Sumber secara jelas menyebut durasi Selasa 30 menit.',
            ],
            [
                'Draf menambahkan belajar 10 menit pada Rabu. Masalahnya apa?',
                [
                    'Draf menambah fakta yang tidak ada dan bertentangan dengan sumber',
                    'Draf terlalu setia pada sumber',
                    'Semua ringkasan boleh menambah durasi',
                    'Kata Rabu tidak boleh dipakai',
                ],
                'Sumber menyebut Rabu untuk istirahat dan tidak menyatakan belajar 10 menit.',
            ],
            [
                'Kapan ringkasan siap digunakan untuk tugas latihan ini?',
                [
                    'Setelah fakta cocok dengan sumber dan format dua poin terpenuhi',
                    'Begitu model selesai menjawab',
                    'Setelah semua sumber dihapus',
                    'Saat bahasanya terdengar yakin meski angka berbeda',
                ],
                'Kualitas diperiksa terhadap tujuan, batas format, dan sumber; bukan hanya kelancaran bahasanya.',
            ],
        ],
    },
];

const course: ExportedCourse = {
    id: 'ai-fundamentals',
    title: 'AI untuk Pemula',
    description:
        'Kenali cara kerja AI, tulis prompt yang jelas, dan periksa hasilnya melalui contoh serta latihan sehari-hari.',
    level: 'Pemula',
    accessTier: 'free',
    status: 'published',
    units: [
        [
            'Memahami AI',
            'Mengenal model, data, AI generatif, dan evaluasi hasil.',
        ],
        [
            'Menggunakan AI dengan Tepat',
            'Menulis prompt, memeriksa sumber, menjaga privasi, dan merangkum bahan belajar.',
        ],
    ].map(([title, description], group) => ({
        id: `ai-unit-${group + 1}`,
        title,
        description,
        lessons: lessons
            .slice(group * 4, group * 4 + 4)
            .map((lesson, index) => {
                const id = `ai-fundamentals-lesson-${String(group * 4 + index + 1).padStart(2, '0')}`;
                const steps: ExportedStep[] = lesson.concepts.flatMap(
                    ([title, body], i) => {
                        const [question, options, explanation] =
                            lesson.quizzes[i];
                        return [
                            {
                                id: `${id}-step-${i * 2 + 1}`,
                                type: 'concept',
                                reward: { xp: 0 },
                                content: { eyebrow: 'Belajar AI', title, body },
                            },
                            {
                                id: `${id}-step-${i * 2 + 2}`,
                                type: 'quiz',
                                reward: { xp: 5 },
                                content: {
                                    question,
                                    options: options.map((label, j) => ({
                                        id: `option-${j + 1}`,
                                        label,
                                    })),
                                    explanation,
                                },
                                validation: { correctOptionId: 'option-1' },
                            },
                        ];
                    },
                );
                return {
                    id,
                    title: lesson.title,
                    description: lesson.description,
                    completionRewardXp: 25,
                    steps,
                };
            }),
    })),
};

const path = new URL(
    '../database/seeders/data/content-dump.json',
    import.meta.url,
);
const dump: ContentDump = JSON.parse(readFileSync(path, 'utf8'));
const existing = dump.courses.find((item) => item.id === course.id);
const baseline = existing
    ? {
          ...existing,
          units: existing.units.map((unit) => ({
              ...unit,
              lessons: unit.lessons.map((lesson) => ({
                  ...lesson,
                  steps: lesson.steps.slice(0, 6),
              })),
          })),
      }
    : undefined;
if (baseline && JSON.stringify(baseline) !== JSON.stringify(course))
    throw new Error('Modul AI sudah memiliki perubahan lokal.');
if (!existing) dump.courses.push(course);
assertUniqueIds(dump.courses);
writeFileSync(path, JSON.stringify(dump, null, 2) + '\n');
writeFileSync(
    new URL('../database/seeders/data/content-dump.meta.json', import.meta.url),
    JSON.stringify(summarize(dump), null, 2) + '\n',
);
console.log('AI untuk Pemula: 8 pelajaran, 48 langkah, 24 kuis.');
