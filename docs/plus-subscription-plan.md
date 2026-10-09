# Rencana Implementasi ZenUniverse Plus

Status: **draft untuk review, belum menjadi persetujuan implementasi**.

Cakupan: web Laravel/Inertia dan integrasi backend untuk Android. iOS tidak termasuk rilis pertama. Dokumen ini tidak mengubah aplikasi, database, atau akun provider.

## 1. Keputusan produk

| Aspek | Keputusan |
| --- | --- |
| Manfaat Plus | Unlimited hearts dan seluruh roadmap premium yang sudah dipublikasikan, termasuk roadmap premium baru di masa depan |
| Konten lama | Seluruh course/modul lama tetap gratis |
| Roadmap mendatang | Full-stack Web dan AI Engineer dapat diterbitkan sebagai premium; jangan mengiklankan akses konten yang belum tersedia sebagai konten siap pakai |
| Paket | Bulanan dan tahunan memiliki manfaat identik |
| Harga web | Rp35.000 untuk 1 bulan; Rp300.000 untuk 12 bulan |
| Harga Android | Ditampilkan dari katalog Google Play, bukan hardcoded dari harga web |
| Web | Mayar hosted checkout dengan invoice berkala, bukan auto-debit |
| Android | Native Google Play subscription dengan auto-renew |
| Akun | Hak akses berlaku lintas web/Android pada akun ZenUniverse yang sama |
| Pembatalan biasa | Akses bertahan sampai periode berbayar berakhir |
| Expiry | Premium terkunci; progress, completion, XP, dan badge tidak dihapus |
| Prasyarat | Plus tidak melewati urutan lesson atau prasyarat |
| XP | Aturan verifikasi dan reward tidak berubah |

Refund, chargeback, dan revocation bukan pembatalan biasa. Perubahan hak akses mengikuti hasil verifikasi provider, bukan payload klien.

## 2. Desain minimum

### 2.1 Course sebagai roadmap

Gunakan struktur `Course > Unit > Lesson > Step` yang sudah ada. Tidak menambah tabel roadmap, grouping lintas-course, tier per lesson, atau publisher kedua.

Tambah `courses.access_tier` dengan nilai `free|plus`, non-null, default `free`. Semua row lama tetap Free. Nama field dalam dokumen dan payload: `accessTier`.

Grouping lintas-course baru dipertimbangkan bila kebutuhan produk benar-benar memerlukannya.

### 2.2 Data billing

Nama tabel berikut merupakan usulan implementasi, bukan schema yang sudah tersedia.

| Record | Data minimum |
| --- | --- |
| `subscriptions` | `user_id`, provider, paket lokal, identitas subscription/provider, status provider, status akses terverifikasi, periode akses, informasi pembatalan, waktu verifikasi, revision perubahan entitlement |
| `billing_checkouts` | ID checkout lokal, pemilik, paket/nominal dari server, status, korelasi member/customer/tier/invoice/transaction Mayar, URL checkout, waktu kedaluwarsa checkout, kegagalan pemeriksaan |
| `billing_events` | Provider, deduplication key, referensi subscription/checkout, status pemrosesan, jumlah retry, waktu pemrosesan, error tersanitasi |
| Token Google Play | Token terenkripsi untuk panggilan provider; hash unik untuk pencarian dan pencegahan kepemilikan ganda |

Gunakan unique constraint untuk identitas provider dan token. Terapkan transaksi dan locking dengan urutan konsisten. Jangan menahan lock DB selama panggilan HTTP provider.

Tidak perlu tabel entitlement terpisah. Service entitlement menghitung Plus dari sumber subscription terverifikasi yang masih memberi akses. Dua sumber aktif tidak dijumlahkan menjadi tambahan bulan; salah satu sumber valid sudah cukup. Pencabutan satu sumber tidak menghapus akses dari sumber lain yang masih valid.

### 2.3 Fulfillment tepat

Backend memperbarui subscription milik akun yang sudah dikorelasikan, termasuk status provider, periode terverifikasi, waktu verifikasi, dan revision entitlement.

Plus aktif hanya ketika:

1. Pembelian terverifikasi melalui API provider.
2. Kepemilikan akun dan produk/paket cocok dengan konfigurasi server.
3. Status provider mengizinkan akses.
4. Waktu server berada dalam periode akses valid.

Redirect checkout, status member Mayar `active`, webhook mentah, dan status pembelian dari perangkat tidak cukup untuk aktivasi.

## 3. Publikasi konten premium

### Alur metadata

- Masukkan `accessTier` ke draft, release baru, projection, snapshot, dan duplication.
- Edit tier melalui `CoursePublisher::saveDraft()` lalu `publish()`.
- Jangan menambah select Filament biasa yang langsung menyimpan tier ke projection live.
- Perubahan tier ikut hash dan content revision.
- Preserve draft yang sudah ada; jangan menggantinya dengan snapshot projection hanya untuk mengedit tier.
- Historical release document dan hash tetap utuh.
- Historical document tanpa `accessTier` dibaca sebagai `free`; publication baru menormalisasi field sebelum hashing.
- Tolak field eksplisit yang null, bukan string, atau bukan `free|plus`.

### Kompatibilitas import/export

- Import legacy tanpa tier: course baru menjadi Free; course existing mempertahankan tier saat ini.
- Import eksplisit tier tetap divalidasi.
- Importer merupakan bootstrap tooling, bukan jalur edit live. Jangan memakai import untuk melewati lifecycle publication premium.
- Export menambah optional `accessTier`; sumber legacy tanpa tier diekspor sebagai Free.
- Checksum course berubah ketika tier berubah.
- Dump dan export yang mengandung jawaban tetap privat, bukan dalam `public/` atau import frontend.

### Risiko publisher yang perlu ditangani

Audit menemukan Filament mengedit projection langsung dan `publishProjection()` menyimpan snapshot tabel yang sudah diedit. Scope perubahan Plus harus memastikan tier tidak ikut berubah live sebelum publication.

Kedua jalur publish juga dapat mengembalikan historical release dengan hash sama sebelum menyelaraskan projection/status. Perbaiki perilaku ini secara terbatas agar publication tidak dilaporkan berhasil dengan projection berbeda. Historical release tidak boleh dimutasi. Tambahkan regression test sebelum mengubah perilaku deduplikasi publication.

## 4. Mayar web

### 4.1 Kontrak V2 yang terdokumentasi

Semua path berikut relatif terhadap `/hl/v2`.

| Operasi | Method/path | Request penting | Response penting |
| --- | --- | --- | --- |
| Registrasi member | `POST /memberships/members/create` | `productId`, `membershipTierId`, `customerInfo.name`, `customerInfo.email`, `customerInfo.mobile`, `membershipMonthlyPeriod` | `data.membershipCustomer`, termasuk `memberId`, `customerId`, tier, product |
| Buat/gunakan invoice | `POST /memberships/members/{memberId}/invoice/create` | `productId` dalam body atau query | `id`, `transactionId`, `customerId`, `membershipTierId`, `amount`, `status`, `expiredAt`, `membershipBillUrl` |
| Detail transaksi | `GET /transactions/{id}` | Transaction ID tersimpan | `status`, `amount`, customer, payment link, merchant |
| Detail member | `GET /memberships/members/{memberId}` | Query `productId` | Identitas member/customer/tier/product, `nextPayment`, `expiredAt`, status |
| Pembatalan | `POST /memberships/members/{memberId}/cancel` | `productId` | Member berstatus `stopped` |
| Pemeriksaan tier | `GET /memberships/tiers` | Query `productId` | Tier dan konfigurasi membership, termasuk redirect URL |

Invoice membership menggunakan **`membershipBillUrl`**, bukan asumsi field `link` dari endpoint pembayaran umum. Invoice belum dibayar digunakan kembali untuk billing term yang sama.

Error terdokumentasi yang relevan:

- Registrasi: `400` validation, product tidak dimiliki merchant, email sudah terdaftar pada tier, atau batas anggota tercapai.
- Invoice membership: `400` invalid path/body.
- Detail member: `400` invalid path/query; `404` member tidak ditemukan.
- Detail transaksi: `401` unauthorized; `404` transaction tidak ditemukan.
- Pembatalan: `400` invalid path/body atau member sudah tidak aktif; `404` member tidak ditemukan.
- Batas global: 50 request/menit per API key; hormati `Retry-After` saat terkena rate limit.

Periksa HTTP status dan `body.statusCode`; baca pesan dari `messages ?? message`. Jangan melakukan retry buta pada semua error `400`.

### 4.2 Alur checkout

1. Pengguna login, memilih paket lokal yang diizinkan, dan melengkapi kontak yang diwajibkan Mayar.
2. Server menentukan product, tier, nominal, dan periode. Klien tidak menentukan harga.
3. Simpan checkout lokal sebelum memanggil Mayar.
4. Registrasikan atau gunakan member yang sudah terikat secara aman.
5. Buat/gunakan invoice dan simpan korelasi dari respons provider.
6. Validasi HTTPS dan host checkout yang diizinkan sebelum redirect ke `membershipBillUrl`.
7. Return menggunakan halaman status subscription khusus; query redirect tidak mengaktifkan Plus.
8. Job memeriksa transaksi dan periode membership, lalu menjalankan fulfillment.

Redirect dikonfigurasi melalui mekanisme provider yang terdokumentasi; jangan mengarang request field redirect untuk endpoint registrasi/invoice.

### 4.3 Keamanan, idempotensi, dan recovery

- Klik ganda memakai checkout lokal yang sama.
- Timeout write menghasilkan status belum pasti dan reconciliation, bukan langsung membuat member baru.
- Error email sudah terdaftar tidak membolehkan klaim member berdasarkan email saja.
- Webhook dianggap pemicu pemeriksaan, bukan bukti autentik pembayaran.
- ID webhook belum boleh diasumsikan sebagai transaction ID. Korelasikan hanya setelah format nyata terbukti.
- Notifikasi yang tidak dapat dikorelasikan tidak membuat entitlement.
- Batasi ukuran payload, rate, dan pekerjaan queue; deduplikasi event agar endpoint tidak menghabiskan kuota API.
- Reconciliation berkala menangani notifikasi hilang dan proses yang terhenti.
- Error provider tidak memperpanjang periode tanpa bukti baru dan tidak menghapus periode berbayar yang masih tersimpan valid.
- Pembatalan biasa tidak mengosongkan batas akses berbayar.

### 4.4 Gerbang rilis Mayar

**Belum tersedia akun sandbox dan sampel webhook pembayaran membership. Aktivasi produksi tetap diblokir sampai bukti berikut tersedia.**

- Pembayaran pertama dan renewal berhasil dikorelasikan ke member, invoice, transaksi, dan akun lokal.
- Nominal yang diverifikasi jelas, termasuk perlakuan biaya channel/admin.
- Periode akses 1/12 bulan terbukti untuk pembayaran pertama, renewal, pembayaran terlambat, dan batas akhir bulan.
- `expiredAt` invoice tidak dipakai sebagai batas akses; field tersebut adalah kedaluwarsa invoice.
- `nextPayment` dari registrasi tidak dipakai sebagai bukti bahwa pembayaran sudah terjadi.
- Pembatalan mempertahankan periode berbayar lokal.
- Registrasi timeout/duplicate dan renewal tanpa webhook dapat dipulihkan.
- Mapping product/tier, konfigurasi trial/grace, redirect, dan periode tahunan cocok dengan kontrak produk.

Autentikasi webhook Mayar belum terbukti dari dokumentasi yang diperiksa. Tanpa bukti tambahan, jalur fail-closed tetap menggunakan API verification dan reconciliation. Jangan mengarang signature/header provider.

### 4.5 Konfigurasi server-only

`MAYAR_API_KEY`, `MAYAR_ENV`, `APP_URL`, mapping product/tier/paket, nominal server, dan host checkout yang diizinkan. Sandbox dan production terpisah. API key, token, serta payload pribadi tidak masuk frontend atau log umum.

## 5. Google Play Android

### Verifikasi dan ownership

- Backend memanggil `purchases.subscriptionsv2.get` dengan package server dan purchase token.
- Allowlist product dan base plan dari konfigurasi server.
- Server menyediakan identitas billing opaque stabil untuk `obfuscatedAccountId`; jangan gunakan email.
- Cocokkan `externalAccountIdentifiers.obfuscatedExternalAccountId` dengan akun lokal.
- Token hanya boleh dimiliki satu akun ZenUniverse; restore tidak boleh memindahkan kepemilikan.
- Periksa `linkedPurchaseToken` dan konteks resubscribe sebelum acknowledgment.
- Out-of-app resubscribe tanpa identifier langsung hanya boleh diklaim melalui rantai ownership yang dapat diverifikasi. Jika tidak cukup, tolak klaim dan sediakan pemulihan dukungan; jangan first-claim-wins.
- Simpan kepemilikan/konteks, grant akses terverifikasi, lalu acknowledge dengan retry dan pemantauan kegagalan. Selesaikan dalam batas waktu Google yang berlaku; jangan acknowledge transaksi pending.
- Restore mengambil purchase yang tersedia dari Play dan memverifikasinya kembali di backend.

### Mapping akses

| Status Google Play | Akses Plus |
| --- | --- |
| `SUBSCRIPTION_STATE_ACTIVE` | Ya, jika line item produk yang diizinkan memiliki periode valid |
| `SUBSCRIPTION_STATE_IN_GRACE_PERIOD` | Ya, mengikuti `expiryTime` terverifikasi yang diperbarui Google |
| `SUBSCRIPTION_STATE_CANCELED` | Ya, sampai expiry |
| `SUBSCRIPTION_STATE_PENDING` | Tidak |
| `SUBSCRIPTION_STATE_ON_HOLD` | Tidak |
| `SUBSCRIPTION_STATE_PAUSED` | Tidak |
| `SUBSCRIPTION_STATE_EXPIRED` | Tidak |
| `SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED` | Tidak memberi akses baru; periksa subscription sebelumnya melalui linked token bila relevan |
| Status tidak dikenal/tidak lengkap | Tidak memberi akses baru; simpan untuk pemeriksaan |

### RTDN dan reconciliation

- Authenticated Pub/Sub push memvalidasi signature Google, issuer, expiry, expected audience, email service account, dan `email_verified`.
- Jangan memakai aturan audience mobile ID token untuk Pub/Sub.
- Validasi envelope dan package RTDN; deduplikasi message ID.
- Simpan pekerjaan secara durable sebelum mengembalikan sukses.
- RTDN memicu pengambilan state terbaru dari Google; event lama tidak boleh menimpa hasil verifikasi baru.
- Serialisasikan reconciliation per subscription/token chain agar respons concurrent tidak mundur.
- Verifikasi ulang secara terjadwal untuk memulihkan RTDN hilang, renewal, refund/revoke, dan acknowledgment yang gagal.
- Jangan memperpanjang akses melewati expiry terakhir yang terverifikasi karena provider sedang tidak tersedia.

Android memakai purchase sheet, restore, dan pengelolaan subscription Google Play. Tidak menambah checkout Mayar/WebView sebagai jalan pintas pembayaran digital. Integrasi native memerlukan repository Android terkait; kode native belum diaudit di repository ini.

## 6. Identitas bersama web/Android

- Google `sub` menjadi identitas OAuth penghubung ke `OauthAccount` dan `User` yang sama.
- Selaraskan web callback dengan resolver mobile, termasuk validation, race, dan konflik akun.
- Jangan auto-link berdasarkan email yang sama.
- Pertahankan `account_link_required`; linking memerlukan autentikasi dan pembuktian ownership, bukan bypass saat checkout.
- Subscription selalu terikat ke `User`, bukan perangkat atau alamat email pembayaran.

## 7. Learning, hearts, replay, dan freshness

### Guard konten

- Katalog dapat menampilkan metadata roadmap premium yang terkunci.
- Payload lesson premium membutuhkan entitlement server-side.
- Lindungi read lesson, submit attempt, dan complete lesson di web maupun API mobile.
- Plus tidak melewati prerequisite dan `contentRevision`.
- Draft/release document yang mengandung jawaban tidak boleh dipakai sebagai payload badge/tier.
- Asset yang memuat materi premium tidak boleh dilindungi hanya dengan menyembunyikan URL; gunakan penyimpanan privat dan akses terotorisasi bila diperlukan.
- Konten yang sudah dikirim ke perangkat tidak dapat ditarik kembali. Hindari menjanjikan perlindungan mutlak terhadap salinan lokal.

### Unlimited hearts

- Saat Plus aktif, bypass pemeriksaan hearts habis dan deduction akibat jawaban salah.
- Jangan mengubah counter menjadi angka besar atau mengisi ulang permanen.
- Counter Free dan mekanisme regenerasi lama tetap berlaku setelah expiry.
- Snapshot mengekspos status unlimited secara eksplisit; UI tidak menebak dari jumlah hearts.
- XP, streak, badge, completion, dan pemeriksaan jawaban tetap memakai service otoritatif yang sama.

### Replay dan offline

- Hitung payload hash dari request asli sebelum translasi jawaban.
- Periksa attempt existing milik akun dengan `attemptId` dan hash sebelum menolak karena entitlement habis.
- Replay accepted attempt mengembalikan hasil tersimpan tanpa reward/deduction ulang.
- Simpan data respons yang diperlukan agar replay tidak memverifikasi ulang terhadap konten yang sudah berubah.
- Pertahankan aturan `contentRevision` untuk attempt baru; replay lama tidak boleh menjadi cara mengeksekusi jawaban baru.
- Attempt offline baru yang tiba setelah expiry ditolak, meskipun dibuat perangkat sebelum expiry. Waktu perangkat bukan bukti akses.
- Error premium terminal tidak di-retry tanpa batas; UI menjelaskan bahwa jawaban belum diterima server.

### Freshness

- Tambah stamp entitlement terpisah dari `gamification.updatedAt`.
- Sertakan status akses, batas akses, revision, dan waktu evaluasi server.
- Merge freshness progress dan entitlement secara terpisah agar respons lama tidak mengembalikan status Plus lama.
- Refresh setelah checkout/restore, reconnect, focus, dan saat mencapai expiry.
- Expiry berdasarkan waktu harus mengubah hasil evaluasi meskipun tidak ada write gamification.
- Server tetap memeriksa entitlement pada setiap tindakan penting; polling/timer UI bukan pengaman akses.

## 8. Routes dan UI yang direncanakan

### Backend

- Web session-authenticated: status subscription, checkout Mayar, status checkout, pembatalan Mayar.
- `/api/v1` dengan Sanctum learner auth: status subscription, identitas billing Play, verifikasi/restore purchase.
- Webhook Mayar dan authenticated Pub/Sub RTDN: tanpa learner session, dengan validasi transport/provider dan batas input masing-masing.
- Route admin/session-authenticated yang sudah ada tidak diubah menjadi stateless API.
- Frontend web menggunakan route helper Wayfinder; generated files tidak diedit manual.

Nama/path endpoint final disesuaikan dengan pola controller dan envelope API repository ketika implementasi. Ini usulan kontrak, bukan endpoint yang sudah tersedia.

### UI

Pertahankan visual ZenUniverse dan teks Indonesia. Antislop diterapkan selama pekerjaan, bukan redesign menyeluruh.

- Pricing: paket jelas, invoice berkala versus auto-renew dijelaskan, tombol punya aksi nyata.
- Status: belum berlangganan, menunggu pembayaran, memverifikasi, aktif, gagal, kedaluwarsa, pembatalan masih aktif, serta status pemeriksaan belum pasti.
- Android: harga lokal Play, pending purchase, restore, ownership conflict, dan manage subscription.
- Roadmap: bedakan premium lock dari prerequisite lock; jangan semua course berlabel `Terbuka`.
- Lesson: unlimited hearts dan error expiry/premium jelas tanpa menghapus progress.
- Cegah pembelian ganda yang tidak perlu ketika akun sudah memiliki Plus; jangan mengklaim dapat menghentikan auto-renew provider lain.
- Semua tampilan data memiliki empty/loading/error, fokus terlihat, keyboard access, dan layout mobile tanpa overflow.
- Tidak menambah aset, testimonial, atau klaim benefit yang belum nyata.

## 9. Peta file

### File baru yang diusulkan

- `config/billing.php`: paket server, mapping provider, dan transport settings.
- Migration baru di `database/migrations/`: access tier dan persistence billing.
- `app/Models/Subscription.php`, `BillingCheckout.php`, `BillingEvent.php`.
- `app/Services/Billing/`: entitlement, Mayar checkout/verification, Google Play verification, dan reconciliation; tanpa interface/factory yang belum dibutuhkan.
- Controller/request billing dalam pola folder web dan `Api/V1` yang sudah ada.
- Job verification/reconciliation dan scheduled command bila diperlukan.
- Halaman subscription di `resources/js/pages/`.
- Test billing/provider dan entitlement sesuai konvensi suite existing.

### File existing yang berubah

| Area | Path |
| --- | --- |
| Model konten | `app/Models/Course.php` |
| Publication | `app/Services/Content/CoursePublisher.php`, `ContentValidator.php` |
| CMS | `app/Filament/Admin/Resources/Courses/CourseResource.php`, `Pages/EditCourse.php` |
| Import/export | `app/Services/Content/ContentImporter.php`, `scripts/export-content.mts` |
| Payload/access | `app/Services/Content/PublishedContent.php`, `LessonAccess.php` |
| Learner controllers | `app/Http/Controllers/LearnController.php`, `LessonController.php`, `Api/V1/LearningController.php` |
| Google identity | `app/Http/Controllers/Auth/GoogleAuthController.php`, `app/Services/Auth/ResolveGoogleAccount.php`, verifier sesuai kebutuhan |
| Learning | `app/Services/Learning/SubmitAttempt.php`, `GamificationService.php`, `ProgressSnapshot.php` |
| Routing | `routes/web.php`, `routes/api.php`; registration schedule sesuai struktur repository |
| Frontend | `resources/js/components/landing/pricing.tsx`, `resources/js/pages/learn.tsx`, `dashboard.tsx`, `resources/js/components/lesson/lesson-player.tsx`, `resources/js/lib/progress/`, `resources/js/types/lesson.ts` |
| API contracts | `docs/api/mobile-integration.md`, `docs/api/openapi.yaml`, `docs/api/zenuniverse.postman_collection.json` |
| Configuration | Server environment example/config sesuai pola repository; queue configuration hanya bila ada kebutuhan nyata |

Tidak ada penghapusan file yang direncanakan. Tidak mengubah aset desain atau pekerjaan uncommitted yang tidak terkait.

## 10. Urutan implementasi

1. **Foundation:** schema, resolver identitas bersama, entitlement, constraint ownership, dan test waktu. Pembelian belum dibuka.
2. **Konten dan learning:** staged tier publication, guard reads/writes, hearts, replay, freshness, kompatibilitas import/export.
3. **Mayar sandbox:** checkout, verification, cancellation, webhook/reconciliation. Buktikan paid period sebelum membuka pembelian web.
4. **Google Play test track:** backend verification, native purchase/restore, acknowledgment, RTDN, renewal, grace, hold, revoke, linked tokens.
5. **UI dan kontrak:** status lengkap, harga benar, aksesibilitas, Wayfinder, OpenAPI/Postman/mobile docs.
6. **Rollout terpisah:** buka hanya provider yang lulus gerbang; gangguan billing tidak mematikan materi Free. Pantau failed jobs, subscription belum terverifikasi, acknowledgment, serta reconciliation.

Tidak menjalankan provisioning provider, migrasi produksi, atau perubahan webhook sebelum konfigurasi dan target environment disetujui.

## 11. Test dan acceptance gates

### Konten/CMS

- Seluruh course lama tetap Free.
- Tier draft tidak mengubah learner projection sebelum publish.
- Tier-only publish menghasilkan revision yang benar; historical document/hash tetap utuh.
- Invalid/missing tier, duplicate course, historical hash reuse, dan legacy import tidak membuka premium tanpa sengaja.
- Payload learner mengekspos hanya metadata allowlisted; jawaban dan draft/release tetap tersembunyi.

Extend suite existing: `CoursePublishProjectionTest.php`, `CmsTest.php`, `FilamentCourseResourceTest.php`, `ContentImportTest.php`, `PublishedContentTest.php`, `ContentLeakTest.php`, dan `scripts/export-content.test.ts`.

### Billing/provider

- Redirect palsu, webhook palsu/replay, nominal salah, produk salah, dan akun/token lain tidak memberi akses.
- Klik ganda, timeout setelah provider berhasil, worker crash, event terbalik, dan respons concurrent pulih tanpa fulfillment ganda.
- Renewal tidak menggandakan periode.
- Cancel, expiry, refund/revoke, dan dua sumber aktif menghasilkan akses yang benar.
- Play pending/grace/hold/pause/restore/linked tokens dan acknowledgment retry teruji.
- Mayar term 1/12 bulan dan biaya channel/admin dibuktikan dari sandbox, bukan fixture asumsi.

### Learning/sync

- Plus bisa belajar dengan counter Free nol tanpa deduction tambahan.
- Expiry memulihkan aturan Free tanpa kehilangan progress atau mengubah XP.
- Prasyarat tetap berlaku pada Plus.
- Accepted-attempt replay setelah expiry/revision berubah tidak memberi reward/deduction ulang.
- Payload berbeda dengan `attemptId` sama tetap konflik.
- Offline attempt baru setelah expiry ditolak dengan error yang tidak menyebabkan retry loop.
- Snapshot terlambat dan pergantian akun tidak membocorkan atau mengembalikan entitlement lama.

### Pemeriksaan repository

- `npm test` untuk suite JavaScript native Node.
- Focused PHP tests selama perubahan.
- `npm run build` untuk build dan generation Wayfinder.
- `composer ci:check` untuk gate repository.
- Test konkurensi MySQL memakai database khusus disposable; SQLite tidak membuktikan locking MySQL.
- E2E memakai database yang diizinkan guard existing, bukan data development. Setup E2E menjalankan `migrate:fresh --seed --force` dan menghapus `public/hot`.
- Jangan menjalankan `composer setup` sebagai perbaikan rutin pada environment existing karena regenerasi key dan migrasi.

## 12. Hal yang masih perlu review

- Bukti sandbox Mayar untuk paid period, annual term, renewal terlambat, dan fee handling merupakan blocker rilis web.
- Kebijakan pindah bulanan/tahunan, proration, dan perpindahan provider belum ditetapkan. Jangan membangun upgrade/downgrade otomatis sebelum aturan disetujui; rilis awal dapat membatasi pembelian baru saat Plus masih aktif dan mengarahkan pengelolaan ke provider asal.
- Repository Android, package name, product/base-plan IDs, serta akses Play Console perlu tersedia untuk pekerjaan native dan test track.
- Konfigurasi queue worker, scheduler, service account Google, dan authenticated Pub/Sub push perlu dipastikan pada hosting target.
- Perubahan lifecycle CMS dibatasi pada kebutuhan access tier dan correctness publication; bukan rewrite CMS menyeluruh.

## 13. Sumber dokumentasi

Rencana ditopang audit repository read-only, Context7, serta dokumentasi resmi provider. Belum ada live Mayar calls atau bukti sandbox.

- [Mayar documentation index](https://docs.mayar.id/llms.txt)
- [Register membership member](https://docs.mayar.id/api-reference-v2/membership/register.md)
- [Create membership invoice](https://docs.mayar.id/api-reference-v2/membership/createinvoice.md)
- [Get membership member detail](https://docs.mayar.id/api-reference-v2/membership/memberdetail.md)
- [Cancel membership](https://docs.mayar.id/api-reference-v2/membership/cancel.md)
- [Membership tiers](https://docs.mayar.id/api-reference-v2/membership/tiers.md)
- [Transaction detail](https://docs.mayar.id/api-reference-v2/transaction/detail.md)
- [Mayar webhook](https://docs.mayar.id/integration/webhook.md)
- [Google Play subscription resource](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2)
- [Google Play subscription lifecycle](https://developer.android.com/google/play/billing/lifecycle/subscriptions)
- [Google Play billing security](https://developer.android.com/google/play/billing/security)
- [Google Play RTDN reference](https://developer.android.com/google/play/billing/rtdn-reference)
- [Authenticated Pub/Sub push](https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions)

Context7 library IDs yang digunakan dalam riset: `/websites/mayar_id`, `/laravel/docs/__branch__13.x`, `/websites/developer_android_google_play_billing`, dan `/websites/developers_google_android-publisher`.
