# Entity Relationship Diagram (ERD) — Our Little World (MySQL / phpMyAdmin)

Diagram di bawah menggambarkan relasi seluruh **26 tabel** pada database MySQL/MariaDB `our_little_world` di XAMPP & phpMyAdmin.

```mermaid
erDiagram
    users ||--o{ user_sessions : "authenticates"
    users ||--o{ password_reset_tokens : "resets"
    users ||--|| profiles : "has_profile"

    profiles ||--o{ couple_spaces : "creates"
    profiles ||--o| couple_members : "belongs_to"
    couple_spaces ||--|{ couple_members : "has_max_2"
    couple_spaces ||--o{ couple_invitations : "issues"
    couple_spaces ||--|| relationship_settings : "configures"
    couple_spaces ||--|| love_garden : "grows"

    couple_spaces ||--o{ memory_albums : "organizes"
    memory_albums ||--o{ memories : "contains"
    couple_spaces ||--o{ memories : "stores"

    couple_spaces ||--o{ love_letters : "exchanges"
    couple_spaces ||--o{ calendar_events : "schedules"
    couple_spaces ||--o{ daily_checkins : "logs"
    couple_spaces ||--o{ bucket_list : "tracks"

    couple_spaces ||--o{ quiz_questions : "owns"
    couple_spaces ||--o{ quiz_sessions : "records"
    quiz_sessions ||--|{ quiz_answers : "has"
    quiz_questions ||--o{ quiz_answers : "answered_by"

    couple_spaces ||--o{ playlists : "curates"
    couple_spaces ||--o{ love_jar_messages : "collects"
    couple_spaces ||--o{ chat_messages : "chats"
    couple_spaces ||--o{ notifications : "notifies"
    couple_spaces ||--o{ relationship_timeline : "chronicles"
    couple_spaces ||--o{ virtual_hugs : "sends"

    couple_spaces ||--o{ ai_conversations : "hosts"
    profiles ||--o{ ai_conversations : "owns_private"
    ai_conversations ||--o{ ai_messages : "contains"
```

## Ringkasan Integritas Relasional

- **Engine & Charset**: Seluruh 26 tabel menggunakan `ENGINE=InnoDB` dan `utf8mb4_unicode_ci` untuk dukungan transaksi atomik, Foreign Key `ON DELETE CASCADE/SET NULL`, serta seluruh karakter emoji.
- **Isolasi Multi-Pasangan**: Setiap tabel fitur menyimpan kolom `couple_id` dan setiap Server Action/API hanya memproses `couple_id` milik sesi yang login.
- **Maksimal 2 Anggota**: `couple_members` memiliki `UNIQUE(user_id)` dan transaksi `FOR UPDATE` saat klaim kode undangan guna memastikan maksimal 2 akun per Couple Space.
