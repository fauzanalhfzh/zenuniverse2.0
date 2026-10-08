# Orangutan menyapa

Lima pose SVG berlayer berdasarkan referensi `zGZ2f`, ukuran 512 × 512, latar transparan. Ini aset persiapan animasi, belum berupa JSON Lottie atau berkas .lottie.

## Berkas

- `01-tangan-turun.svg`
- `02-mulai-menyapa.svg`
- `03-telapak-tengah.svg`
- `04-ayun-masuk.svg`
- `05-ayun-keluar.svg`

`poses.html` adalah ekspor pembanding dari canvas. `export_svg.py` mengubah ekspor tersebut menjadi kelima SVG.

## Layer dan pivot

Setiap pose memakai grup `torso-legs`, `boot-left`, `boot-right`, `arm-rest`, `wave-arm-pivot-shoulder-317-277`, dan `helmet-face`. Wajah, telapak, cuff, serta bayangan tetap berupa elemen vektor terpisah di dalam grup.

Pivot lambaian berada di koordinat komposisi **(317, 277)**, pada bahu. Gerakan pose menggunakan rotasi seluruh lengan menyapa, bukan rig siku independen. Torso dan kedua kaki masih berbagi satu path utama. Jika membutuhkan tekukan siku atau gerakan kaki terpisah, pisahkan path tersebut di editor vektor sebelum rigging.

## Saran animasi Lottie

Gunakan `03-telapak-tengah.svg` sebagai master; empat SVG lain sebagai acuan keyframe. Jangan menumpuk kelima karakter lalu menyilang opacity karena hasilnya akan berbayang.

Komposisi yang disarankan: 512 × 512, 30 fps, durasi 2 detik. Sudut berikut relatif terhadap master, positif searah jarum jam:

| Frame | Pose | Rotasi lengan |
| --- | --- | --- |
| 0 | 01 | +100° |
| 8 | 02 | +45° |
| 14 | 03 | 0° |
| 20 | 04 | -16° |
| 28 | 05 | +16° |
| 36 | 04 | -16° |
| 42 | 03 | 0° |
| 50 | 02 | +45° |
| 60 | 01 | +100° |

Gunakan ease-in-out; kaki dan helm tidak perlu ikut bergoyang. Mainkan satu kali saat sapaan, bukan terus-menerus. Impor ke editor animasi yang mendukung SVG, periksa struktur layer, lalu ekspor melalui pipeline Lottie editor tersebut. Hasil SVG ini belum diuji sebagai animasi Lottie.

## Alasan visual

- Jingga, peach, navy, dan putih mengikuti karakter astronaut pada referensi, bukan palet baru.
- Laptop dihilangkan supaya siluet berdiri dan telapak menyapa terlihat jelas.
- Pose memakai karakter master yang sama untuk menjaga wajah dan kostum konsisten.
- Semua pose memiliki ruang gambar dan baseline yang sama supaya tidak bergeser saat pergantian pose.
- Latar transparan memudahkan penempatan pada halaman terang maupun gelap.
- ENERGY 2 / RHYTHM 1 / MOTION 2: ekspresi ramah, registrasi pose seragam, gerak hanya untuk sapaan.

## Pemeriksaan antislop

- Hard Gate PASS: aset diminta secara eksplisit dan mengikuti referensi; tidak ada klaim statistik, teks pemasaran, atau kontrol interaktif. Aturan navigasi, mobile UI, tema, keyboard, dan status data tidak berlaku pada aset SVG statis ini.
- Purpose-Gate PASS: identitas astronaut mengikuti referensi; tidak ada glow, gradient, latar dekoratif, atau animasi tambahan. Gerak lengan berfungsi sebagai sapaan.
- Liveliness PASS: ekspresi dan aksen jingga menjadi fokus; lima posisi lengan berbeda memakai identitas wajah yang tetap.
- Craftsmanship PASS: kelima pose diperiksa di canvas tanpa laporan clipping. Semua SVG berhasil diparse sebagai XML; pose 04 juga diperiksa melalui render browser.
