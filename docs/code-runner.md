# Code runner (sandbox Piston)

Langkah `code` (Tulis Kode) sekarang dinilai dari **output asli** kode learner, bukan
hanya kecocokan teks dengan `expectedCode`. Kode dijalankan di
[Piston](https://github.com/engineer-man/piston) pada **VPS terpisah**; server Laravel
tidak pernah mengeksekusi kode learner.

## Alur

- `POST /api/v1/learning/run` (tombol JALANKAN): menjalankan kode dan mengembalikan
  `{ matches, output }`. Tidak menilai, tidak memberi XP, tidak memotong heart.
  Dibatasi 30 request/menit per user.
- `POST /api/v1/learning/attempts` (PERIKSA): benar jika stdout sama dengan
  `mockOutput` (spasi di akhir baris dan baris kosong di ujung diabaikan). Kode yang
  cocok dengan `expectedCode` tetap diterima, jadi kunci jawaban lama tidak rusak.
- `sampleInput` di konten soal dikirim sebagai stdin.
- Bahasa tanpa runtime (HTML, CSS) atau saat `PISTON_URL` kosong / sandbox mati:
  kembali ke pencocokan teks seperti sebelumnya.

## Pengamanan

| Lapisan | Pengaturan |
| --- | --- |
| Host | VPS khusus, tidak menyimpan `.env`, database, atau rahasia apa pun |
| Jaringan program | `PISTON_DISABLE_NETWORKING=true` |
| Waktu | run 3 dtk, compile 10 dtk (juga dikirim per request dari Laravel) |
| Memori | 128 MB run, 256 MB compile |
| Proses / file | maks 32 proses, 64 file terbuka, file 1 MB, output 8 KB |
| Akses API | Caddy hanya meneruskan `POST /api/v2/execute` dengan token Bearer; port 2000 hanya di localhost |
| Penyalahgunaan | throttle 30/menit di Laravel, `max_size` 64 KB, maks 8 job paralel |

Piston butuh container `privileged` (untuk isolate/cgroup). Itulah alasan utama
sandbox ini **harus** berada di VPS sendiri, bukan di hosting cPanel.

## Deploy sandbox

Di VPS (Ubuntu + Docker), dengan domain misalnya `runner.zenuniverse.id` diarahkan ke VPS:

```bash
git clone https://github.com/fauzanalhfzh/zenuniverse2.0 && cd zenuniverse2.0/deploy/piston
export PISTON_DOMAIN=runner.zenuniverse.id
export PISTON_TOKEN=$(openssl rand -hex 32)   # simpan, dipakai di .env Laravel
docker compose up -d
```

Pasang runtime (cukup sekali; dijalankan dari VPS itu sendiri):

```bash
curl -X POST localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"python","version":"3.10.0"}'
curl -X POST localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"node","version":"18.15.0"}'
curl -X POST localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d '{"language":"gcc","version":"10.2.0"}'
```

Uji dari luar:

```bash
curl https://runner.zenuniverse.id/api/v2/execute -H "Authorization: Bearer $PISTON_TOKEN" -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"*","files":[{"content":"print(1+1)"}]}'
```

Batasi juga firewall VPS: hanya 22, 80, 443 yang terbuka.

## Konfigurasi Laravel

```dotenv
PISTON_URL=https://runner.zenuniverse.id
PISTON_TOKEN=<token yang sama dengan di VPS>
# opsional
PISTON_RUN_TIMEOUT_MS=3000
PISTON_MEMORY_BYTES=134217728
PISTON_PYTHON_VERSION=*
```

Lalu `php artisan config:cache`. Mengosongkan `PISTON_URL` mematikan eksekusi dan
kembali ke pencocokan teks.

## Catatan konten

Karena output sekarang benar-benar dijalankan, `mockOutput` setiap soal harus sama
persis dengan output program sungguhan. Soal C++ yang dulu memakai output "simulasi"
tetap lolos lewat `expectedCode`, tapi sebaiknya `mockOutput`-nya diperbaiki.
