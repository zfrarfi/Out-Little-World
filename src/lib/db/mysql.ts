import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { getMysqlConfig } from "./env";

const globalForMysql = globalThis as unknown as {
  __olwMysqlPool?: Pool;
};

export function getDbPool(): Pool {
  if (!globalForMysql.__olwMysqlPool) {
    const cfg = getMysqlConfig();
    globalForMysql.__olwMysqlPool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      dateStrings: true,
    });
  }
  return globalForMysql.__olwMysqlPool;
}

export type SqlParam = string | number | boolean | Date | Buffer | null | undefined;
type SafeSqlParam = string | number | boolean | Date | Buffer | null;

function sanitizeParams(params: SqlParam[]): SafeSqlParam[] {
  return params.map((p) => (p === undefined ? null : p));
}

export async function queryRows<T = RowDataPacket>(
  sql: string,
  params: SqlParam[] = []
): Promise<T[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(sql, sanitizeParams(params));
  return rows as unknown as T[];
}

export async function queryOne<T = RowDataPacket>(
  sql: string,
  params: SqlParam[] = []
): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function execSql(
  sql: string,
  params: SqlParam[] = []
): Promise<ResultSetHeader> {
  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, sanitizeParams(params));
  return result;
}

export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const res = await fn(conn);
    await conn.commit();
    return res;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function checkMysqlHealth(): Promise<{
  connected: boolean;
  database: string;
  tableCount: number;
  error?: string;
}> {
  const cfg = getMysqlConfig();
  try {
    const row = await queryOne<{ total: number }>(
      "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ?",
      [cfg.database]
    );
    return {
      connected: true,
      database: cfg.database,
      tableCount: Number(row?.total ?? 0),
    };
  } catch (err) {
    return {
      connected: false,
      database: cfg.database,
      tableCount: 0,
      error: err instanceof Error ? err.message : "Tidak dapat terhubung ke MySQL XAMPP.",
    };
  }
}

/** Converts ISO datetime string or Date into MySQL DATETIME string 'YYYY-MM-DD HH:mm:ss' */
export function toMysqlDatetime(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export function normalizeBool(val: unknown): boolean {
  return val === true || val === 1 || val === "1";
}
