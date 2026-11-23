# Panduan Hosting Online di Vercel (Gratis & Bisa Diakses Semua Orang)

Website **Our Little World** sudah dirancang **hybrid**:
- Jalan mulus di **laptop lokal** dengan **XAMPP + phpMyAdmin**, **DAN**
- Langsung siap di-deploy ke **Vercel** agar dapat diakses oleh pasangan atau orang lain dari HP/laptop mana saja lewat internet!

Semua kendala serverless Vercel sudah ditangani otomatis di dalam kode:
1. **Cloud MySQL + SSL otomatis** (mendukung `DATABASE_URL` maupun `MYSQL_HOST` dengan TLS 1.2).
2. **Penyimpanan Media Privat Permanen di MySQL (`media_files`)** otomatis aktif di Vercel + kompresi gambar otomatis di browser agar foto HP tidak melewati batas upload 4.5 MB Vercel.
3. **Realtime Chat, Typing Indicator, Online Presence, Notifikasi, Virtual Hug, & Love Garden** otomatis tersinkron lintas server via `/api/realtime/sync` + tabel `couple_presence`.

---

## Langkah 1 — Buat Database MySQL Cloud Gratis (5 Menit, Tanpa Kartu Kredit)

Pilih salah satu penyedia **MySQL Cloud Gratis** berikut:

### Opsi A — TiDB Cloud Serverless (Direkomendasikan — Gratis 5 GB, Tanpa Kartu Kredit)
1. Daftar gratis di [https://tidbcloud.com](https://tidbcloud.com) (bisa login pakai akun GitHub/Google).
2. Klik **Create Cluster** → pilih **Starter (Serverless — Free)** → pilih region terdekat (**Singapore**).
3. Klik tombol **Connect** → pilih **General** → buat password → salin info koneksi (`Host`, `Port: 4000`, `User`, `Password`) atau `DATABASE_URL`.
4. **Tabel otomatis terbuat sendiri!** Kamu **tidak perlu** copy-paste SQL manual — saat website Vercel pertama kali dibuka (atau saat `/api/health` diakses), aplikasi otomatis membuat seluruh **28 tabel** di TiDB Cloud / Aiven / Railway!
   *(Opsional jika ingin buat manual sebelumnya: import `database/our_little_world_mysql.sql` atau jalankan `DATABASE_URL="..." npm run db:init`.)*

### Opsi B — Aiven for MySQL (Gratis) / Railway MySQL
1. Buat service MySQL baru di [https://aiven.io](https://aiven.io) atau [https://railway.app](https://railway.app).
2. Salin `Service URI` / `DATABASE_URL` (`mysql://...`).
3. Jalankan `database/our_little_world_mysql.sql` atau jalankan `npm run db:init` dengan `DATABASE_URL` tersebut.

---

## Langkah 2 — Deploy Repository GitHub ke Vercel

1. Masuk ke [https://vercel.com/new](https://vercel.com/new) (login dengan akun GitHub `zfrarfi`).
2. Pilih repository **`Out-Little-World`** → klik **Import**.
3. Buka bagian **Environment Variables** dan tambahkan:

| Key | Contoh Nilai |
|-----|--------------|
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:4000/our_little_world` *(dari TiDB Cloud / Aiven)* |
| `STORAGE_DRIVER` | `database` *(otomatis aktif di Vercel, boleh diisi eksplisit)* |
| `AUTH_SESSION_SECRET` | string acak panjang minimal 32 karakter *(bebas)* |
| `AI_API_KEY` | *(opsional — kosongkan untuk Mode Lokal, atau isi API key gratis Gemini/Groq)* |
| `AI_API_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` *(opsional)* |
| `AI_MODEL` | `gemini-2.0-flash` *(opsional)* |

4. Klik **Deploy** dan tunggu ~1–2 menit.
5. Setelah selesai, klik domain Vercel kamu (misal `https://out-little-world.vercel.app`) dan cek `https://out-little-world.vercel.app/api/health` untuk memastikan `"connected": true` dan `"tableCount": 28`!

---

## Langkah 3 — Uji Akses Dua Orang Berbeda
1. Buka link Vercel dari HP/laptop kamu → daftar akun pertama → selesaikan Onboarding → salin **Kode Undangan (`OLW-XXXXXXXX`)**.
2. Kirim link Vercel + kode undangan ke pasanganmu → pasangan daftar akun kedua & masukkan kode undangan → kedua akun langsung terhubung realtime dari perangkat & lokasi berbeda!
