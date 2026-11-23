import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MYSQL_SQL_PATH = path.join(ROOT, "database", "our_little_world_mysql.sql");

const REQUIRED_TABLES = [
  "users",
  "user_sessions",
  "password_reset_tokens",
  "profiles",
  "couple_spaces",
  "couple_members",
  "couple_invitations",
  "relationship_settings",
  "memory_albums",
  "memories",
  "love_letters",
  "calendar_events",
  "daily_checkins",
  "love_garden",
  "bucket_list",
  "quiz_questions",
  "quiz_sessions",
  "quiz_answers",
  "playlists",
  "love_jar_messages",
  "chat_messages",
  "notifications",
  "relationship_timeline",
  "virtual_hugs",
  "ai_conversations",
  "ai_messages",
  "media_files",
  "couple_presence",
];

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe("XAMPP MySQL Schema & Security Audit", () => {
  const sql = fs.readFileSync(MYSQL_SQL_PATH, "utf-8");

  it("defines all 28 required InnoDB utf8mb4 tables for phpMyAdmin & Cloud MySQL", () => {
    expect(sql).toContain("CREATE DATABASE IF NOT EXISTS `our_little_world`");
    expect(sql).toContain("utf8mb4_unicode_ci");
    for (const tbl of REQUIRED_TABLES) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS \`${tbl}\``);
    }
  });

  it("enforces relational integrity constraints and unique invite/member keys", () => {
    expect(sql).toContain("UNIQUE KEY `uq_users_email` (`email`)");
    expect(sql).toContain("UNIQUE KEY `uq_couple_members_single_space` (`user_id`)");
    expect(sql).toContain("UNIQUE KEY `uq_couple_invitations_code` (`invite_code`)");
    expect(sql).toContain("ON DELETE CASCADE");
  });

  it("never exposes MySQL credentials or AI_API_KEY in client components", () => {
    const srcFiles = walkFiles(path.join(ROOT, "src"));
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const isClientComponent =
        content.trimStart().startsWith('"use client"') ||
        content.trimStart().startsWith("'use client'");
      if (isClientComponent) {
        expect(content).not.toContain("MYSQL_PASSWORD");
        expect(content).not.toContain("AUTH_SESSION_SECRET");
        expect(content).not.toContain("process.env.AI_API_KEY");
      }
      expect(content).not.toContain("NEXT_PUBLIC_MYSQL_PASSWORD");
      expect(content).not.toContain("NEXT_PUBLIC_AI_API_KEY");
    }
  });

  it("has zero leftover Supabase imports in src/", () => {
    const srcFiles = walkFiles(path.join(ROOT, "src"));
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content).not.toContain("@supabase/");
      expect(content).not.toContain("@/lib/supabase");
    }
  });
});
