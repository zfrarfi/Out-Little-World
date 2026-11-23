# Our Little World — Premium Full-Stack Couple Website (XAMPP MySQL)

**Our Little World** adalah platform web full-stack pribadi khusus untuk dua orang pasangan guna menyimpan kenangan, mengirim surat cinta, mencatat momen spesial, berkomunikasi secara realtime, bermain kuis pasangan, merawat taman cinta virtual, hingga berdiskusi dengan AI Love Assistant.

Website ini berjalan dengan **Next.js App Router + TypeScript + Tailwind CSS + Framer Motion** dan menggunakan database lokal **MySQL / MariaDB (XAMPP & phpMyAdmin)** sehingga langsung siap dipakai dari VS Code tanpa perlu daftar database cloud.

---

## Teknologi Utama

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS (HTML/JSX + CSS modern), Framer Motion, Lucide React
- **Backend**: Next.js Server Actions, Next.js Route Handlers, Zod Validation, HTTP-Only Session Auth (`scrypt`)
- **Database**: **MySQL / MariaDB via XAMPP & phpMyAdmin** (`mysql2/promise` connection pool, 26 tabel relasional `utf8mb4`)
- **Penyimpanan Media Privat**: Server local private storage (`storage/uploads/`) dengan verifikasi otorisasi per Couple Space (`/api/storage/file`) + dukungan streaming video (`Range`)
- **Realtime**: Server-Sent Events (`/api/realtime/stream`) untuk Private Chat, Typing Indicator, Online Presence, Notifikasi, Virtual Hug, & Love Garden
- **AI Integration**: Server-only OpenAI-compatible Chat Completions API (opsional, dikonfigurasi lewat `.env.local`)

---

## Cara Menjalankan di VS Code + XAMPP

1. **Nyalakan XAMPP**: Buka **XAMPP Control Panel** → klik **Start** pada **Apache** dan **MySQL**.
2. **Buka Project di VS Code**: `File > Open Folder` → pilih `D:\AchmadZufarTUGAS\PROJECT SENDIRI\WEB`.
3. **Inisialisasi Database phpMyAdmin** (pilih salah satu):
   - Jalankan `npm run db:init` di Terminal VS Code, **ATAU**
   - Import file `database/our_little_world_mysql.sql` lewat `http://localhost/phpmyadmin`.
4. **Jalankan Server Website**:
   ```bash
   npm run dev
   ```
5. Buka browser ke `http://localhost:3000` (dan pantau database kapan saja di `http://localhost/phpmyadmin` → database `our_little_world`).

---

## 15 Fitur Utama

1. **Our Dashboard** — Profil kedua pasangan, foto utama, lama hubungan, total hari bersama, countdown anniversary otomatis, sapaan romantis, aktivitas terbaru, & quick access.
2. **Our Memories** — Upload foto & video privat, album kenangan, filter tanggal/pencarian, tampilan Scrapbook & Grid, favorit, lightbox.
3. **Love Letters** — 5 tema amplop, animasi membuka amplop, surat rahasia, dan penjadwalan tanggal pembukaan terkunci.
4. **Our Calendar** — Kalender bulanan interaktif untuk anniversary, ulang tahun, jadwal kencan, momen spesial, dan pengingat mendatang.
5. **Daily Check-in** — 8 mood & emoji, tingkat kebahagiaan 1–10, cerita harian, pesan untuk pasangan, grafik mood, dan riwayat.
6. **Virtual Love Garden** — Pohon hubungan interaktif 6 tahap pertumbuhan, bunga bermekaran, sistem poin & level, sinkronisasi realtime.
7. **Our Bucket List** — Daftar impian berdua, kategori, target tanggal, checklist selesai, upload foto pencapaian, dan progress bar persentase.
8. **Couple Quiz** — Pilihan ganda, tebak jawaban, kuis acak, buat pertanyaan sendiri, skor, leaderboard, riwayat, & statistik kecocokan.
9. **Our Playlist** — Lagu kenangan dengan kategori, catatan kenangan, dan embed resmi Spotify & YouTube.
10. **Jar of Love** — Toples digital interaktif (Romantis, Motivasi, Penyemangat, Ketika Sedih, Ketika Rindu), ambil pesan acak beranimasi, & riwayat.
11. **Private Chat Realtime** — Chat pribadi 2 anggota via SSE + MySQL lengkap teks, emoji, kirim gambar privat, timestamp, status terkirim/dibaca, typing indicator, & online presence.
12. **Realtime Notification** — Badge & dropdown notifikasi realtime untuk pesan, surat, kenangan, bucket list, kalender, check-in, & virtual hug.
13. **Relationship Timeline** — Garis waktu vertikal perjalanan hubungan dari pertama kenal hingga hari ini dengan foto & lokasi.
14. **Virtual Hug Animation** — Animasi dua karakter mendekat & berpelukan disertai floating hearts, pesan hangat, penerimaan realtime, & riwayat.
15. **AI Love Assistant** — Chatbot berbahasa Indonesia berbasis server API dengan riwayat percakapan MySQL serta batasan etika komunikasi sehat.
16. **Dynamic Onboarding & Settings** — 4-step setup, kode undangan 1x pakai & kedaluwarsa (maks 2 akun), edit profil/tema/privasi, ubah/reset password, Export Memories, Backup Data JSON, dan Account Deletion.

---

## Script Pengujian & Validasi

```bash
npm run db:init     # Membuat database & 26 tabel otomatis di MySQL XAMPP
npm run typecheck   # Cek TypeScript strict mode
npm run lint        # Cek ESLint Next.js
npm test            # Jalankan unit test logika & audit schema MySQL/keamanan
npm run build       # Build produksi Next.js App Router
```

## Dokumentasi Lengkap

- [Panduan Setup XAMPP & phpMyAdmin](./docs/XAMPP_SETUP.md)
- [Dokumentasi Database MySQL & Keamanan](./docs/DATABASE.md)
- [Entity Relationship Diagram (ERD)](./docs/ERD.md)
- [Panduan Konfigurasi AI API](./docs/AI_SETUP.md)
- [Panduan Deployment](./docs/DEPLOYMENT.md)
