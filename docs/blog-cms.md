# Panduan operator Blog CMS

## Persiapan oleh operator deployment

CMS menggunakan tabel `blog_articles` dan menu **Blog** di `/admin/blog-articles`. Hanya akun admin (`is_admin`) yang dapat mengaksesnya; akun pelajar tidak mempunyai akses. Tidak ada artikel yang otomatis diimpor atau diterbitkan oleh deployment.

Perintah berikut **menulis database/storage**. Jalankan hanya di release yang benar setelah backup database dan persetujuan deployment, dengan konfigurasi koneksi yang sudah diverifikasi. Jangan memakai `migrate:fresh` pada database nyata.

```bash
php artisan migrate --path=database/migrations/2026_10_06_000001_create_blog_articles_table.php --force
# Jika public/storage belum ditautkan ke storage/app/public:
php artisan storage:link
# Opsional: impor tiga artikel contoh sebagai DRAF, bukan publikasi:
php artisan blog:import-demos
```

Import membaca `resources/content/blog.json`. Pada database baru dibuat tiga draf dengan `published_at = null`. Pengulangan melewati slug yang sudah ada, tidak menimpa judul, isi, status, atau perubahan editorial. Output melaporkan jumlah draf baru. Setelah import, periksa tiga artikel di menu Blog; publik tetap kosong sampai operator menerbitkan artikel.

PHP memerlukan ekstensi GD dengan dukungan JPEG, PNG dan WebP serta Fileinfo untuk validasi sampul. Disk `public` harus dapat ditulis oleh proses PHP. Pertahankan `storage/app/public` lintas release dan sertakan dalam backup. Server harus menyajikan upload sebagai file statis, **bukan mengeksekusi PHP** di `/storage`. Pastikan batas PHP/proxy dan temporary upload Livewire mengizinkan gambar sampai 2 MB.

## Membuat dan menerbitkan artikel

1. Masuk sebagai admin, buka **Blog → tambah artikel**.
2. Isi judul, slug unik (huruf kecil, angka, tanda hubung), kategori, ringkasan dan isi Markdown. Kategori: Coding untuk anak, Orang tua, Tips belajar, Logika, atau Cerita komunitas.
3. Opsional, unggah sampul JPEG, PNG atau WebP asli, maksimal 2 MB dan 20 megapiksel. Nama file saja tidak cukup: isi harus dapat didekode sebagai raster yang diizinkan. SVG, GIF, skrip tersamar, dan path string yang disisipkan ditolak. Sampul disimpan dengan nama acak di `storage/app/public/blog` dan URL `/storage/blog/...`.
4. Simpan sebagai **Draf** terlebih dahulu. Untuk contoh hasil import, edit dan tinjau isinya sebelum publikasi. Sampul aset bawaan import boleh dipertahankan saat edit; ini bukan izin untuk mengunggah SVG baru.
5. Untuk publikasi, pilih **Terbit**, isi **Tanggal terbit** sesuai zona waktu aplikasi, lalu simpan. Hanya artikel Terbit dengan tanggal yang sudah tiba muncul di `/blog` dan `/blog/{slug}`. Tanggal masa depan menjadwalkan publikasi; draf dan artikel belum waktunya mengembalikan 404 untuk pengunjung, termasuk admin di URL publik. Tidak ada halaman preview draf khusus.
6. Buka URL publik dan periksa judul, sampul, isi, filter kategori, serta tautan dari daftar. Flag **Artikel pilihan** memprioritaskan artikel; jika tidak ada, artikel terbaru tampil lebih dahulu. Daftar dipaginasi 12 artikel.

Markdown mendukung heading, tebal, daftar dan tautan. HTML mentah dibuang, dan tautan berbahaya dinonaktifkan. Jangan bergantung pada HTML/embed/script untuk konten. Mengubah slug memutus URL lama; tidak ada redirect otomatis.

## Menarik publikasi, mengubah dan menghapus

- Ubah status menjadi Draf untuk menarik artikel dari publik tanpa menghapus isinya.
- Edit artikel melalui menu Blog; sampul asli boleh dipertahankan, diganti dengan upload valid, atau dikosongkan. Tanpa sampul, publik memakai ilustrasi fallback.
- Penghapusan menghapus record artikel. Jangan mengasumsikan file sampul otomatis dibersihkan; audit file tidak terpakai secara terpisah setelah backup dan pastikan tidak dirujuk record lain.
- Backup database dan storage sebelum operasi massal. Migration bersifat aditif; jangan rollback/drop tabel jika ada konten yang perlu dipertahankan.

## Verifikasi lokal yang aman

Jangan jalankan suite dengan koneksi database produksi. Tes berikut memakai SQLite in-memory dan fake storage pada tes upload:

```bash
APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=:memory: DB_URL= php artisan test --compact
npm run types:check
npm run build
```

Empat tes concurrency memerlukan database MySQL khusus berakhiran `_test` dan dilewati pada SQLite; itu bukan alasan memakai database live. Tes Blog mencakup akses admin, CRUD, import idempotent, status/tanggal, sanitasi Markdown, raster asli, SVG/skrip tersamar dan path tampering.

## Pemecahan masalah

- **403 admin:** pastikan akun benar-benar admin; jangan membuka akses resource untuk pelajar.
- **Artikel tidak muncul/404:** periksa status, tanggal terbit dan zona waktu aplikasi, lalu slug. Import tidak pernah menerbitkan artikel otomatis.
- **Sampul rusak:** periksa symlink `public/storage`, izin baca/tulis, file di disk public dan konfigurasi URL aplikasi. Aset bawaan import ada di direktori `public/`, bukan disk upload.
- **Upload ditolak:** pastikan format aktual JPEG/PNG/WebP, bukan sekadar ekstensi, gambar tidak rusak, maksimal 2 MB/20 megapiksel, dan GD tersedia. Jangan menonaktifkan validasi atau perlindungan path untuk melewati masalah upload.
