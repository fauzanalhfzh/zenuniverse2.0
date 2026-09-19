# Zenuniverse Rewrite: Laravel + Inertia + React

**Tujuan:** Pindahkan fitur Zenuniverse lama ke boilerplate yang sudah dibuat, tanpa scaffold ulang atau frontend terpisah.

**Arsitektur:** Laravel 13 + Inertia 3 + React 19, routing Laravel/Wayfinder, autentikasi Google dengan session Laravel. **Semua kode React target berada di `resources/js/`.** Database memakai **MySQL 8.0.30 yang sudah berjalan melalui Laragon**.

**Status:** Dokumen rencana + progres nyata. Task scaffold/setup awal dihapus karena boilerplate sudah tersedia. MySQL berjalan berdasarkan konfirmasi pengguna; koneksi aplikasi dan isolasi database test diperiksa saat mengerjakan migration. Per **19 Sep 2026** Task 1–6 dan 10 selesai; Task 7 sebagian (provider sesi ikut di Task 9), Task 8 sebagian (smoke browser belum), Task 9 sebagian (Blockly/Monaco belum); Task 11–12 belum. Centang di bawah hanya untuk yang benar-benar ada; item yang belum dikerjakan tetap `[ ]` beserta catatan.

## 1. Keputusan yang sudah disepakati

- Pertahankan boilerplate root, `composer.json`, `package.json`, `vite.config.ts`, Inertia, dan tooling existing. Tidak membuat proyek Laravel/Vite kedua, tidak mengulang setup, tidak mengganti APP_KEY.
- Halaman React: `resources/js/pages/`. Komponen: `resources/js/components/`. Helper: `resources/js/lib/`. State: `resources/js/stores/`. Tipe: `resources/js/types/`.
- **Tidak membuat folder `web/` di target.** Path `LEGACY/apps/web/` dalam dokumen ini hanya menunjuk source lama yang akan dipindahkan.
- MySQL tepat **8.0.30 Laragon**, InnoDB, `utf8mb4`. Tidak ada task instalasi/start MySQL, upgrade versi, atau Docker development.
- UI/konten Bahasa Indonesia; locale aplikasi `id`, HTML `lang="id"`. Pertahankan visual, Fredoka/Figtree, aksesibilitas, dan reduced motion dari source.
- Baseline fitur mengikuti frontend lama dan jalur backend Supabase yang digunakannya. Elysia menjadi referensi kontrak dan validasi tambahan.
- Google-only login; gunakan Socialite dan session `web`. Tidak menambah email/password, Fortify, Sanctum, React Router, atau Bearer token localStorage.
- Akun, progress, XP, avatar pengguna, session, dan role admin lama tidak dimigrasikan. Pengguna login kembali sebagai akun baru; admin ditetapkan ulang secara eksplisit.
- Konten diambil dari repository, bukan database CMS live. C++ tetap draft. Draft/release history/aset Storage yang hanya ada di database lama tidak ikut migrasi.
- CMS lengkap, leaderboard all-time, hearts configurable, outbox, dan profile/avatar tetap masuk scope. Jangan menyederhanakan CMS menjadi course CRUD.
- Browser merender Blockly/Monaco dan simulasi; server memverifikasi jawaban serta menghitung completion/XP/hearts/streak/badge. Tidak mengeksekusi kode pengguna di PHP atau proses shell.
- Source, database, dan layanan lama tetap utuh. Jangan menjalankan importer live, reset legacy, atau menghapus direktori lama.
- Setiap perubahan perilaku memiliki regression test: FAIL yang relevan, implementasi, PASS. Commit hanya atas permintaan pengguna.
- Selama revisi dokumen ini, aplikasi, dependency, konfigurasi Laragon, dan database tidak diubah.

## 2. Lokasi source dan struktur target

| Peran                 | Lokasi                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Target                | `/mnt/c/laragon/www/zenuniverse`                                                                                                        |
| `LEGACY`              | `/home/zen/Documents/Development/zenuniverse-fe`                                                                                        |
| Sumber konten         | `LEGACY/packages/content/src/`                                                                                                          |
| Sumber UI dan aset    | `LEGACY/apps/web/components/`, `LEGACY/apps/web/app/`, `LEGACY/apps/web/public/`                                                        |
| Kontrak referensi     | `LEGACY/docs/backend-elysia-prd.md`, `LEGACY/packages/contracts/src/domain.ts`                                                          |
| Aturan progress aktif | `LEGACY/apps/web/lib/progress/actions.ts`, `LEGACY/supabase/migrations/`                                                                |
| Submission/evaluator  | `LEGACY/packages/content/src/submission.ts`, `validation.ts`, `blockly-evaluator.ts`, `code-evaluator.ts`, `code-practice-evaluator.ts` |
| Outbox                | `LEGACY/apps/web/lib/progress/outbox.ts`                                                                                                |

```text
zenuniverse/
├── app/
│   ├── Http/Controllers/
│   │   ├── Auth/GoogleAuthController.php
│   │   ├── LearnController.php
│   │   ├── LessonController.php
│   │   ├── ProgressController.php
│   │   └── Admin/
│   ├── Http/Requests/
│   ├── Http/Resources/
│   ├── Models/
│   ├── Policies/
│   ├── Services/Content/
│   ├── Services/Learning/
│   └── Services/GamificationService.php
├── routes/web.php
├── resources/
│   ├── css/app.css
│   ├── views/app.blade.php
│   └── js/
│       ├── app.tsx
│       ├── pages/
│       ├── components/
│       ├── lib/
│       ├── stores/
│       └── types/
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── ContentSeeder.php
│       └── data/
├── scripts/export-content.mts
├── tests/Feature/
├── tests/Unit/
├── tests/Fixtures/
├── tests/e2e/
├── composer.json
├── package.json
└── vite.config.ts
```

`resources/js/actions/`, `resources/js/routes/`, dan `resources/js/wayfinder/` mengikuti generator existing, bukan diedit manual. Dump privat disimpan di `database/seeders/data/`, bukan `public/` atau bundle frontend.

## 3. Audit stack

Snapshot audit **18 September 2026**, dari lockfile target, metadata npm/Packagist, dan dokumentasi Context7. Versi terbaru tidak berarti seluruh upgrade wajib dilakukan sebelum fitur dimulai. Tidak ada task upgrade massal/tooling ulang.

| Stack                | Terpasang/teramati saat audit                 | Terbaru saat audit           | Keputusan                                                                                      |
| -------------------- | --------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| PHP                  | 8.5.0 lokal; CI 8.3                           | 8.5.10                       | Pertahankan lingkungan yang tersedia; patch/penyelarasan CI dilakukan terpisah bila diperlukan |
| Laravel              | 13.32.0                                       | 13.32.0                      | Pertahankan                                                                                    |
| Inertia Laravel      | 3.3.4                                         | 3.3.4                        | Pertahankan                                                                                    |
| Inertia React/Vite   | 3.7.1                                         | 3.7.1                        | Pertahankan                                                                                    |
| React/React DOM      | 19.3.0                                        | 19.3.0                       | Pertahankan                                                                                    |
| Vite                 | 8.3.0                                         | 8.3.0                        | Pertahankan                                                                                    |
| Tailwind/plugin Vite | 4.3.3                                         | 4.3.3                        | Pertahankan                                                                                    |
| Vite Plus            | 0.3.0                                         | 0.3.3                        | Patch opsional setelah compatibility check                                                     |
| TypeScript           | 5.9.3                                         | 7.0.2                        | Tidak memaksa upgrade major dalam port                                                         |
| PHPUnit              | 12.5.35                                       | 13.3.4                       | Tetap baseline; versi 13 memerlukan PHP ≥8.4.1, berbeda dengan CI lama                         |
| Vitest               | 4.1.11 transitif Vite Plus                    | 5.0.1                        | Pakai runner kompatibel dengan Vite Plus, bukan memasang dua major                             |
| Node.js              | 24.18.1 lokal; CI 22                          | 24.21.0 LTS / 26.9.0 Current | Utamakan LTS, jangan upgrade hanya demi angka terbaru                                          |
| npm                  | 11.17.0                                       | 12.0.2                       | Tidak upgrade otomatis                                                                         |
| Composer             | 2.8.12                                        | 2.10.3                       | Tidak upgrade otomatis                                                                         |
| MySQL                | **8.0.30 Laragon**, berjalan menurut pengguna | Bukan target upgrade         | **Tetap 8.0.30**                                                                               |

Tooling existing yang telah diperiksa: Tinker 3.0.2, Wayfinder PHP 0.1.21/plugin Vite 0.1.10, Larastan 3.12.1, Pint 1.32.1, Pail 1.2.7, Pao 1.1.5, Sail 1.67.0, Faker 1.24.1, Mockery 1.6.15, Collision 8.9.5, plugin React 6.1.1, Laravel Vite plugin 3.2.0, Babel React Compiler 1.0.0. Semuanya sama dengan rilis terbaru yang diperiksa saat audit. Sail tidak dipakai untuk mengganti Laragon.

Dependency fitur ditambahkan hanya ketika task memerlukannya:

| Fitur                       | Versi terbaru yang diperiksa                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Google OAuth                | `laravel/socialite` 5.31.0                                                                               |
| Blockly                     | `blockly` 13.3.0                                                                                         |
| Monaco                      | `monaco-editor` 0.56.0, `@monaco-editor/react` 4.7.0                                                     |
| Animasi                     | `gsap` 3.15.0, `@gsap/react` 2.1.2                                                                       |
| State                       | `zustand` 5.0.15                                                                                         |
| UI                          | `@base-ui/react` 1.8.0, `class-variance-authority` 0.7.1, `lucide-react` 1.47.0, `tw-animate-css` 1.4.0  |
| Efek source, jika digunakan | `framer-motion` 13.4.0, `ogl` 1.0.11                                                                     |
| Schema TS                   | `zod` 4.6.5; jalankan fixture source sebelum menaikkan versi dari source 4.4.3                           |
| E2E                         | `@playwright/test` 1.63.0                                                                                |
| Export TS                   | Tanpa dependency baru: loader `scripts/register-ts.mjs` + type-stripping Node 24                         |
| Font alternatif             | `@fontsource/figtree`, `@fontsource/fredoka` 5.3.0; utamakan fasilitas font plugin existing bila memadai |

Jangan membawa Next.js, Supabase SDK, Elysia, Better Auth, Drizzle/PostgreSQL, Vercel Speed Insights, atau `server-only` ke target. Tipe Node mengikuti major runtime, bukan otomatis versi terbaru; native binary packages mengikuti parent tooling, tidak dinaikkan sendiri.

Sumber pemeriksaan:

- Context7: `/laravel/docs/__branch__13.x`, `/inertiajs/docs`, `/websites/dev_mysql_doc`.
- [Laravel authentication](https://github.com/laravel/docs/blob/13.x/authentication.md), [database](https://github.com/laravel/docs/blob/13.x/database.md).
- [Inertia authentication](https://github.com/inertiajs/docs/blob/main/v3/security/authentication.mdx), [routing](https://github.com/inertiajs/docs/blob/main/v3/the-basics/routing.mdx).
- Metadata npm `https://registry.npmjs.org/`, Packagist `https://repo.packagist.org/`, [PHP](https://www.php.net/releases/index.php?json&version=8.5), [Node](https://nodejs.org/dist/index.json), [Composer](https://getcomposer.org/versions).
- Halaman rilis MySQL mengembalikan 403 saat audit; versi GA terbaru tidak diklaim terverifikasi. Pengguna memilih 8.0.30 secara eksplisit. Pemeriksaan versi ini bukan security audit atau verifikasi koneksi database.

## 4. Kontrak dan keamanan

### Routing/auth

Gunakan `routes/web.php`, middleware session/CSRF, Inertia page responses, dan endpoint JSON same-origin untuk kebutuhan player/outbox. Tidak membuat API mirror untuk setiap halaman.

- `GET /`, `/login`, `/learn`, `/dashboard?course=...`, `/lesson/{lesson}`, `/profile`, `/leaderboard`.
- `GET /auth/google/redirect`, `/auth/google/callback`; `POST /logout`.
- `POST /learning/attempts`, `/learning/lessons/{lesson}/complete`; `GET /me/progress`.
- Route `/admin/...` memerlukan auth dan policy admin, termasuk preview/assets.
- Shared props hanya identitas minimum; OAuth secret/token tidak dikirim ke browser. Google subject menentukan identitas; jangan auto-link berdasarkan email.

### Submission

Request mengirim `attemptId` UUID, `contentRevision` wajib, `lessonId`, `stepId`, dan `answer` sesuai tipe:

| Tipe         | Jawaban browser      | Verifikasi server                                          |
| ------------ | -------------------- | ---------------------------------------------------------- |
| concept      | `acknowledged: true` | Jenis step dan acknowledgement                             |
| quiz         | `optionId`           | Pemetaan ke opsi milik step dan jawaban privat             |
| blockly      | `commands`           | Simulasi deterministik challenge server                    |
| code-arrange | `tokenIds`           | Urutan lengkap tanpa duplikasi                             |
| code-fill    | `answers`            | Blank keys valid; trimmed, case-sensitive accepted answers |
| code         | `code`               | Normalisasi/perbandingan source, bukan eksekusi kode       |

Server menolak field actor/XP/result/correct/completed yang dibuat client. Batasi request 128.000 byte, ID 160 karakter, code 20.000 karakter, fill 500 entries/2.000 karakter per value, token 500. Blockly membatasi repeat/depth/visits sesuai fixture source; schema, ukuran, dan structural limits diperiksa sebelum evaluasi berat.

Verifikasi published revision dan mutasi reward harus atomik. Unique `(user_id, attempt_id)` serta payload hash membedakan retry sah dengan reuse ID untuk jawaban lain. Replay tidak menggandakan XP atau pengurangan hearts. Return outcome tersimpan dan snapshot server; jangan percaya clock atau counter client.

Public DTO memakai allowlist per tipe, tanpa `validation`, `correctOptionId`, `correctOrder`, `acceptedAnswers`, atau `content.expectedCode`. Opaque option/token IDs menghindari bocoran seperti ID `correct` atau ID berurutan sesuai solusi. Stable lesson/step IDs tetap dipertahankan.

JSON error membedakan session expired 401, forbidden 403, not found 404, revision/attempt/hearts conflict 409, oversized 413, CSRF expired 419, invalid input 422, dan throttle 429. Jawaban salah yang valid bukan error bentuk input. Pesan UI Bahasa Indonesia; error tidak membocorkan solusi atau draft CMS.

### Database dan aturan produk

Gunakan InnoDB, strict mode, `utf8mb4`; ID case-sensitive memakai collation biner yang konsisten pada PK/FK. Timestamp UTC, tanggal daily/streak `Asia/Jakarta`.

| Kelompok | Tabel/invariant                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Akun     | users existing + `oauth_accounts`; unique provider/subject; admin default false; session Laravel                              |
| Konten   | courses, units, lessons, lesson_steps; stable IDs, reward, order, icon, planned IDs, challenge, content dan validation privat |
| CMS      | course_drafts, immutable course_releases, reserved_content_ids, admin_audits; revision conflict detection                     |
| Progress | lesson_attempts, step_completions, lesson_completions; unique completion per user/stable ID, termasuk reward nol              |
| XP/daily | xp_transactions append-only dengan event key unik per user; daily_activities unik per user/tanggal                            |
| State    | user_gamification satu row per user; user_badges unik per user/badge                                                          |
| Hearts   | heart_settings versioned; heart_events idempotent dan audit adjustment                                                        |

Published projection diperbarui dalam transaksi publish yang sama dengan release pointer. Jangan mengedit projection terpisah. Archive mempertahankan histori/progress; hard-delete hanya draft yang belum pernah published/direferensikan. Reservasi ID mencegah penggunaan ulang ID lama untuk konten berbeda.

Lock order konsisten: course/revision, settings, user state, kemudian attempt/completion/ledger. Admin hearts mengikuti settings sebelum user. Uji dengan beberapa koneksi MySQL; SQLite tidak membuktikan row-lock/concurrency parity.

Aturan baseline:

- Level Beginner 0, Explorer 100, Coder 250; final level percent 100 dan `nextXp` 500.
- Daily earned-XP goal 50, bonus sekali sehari 50; bonus tidak menambah earned-XP counter daily.
- Course completion bonus 100 setelah semua lesson wajib/planned selesai; step/lesson reward berasal dari content.
- Jangan menambah perfect-lesson bonus hanya karena konstanta 25 ada; jalur authoritative source yang diaudit tidak memberikannya.
- Hearts default 5, regen 5 menit; admin dapat mengatur kapasitas 1–100 dan regen 1–1440 menit.
- Mistake event idempotent; incomplete arrange/fill dan kode kosong tidak mengurangi hearts. Successful completion dengan hearts nol ditolak sesuai baseline aktif.
- Badge `first-step` setelah lesson pertama, `block-master` setelah challenge pertama, `week-warrior` setelah streak 7.
- Leaderboard all-time: total XP DESC, account created_at ASC, user ID ASC. Bukan mingguan.

## 5. Pekerjaan tersisa

**Task scaffold/tooling awal dan setup/start MySQL dikeluarkan dari daftar.** Penomoran berikut baru; mulai dari ekspor konten. Test runner yang belum tersedia ditambahkan saat task pertama yang memerlukannya, bukan melalui scaffold ulang.

### Task 1: Export konten repository

**Files:** `scripts/export-content.mts`, `scripts/export-content.test.ts`, `database/seeders/data/content-dump.json`, `content-dump.meta.json` dalam direktori yang sama.

- [x] Test exporter dengan fixture untuk generated practices, duplicate ID, urutan, private validation, Blockly challenge, dan status C++ (`scripts/export-content.test.ts`, 5 test).
- [x] Muat enam course hasil builder secara eksplisit dari `LEGACY`, tidak menghitung raw lesson files atau bergantung pada `NODE_ENV`. `addCodePracticeSteps` menghasilkan object/array baru dan menyusun ulang step.
- [x] Ekspor schema version, course status, counts per course, source revision/hash (`d0c3c40`), dan checksum canonical. Export time tidak masuk checksum content.
- [x] Jalankan dua ekspor; hash/count identik (6 course / 30 unit / 62 lesson / 413 step). C++ draft; lima course lain published.
- [x] Dump ada di `database/seeders/data/`, tidak diimpor frontend/bundle. Fixture parity TS belum dibuat sebagai berkas terpisah; parity diuji langsung sebagai unit test PHP (Task 4).

**Gate:** test exporter lulus dan jumlah aktual dicatat. Source memiliki enam definisi course, bukan tujuh; hitungan statis sekitar 62 lesson bukan pengganti hasil ekspor runtime.

### Task 2: Google auth dan otorisasi

**Files:** `app/Http/Controllers/Auth/GoogleAuthController.php`, `app/Models/User.php`, `config/services.php`, `routes/web.php`, `app/Http/Middleware/HandleInertiaRequests.php`, migration `oauth_accounts`, `tests/Feature/GoogleAuthTest.php`.

- [x] Socialite dipasang; test mock provider untuk akun baru, login ulang subject sama, dan konflik email berbeda subject (`GoogleAuthTest`). _Belum_ ada test invalid state / cancel provider / redirect eksternal.
- [x] Gunakan OAuth stateful, session regeneration saat login, invalidate session + regenerate CSRF saat logout; jangan memakai `stateless()`.
- [x] Password nullable untuk Google-only; tidak menambah form register/password reset. Admin ditetapkan lewat `is_admin` (operator), bukan dari request/domain email.
- [x] Koneksi Laragon diperiksa; DB development `zenuniverse_db` dan test `zenuniverse_test` terpisah; APP_KEY/setup/legacy tidak disentuh.
- [x] Guard `ProgressConcurrencyTest`/`CmsConcurrencyTest` memeriksa driver `mysql` dan nama DB berakhiran `_test` sebelum `DatabaseMigrations`; integrasi memakai MySQL 8.0.30, unit pure tanpa DB.

**Gate:** `php artisan test --filter=GoogleAuthTest` lulus pada DB test. Menjalankan server Laragon tidak otomatis membuktikan `.env` aplikasi sudah memakai MySQL; periksa koneksi, jangan instal/start ulang server.

### Task 3: Schema konten dan seed

**Files:** migration/model content pada bagian 4, `app/Enums/StepType.php`, `app/Services/Content/ContentImporter.php`, `database/seeders/ContentSeeder.php`, `tests/Feature/ContentImportTest.php`.

- [x] Test constraint, rollback import invalid, ID duplicate, dan idempotent re-import (`ContentImportTest`).
- [x] Pertahankan content/challenge/planned IDs dan private answers; enam tipe step didukung.
- [x] Import projection published dari dump Task 1; C++ draft tidak muncul di player published.
- [x] Cocokkan counts/order DB dengan manifest (413 step). Importer menolak overwrite buta (`updateOrCreate` hanya dari dump terverifikasi).
- [x] Tabel CMS (drafts/releases/reserved IDs/audit) di Task 6; guard overwrite admin ada di `CoursePublisher`.

**Gate:** `php artisan test --filter=ContentImportTest` lulus; seed tidak menghapus user/progress.

### Task 4: Verifier PHP dan gamifikasi server

**Files:** `app/Services/Learning/StepVerifier.php`, `BlocklyVerifier.php`, `CodeVerifier.php`, `SubmitAttempt.php`, `app/Services/GamificationService.php`, `app/Http/Requests/SubmitStepRequest.php`, `app/Http/Controllers/ProgressController.php`, migration progress/ledger/hearts, `tests/Unit/StepVerifierTest.php`, `tests/Feature/ProgressTest.php`, `ProgressConcurrencyTest.php`.

- [x] Parity enam evaluator (benar, salah, incomplete, malformed, whitespace) di `StepVerifierTest`; resource limit Blockly diuji (`too_many_blocks`, `step_limit`).
- [x] Route memakai web middleware: auth, CSRF, throttle, cek lesson/step dan published revision.
- [x] Test step milik lesson lain (422), zero hearts (409), stale revision (409), duplicate/conflicting attempt (409), dan replay tanpa XP ganda.
- [x] Transaksi meliputi attempt, completion, ledger, daily/streak/hearts/badges; reward nol tetap menghasilkan completion.
- [x] Test streak, bonus daily/course sekali, badge threshold, level cap (`GamificationRulesTest`, `GamificationServiceTest`).
- [x] Uji proses paralel nyata di MySQL 8.0.30 (`ProgressConcurrencyTest`, 3 skenario) + retry deadlock.

**Gate:** suite verifier, progress, dan concurrency lulus; PHP tidak pernah mengeksekusi kode pengguna.

### Task 5: Read model dan DTO Inertia

**Files:** `app/Http/Controllers/LearnController.php`, `LessonController.php`, `app/Services/Content/PublishedContent.php`, `app/Services/Content/PublicId.php`, `resources/js/types/lesson.ts`, `tests/Feature/PublishedContentTest.php`, `routes/web.php`.

Allowlist dibangun di `PublishedContent` (bukan `LessonResource`) agar satu sumber dipakai controller, test, dan verifier. `PublicId` memetakan option/token privat ke ID opaque per revisi; `SubmitAttempt` menerjemahkannya kembali sebelum verifikasi.

- [x] Test guest/auth, draft 404, unlock 403, course order, dan lesson-step mismatch.
- [x] Controller mengirim props Inertia dengan public DTO + `contentRevision`; model/CMS tidak diserialisasi utuh.
- [x] Test rekursif tidak ada `validation`/`expectedCode`/`explanation`/`correctOrder`/`acceptedAnswers` di payload.
- [x] Opaque option/token IDs per revisi (`PublicId`) dan `SubmitAttempt` menerjemahkannya kembali; stable IDs tetap.

**Gate:** `php artisan test --filter=PublishedContentTest` lulus sebelum port player.

### Task 6: Backend CMS, hearts settings, dan admin pemain

**Files:** `app/Http/Controllers/Admin/`, `app/Policies/CoursePolicy.php`, `app/Services/Content/CoursePublisher.php`, Form Requests, `tests/Feature/CmsTest.php`, `CmsConcurrencyTest.php`, `HeartSettingsTest.php`, `PlayerHeartsTest.php`.

- [x] Non-admin 403 (termasuk JSON/preview/assets); guest 401. Role browser tidak menentukan akses.
- [x] create/save/publish/archive/restore/delete + duplication + release history + audit + preview. Expected revision → 409 `revision_conflict`.
- [x] Publish tervalidasi (`invalid_content`) dan mengubah projection + release + reserved IDs + audit atomik; structure-lock ID/tipe/urutan → 422 `locked_structure`.
- [x] Preview draft tidak memberi reward; archive/restore mempertahankan progress; `reserved_content_ids` mencegah ID dipakai ulang; delete ditolak setelah publish.
- [x] Hearts settings versioned + clamp kapasitas, player adjustment idempotent dengan alasan/audit dan `expected_hearts`; rentang nilai & conflict diuji (`HeartSettingsTest`, `PlayerHeartsTest`). Race dengan submission masih mengandalkan lock order + `CmsConcurrencyTest` untuk publish.

**Gate:** suite CMS/hearts lulus di MySQL 8.0.30, termasuk publish-versus-submission concurrency.

### Task 7: Transport client, outbox, dan sinkronisasi

**Files:** `resources/js/lib/progress/client.ts`, `outbox.ts`, `outbox.test.ts`, `resources/js/components/progress/progress-session-provider.tsx`, `resources/js/stores/gamification.store.ts` dan tests.

- [x] `client.ts` fetch same-origin + cookie/CSRF; Inertia untuk navigation. Tidak ada token localStorage.
- [x] `outbox.ts` per-user maks 100 job, dedup, retry/backoff, isolasi per-user, persist; provider sesi flush + submit (`lib/progress/session.tsx`).
- [ ] Test offline/5xx, 401, 419, 409, 429 lengkap belum ada; logika mapping ada di provider, test saat ini mencakup client+outbox (dedup/cap/backoff/drop/isolasi/persist).
- [x] Snapshot server merekonsiliasi state (`setProgress(result.progress)`); store bukan sumber XP.
- [ ] Pengganti Realtime (BroadcastChannel/polling) belum dibuat.

**Gate:** test transport/outbox lulus. Pilihan dan batas latensi pengganti Realtime harus disetujui sebelum cutover, bukan menghapus fitur sinkronisasi diam-diam.

### Task 8: Port landing, layout, dan login ke resources/js

**Files:** `resources/js/pages/home.tsx`, `auth/login.tsx`, `resources/js/components/landing/`, `layout/`, `ui/`, `resources/css/app.css`, `resources/views/app.blade.php`, `vite.config.ts`, `public/`.

- [x] Komponen landing/auth dipindah ke `resources/js` (bukan menyalin app baru).
- [x] `next/image`→`<img>`, `next/link`→Inertia `Link`, `next/navigation` dibuang; entri page dinamis di `@vite` dihapus.
- [x] CSS tokens, Fredoka/Figtree (`@fontsource`), Base UI button, aset gambar/audio disalin; `app.blade.php` `lang="id"` + csrf meta.
- [x] GSAP lifecycle (useGSAP/ScrollTrigger) & reduced-motion dari source; dialog Base UI untuk login modal.
- [x] Login Google memakai route Task 2; tidak ada halaman email register/reset.
- [ ] Smoke browser mobile/desktop/keyboard belum dijalankan (hanya build/typecheck/lint).

**Gate:** root frontend lint/typecheck/build dan smoke mobile/desktop/keyboard lulus. Tidak ada frontend `web/` baru.

### Task 9: Learn, dashboard, dan player enam tipe

**Files:** `resources/js/pages/learn.tsx`, `dashboard.tsx`, `lesson/show.tsx`, `resources/js/components/course/`, `dashboard/`, `lesson/`, `resources/js/lib/content/`, `resources/js/stores/lesson-store.ts`, tests terkait, `tests/e2e/lesson.spec.ts`.

- [x] Learn + dashboard: katalog, path per unit, lock/completed dari server (`PublishedContent`), link ke `/lesson/{id}`.
- [ ] Concept, quiz, arrange, fill sudah mengirim raw answer lewat transport; **Blockly dan code belum** (placeholder "belum tersedia", tidak menilai). Client tidak mengirim outcome.
- [ ] Lazy-load Blockly/Monaco + worker Vite belum; belum ada simulator Blockly browser.
- [ ] Hints/audio/zero-hearts blocking/offline recovery/content-changed flow belum diuji end-to-end (server sudah mengembalikan kode error).
- [ ] E2E enam tipe, mistake/incomplete/success, retry setelah reload, ganti akun, dan revisi berubah belum dibuat.

**Gate:** unit/store tests dan E2E player lulus; manipulasi client flags tidak menaikkan XP.

### Task 10: Profile/avatar dan leaderboard all-time

**Files:** `app/Http/Controllers/ProfileController.php`, `LeaderboardController.php`, `resources/js/pages/profile.tsx`, `leaderboard.tsx`, `resources/js/components/profile/`, `tests/Feature/ProfileTest.php`, `LeaderboardTest.php`.

- [x] Profil menampilkan nama/avatar/joined year/level/lesson totals/badge (`ProfileController`, `ProfileView`); tidak ada editor lain.
- [x] Upload avatar ≤2 MiB, JPEG/PNG/WebP via finfo, nama file server, path per user, SVG/non-image ditolak (`AvatarService`).
- [x] Avatar lama dihapus hanya setelah file baru tersimpan dan DB tersimpan; file baru dibersihkan bila save gagal.
- [x] Leaderboard all-time `total_xp DESC, created_at ASC, id ASC`, pagination 25, `viewerRank` di luar halaman, email tidak dibagikan (`HandleInertiaRequests` hanya id+name).
- [x] Test ties, XP nol, rank di luar halaman (28 peserta), upload palsu/oversized/SVG, dan avatar lama tetap saat upload gagal.

**Gate:** kedua feature suite dan UI smoke lulus; tidak membuat leaderboard mingguan.

### Task 11: Port UI CMS dan admin lengkap

**Files:** `resources/js/pages/admin/`, `resources/js/components/admin/`, `resources/js/lib/content/cms-schema.ts`, editor helpers/tests, `tests/e2e/cms.spec.ts`, `hearts.spec.ts`.

- [ ] Port editor course/unit/lesson/step, duplicate, assets, draft save/publish, archive/restore/delete, preview, history/audit.
- [ ] Conflict 409 menampilkan reload/reconcile, tidak auto-overwrite. Preview draft tidak memakai outbox siswa.
- [ ] Admin assets memvalidasi file/path/akses; sanitasi rich content dan URL schemes, jangan render HTML mentah tanpa sanitasi.
- [ ] Port hearts settings/player controls dengan version, reason, dan audit.
- [ ] Test tab editor ganda, invalid publish, non-admin, reserved IDs, rollback, serta preview tanpa perubahan progress.

**Gate:** CMS helper tests, feature suites, E2E admin, dan build lulus.

### Task 12: Regression dan cutover

**Files:** tests/CI yang relevan dan status/evidence dalam dokumen ini. Tidak membuat README/AGENTS baru tanpa permintaan.

- [ ] Jalankan seluruh verifikasi bagian 6, termasuk concurrency MySQL 8.0.30, export hashes, dan E2E.
- [ ] Google login nyata memakai akun test baru; cek progress nol, assignment admin baru, dan avatar baru.
- [ ] Audit response, HTML props, bundle/source map publik, dan log agar jawaban privat/OAuth secrets tidak bocor.
- [ ] Pastikan tidak ada runtime import Next/Supabase/Elysia atau dump privat, semua assets tersedia, dan aksesibilitas tetap berfungsi.
- [ ] Verifikasi offline replay dan sinkronisasi lintas tab/perangkat dengan latensi yang disepakati.
- [ ] Catat konten hanya dari repository, akun/progress baru, dan tidak ada migrasi CMS live. Source/layanan lama tidak dihapus.
- [ ] Cutover memerlukan keputusan operator. Rollback layanan tidak otomatis memindahkan progress baru ke sistem lama; jelaskan batas ini sebelum pengguna dialihkan.

**Gate:** semua blocker dicatat; build hijau saja tidak berarti migrasi selesai.

## 6. Verifikasi

Command existing dijalankan dari **root target**, bukan direktori frontend terpisah:

```bash
composer lint:check
composer types:check
php artisan test
npm run check
npm run types:check
npm run build
```

- `npm test` menjalankan test Node (`node --import ./scripts/register-ts.mjs --test "scripts/**/*.test.ts"`). Test exporter otomatis skip bila source legacy tidak terjangkau, sehingga Windows dan WSL sama-sama hijau.
- Tambahkan script/config E2E saat port UI memerlukannya. Tests legacy tidak dijalankan terhadap database/live service lama.
- Sebelum PHP integration test memakai MySQL, terapkan guard database test terpisah. SQLite in-memory tidak menggantikan test transaksi/JSON/FK/concurrency MySQL.
- Integration/concurrency MySQL dijalankan pada database terpisah `zenuniverse_test` melalui CLI Windows Laragon, karena interop WSL tidak meneruskan environment variable:

```bash
cmd.exe /c 'cd /d C:\laragon\www\zenuniverse && set DB_CONNECTION=mysql&& set DB_HOST=127.0.0.1&& set DB_PORT=3306&& set DB_DATABASE=zenuniverse_test&& set DB_USERNAME=root&& set DB_PASSWORD=&& C:\laragon\bin\php\php-8.5.10-nts-Win32-vs17-x64\php.exe artisan test --filter=ProgressConcurrencyTest'
```

- `ProgressConcurrencyTest` hanya berjalan pada MySQL `*_test` dan otomatis skip selain itu; verifikasi terakhir 3/3 stabil pada MySQL 8.0.30. Jangan memakai `root` pada CI/produksi; ini hanya kredensial development lokal.
- Koneksi read-only `SELECT VERSION(), DATABASE()` dapat memastikan aplikasi menunjuk server 8.0.30 dan DB yang benar. Ini pemeriksaan koneksi yang sudah ada, bukan task setup/start MySQL.
- CI memerlukan MySQL 8.0.30 terisolasi untuk integration tests; penyediaan service runner CI tidak mengubah Laragon development. Tidak perlu membuat Docker Compose lokal.
- Jangan menjalankan ulang `composer setup`: script existing menghasilkan key dan menjalankan migration. Jangan menjalankan `migrate:fresh` pada DB development/live.
- Pada audit sebelumnya, PHPStan mencapai batas 128 MB; `composer types:check -- --memory-limit=512M` lulus dengan warning turbo extension. Gunakan evidence run baru untuk hasil terkini, bukan menganggap warning atau hasil lama sudah terselesaikan.

**Bukti terakhir (19 Sep 2026):** `php artisan test` 100 passed + 4 skipped (447 assertions); `npm test` 17 passed + 4 skipped (exporter skip di Windows); `npm run build` sukses; `npm run check` + `npm run types:check` hijau; Pint + PHPStan (512 MB) hijau; concurrency MySQL 8.0.30 4/4 hijau.

**Kriteria selesai:** fitur legacy yang dipilih terporting, akun baru/konten repository sesuai keputusan, frontend seluruhnya di `resources/js/`, MySQL tetap 8.0.30 Laragon, dan semua pemeriksaan yang relevan memiliki hasil terbaru.
