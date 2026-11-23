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

async function main() {
  const root = process.cwd();
  loadEnvFile(path.join(root, ".env.local"));

  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = Number(process.env.MYSQL_PORT || "3306");
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD || "";
  const database = process.env.MYSQL_DATABASE || "our_little_world";

  console.log(`[db:init] Menghubungkan ke MySQL XAMPP (${user}@${host}:${port})...`);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    const sqlPath = path.join(root, "database", "our_little_world_mysql.sql");
    let sql = fs.readFileSync(sqlPath, "utf-8");
    if (database !== "our_little_world") {
      sql = sql.replace(/`our_little_world`/g, `\`${database}\``);
    }

    await conn.query(sql);

    const [tables] = await conn.query(
      "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ?",
      [database]
    );
    const total = Array.isArray(tables) && tables[0] ? tables[0].total : 0;
    console.log(
      `[db:init] SUKSES! Database '${database}' siap digunakan dengan ${total} tabel di phpMyAdmin.`
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[db:init] GAGAL terhubung ke MySQL XAMPP:", err.message);
  console.error("Pastikan modul MySQL di XAMPP Control Panel sudah diklik 'Start'!");
  process.exit(1);
});
