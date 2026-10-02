# Gate loading maps ke lesson player

Lingkup: indikator loading baru dan perubahan navigasi pada `mission-map.tsx`, bukan audit ulang seluruh aplikasi.

Arah desain: loading misi untuk pelajar, mengikuti visual ZenUniverse. ENERGY 2 / RHYTHM 1 / MOTION 2.

Alasan desain: oranye menghubungkan indikator dengan node misi; ikon memakai aset node yang dipilih; Fredoka/Figtree mempertahankan suara produk. Dialog memusatkan status sekaligus mencegah klik ganda. Lebar maksimal 384px, jarak 16px, dan radius 20px mengikuti skala maps serta memberi ruang pada layar sempit. Orbit bergerak hanya selama request untuk menunjukkan aplikasi masih bekerja, bukan mengklaim kemajuan tertentu.

## Bukti

- Lint/format tiga file perubahan: lulus tanpa warning.
- `npm run types:check`: lulus.
- `npm run build`: lulus; masih ada peringatan ukuran chunk editor/Blockly.
- Playwright `lesson-navigation.spec.ts` dan `player.spec.ts`: 8 test lulus pada database khusus `zenuniverse_e2e`.
- Screenshot desktop dan mobile 320px diperiksa di `test-results`; lebar dialog dan warna light/dark juga diperiksa oleh test.
- Test desktop menahan request, memeriksa orbit bergerak, lalu memastikan loading hilang dan kontrol player muncul. Test mobile memastikan orbit statis saat reduced motion.
- Test pembatalan memeriksa Batal, Escape, pengembalian fokus, dan navigasi ulang. Test koneksi gagal memeriksa pesan error dan percobaan ulang.
- Test loading memeriksa tidak ada JavaScript page error.
- Contrast checker: judul light 16.27:1, judul dark 16.20:1, teks light 7.03:1, teks dark 10.04:1, border Batal light 5.12:1, error 5.88:1. Segmen orbit light 5.16:1 dan dark 4.12:1 memenuhi syarat nonteks 3:1.

## Hard Gate

- R-02 PASS: teks UI baru tidak memakai em dash.
- R-03 PASS: test lebar 320px memastikan dialog berada di viewport; Batal memiliki tinggi minimum 44px.
- R-17 PASS: tidak ada statistik atau persentase loading baru.
- R-18 PASS: tidak ada testimoni baru.
- R-23 PASS: memakai aset ikon node yang sudah ada; tidak membuat logo/avatar/navigasi baru.
- R-24 PASS: URL lesson tetap memakai helper Wayfinder yang sama.
- R-25 PASS: pasangan teks, border kontrol, dan indikator diperiksa dengan contrast checker.
- R-26 PASS: Batal membatalkan request; node misi membuka lesson; keduanya diuji.
- R-27 PASS: maps tetap mempunyai empty state; loading mengikuti request; kegagalan koneksi menampilkan alert dengan instruksi mencoba lagi.
- R-28 PASS: tidak menambah FAQ.
- R-32 PASS: Enter membuka misi; Batal mendapat fokus; Escape membatalkan; fokus kembali ke node, dibuktikan test.
- R-33 PASS: perubahan ditulis langsung melalui editor file, tanpa skrip penambal source/CSS.
- R-34 PASS: test memeriksa warna dialog light dan kelas dark; screenshot keduanya diperiksa.
- R-35 PASS: build dan 8 test browser dijalankan; tidak ada page error pada test loading.
- R-36 PASS: tidak menambah klaim performa, keamanan, atau pelanggan.
- R-37 PASS: arah visual diambil dari UI ZenUniverse yang sudah ada dan dinyatakan sebelum implementasi.
- R-38 PASS: judul berasal dari lesson yang diklik; ikon berasal dari node tersebut.

## Purpose-Gate

- R-01 PASS: aksen oranye berasal dari maps; tidak ada gradient/glow baru.
- R-04 PASS: ikon Book/Quiz/Code sama dengan node misi yang dibuka.
- R-06 PASS: Fredoka/Figtree memakai tipografi produk; tidak ada monospace atau label uppercase baru.
- R-07 PASS: tidak menambah pola background.
- R-08 PASS: tidak menambah panah dekoratif.
- R-09 PASS: tidak menambah badge.
- R-10 PASS: backdrop memakai warna solid transparan, tanpa blur.
- R-12 PASS: tidak menambah shadow; backdrop membedakan lapisan dialog.
- R-13 PASS: tidak menambah glow.
- R-14 PASS: tidak menambah feature cards.
- R-19 PASS: orbit hanya terpasang selama navigasi; GSAP membersihkan tween saat unmount; reduced motion menghentikan putaran.
- R-22 PASS: ikon yang sudah ada menjelaskan misi tujuan; tidak membuat ilustrasi baru.

## Liveliness

- Dial PASS: ENERGY 2 / RHYTHM 1 / MOTION 2 sudah dinyatakan sebelum implementasi.
- Konsistensi PASS: satu komposisi status terpusat, satu indikator bergerak, tanpa koreografi dekoratif.
- Fokus PASS: ikon dan judul status menjadi pusat perhatian dalam dialog.
- Whitespace PASS: gap memisahkan ikon, judul pelajaran, status, dan kontrol pembatalan.
- Aksen PASS: oranye digunakan pada segmen orbit dan indikator fokus keyboard.
- Motif PASS: ikon node misi dan tipografi ZenUniverse diulang pada loading.
- Design Read PASS: arah visual dan tujuan loading dinyatakan sebelum implementasi.

## Craftsmanship dan Quality Locks

- C-1 PASS: alasan warna, layout, tipografi, jarak, radius, dan gerak tercatat di atas.
- C-2 PASS: semua kontrol baru mempunyai perilaku yang diuji.
- C-3 PASS: tidak ada section baru selain status request dan error.
- C-4 PASS: loading, cancel, error/retry, desktop/mobile, light/dark, keyboard, dan reduced motion diperiksa oleh test.
- C-5 PASS: tidak menambah klaim atau data yang tidak bersumber.
- R-05 PASS: dialog hanya menyampaikan status navigasi, bukan template halaman baru.
- R-11 PASS: radius 20px mengikuti maps, radius kontrol 12px; tidak membuat seluruh UI berbentuk pill.
- R-15 PASS: Batal menyebutkan tindakan kontrol secara langsung.
- R-16 PASS: status dan error memakai bahasa Indonesia tanpa jargon pemasaran.
- R-20 PASS: ikon misi serta Fredoka/Figtree mempertahankan identitas ZenUniverse.
- R-21 PASS: tidak memaksa dark mode atau mengubah kebijakan tema; indikator mendukung kelas dark existing.
- R-29 PASS: satu aksen oranye dengan warna netral mengikuti produk.
- R-30 PASS: tidak memakai referensi atau meniru produk lain.
- R-31 PASS: setiap keputusan visual utama mempunyai alasan tertulis.
