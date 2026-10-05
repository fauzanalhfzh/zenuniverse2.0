# Handoff mobile — Zenuniverse API v1

## Status dan batas verifikasi

Kontrak ini diturunkan dari source lokal (`routes/api.php`, bootstrap exception handler, `ApiResource`, middleware, controller API, request validator dan services auth/content/learning). OpenAPI 3.1 ada di `openapi.yaml`; koleksi Postman ada di `zenuniverse.postman_collection.json`.

**Login Google native Android/iOS dan lingkungan staging belum diverifikasi live.** Origin contoh bukan alamat staging yang sudah tersedia. Parsing dokumen dan pencocokan route statis bukan pengujian API, Google OAuth atau integrasi perangkat. Handoff ini tidak menjalankan aplikasi, migration, DB, Composer, deployment maupun test aplikasi.

Base URL: `<origin>/api/v1` (contoh lokal `http://localhost:8000/api/v1`). Gunakan HTTPS untuk lingkungan remote. API tidak memakai cookie session, CSRF, browser redirect OAuth atau Google access token sebagai bearer. Tidak ada endpoint refresh, register terpisah, linking mobile, admin CMS, upload avatar, atau perubahan profil pada API v1 ini.

## Route aktual

| Metode | Path relatif base | Catatan |
|---|---|---|
| POST | `/auth/google` | Publik, 10/menit; JSON `id_token`, `device_name` |
| GET | `/me` | Profil ID integer, displayName, email |
| POST | `/auth/logout` | Hapus token saat ini, bukan semua perangkat |
| GET | `/courses` | Published; `page`, `per_page` |
| GET | `/courses/{course}` | Course published, unit/lesson, unlocked/completed |
| GET | `/lessons/{lesson}` | Published dan unlocked, langkah publik |
| GET | `/me/progress` | Snapshot authoritative |
| GET | `/leaderboard` | Paginasi; rank/displayName/avatarUrl/totalXp |
| POST | `/learning/attempts` | 60/menit; UUID idempotensi per user |
| POST | `/learning/lessons/{lesson}/complete` | 60/menit; rekonsiliasi, bukan skip lesson |

Selain login, semua route memerlukan `Authorization: Bearer <Sanctum-token>` dan ability `learner`. Token session web tidak memenuhi middleware learner. Gunakan ID course/lesson/step string dari response, bukan ID yang dikarang. `avatarUrl` nullable memang ada pada leaderboard existing; profil/login tidak memiliki avatar dan tidak ada endpoint avatar.

## Google native → backend → Sanctum

1. Integrasikan SDK Google pada platform Android/iOS; commonMain hanya menerima ID token hasil platform. Android memerlukan OAuth client Android yang cocok package/signing certificate; iOS memerlukan client iOS/bundle dan konfigurasi SDK platform. Credential ini **tidak menjamin nilai `aud` sama dengan client ID platform**.
2. SDK dapat meminta ID token untuk server/web client ID yang dikonfigurasi (misalnya Android server client ID; iOS konfigurasi server client). Tentukan konfigurasi sesuai SDK yang benar-benar dipakai, lalu verifikasi `aud` ID token hasil native pada pengujian terkontrol. Jangan menulis token ke log, tiket atau repo. Decode claim untuk diagnosis bukan validasi kepercayaan; validasi kriptografi tetap di server.
3. Backend membaca `GOOGLE_MOBILE_AUDIENCES` sebagai daftar **client ID audience nonsecret**, dipisahkan koma, whitespace dipangkas. Contoh placeholder: `GOOGLE_MOBILE_AUDIENCES="SERVER_CLIENT_ID.apps.googleusercontent.com,OTHER_APPROVED_CLIENT_ID.apps.googleusercontent.com"`. Jangan masukkan client secret, package name, bundle ID, wildcard atau token. Jangan menganggap `GOOGLE_CLIENT_ID` otomatis dipakai sebagai fallback; allowlist mobile kosong menolak semua login native. `.env.example` sengaja kosong sampai audience nyata disepakati. Operator perlu menerapkan konfigurasi/cache lingkungan melalui prosedur deployment yang ada; handoff ini tidak mengubah `.env` nyata.
4. Kirim `POST /auth/google` dengan `{"id_token":"<native-google-id-token>","device_name":"Android learner"}`. ID token maksimum 16384 karakter, nama perangkat maksimum 100.
5. Backend memverifikasi signature melalui Google verifier, `aud` allowlist exact match, `iss` Google, expiry, subject, email valid dan `email_verified === true`. Kegagalan: 401 `invalid_google_token`. Subject Google yang sudah terhubung dipakai; email existing tanpa mapping menghasilkan 409 `account_link_required`, bukan auto-link. Tidak ada endpoint linking mobile; arahkan pengguna ke dukungan/alur existing, jangan membuat endpoint baru.
6. Sukses HTTP 200: `data.token`, `data.tokenType = "Bearer"`, `data.expiresAt` ISO8601, `data.user = {id,displayName,email}`, `meta.requestId`. Token Sanctum memiliki expiry **30 hari** saat diterbitkan. Simpan token dan expiry di secure storage platform (Android Keystore-backed storage, iOS Keychain), bukan preference/plaintext/database bersama. Jangan simpan Google ID token jangka panjang.
7. Pada token 401/expiry/revocation, hapus session lokal lalu lakukan login Google native lagi. **Tidak ada refresh token atau `/auth/refresh`.** Logout API mencabut hanya token request; logout SDK Google adalah aksi platform terpisah. Jika logout gagal jaringan, tetap hapus token lokal; revocation server belum terkonfirmasi.

## KMP / Ktor

Gunakan engine Android/Darwin pada platform, ContentNegotiation + kotlinx.serialization pada commonMain. Pilih versi dependency dari katalog aplikasi; contoh berikut adalah sketsa integrasi, **belum dikompilasi atau diuji perangkat**. Base URL harus berakhir `/`, dan path panggilan jangan diawali `/` agar `/api/v1` tidak terbuang. Contoh tidak memakai automatic bearer refresh.

```kotlin
@Serializable data class ApiMeta(val requestId: String)
@Serializable data class Envelope<T>(val data: T, val meta: ApiMeta)
@Serializable data class ApiError(
    val code: String,
    val message: String,
    val fields: Map<String, List<String>> = emptyMap()
)
@Serializable data class ErrorEnvelope(val error: ApiError, val meta: ApiMeta)
@Serializable data class GoogleLoginRequest(
    @SerialName("id_token") val idToken: String,
    @SerialName("device_name") val deviceName: String
)
@Serializable data class Learner(val id: Long, val displayName: String, val email: String)
@Serializable data class LoginPayload(
    val token: String, val tokenType: String, val expiresAt: String, val user: Learner
)

// engine berasal dari platform; secure storage diimplementasikan platform.
val api = HttpClient(engine) {
    expectSuccess = false // parse error envelope pada non-2xx, bukan sebagai Envelope<T>
    install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
    install(HttpTimeout) {
        requestTimeoutMillis = 30_000
        connectTimeoutMillis = 15_000
    }
    defaultRequest {
        url("https://YOUR_CONFIRMED_ORIGIN/api/v1/")
        accept(ContentType.Application.Json)
    }
}

val loginResponse = api.post("auth/google") {
    contentType(ContentType.Application.Json)
    setBody(GoogleLoginRequest(nativeIdToken, deviceName))
}
if (loginResponse.status == HttpStatusCode.OK) {
    val login = loginResponse.body<Envelope<LoginPayload>>()
    // secureStore.save(login.data.token, login.data.expiresAt)
} else {
    val failure = loginResponse.body<ErrorEnvelope>()
    // UI berdasarkan failure.error.code; catat hanya requestId/status/code.
}
val meResponse = api.get("me") {
    bearerAuth(tokenFromSecureStorage)
}
```

Import API berasal dari `io.ktor.client.*`, engine platform, plugins/contentnegotiation/timeout, request, statement, `io.ktor.http.*`, `io.ktor.serialization.kotlinx.json.*`, `kotlinx.serialization.*` dan `kotlinx.serialization.json.*`. Jangan aktifkan logging body/header Authorization. Batasi pengiriman bearer ke origin API yang disetujui; jangan kirim ke URL avatar/asset dari respons. KMP gunakan `Long` untuk user ID, epoch milliseconds dan countdown. `expiresAt` adalah ISO8601, tetapi `progress.updatedAt` epoch milliseconds; tanggal streak/daily adalah tanggal kalender server (jangan diasumsikan UTC perangkat).

## Envelope, pagination dan error

Sukses: `{ "data": <objek atau array>, "meta": { "requestId": "<uuid>" } }`. List courses/leaderboard menambahkan `meta.pagination = {total, perPage, currentPage, lastPage}`; **bukan** `data.items` atau Laravel links. Query memakai snake_case `per_page` (default 25; 1–100), `page` (default 1; 1–100000). Header respons `X-Request-ID`, `Cache-Control: no-store`. Tidak ada kontrak ETag/offline cache server.

Error: `{ "error": { "code": "validation_failed", "message": "Permintaan tidak valid.", "fields": { "id_token": ["..."] } }, "meta": { "requestId": "<uuid>" } }`. Non-validation error tetap memiliki `fields: {}`. Pesan bisa berubah; cabangkan dengan code/status, bukan string pesan.

| Status / code | Perlakuan mobile |
|---|---|
| 401 `unauthenticated` | Token hilang/expired/revoked; login ulang |
| 401 `invalid_google_token` | Periksa konfigurasi audience dan hasil SDK; bukan token Sanctum |
| 403 `forbidden` / `lesson_locked` | Ability salah atau lesson sebelumnya belum selesai |
| 404 `not_found` | ID hilang atau unpublished; refresh katalog |
| 409 `account_link_required` | Jangan auto-create/link akun berdasarkan email |
| 409 `content_changed` | Muat ulang lesson dan revisi; tinjau jawaban baru |
| 409 `attempt_conflict` | UUID dipakai payload berbeda; jangan retry payload berubah dengan UUID lama |
| 409 `no_hearts` | Tampilkan countdown/progress; concept tidak memerlukan hearts |
| 422 `validation_failed` / `invalid_step` | Tampilkan field errors; perbaiki pairing lesson/step |
| 429 `rate_limited` | Backoff dan hormati Retry-After bila ada |
| 500 `server_error` | Tampilkan retry terbatas; laporkan requestId tanpa rahasia |

## Konten dan submission

Course detail memberi `contentRevision`, unit/lesson `unlocked`/`completed`. Lesson memberi `contentRevision`, `courseId`, `courseTitle`, `completionRewardXp`, `completedStepIds`, `steps`. Langkah memakai `type` `concept`, `quiz`, `blockly`, `code-fill`, `code`; `reward.xp` adalah metadata, bukan hak client untuk memberikan XP. Konten field opsional mengikuti allowlist OpenAPI. HTML concept (`bodyHtml`) tersanitasi server, namun gunakan renderer aman; jangan memberi WebView akses native/JS yang tidak diperlukan. Opsi quiz ID opaque/revision-dependent: kirim `content.options[].id`, bukan index, label atau ID privat. Jangan bergantung urutan opsi antar revisi. Server tidak mengirim validation, expectedCode atau explanation quiz pada payload awal; feedback sesudah attempt dapat memuat explanation.

Request attempt:

```json
{
  "lesson_id": "<lesson-id-from-api>",
  "step_id": "<step-id-from-api>",
  "attempt_id": "<new-uuid-for-this-logical-submission>",
  "content_revision": 1,
  "answer": {"type": "concept", "acknowledged": true}
}
```

Revisi `1` hanya ilustrasi, selalu pakai `contentRevision` aktual. Bentuk answer:

- concept: `{"type":"concept","acknowledged":true}`. Saat ini acknowledged tidak diperiksa verifier; type yang cocok cukup.
- quiz: `{"type":"quiz","optionId":"<public-option-id>"}`.
- blockly: `{"type":"blockly","commands":[{"type":"move_forward"},{"type":"turn_right"},{"type":"repeat","count":2,"children":[{"type":"move_forward"}]}]}`. Ini contoh bentuk, bukan solusi lesson; limits/board dari payload. Command repeat count 1–100, depth maksimum 8, global blocks maksimum 500 dan execution maksimum 10000; tantangan dapat lebih ketat.
- code-fill: `{"type":"code-fill","answers":{"<blank-id>":"<text>"}}`, blank ID dari payload, bukan indeks.
- code: `{"type":"code","code":"<submitted-code>"}`. Server mencocokkan verifier, **tidak mengeksekusi kode arbitrary**; output mock/simulasi bukan layanan compiler.

`answer.type` wajib; field jenis lain pada request validator bersifat `sometimes`, jadi missing/mismatch dapat menghasilkan result.correct=false alih-alih 422. UUID wajib, ID string max 160, answer maksimum 32 entri, commands/answers maksimum 500, string isian max 2000 dan code max 20000.

Sukses attempt: `data.result = {correct,consumeHeart,feedback}`, `xpAwarded`, `completed` (lesson), `progress`. Jawaban salah normal HTTP 200. Simpan UUID **dan serialized payload identik** sebelum mengirim; retry akibat timeout memakai UUID/payload sama, jangan buat UUID baru otomatis. Hash server memakai JSON payload, maka hindari mengubah urutan/key saat rekonstruksi retry. Payload berbeda dengan UUID lama konflik. Revisi/access diperiksa sebelum replay; tidak dijamin bisa replay setelah konten berubah. Replay mengembalikan xpAwarded historis dan progress terbaru: jangan menjumlahkan xpAwarded pada local total, gunakan snapshot.

Attempt benar dapat menyelesaikan lesson/course dan reward otomatis ketika prasyarat terpenuhi. `POST learning/lessons/{lesson}/complete` hanya menerima `{"content_revision": <revision>}`; tidak punya attempt_id dan tidak melompati prasyarat. Jika langkah belum lengkap, response 200 `completed=false, xpAwarded=0`. Repetition tidak memberi reward berulang.

Snapshot mencakup totalXp, updatedAt, dailyXp/tanggal, streak, hearts/capacity/regen/countdown nullable, badges, level, dailyGoal, completion ID arrays dan courseProgress. Jangan hardcode capacity/regeneration/bonus; gunakan snapshot. Sinkronkan pada app foreground, setelah attempt/completion dan setelah pemulihan koneksi. Tidak ada batch sync/offline submission endpoint; jangan menganggap queue lama valid setelah revisi berubah.

## Postman dan checklist penerimaan berikutnya

Koleksi memuat tepat sepuluh route API. `base_url` default lokal; set origin yang benar setelah operator mengonfirmasi deployment. `google_id_token`/`api_token` kosong, isi hanya pada sesi lokal privat. Login menyimpan api_token/expires_at via script sukses; logout membersihkan variabel token. Isi course_id/lesson_id/step_id dan content_revision dari API. Generate attempt_id UUID baru untuk jawaban baru; pertahankan nilainya untuk retry. Placeholder answer concept harus diganti sesuai step. Koleksi bukan hasil run live; jangan export koleksi yang telah berisi token.

Sebelum menyatakan integrasi siap: konfirmasi origin/TLS dan config audience pada staging; uji native Android/iOS dengan client/signing nyata; uji invalid audience/expired/unverified email/account collision; login→me→catalog→lesson→attempt→progress→logout; retry UUID identik/berbeda, content_changed, locked lesson, no_hearts, pagination dan 429; konfirmasi revocation 401. Semua itu **masih acceptance checklist, bukan verifikasi yang telah dilakukan oleh handoff ini**.
