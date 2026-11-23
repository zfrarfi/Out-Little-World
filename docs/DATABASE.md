# Dokumentasi Database MySQL (XAMPP / phpMyAdmin) — Our Little World

Arsitektur database menggunakan **MySQL / MariaDB (XAMPP & phpMyAdmin)** dengan engine `InnoDB` dan charset `utf8mb4_unicode_ci` (mendukung penuh seluruh emoji). Terdapat **26 tabel relasional** (3 tabel autentikasi lokal + 23 tabel fitur inti) dengan primary key UUID `CHAR(36)`, foreign key konsisten (`ON DELETE CASCADE` / `ON DELETE SET NULL`), index, dan validasi otorisasi server-side ketat pada setiap query.

File SQL siap import di phpMyAdmin: `database/our_little_world_mysql.sql`.

---

## Daftar 26 Tabel di phpMyAdmin (`our_little_world`)

### A. Autentikasi & Sesi Lokal (3 Tabel)
| No | Tabel | Fungsi Utama |
|----|-------|--------------|
| 1 | `users` | Akun pengguna (`email` unik + `password_hash` berbasis `scrypt`) |
| 2 | `user_sessions` | Token sesi ter-hash (`SHA-256`) untuk cookie HTTP-Only `olw_session` |
| 3 | `password_reset_tokens` | Token reset password sekali pakai dengan masa berlaku 1 jam |

### B. 23 Tabel Inti Fitur Couple Platform
| No | Tabel | Fungsi Utama |
|----|-------|--------------|
| 4 | `profiles` | Identitas pengguna, preferensi notifikasi & privasi (`FK -> users`) |
| 5 | `couple_spaces` | Ruang privat pasangan (tenant utama) |
| 6 | `couple_members` | Keanggotaan ruang (maksimal **2 anggota** per space via transaksi `FOR UPDATE` + `UNIQUE(user_id)`) |
| 7 | `couple_invitations` | Kode undangan unik (`OLW-XXXXXXXX`), kedaluwarsa, & 1x klaim |
| 8 | `relationship_settings` | Tanggal kenal/bertemu/jadian, cerita, foto utama, tema, font, animasi |
| 9 | `memory_albums` | Pengelompokan album kenangan |
| 10 | `memories` | Metadata foto/video kenangan di folder privat `memories` |
| 11 | `love_letters` | Surat cinta, tema amplop, surat rahasia, jadwal pembukaan terkunci |
| 12 | `calendar_events` | Acara kalender (anniversary, birthday, date, special) & pengingat |
| 13 | `daily_checkins` | Mood harian, emoji, happiness 1–10, cerita, & pesan pasangan (`UNIQUE(couple_id, user_id, checkin_date)`) |
| 14 | `love_garden` | State pohon hubungan, tahap tumbuh, poin, level, bunga mekar |
| 15 | `bucket_list` | Impian bersama, kategori, target tanggal, checklist, foto pencapaian |
| 16 | `quiz_questions` | Bank soal kuis (`multiple_choice` & `guess_answer`) |
| 17 | `quiz_sessions` | Riwayat sesi bermain, skor, persentase kecocokan |
| 18 | `quiz_answers` | Detail jawaban per soal dalam setiap sesi kuis |
| 19 | `playlists` | Lagu kenangan, link Spotify/YouTube, cover, catatan, kategori |
| 20 | `love_jar_messages` | Pesan toples digital (5 kategori), status & waktu pembukaan |
| 21 | `chat_messages` | Private chat teks & gambar, status (`sent`/`delivered`/`read`) |
| 22 | `notifications` | Notifikasi realtime khusus penerima (`recipient_id`) |
| 23 | `relationship_timeline` | Milestone perjalanan hubungan secara kronologis |
| 24 | `virtual_hugs` | Riwayat pelukan virtual, gaya pelukan, pesan, & status diterima |
| 25 | `ai_conversations` | Sesi percakapan AI Love Assistant privat milik pengguna |
| 26 | `ai_messages` | Riwayat pesan user & assistant dalam setiap sesi AI |

---

## Mekanisme Keamanan & Isolasi Data

1. **Strict Server-Side Tenant Isolation**: Seluruh Server Actions & Route Handlers mengambil `userId` dan `coupleId` langsung dari sesi cookie HTTP-Only yang diverifikasi di tabel `user_sessions` & `couple_members` — **tidak pernah** mempercayai `couple_id` dari client.
2. **Parameterized Queries**: Seluruh query MySQL menggunakan prepared statement `?` (`mysql2/promise`) sehingga aman dari SQL Injection.
3. **Maksimal 2 Anggota & Single-Use Invite**: Klaim undangan dijalankan dalam transaksi MySQL (`SELECT ... FOR UPDATE`) yang menolak kode kedaluwarsa, kode yang sudah diklaim, klaim oleh pembuat sendiri, serta Couple Space yang sudah berisi 2 anggota.
4. **Private Local Media Authorization**: File media disimpan di luar folder `public/` (yakni `storage/uploads/<bucket>/<scopeId>/...`) dan hanya disajikan lewat `/api/storage/file` setelah server memastikan pengguna yang login adalah pemilik atau pasangan sah pada Couple Space tersebut.
