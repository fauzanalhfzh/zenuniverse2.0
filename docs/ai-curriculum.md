# AI untuk Pemula

Modul gratis tanpa prasyarat Python, berisi dua unit, delapan pelajaran, dan 72 langkah. Setiap pelajaran menyelingi tiga penjelasan dengan tiga kuis, lalu ditutup flash card, matching pairs, dan unjumble. Kuis menggunakan skenario yang dapat dinilai server tanpa memanggil layanan AI eksternal.

1. Mengenal AI dalam Kehidupan Sehari-hari
2. Dari Data ke Model
3. AI Generatif dan Batas Jawabannya
4. Menguji Kualitas dan Mengenali Bias
5. Menulis Prompt yang Jelas
6. Memberi Contoh dan Memperbaiki Prompt
7. Memeriksa Fakta dan Menjaga Privasi
8. Proyek Mini: Asisten Ringkasan Belajar

Setiap kuis, matching pairs, dan unjumble memberikan 5 XP. Flash card adalah ulasan tanpa XP dan tanpa pengurangan heart; semua kartu perlu dibuka. Penyelesaian pelajaran memberikan 25 XP. Modul tidak membuat akun AI, mengirim prompt ke penyedia AI, atau mengharuskan API berbayar. Proyek akhir memakai catatan fiktif serta draf ringkasan yang harus diperiksa.

Materi ditulis dalam `scripts/add-ai-content.mts`, lalu digabungkan ke dump privat dengan `node --import ./scripts/register-ts.mjs scripts/add-ai-content.mts`. Metadata checksum diperbarui. Jangan mengimpor sumber atau dump tersebut ke frontend karena memuat kunci jawaban.

Untuk instalasi yang sudah berjalan, `php artisan db:seed --class=AiCurriculumSeeder --force` membuat kursus draft dan memublikasikannya melalui `CoursePublisher` dengan admin yang sudah ada. Tidak mengubah kursus lain. Pengulangan tanpa perubahan tidak membuat rilis baru; draft tertunda atau perubahan lokal ditolak.

Referensi konsep:

- [Google: What is Machine Learning?](https://developers.google.com/machine-learning/intro-to-ml/what-is-ml)
- [Google: Supervised Learning](https://developers.google.com/machine-learning/intro-to-ml/supervised)
- [Google: Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course/)
- [NIST: Generative Artificial Intelligence Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [UNESCO: Guidance for generative AI in education and research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=802)

Latihan tambahan ditulis dalam `scripts/add-ai-activities.mts`. Jalankan dengan loader Node yang sama, kemudian publikasikan melalui `php artisan db:seed --class=AiActivitiesSeeder --force`. Seeder hanya menambahkan latihan ke pelajaran yang ada, menjaga perubahan materi lokal dan progres lama. Draft tertunda atau konflik isi latihan menghentikan publikasi. ID token dan pasangan pada payload publik bersifat opaque; kunci jawaban hanya tersedia di server.
