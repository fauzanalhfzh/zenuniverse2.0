# Tambahan materi Python

Kursus `python-fundamentals` memiliki 22 pelajaran. Pelajaran 1–10 dipertahankan; pelajaran 11–22 menambah 96 langkah di empat unit baru.

| Unit                                | Pelajaran                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Input dan Pengolahan Teks           | Membaca Input dan Mengubah Tipe; Menyusun Pesan dengan f-string; Mengolah Teks dan Mengambil Bagiannya    |
| Kontrol Alur Lanjutan               | Menggabungkan Kondisi; Memilih Banyak Cabang dengan elif; Mengendalikan Loop dengan break dan continue    |
| Koleksi Data Python                 | Menambah, Menghapus, dan Menelusuri List; Menyimpan Pasangan Data dalam Dictionary; Memilih Tuple dan Set |
| Fungsi dan Program yang Tahan Error | Mengembalikan Hasil dari Fungsi; Menangani Input Tidak Valid; Proyek Mini: Ringkasan Belanja              |

Setiap pelajaran baru memiliki tiga bagian penjelasan beserta contoh kode, tiga kuis dengan penjelasan jawaban, dan dua latihan lengkapi kode menggunakan pilihan token. Urutannya menyelingi penjelasan dengan latihan. Hadiah penyelesaian pelajaran adalah 25 XP; setiap kuis dan latihan memiliki hadiah 5 XP.

Potongan kode kuis disimpan pada `content.code` dengan `content.language = python`, terpisah dari `content.question`. Form CMS menyediakan kolom untuk keduanya. Kunci kuis, accepted answers, dan penjelasan evaluasi tidak disertakan dalam payload publik. Server memverifikasi pilihan dan isian; kode peserta tidak dieksekusi.

Sumber materi tambahan ada dalam `scripts/extend-python-content.mts`. Jalankan dengan `node --import ./scripts/register-ts.mjs scripts/extend-python-content.mts` untuk menghasilkan tambahan pada dump dan metadata. Generator berhenti jika unit tambahan sudah memiliki perubahan berbeda. Jangan mengimpor berkas ini ke frontend karena memuat kunci jawaban.

Untuk memasukkan tambahan ke instalasi yang sudah memiliki kursus Python, gunakan `php artisan db:seed --class=PythonCurriculumSeeder --force`. Seeder menambahkan empat unit melalui `CoursePublisher`, mempertahankan metadata dan materi lama, menolak draft tertunda serta perubahan lokal pada unit tambahan, dan tidak membuat rilis baru ketika dijalankan ulang tanpa perubahan. Seeder membutuhkan kursus yang sudah dipublikasikan dan admin yang sudah ada.
