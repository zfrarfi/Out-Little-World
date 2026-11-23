import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

function resolveConnectionConfig() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://"))) {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname;
    const isLocal = host === "127.0.0.1" || host === "localhost";
    const database = parsed.pathname.replace(/^\//, "") || "our_little_world";
    return {
      host,
      port: Number(parsed.port || "3306"),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database,
      ssl: isLocal ? undefined : { minVersion: "TLSv1.2", rejectUnauthorized: false },
    };
  }

  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const isLocal = host === "127.0.0.1" || host === "localhost";
  const useSsl = process.env.MYSQL_SSL === "true" || (!isLocal && process.env.MYSQL_SSL !== "false");

  return {
    host,
    port: Number(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "our_little_world",
    ssl: useSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: false } : undefined,
  };
}

async function main() {
  const root = process.cwd();
  loadEnvFile(path.join(root, ".env.local"));

  const cfg = resolveConnectionConfig();
  console.log(
    `[db:init] Menghubungkan ke MySQL (${cfg.user}@${cfg.host}:${cfg.port}, db=${cfg.database}, ssl=${Boolean(
      cfg.ssl
    )})...`
  );

  // Connect without database first so CREATE DATABASE succeeds on XAMPP & cloud servers
  // Fallback to connecting directly to cfg.database if cloud provider restricts CREATE DATABASE
  let conn;
  let connectedDirectly = false;
  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      ssl: cfg.ssl,
      multipleStatements: true,
      charset: "utf8mb4",
    });
  } catch {
    conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      ssl: cfg.ssl,
      multipleStatements: true,
      charset: "utf8mb4",
    });
    connectedDirectly = true;
  }

  try {
    const sqlPath = path.join(root, "database", "our_little_world_mysql.sql");
    let sql = fs.readFileSync(sqlPath, "utf-8");

    if (connectedDirectly) {
      sql = sql
        .replace(/CREATE DATABASE IF NOT EXISTS[\s\S]*?;/i, "")
        .replace(/USE\s+`our_little_world`\s*;/i, "");
    } else if (cfg.database !== "our_little_world") {
      sql = sql.replace(/`our_little_world`/g, `\`${cfg.database}\``);
    }

    await conn.query(sql);

    const [tables] = await conn.query(
      "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ?",
      [cfg.database]
    );
    const total = Array.isArray(tables) && tables[0] ? tables[0].total : 0;
    console.log(
      `[db:init] SUKSES! Database '${cfg.database}' siap digunakan dengan ${total} tabel.`
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[db:init] GAGAL terhubung ke MySQL:", err.message);
  console.error(
    "Jika lokal, pastikan MySQL di XAMPP Control Panel sudah 'Start'. Jika cloud, periksa DATABASE_URL / MYSQL_HOST."
  );
  process.exit(1);
});
