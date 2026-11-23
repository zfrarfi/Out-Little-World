import mysql from "mysql2/promise";
import { getMysqlConfig } from "./env";
import { getDbPool } from "./mysql";
import { MYSQL_TABLE_STATEMENTS } from "./schema-sql";

const globalForInit = globalThis as unknown as {
  __olwSchemaReady?: boolean;
  __olwSchemaInitPromise?: Promise<void>;
};

/**
 * Automatically creates all 28 tables on first visit whenever connected to a fresh
 * MySQL database (TiDB Cloud, Aiven, Railway, or XAMPP) — zero manual SQL copy-paste needed!
 */
export async function ensureDatabaseSchema(): Promise<{ initialized: boolean; error?: string }> {
  if (globalForInit.__olwSchemaReady) {
    return { initialized: true };
  }

  if (!globalForInit.__olwSchemaInitPromise) {
    globalForInit.__olwSchemaInitPromise = (async () => {
      const cfg = getMysqlConfig();

      // Try creating database if missing (works on XAMPP / TiDB Cloud / Railway)
      try {
        const bootstrap = await mysql.createConnection({
          host: cfg.host,
          port: cfg.port,
          user: cfg.user,
          password: cfg.password,
          ssl: cfg.useSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: false } : undefined,
          charset: "utf8mb4",
        });
        try {
          const safeDb = cfg.database.replace(/[^a-zA-Z0-9_]/g, "");
          if (safeDb) {
            await bootstrap.query(
              `CREATE DATABASE IF NOT EXISTS \`${safeDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
          }
        } finally {
          await bootstrap.end();
        }
      } catch {
        // Cloud providers like Aiven pre-create the database (`defaultdb`) and restrict CREATE DATABASE;
        // proceed directly to creating tables inside the target database.
      }

      const pool = getDbPool();
      const [rows] = await pool.query<mysql.RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ?",
        [cfg.database]
      );
      const existingCount = Number(rows?.[0]?.total ?? 0);

      if (existingCount < MYSQL_TABLE_STATEMENTS.length) {
        for (const stmt of MYSQL_TABLE_STATEMENTS) {
          await pool.query(stmt);
        }
      }

      globalForInit.__olwSchemaReady = true;
    })().catch((err) => {
      globalForInit.__olwSchemaInitPromise = undefined;
      throw err;
    });
  }

  try {
    await globalForInit.__olwSchemaInitPromise;
    return { initialized: true };
  } catch (err) {
    return {
      initialized: false,
      error: err instanceof Error ? err.message : "Gagal inisialisasi skema MySQL.",
    };
  }
}
