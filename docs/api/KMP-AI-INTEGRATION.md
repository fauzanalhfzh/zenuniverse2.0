# Zenuniverse API — panduan implementasi untuk AI coding KMP

## Brief dan sumber kebenaran
Implementasikan client Android/iOS pada repo Kotlin Multiplatform milik tim mobile. Jangan mengubah backend, membuat endpoint yang tidak ada, atau merombak arsitektur aplikasi tanpa persetujuan.

- Base URL live: `https://zenuniverse.id/api/v1/` (trailing slash).
- Swagger baca kontrak: https://zenuniverse.id/api/docs/
- OpenAPI: https://zenuniverse.id/api/docs/openapi.yaml
- Repo backend: https://github.com/fauzanalhfzh/zenuniverse2.0
- Detail kontrak: `docs/api/openapi.yaml`, `docs/api/mobile-integration.md`.
- Swagger Try it out dinonaktifkan pada produksi; gunakan client/Postman secara terkendali.
- API telah dideploy; login positif native Google Android/iOS belum diuji dengan perangkat nyata. Jangan klaim selesai hanya karena DTO berhasil dikompilasi.

## Batas scope
Buat data/network/auth/repository + UI state integrasi. Gunakan struktur, dependency catalog dan pola DI yang sudah ada dalam repo KMP. Ktor Client dan kotlinx.serialization direkomendasikan bila belum ada stack lain. Jangan menambahkan versi library secara tebakan; cek kompatibilitas Kotlin, Gradle, Ktor dan serialization plugin yang terpasang.

Backend mendukung 10 operasi di bawah. Tidak ada refresh token, endpoint register terpisah, linking akun, upload avatar, pembayaran, admin mobile, push notification atau compiler arbitrary. Editor codeblock native ditunda: jangan mengimplementasikannya diam-diam. Bila renderer suatu step belum ada, tampilkan unsupported state yang aman dan laporkan, bukan fabricate progress.

## Arsitektur KMP yang disarankan (sesuaikan root modul)
```text
shared/src/commonMain/kotlin/<package>/
  network/ApiClient.kt
  network/ApiResult.kt
  network/dto/AuthDto.kt
  network/dto/ContentDto.kt
  network/dto/ProgressDto.kt
  network/dto/AttemptDto.kt
  auth/GoogleIdentityProvider.kt
  auth/SecureSessionStore.kt
  repository/AuthRepository.kt
  repository/LearningRepository.kt
  sync/PendingAttemptStore.kt
  sync/AttemptReplayWorker.kt
shared/src/commonTest/kotlin/<package>/...
shared/src/androidMain/kotlin/<package>/auth/...
shared/src/iosMain/kotlin/<package>/auth/...
```
Paths ilustrasi, bukan asumsi repo memiliki modul `shared`. Inspect dahulu. Network/repository/models/retry dibagi commonMain; Google SDK dan secure storage memiliki implementasi platform. UI mengikuti framework aplikasi yang sebenarnya, bukan asumsi semua UI memakai Compose.

## Google Sign-In: kontrak pasti
Web/Server Client ID yang disetujui:
`80266038356-o7oc7rnei71gadespjn5r4apob8hk7r7.apps.googleusercontent.com`

Ini ID nonsecret. Android tetap perlu OAuth client package + SHA certificate yang benar; iOS tetap perlu client bundle/scheme. Google SDK harus menghasilkan ID token dengan audience server yang disetujui. Jangan masukkan Client Secret ke aplikasi. Jangan mengirim Google access token sebagai ID token; jangan memakai callback website sebagai login mobile.

1. Native Google SDK menghasilkan ID token.
2. POST `auth/google` tanpa bearer:
```json
{"id_token":"<token-dari-sdk>","device_name":"Zenuniverse Android"}
```
3. Backend memverifikasi identity; response sukses 200 memiliki:
```json
{"data":{"token":"<sanctum-token>","tokenType":"Bearer","expiresAt":"<ISO8601>","user":{"id":1,"displayName":"<nama>","email":"<email>"}},"meta":{"requestId":"<uuid>"}}
```
Contoh ini placeholder schema, bukan token/data pengguna nyata.
4. Simpan hanya token aplikasi dan expiry dalam secure storage platform. Jangan simpan ID token Google permanen.
5. Semua operasi berikut memakai `Authorization: Bearer <sanctum-token>`.
6. Expiry 30 hari; 401 authenticated request -> hapus session lokal, stop queue user tersebut, navigasi login. Tidak ada auto-refresh endpoint. Jangan membuat login loop atau mencoba login lewat jaringan pada setiap 401.
7. POST logout dengan token -> `data.loggedOut=true`; cabut hanya perangkat aktif. Bersihkan local session walau offline, tapi jelaskan server revocation belum dikonfirmasi. Antrean tidak boleh terkirim sebagai akun berikutnya.

## Endpoint, pagination dan schema
Semua path relatif base; pada Ktor jangan memulai path dengan `/`, karena dapat menghilangkan prefix `/api/v1/`.

| Method | Path | Request / hasil utama |
|---|---|---|
| POST | auth/google | id_token, device_name -> token, tokenType, expiresAt, user |
| GET | me | id Long, displayName, email |
| POST | auth/logout | data.loggedOut boolean |
| GET | courses | page/per_page -> data array + meta.pagination |
| GET | courses/{course} | course + contentRevision + units/lessons unlock/progress |
| GET | lessons/{lesson} | steps, contentRevision, completedStepIds, course info |
| GET | me/progress | authoritative XP/hearts/streak/completion snapshot |
| GET | leaderboard | page/per_page -> data array safe profile/score |
| POST | learning/attempts | lesson_id, step_id, UUID attempt_id, content_revision, answer |
| POST | learning/lessons/{lesson}/complete | content_revision -> completed/xpAwarded/progress |

Accept `application/json`, JSON body Content-Type `application/json`. GET catalog juga wajib token.
`per_page` 1..100, default25; page default1. Pagination berada di `meta.pagination` dengan total/perPage/currentPage/lastPage, bukan `data.items`.
ID user Long; ID course/lesson/step String. `expiresAt` ISO8601; progress.updatedAt epoch milliseconds (Long). Tanggal daily/streak mengikuti server, bukan tanggal timezone perangkat secara otomatis. Gunakan `@SerialName` pada submission snake_case, response camelCase sesuai kontrak.

### DTO inti (contoh yang harus diadaptasi dan diuji)
```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable data class PaginationDto(val total: Int, val perPage: Int, val currentPage: Int, val lastPage: Int)
@Serializable data class ApiMetaDto(val requestId: String, val pagination: PaginationDto? = null)
@Serializable data class EnvelopeDto<T>(val data: T, val meta: ApiMetaDto)
@Serializable data class ApiErrorDto(val code: String, val message: String, val fields: Map<String, List<String>> = emptyMap())
@Serializable data class ErrorEnvelopeDto(val error: ApiErrorDto, val meta: ApiMetaDto)
@Serializable data class GoogleLoginDto(@SerialName("id_token") val idToken: String, @SerialName("device_name") val deviceName: String)
@Serializable data class UserDto(val id: Long, val displayName: String, val email: String)
@Serializable data class LoginDto(val token: String, val tokenType: String, val expiresAt: String, val user: UserDto)
```
Jangan menerapkan `Envelope<T>` pada non-2xx. `fields` selalu object; pesan bukan enum untuk business branching. DTO content/progress harus diturunkan dari OpenAPI, termasuk nullability; jangan memakai model yang kehilangan fields penting.

### Client rules
- Ktor Android/Darwin engines di source set masing-masing; engine injection sesuai pola aplikasi.
- ContentNegotiation + Json(ignoreUnknownKeys=true). Hindari global coercion yang mengubah step tidak dikenal menjadi tipe salah.
- expectSuccess=false dan branch status sebelum deserialize success/error.
- Request timeout yang terbatas; rekomendasi awal 30s request /15s connect, bukan infinite.
- Hanya kirim bearer ke origin API yang disepakati. Asset/Google URL memakai client tanpa Authorization. Jangan meneruskan bearer ke cross-origin redirect.
- Jangan logging Authorization, ID token, request jawaban atau response login. Diagnostik cukup status/error.code/requestId.
- Offline/error server dapat menghasilkan body non-JSON dari proxy; tangani sebagai transport/unexpected-response error, bukan crash parser.
- Batasi retry otomatis GET; POST jawaban memakai aturan idempotensi berikut.

## Tipe step dan jawaban
Discriminator `type`: concept, quiz, blockly, code-fill, code. Unknown type harus safe fallback, jangan throw yang merusak seluruh lesson. Ambil IDs/revision dari response, bukan hardcode.

- concept: `{"type":"concept","acknowledged":true}`.
- quiz: `{"type":"quiz","optionId":"<ID-publik-dari-options>"}`. Jangan mengirim index/label/private correct ID.
- blockly:
```json
{"type":"blockly","commands":[{"type":"repeat","count":3,"children":[{"type":"move_forward"}]}]}
```
Perintah yang didukung move_forward, turn_right, repeat; hanya yang diizinkan challenge. `count`/`children`, BUKAN `times`/`commands` untuk children. Coordinates zero-based: x ke kanan, y ke bawah. maxBlocks/maxExecutionSteps/starterProgram dari payload. Repeat1..100, nesting max8, global500blocks/10000execution; challenge dapat lebih ketat. Contoh bukan solusi universal.
- code-fill: `{"type":"code-fill","answers":{"<blank-id>":"<isi>"}}`.
- code: `{"type":"code","code":"<kode>"}`. Backend membandingkan validasi, bukan mengeksekusi kode arbitrary. Jangan menampilkan keluaran compiler palsu.

HTML concept gunakan renderer aman; jangan mengaktifkan unrestricted JS/native bridge. Payload awal tidak memberikan jawaban privat. Tampilkan hasil benar/salah dari server, bukan perhitungan lokal sebagai keputusan XP.

## Submit, offline dan idempotensi
```json
{"lesson_id":"<lesson-id>","step_id":"<step-id>","attempt_id":"<uuid>","content_revision":1,"answer":{"type":"quiz","optionId":"<public-option-id>"}}
```
1. Buat UUID sekali untuk satu submission logis.
2. Simpan UUID, userId, revision dan serialized JSON persis sebelum kirim; secure/account-scoped queue, jangan ekspor jawaban sebagai log.
3. Timeout/network failure -> retry UUID dan payload yang sama; jangan reserialize dengan key order berubah karena server hash JSON payload.
4. POST sukses 200 tidak selalu benar: cek `data.result.correct`. Jawaban salah adalah response normal.
5. Ganti local progress dari `data.progress`. Jangan menambah xpAwarded lagi saat replay karena angka itu dapat reward historis.
6. content_changed -> fetch ulang lesson, hentikan replay payload revisi lama. Jangan otomatis mengganti revision UUID lama atau menebak mapping option.
7. attempt_conflict -> hentikan item dan laporkan; UUID baru hanya untuk jawaban/submission baru yang disengaja.
8. no_hearts -> tampilkan progress/countdown, jangan retry loop. completed endpoint bukan cara melewati step.
9. Logout/account switch -> queue terisolasi; item user A tidak pernah dikirim dengan token user B.

## Error mapping UI
| Status / code | Aksi |
|---|---|
| 401 unauthenticated | Session habis; login ulang |
| 401 invalid_google_token | SDK/audience/token invalid; bukan retry Sanctum refresh |
| 403 lesson_locked/forbidden | Lesson terkunci/akses ditolak; refresh course |
| 404 not_found | Konten tidak tersedia; reload katalog |
| 409 account_link_required | Dukungan/linking resmi, jangan implicit link berdasarkan email |
| 409 content_changed | Reload lesson + revision, review jawaban |
| 409 attempt_conflict | UUID/payload konflik; stop retry |
| 409 no_hearts | Tampilkan countdown dari progress |
| 422 validation_failed/invalid_step | Field error atau pasangan lesson-step invalid |
| 429 rate_limited | Hormati Retry-After dan bounded backoff |
| 500 server_error | Retry terbatas sesuai operasi; tampilkan requestId untuk support |

## Urutan implementasi untuk AI
1. Inspect repo KMP: modul, Kotlin/Ktor versions, DI, navigation, existing auth/storage/tests. Jelaskan asumsi sebelum mengubah.
2. Buat DTO + error model, test parsing fixtures berdasarkan OpenAPI. Fixtures harus jelas contoh, bukan rekaman token production.
3. Ktor client dengan MockEngine tests: URL mempertahankan api/v1, 200/401/422/429/non-JSON parsing, token hanya ke host benar.
4. Secure storage dan native Google implementation Android/iOS. Test repository memakai fake provider khusus tests; jangan memasang fake-login di build rilis.
5. AuthRepository: exchange -> persist -> me, current-device logout; 401/expiry. Jangan implementasikan refresh.
6. Catalog/course/lesson repositories + UI loading/error/unsupported state. Pagination dan nullability tested.
7. Learning submission + account-scoped queue; idempotent retry, content revision, wrong answer HTTP200, fresh progress. Test offline/account switching.
8. Profile/ranking data integration; jangan tambah avatar update route yang tidak ada.
9. Real native login dan end-to-end kedua platform; laporkan output tool/build/test dan blockers. Hanya compile sukses bukan acceptance.
10. Dokumentasikan konfigurasi package/SHA/bundle/server client dan private secret handling. Jangan commit credentials.

## Acceptance gate
- [ ] Android dan iOS menghasilkan ID token audience tepat, login nyata -> me berhasil.
- [ ] Secure token storage, expiry dan logout bekerja, token revoked ->401.
- [ ] Catalog -> unlocked lesson -> correct/wrong submission -> progress konsisten web.
- [ ] UUID replay tidak double XP/hearts; revision conflict aman.
- [ ] Unknown step/nullable fields/malformed proxy error tidak crash.
- [ ] No token secret di repo/logs/URL; bearer tidak dikirim ke assets/provider.
- [ ] Build/test sesuai toolchain repo, UI states ditest, tidak ada invented backend routes.

## Prompt siap pakai untuk AI mobile
> Baca KMP-AI-INTEGRATION.md dan OpenAPI Zenuniverse terlebih dahulu. Inspect repo KMP ini, lalu implementasikan data layer/auth Google/platform secure storage dan learning API mengikuti kontrak aktual. Base URL https://zenuniverse.id/api/v1/. Jangan membuat endpoint baru, refresh-token flow, compiler, atau codeblock editor; editor ditunda. Pertahankan arsitektur/dependency catalog proyek. Gunakan TDD dengan Ktor MockEngine dan test account-scoped retry. Jangan logging token atau menggandakan XP dari response replay. Implementasi Google SDK di Android/iOS harus meminta ID token untuk Server Client ID yang tertulis pada panduan. Laporkan real build/test outputs dan langkah login perangkat yang belum dapat diverifikasi. Jangan klaim native login sudah berhasil bila belum diuji. Mulai dengan inspeksi repo dan rencana perubahan kecil sebelum coding.

Catatan: contoh Kotlin belum dikompilasi dalam repo KMP karena repo mobile belum tersedia di sesi ini. Dokumen adalah kontrak/handoff, bukan SDK KMP siap pakai.
