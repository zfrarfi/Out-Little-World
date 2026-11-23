# Panduan Menjalankan Lokal (XAMPP) & Deployment Produksi

## A. Menjalankan Lokal (VS Code + XAMPP + phpMyAdmin)

1. Buka **XAMPP Control Panel** → klik **Start** pada **Apache** dan **MySQL**.
2. Buka folder `D:\AchmadZufarTUGAS\PROJECT SENDIRI\WEB` di **VS Code**.
3. Pastikan database `our_little_world` sudah ada di phpMyAdmin (`http://localhost/phpmyadmin`). Jika belum, jalankan di Terminal VS Code:
   ```bash
   npm run db:init
   ```
4. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
5. Buka [http://localhost:3000](http://localhost:3000).

## B. Deployment ke Server / Cloud (Opsional)

Jika ingin men-deploy website ini ke internet:
1. Gunakan layanan MySQL/MariaDB terkelola (misal PlanetScale, Railway MySQL, Aiven MySQL, atau VPS dengan MariaDB).
2. Import file `database/our_little_world_mysql.sql` ke server MySQL produksi.
3. Atur Environment Variables pada hosting Node.js/Next.js Anda (Railway, Render, VPS, atau Vercel + Remote MySQL):
   - `NEXT_PUBLIC_APP_URL`
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - `AUTH_SESSION_SECRET` (string acak minimal 32 karakter)
   - `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL` (opsional untuk AI Love Assistant)
4. Jalankan `npm run build` lalu `npm start`.
