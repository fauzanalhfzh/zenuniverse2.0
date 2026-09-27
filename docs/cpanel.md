# Upload ZenUniverse ke cPanel tanpa SSH

Target: `https://zenuniverse.id`, document root `public_html/zenuniverse.id`, database MySQL baru berisi materi awal.

## 1. Periksa hosting

- Pilih PHP **8.4.1 atau lebih baru** untuk domain. Dependensi dalam `composer.lock` memerlukan minimal 8.4.1, bukan hanya batas Laravel 8.3.
- Aktifkan ekstensi PHP: ctype, curl, dom, fileinfo, filter, hash, iconv, intl, mbstring, openssl, pdo, pdo_mysql, session, tokenizer, xml, xmlreader, zip. JSON/PCRE/libxml biasanya sudah tersedia.
- Pastikan DNS domain mengarah ke hosting dan sertifikat SSL/AutoSSL aktif. Aktifkan Force HTTPS Redirect setelah sertifikat valid.
- Catat **Home Directory** akun dari cPanel. Contoh di bawah memakai `/home/USER_CPANEL`; ganti dengan lokasi sebenarnya, termasuk jika hosting memakai `/home2`.
- Tanyakan path **PHP CLI 8.4** kepada hosting. Contoh `/opt/cpanel/ea-php84/root/usr/bin/php` tidak berlaku untuk semua hosting. PHP untuk Cron Jobs bisa berbeda dari PHP domain.
- Pastikan hosting mengizinkan symlink untuk `storage:link` dan menyediakan perintah `flock`. Jika tidak, minta bantuan hosting sebelum menjalankan tahap 5.

## 2. Upload dua ZIP

Paket lokal ada di folder `dist/cpanel/` setelah disiapkan.

**Jangan ekstrak ZIP aplikasi di dalam `public_html`. ZIP tersebut berisi kode privat dan kunci jawaban materi. Backup file website yang sudah ada sebelum mengganti file.**

1. Upload `zenuniverse-app.zip` ke **Home Directory**, bukan document root. Ekstrak di sana. ZIP sudah berisi folder `zenuniverse-app`.
2. Upload `zenuniverse-public.zip` ke Home Directory juga. Ekstrak ke folder **`public_html/zenuniverse.id`**. ZIP publik berisi file langsung, tanpa folder pembungkus.
3. Hapus kedua ZIP dari hosting setelah ekstraksi dan pemeriksaan.
4. File Manager > Settings > aktifkan **Show Hidden Files**. Pastikan `.htaccess` ikut diekstrak.
5. Jika ada `index.html` bawaan hosting, backup lalu pindahkan keluar document root agar tidak menggantikan halaman aplikasi.

Struktur akhirnya harus persis:

```text
/home/USER_CPANEL/
├── zenuniverse-app/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env.example
│   └── artisan
└── public_html/
    └── zenuniverse.id/
        ├── .htaccess
        ├── index.php
        ├── build/
        ├── css/
        ├── fonts/
        ├── js/
        └── ...aset lainnya
```

`index.php` dan `bootstrap/app.php` **dalam paket** sudah disesuaikan dengan struktur ini. Nama folder jangan diubah. Public path berlaku juga untuk Artisan, manifest Vite, aset Filament, dan storage link. Source lokal tetap memakai struktur Laravel standar.

Node.js, npm, Composer, dan SSH tidak diperlukan di hosting. SSR dinonaktifkan khusus dalam paket; halaman React berjalan di browser. Paket memakai queue `sync`, tidak membutuhkan worker permanen untuk konfigurasi ini.

## 3. Database dan konfigurasi

1. Buka **MySQL Database Wizard / Database Wizard**.
2. Buat database baru, pengguna database, dan password kuat. Tambahkan pengguna ke database tersebut dengan **ALL PRIVILEGES** pada database itu saja.
3. Gunakan nama lengkap dengan prefix cPanel.
4. Di File Manager, salin `zenuniverse-app/.env.example` menjadi `zenuniverse-app/.env`.
5. Isi `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. `DB_HOST=localhost` hanya jika sesuai hostname database dari hosting.
6. Isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` untuk admin awal. Gunakan password unik minimal 16 karakter. Bungkus password dengan tanda kutip sesuai sintaks dotenv.
7. Biarkan `APP_KEY=` kosong **hanya untuk instalasi baru ini**. Tahap 5 membuatnya di hosting. Jangan mengganti APP_KEY setelah aplikasi digunakan.
8. Pastikan `APP_ENV=production`, `APP_DEBUG=false`, dan `APP_URL=https://zenuniverse.id`.
9. Pastikan `.env` tidak bisa diakses publik. Gunakan permission 600 jika PHP berjalan sebagai pemilik akun; sesuaikan bersama hosting bila berbeda. Jangan memakai 777. `storage/` dan `bootstrap/cache/` harus dapat ditulis proses PHP.

Jangan gunakan database development atau database website lain. Tidak perlu impor SQL; migrasi membuat tabel dan seeder mengisi materi bawaan. Akun pelajar dan progres lokal tidak ikut.

## 4. Login Google

Login pelajar memerlukan OAuth Google. Pada OAuth client bertipe **Web application** di Google Cloud Console:

- Authorized JavaScript origin, jika digunakan: `https://zenuniverse.id`
- Authorized redirect URI: `https://zenuniverse.id/auth/google/callback`
- Atur audience/publishing dan test users sesuai tahap peluncuran. Aplikasi dengan audience Testing hanya bisa dipakai pengguna yang diizinkan Google.

Isi `.env` hosting:

```dotenv
GOOGLE_CLIENT_ID=ISI_CLIENT_ID
GOOGLE_CLIENT_SECRET=ISI_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://zenuniverse.id/auth/google/callback
```

Jangan kirim client secret atau password melalui chat. Admin Filament memakai login password terpisah di `https://zenuniverse.id/admin`.

## 5. Jalankan inisialisasi melalui Cron Jobs

**Hanya untuk database baru yang disiapkan di tahap 3. Periksa kembali nama database sebelum melanjutkan. Jangan gunakan `migrate:fresh`, `db:wipe`, atau reset database.**

Jalankan setiap tahap di bawah **secara berurutan**, bukan sekaligus:

1. Ganti semua `/home/USER_CPANEL` dan path PHP contoh dengan nilai hosting sebenarnya.
2. Tambahkan satu Cron Job dengan jadwal `* * * * *` jika hosting mengizinkan setiap menit. Jika dibatasi, gunakan interval yang diizinkan.
3. Tempel satu perintah dari tahap A, tunggu eksekusi, lalu baca log melalui File Manager.
4. Setelah file penanda tahap muncul, hapus Cron Job itu, lalu lanjut tahap berikutnya.
5. Jika gagal, hentikan Cron Job, periksa log, dan perbaiki penyebabnya. Jangan menghapus penanda sukses untuk memaksa pengulangan.

`flock` mencegah proses saling tumpang tindih. Penanda sukses mencegah cron mengulang tahap yang sudah selesai. Semua log dan penanda berada di folder privat.

### A. Buat APP_KEY

Perintah ini hanya boleh dijalankan ketika `.env` instalasi baru masih memiliki `APP_KEY=` kosong. Jangan jalankan untuk update aplikasi.

```sh
cd /home/USER_CPANEL/zenuniverse-app && flock -n storage/install.lock sh -c 'test -f storage/key.done || ( /opt/cpanel/ea-php84/root/usr/bin/php artisan key:generate --force --no-interaction && touch storage/key.done )' >> storage/logs/install-key.log 2>&1
```

Periksa `storage/logs/install-key.log` dan `storage/key.done`. `.env` sekarang memiliki APP_KEY. Jangan membagikannya.

### B. Buat tabel dan isi materi serta admin

```sh
cd /home/USER_CPANEL/zenuniverse-app && flock -n storage/install.lock sh -c 'test -f storage/seed.done || ( /opt/cpanel/ea-php84/root/usr/bin/php artisan migrate --force --no-interaction && /opt/cpanel/ea-php84/root/usr/bin/php artisan db:seed --force --no-interaction && touch storage/seed.done )' >> storage/logs/install-seed.log 2>&1
```

Periksa `storage/logs/install-seed.log` dan `storage/seed.done`. Jika seed gagal setelah migrasi selesai, migrasi berikutnya hanya menjalankan yang masih tertunda. Jangan memakai seed ini untuk update materi setelah CMS digunakan; importer dapat menimpa materi yang ada.

Setelah berhasil, hapus Cron Job. Kosongkan `ADMIN_EMAIL=` dan `ADMIN_PASSWORD=` di `.env`. Akun admin yang sudah dibuat tetap ada. Bila lupa mengisi kredensial sebelum seed, jangan mengulang seluruh seed; jalankan `db:seed --class=AdminSeeder --force` secara terkontrol setelah mengisinya.

### C. Hubungkan upload publik

```sh
cd /home/USER_CPANEL/zenuniverse-app && flock -n storage/install.lock sh -c 'test -f storage/link.done || ( /opt/cpanel/ea-php84/root/usr/bin/php artisan storage:link --no-interaction && test -L /home/USER_CPANEL/public_html/zenuniverse.id/storage && touch storage/link.done )' >> storage/logs/install-link.log 2>&1
```

Periksa `storage/logs/install-link.log` dan `storage/link.done`. Target link harus `zenuniverse-app/storage/app/public`, **bukan seluruh `storage/`**. Jika symlink ditolak hosting, minta hosting membuat/mengizinkan link; jangan mempublikasikan log, session, atau folder privat sebagai pengganti.

Setelah tahap C berhasil, hapus Cron Job. Saat ini `routes/console.php` tidak memiliki jadwal aplikasi; tidak perlu membiarkan cron instalasi aktif.

Tidak perlu menjalankan `config:cache` pada instalasi awal. Dengan begitu perubahan `.env` langsung dibaca tanpa perintah tambahan. Jangan upload cache konfigurasi/route/view dari komputer lokal.

## 6. Periksa hasil

- `https://zenuniverse.id/up` memberi HTTP 200. Ini memeriksa boot aplikasi, bukan bukti semua fungsi database beres.
- Halaman utama dan login menampilkan CSS/JS tanpa mencoba mengakses `localhost:5173`.
- Login Google berhasil, materi awal tampil, pelajaran dapat dibuka.
- `https://zenuniverse.id/admin` menerima kredensial admin yang dibuat saat seed.
- Upload avatar/aset dan pastikan URL `/storage/...` bisa dibuka.
- Permintaan `/.env`, `/composer.json`, dan `/database/seeders/data/content-dump.json` harus ditolak/404, tidak menampilkan isi file.
- Periksa `storage/logs/laravel.log` secara privat jika muncul 500; jangan mengaktifkan `APP_DEBUG` di domain publik.
- Pastikan tidak ada file `hot` pada document root.

## Batas verifikasi paket

Paket dibangun dari lockfile dengan dependency produksi (`--no-dev`), aset frontend dan Filament tersedia. Uji lokal memeriksa public path terpisah, migrasi/seed dengan SQLite in-memory, serta respons HTTP halaman `/`, `/login`, `/admin/login`, dan `/up`. Ini bukan pengujian MySQL cPanel, permission/symlink Linux, login Google nyata, atau uji browser lengkap. Hosting harus diperiksa melalui tahap 6.

Paket tidak membawa `.env` lokal, data pengguna, upload lokal, `node_modules`, file `hot`, atau cache konfigurasi/route/view lokal. `APP_KEY` dibuat di hosting, bukan dikirim dalam ZIP.

Untuk pembaruan berikutnya, backup file dan database dahulu; pertahankan `.env`, APP_KEY, seluruh upload, dan penanda instalasi. Jangan menimpa `bootstrap/app.php`, `config/inertia.php`, atau `index.php` hosting dengan versi source standar tanpa mengulang penyesuaian paket.

Referensi: [Laravel deployment](https://laravel.com/docs/13.x/deployment), [database seeding](https://laravel.com/docs/13.x/seeding).
