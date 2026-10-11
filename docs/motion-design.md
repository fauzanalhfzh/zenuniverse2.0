# Motion assets Zenuniverse

Enam motion untuk feedback belajar, dibuat dengan GSAP yang sudah ada di aplikasi. Komponen: `resources/js/components/motion/motion-asset.tsx`. Ikon SVG mengikuti hati merah, bintang emas, dan api oranye dari aset statistik sebelumnya. Maskot mengikuti astronaut di roket pada `public/images/loading.png`, dengan salinan transparan hasil imagegen di `public/images/mascot-motion.png`. Aset sumber tetap utuh.

## Arah dan gerakan

Playful dengan ENERGY 2 / RHYTHM 1 / MOTION 2. Gerakan utama menegaskan perubahan state, gerakan pendamping memperhalus penyelesaian, dan ring/dua partikel singkat menandai reward. Ikon bintang memang merepresentasikan XP; api merepresentasikan streak. Gradien hanya memberikan volume pada aset ikon, mengikuti aset sebelumnya. Fredoka dan Figtree pada preview mengikuti tipografi aplikasi.

| Aset            | Pemicu                           | Gerakan                                                    | Durasi total |
| --------------- | -------------------------------- | ---------------------------------------------------------- | ------------ |
| Fill heart      | Slot kosong menjadi terisi       | Warna naik 220 ms, pop kecil, ring dan dua partikel        | 620 ms       |
| Unfill heart    | Slot terisi menjadi kosong       | Warna turun 240 ms, turun dan miring sedikit, kembali diam | 320 ms       |
| Unlimited Heart | Status unlimited aktif           | Pop hati, simbol infinity muncul, ring dan dua partikel    | 620 ms       |
| Main Mascot     | Loading pelajaran dibuka         | Roket bergerak diagonal pendek lalu kembali ke posisi awal | 1.400 ms     |
| Stars           | XP bertambah / pelajaran selesai | Rotasi pendek, pop, dua kilau                              | 620 ms       |
| Streaks         | Streak bertambah                 | Api menekan lalu memanjang dan kembali normal              | 620 ms       |

Pengurangan nyawa sengaja tidak memakai partikel reward. Semua efek selesai sendiri; tidak ada loop dekoratif tanpa akhir. Statistik yang baru dimuat tidak merayakan angka lama. Streak nol ditampilkan abu-abu dan diam. Satu aset preview diputar dalam satu waktu agar mudah dibandingkan.

## Pemakaian

```tsx
import { HeartMeter, MotionAsset } from '@/components/motion/motion-asset';

<HeartMeter hearts={progress.hearts} capacity={progress.heartsCapacity} unlimited={subscription.plusActive} />
<MotionAsset kind="star" value={progress.totalXp} size={32} />
<MotionAsset kind="streak" value={progress.currentStreak} active={progress.currentStreak > 0} />
<MotionAsset kind="mascot" size={160} playOnMount />
```

`filled` memilih bentuk akhir hati. `value` memicu reward hanya jika nilainya naik. `replay` dapat dinaikkan untuk memutar ulang. `playOnMount` digunakan untuk kedatangan maskot, aktivasi unlimited, dan penyelesaian pelajaran. `motion={false}` mematikan gerakan. `label` memberi nama aksesibel untuk aset mandiri; aset di samping label statistik bersifat dekoratif.

Komponen hanya merender data. Perhitungan correctness, XP, streak, nyawa, dan entitlement tetap berasal dari flow server yang sudah ada. Slot hati menggunakan capacity dan key yang stabil agar perubahan nyawa tidak menghapus elemen sebelum animasinya selesai.

Integrasi: dashboard desktop/mobile, header lesson player, lesson completion, dan lesson navigation loading. Tidak ada dependency baru.

Dashboard memakai `useDashboardProgress`: refetch saat fokus/online, notifikasi lintas tab, serta polling saat tab aktif. Refresh latar tidak melepaskan ikon dari DOM sehingga selisih XP/streak memicu animasi. Snapshot lama ditolak dan request dibatalkan saat unmount. Maskot mendampingi petunjuk membuka misi di sidebar desktop. Lesson player menampilkan XP dan streak di desktop, hati terisi/kosong serta unlimited di desktop/mobile, dan maskot di layar completion. Selector mobile dibatasi ke elemen statistik yang dimaksud agar lapisan SVG hati tetap terlihat.

## Aksesibilitas dan lifecycle

- `prefers-reduced-motion` selalu diutamakan, termasuk saat preferensi berubah ketika animasi sedang berjalan. State akhir tetap terlihat tanpa gerakan.
- `useGSAP` membatasi selector ke komponen serta membersihkan timeline saat update/unmount.
- IntersectionObserver dan visibilitychange menjeda efek saat aset di luar viewport atau tab tersembunyi. Listener ikut dibersihkan.
- Transform dan opacity menjadi properti utama. Clip-path hanya pada lapisan warna ikon hati berukuran kecil.
- Sumber teknis: [GSAP React](https://gsap.com/resources/React/) dan [GSAP matchMedia](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>).

## Preview dan pemeriksaan

```sh
npx vite --config tests/browser/motion.vite.config.ts
# http://127.0.0.1:5201/tests/browser/motion.html
npx playwright test --config tests/browser/motion.config.ts
npx playwright test --config tests/browser/motion-integration.config.ts
npm run types:check
npm run build
```

Preview menggunakan state simulasi lokal, tanpa autentikasi atau koneksi database. Tes browser terpisah dari E2E Laravel dan tidak menjalankan migrasi. Mencakup enam animasi, perubahan nyawa cepat, nol nyawa, unlimited, reduced motion saat runtime, keyboard, dan overflow mobile.

## Delivery gate antislop (lingkup motion baru dan preview)

- PASS / Hard gate: empat tes browser memeriksa semua kontrol, keyboard, state kosong/unlimited, reduced motion, dan viewport 360 px tanpa overflow; build dan TypeScript berhasil. Preview berlabel simulasi dan tidak membuat klaim produk.
- PASS / Purpose: ikon berasal dari konsep statistik yang sudah ada; gradien memberi volume pada ikon, ring/partikel hanya untuk reward, gerak roket mengikuti pose maskot.
- PASS / Liveliness: dials dinyatakan di atas; setiap specimen memiliki satu fokus aset, hanya aset yang dipilih bergerak, preview memakai panel seragam untuk membandingkan enam aset secara setara.
- PASS / Craft: teks preview pada latar terang memiliki rasio kontras 6,18:1; latar gelap 8,40:1; tombol aktif 6,25:1. Semua kontrol memiliki handler dan focus ring. Tidak ada statistik atau testimoni buatan.

Lint file motion, dashboard, lesson player, dan fixture integrasi lolos; import `ArrowRight` yang tidak terpakai sudah dihapus. Tiga tes integrasi terisolasi memakai komponen halaman asli dan respons API simulasi: refresh dashboard tanpa remount, perubahan hati pada mobile, serta XP/streak dengan reduced motion. Screenshot tersedia di `test-results/motion-integration/`. Gate ini tidak merupakan audit seluruh aplikasi; alur backend dan E2E berbasis database tidak dijalankan untuk perubahan visual ini. Pembukaan dashboard lokal asli melalui browser belum diverifikasi karena automatic approval review menolak akses saat batas penggunaan layanan review tercapai.
