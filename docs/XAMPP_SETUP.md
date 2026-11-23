# Panduan Setup XAMPP & phpMyAdmin (Database MySQL)

Project **Our Little World** telah terhubung langsung dengan **MySQL / MariaDB di XAMPP** dan dapat dipantau penuh melalui **phpMyAdmin** — tanpa perlu akun layanan cloud eksternal!

---

## Langkah 1 — Jalankan XAMPP
1. Buka **XAMPP Control Panel**.
2. Klik **Start** pada **Apache** (untuk mengakses phpMyAdmin) dan **MySQL** (port default `3306`).

## Langkah 2 — Buat Database & 26 Tabel (Pilih Salah Satu Cara)

### Cara A — Otomatis Lewat Terminal VS Code (Paling Cepat)
Buka folder `D:\AchmadZufarTUGAS\PROJECT SENDIRI\WEB` di **VS Code**, buka Terminal (`Ctrl + ~`), lalu jalankan:
```bash
npm run db:init
```
Perintah ini otomatis membuat database `our_little_world` dan seluruh **26 tabel** ke MySQL XAMPP Anda!

### Cara B — Import Manual Lewat phpMyAdmin
1. Buka browser ke [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Klik tab **Import** di bagian atas.
3. Klik **Choose File** dan pilih file:
   `D:\AchmadZufarTUGAS\PROJECT SENDIRI\WEB\database\our_little_world_mysql.sql`
4. Klik tombol **Import / Go / Kirim** di bagian bawah.
5. Database **`our_little_world`** beserta 26 tabel otomatis muncul di sidebar kiri phpMyAdmin!

## Langkah 3 — Cek File `.env.local`
File `.env.local` sudah otomatis disiapkan untuk konfigurasi standar XAMPP:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=our_little_world
```
> Jika MySQL XAMPP Anda memakai password `root` khusus atau port selain `3306`, cukup ubah `MYSQL_PASSWORD` / `MYSQL_PORT` di `.env.local`.

## Langkah 4 — Jalankan Website di VS Code
Di Terminal VS Code, jalankan:
```bash
npm run dev
```
Lalu buka [http://localhost:3000](http://localhost:3000).
Untuk mengecek status koneksi database kapan saja, buka [http://localhost:3000/api/health](http://localhost:3000/api/health).
