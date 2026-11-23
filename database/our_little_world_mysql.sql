-- ============================================================================
-- OUR LITTLE WORLD — MySQL / MariaDB Schema (XAMPP & phpMyAdmin)
-- ============================================================================
-- Cara import di phpMyAdmin:
-- 1. Buka http://localhost/phpmyadmin
-- 2. Klik tab "Import" -> pilih file ini -> klik "Go / Kirim"
-- Database `our_little_world` dan seluruh 26 tabel akan otomatis dibuat.
-- Kompatibel dengan MariaDB 10.4+ (XAMPP) & MySQL 8.0+ (utf8mb4 full emoji).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `our_little_world`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `our_little_world`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. users (Autentikasi Lokal - Email & Password Hash)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. user_sessions (Sesi Login HTTP-Only Cookie)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_sessions_token` (`token_hash`),
  KEY `idx_user_sessions_user` (`user_id`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. password_reset_tokens (Forgot Password Lokal)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_reset_token` (`token_hash`),
  KEY `idx_password_reset_user` (`user_id`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. profiles (Dynamic User Profile & Preferensi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL DEFAULT '',
  `nickname` VARCHAR(80) NOT NULL DEFAULT '',
  `avatar_path` VARCHAR(500) NULL,
  `birth_date` DATE NULL,
  `bio` TEXT NULL,
  `gender` VARCHAR(32) NULL,
  `onboarding_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `notify_messages` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_letters` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_memories` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_calendar` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_checkins` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_hugs` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_bucket_list` TINYINT(1) NOT NULL DEFAULT 1,
  `show_online_status` TINYINT(1) NOT NULL DEFAULT 1,
  `show_read_receipts` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_partner_edit_shared` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. couple_spaces
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `couple_spaces` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_couple_spaces_creator` (`created_by`),
  CONSTRAINT `fk_couple_spaces_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. couple_members (Maksimal 2 anggota per Couple Space, 1 space per akun)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `couple_members` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('creator', 'partner') NOT NULL,
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_couple_members_pair` (`couple_id`, `user_id`),
  UNIQUE KEY `uq_couple_members_single_space` (`user_id`),
  KEY `idx_couple_members_couple` (`couple_id`),
  CONSTRAINT `fk_couple_members_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_couple_members_user` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. couple_invitations (Kode Undangan Pasangan - 1x pakai & kedaluwarsa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `couple_invitations` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `inviter_id` CHAR(36) NOT NULL,
  `invite_code` VARCHAR(32) NOT NULL,
  `status` ENUM('pending', 'claimed', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
  `expires_at` DATETIME NOT NULL,
  `claimed_by` CHAR(36) NULL,
  `claimed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_couple_invitations_code` (`invite_code`),
  KEY `idx_couple_invitations_couple` (`couple_id`),
  CONSTRAINT `fk_invitations_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invitations_inviter` FOREIGN KEY (`inviter_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invitations_claimed_by` FOREIGN KEY (`claimed_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. relationship_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `relationship_settings` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `partner_placeholder_name` VARCHAR(120) NULL,
  `partner_placeholder_nickname` VARCHAR(80) NULL,
  `partner_placeholder_avatar_path` VARCHAR(500) NULL,
  `partner_placeholder_birth_date` DATE NULL,
  `partner_placeholder_bio` TEXT NULL,
  `first_met_online_date` DATE NULL,
  `first_met_in_person_date` DATE NULL,
  `anniversary_date` DATE NULL,
  `first_meeting_place` VARCHAR(180) NULL,
  `origin_story` TEXT NULL,
  `first_photo_path` VARCHAR(500) NULL,
  `main_photo_path` VARCHAR(500) NULL,
  `theme_preset` VARCHAR(32) NOT NULL DEFAULT 'soft-pink',
  `font_family` VARCHAR(24) NOT NULL DEFAULT 'poppins',
  `animation_style` VARCHAR(24) NOT NULL DEFAULT 'gentle',
  `dashboard_banner_path` VARCHAR(500) NULL,
  `romantic_message` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_relationship_settings_couple` (`couple_id`),
  CONSTRAINT `fk_rel_settings_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. memory_albums
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `memory_albums` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `cover_path` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_memory_albums_couple` (`couple_id`),
  CONSTRAINT `fk_memory_albums_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_memory_albums_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. memories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `memories` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `album_id` CHAR(36) NULL,
  `uploaded_by` CHAR(36) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `caption` TEXT NULL,
  `media_type` ENUM('photo', 'video') NOT NULL,
  `media_path` VARCHAR(500) NOT NULL,
  `memory_date` DATE NOT NULL,
  `location` VARCHAR(160) NULL,
  `is_favorite` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_memories_couple_date` (`couple_id`, `memory_date`),
  KEY `idx_memories_album` (`album_id`),
  CONSTRAINT `fk_memories_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_memories_album` FOREIGN KEY (`album_id`) REFERENCES `memory_albums` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_memories_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. love_letters
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `love_letters` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `sender_id` CHAR(36) NOT NULL,
  `recipient_id` CHAR(36) NULL,
  `title` VARCHAR(180) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `design_theme` VARCHAR(32) NOT NULL DEFAULT 'classic-cream',
  `is_secret` TINYINT(1) NOT NULL DEFAULT 0,
  `scheduled_open_at` DATETIME NULL,
  `opened_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_love_letters_couple` (`couple_id`, `created_at`),
  CONSTRAINT `fk_letters_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_letters_sender` FOREIGN KEY (`sender_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_letters_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. calendar_events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `event_type` ENUM('anniversary', 'birthday', 'date', 'special') NOT NULL,
  `event_date` DATE NOT NULL,
  `event_time` VARCHAR(16) NULL,
  `location` VARCHAR(160) NULL,
  `reminder_days_before` INT NOT NULL DEFAULT 1,
  `is_recurring_yearly` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_couple_date` (`couple_id`, `event_date`),
  CONSTRAINT `fk_calendar_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_calendar_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. daily_checkins
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_checkins` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `checkin_date` DATE NOT NULL,
  `mood` VARCHAR(32) NOT NULL,
  `emoji` VARCHAR(16) NOT NULL,
  `happiness_level` TINYINT NOT NULL,
  `daily_story` TEXT NULL,
  `message_to_partner` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_daily_checkin_user_date` (`couple_id`, `user_id`, `checkin_date`),
  KEY `idx_checkins_couple_date` (`couple_id`, `checkin_date`),
  CONSTRAINT `fk_checkins_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkins_user` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. love_garden
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `love_garden` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `tree_name` VARCHAR(80) NOT NULL DEFAULT 'Pohon Cinta Kita',
  `plant_stage` VARCHAR(32) NOT NULL DEFAULT 'seed',
  `growth_points` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `water_count` INT NOT NULL DEFAULT 0,
  `sunlight_count` INT NOT NULL DEFAULT 0,
  `fertilizer_count` INT NOT NULL DEFAULT 0,
  `flowers_bloomed` INT NOT NULL DEFAULT 0,
  `last_cared_by` CHAR(36) NULL,
  `last_cared_at` DATETIME NULL,
  `last_action_type` VARCHAR(24) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_love_garden_couple` (`couple_id`),
  CONSTRAINT `fk_garden_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_garden_carer` FOREIGN KEY (`last_cared_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. bucket_list
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bucket_list` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(32) NOT NULL DEFAULT 'other',
  `target_date` DATE NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  `achievement_photo_path` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bucket_list_couple` (`couple_id`, `is_completed`),
  CONSTRAINT `fk_bucket_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bucket_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. quiz_questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('multiple_choice', 'guess_answer') NOT NULL DEFAULT 'multiple_choice',
  `option_a` VARCHAR(200) NULL,
  `option_b` VARCHAR(200) NULL,
  `option_c` VARCHAR(200) NULL,
  `option_d` VARCHAR(200) NULL,
  `correct_answer` VARCHAR(200) NOT NULL,
  `category` VARCHAR(32) NOT NULL DEFAULT 'about_us',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_questions_couple` (`couple_id`, `is_active`),
  CONSTRAINT `fk_quiz_q_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quiz_q_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. quiz_sessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_sessions` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `player_id` CHAR(36) NOT NULL,
  `mode` VARCHAR(32) NOT NULL DEFAULT 'random',
  `total_questions` INT NOT NULL,
  `correct_answers` INT NOT NULL DEFAULT 0,
  `score` INT NOT NULL DEFAULT 0,
  `compatibility_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_sessions_couple` (`couple_id`, `completed_at`),
  CONSTRAINT `fk_quiz_s_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quiz_s_player` FOREIGN KEY (`player_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. quiz_answers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_answers` (
  `id` CHAR(36) NOT NULL,
  `session_id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `question_id` CHAR(36) NOT NULL,
  `player_id` CHAR(36) NOT NULL,
  `selected_answer` VARCHAR(255) NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_answers_session` (`session_id`),
  KEY `idx_quiz_answers_couple` (`couple_id`),
  CONSTRAINT `fk_quiz_a_session` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quiz_a_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quiz_a_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quiz_a_player` FOREIGN KEY (`player_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. playlists
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `added_by` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `artist` VARCHAR(160) NOT NULL,
  `spotify_url` VARCHAR(500) NULL,
  `youtube_url` VARCHAR(500) NULL,
  `cover_url` VARCHAR(500) NULL,
  `memory_note` TEXT NULL,
  `category` VARCHAR(32) NOT NULL DEFAULT 'our_anthem',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_playlists_couple` (`couple_id`, `category`),
  CONSTRAINT `fk_playlists_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlists_user` FOREIGN KEY (`added_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. love_jar_messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `love_jar_messages` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `author_id` CHAR(36) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `message` TEXT NOT NULL,
  `is_opened` TINYINT(1) NOT NULL DEFAULT 0,
  `opened_by` CHAR(36) NULL,
  `opened_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_love_jar_couple` (`couple_id`, `is_opened`, `category`),
  CONSTRAINT `fk_love_jar_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_love_jar_author` FOREIGN KEY (`author_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_love_jar_opener` FOREIGN KEY (`opened_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. chat_messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `sender_id` CHAR(36) NOT NULL,
  `content` TEXT NULL,
  `image_path` VARCHAR(500) NULL,
  `status` ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_couple_created` (`couple_id`, `created_at`),
  CONSTRAINT `fk_chat_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_sender` FOREIGN KEY (`sender_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `recipient_id` CHAR(36) NOT NULL,
  `actor_id` CHAR(36) NULL,
  `type` VARCHAR(32) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `body` TEXT NOT NULL,
  `link_url` VARCHAR(255) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_recipient` (`recipient_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_notif_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_actor` FOREIGN KEY (`actor_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. relationship_timeline
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `relationship_timeline` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `milestone_type` VARCHAR(32) NOT NULL,
  `event_date` DATE NOT NULL,
  `description` TEXT NULL,
  `location` VARCHAR(160) NULL,
  `photo_path` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_timeline_couple_date` (`couple_id`, `event_date`),
  CONSTRAINT `fk_timeline_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_timeline_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 24. virtual_hugs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `virtual_hugs` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `sender_id` CHAR(36) NOT NULL,
  `recipient_id` CHAR(36) NULL,
  `hug_style` VARCHAR(32) NOT NULL DEFAULT 'warm_hug',
  `message` TEXT NOT NULL,
  `is_received` TINYINT(1) NOT NULL DEFAULT 0,
  `received_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hugs_couple_created` (`couple_id`, `created_at`),
  CONSTRAINT `fk_hugs_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hugs_sender` FOREIGN KEY (`sender_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hugs_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 25. ai_conversations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `title` VARCHAR(160) NOT NULL DEFAULT 'Obrolan Baru',
  `topic` VARCHAR(80) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_conv_user` (`user_id`, `updated_at`),
  CONSTRAINT `fk_ai_conv_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_conv_user` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 26. ai_messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `conversation_id` CHAR(36) NOT NULL,
  `role` ENUM('user', 'assistant') NOT NULL,
  `content` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_msg_conv` (`conversation_id`, `created_at`),
  CONSTRAINT `fk_ai_msg_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 27. media_files (Penyimpanan Media Privat Serverless-Ready untuk Vercel & Cloud)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` CHAR(36) NOT NULL,
  `bucket` VARCHAR(40) NOT NULL,
  `object_path` VARCHAR(500) NOT NULL,
  `owner_scope_id` CHAR(36) NOT NULL,
  `uploaded_by` CHAR(36) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `size_bytes` INT NOT NULL,
  `content` LONGBLOB NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_media_bucket_path` (`bucket`, `object_path`(191)),
  KEY `idx_media_scope` (`owner_scope_id`),
  CONSTRAINT `fk_media_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 28. couple_presence (Status Online & Typing Indicator Lintas Server / Vercel)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `couple_presence` (
  `user_id` CHAR(36) NOT NULL,
  `couple_id` CHAR(36) NOT NULL,
  `last_seen_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `typing_until` DATETIME NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_presence_couple` (`couple_id`, `last_seen_at`),
  CONSTRAINT `fk_presence_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_presence_space` FOREIGN KEY (`couple_id`) REFERENCES `couple_spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
