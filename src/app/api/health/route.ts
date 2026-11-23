import { NextResponse } from "next/server";
import { checkMysqlHealth } from "@/lib/db/mysql";
import { isAiConfigured } from "@/lib/db/env";

export async function GET() {
  const mysql = await checkMysqlHealth();

  return NextResponse.json({
    status: mysql.connected ? "ok" : "degraded",
    app: "Our Little World",
    database: {
      engine: "MySQL / MariaDB (XAMPP & phpMyAdmin)",
      connected: mysql.connected,
      name: mysql.database,
      tableCount: mysql.tableCount,
      error: mysql.error ?? null,
    },
    integrations: {
      aiAssistant: isAiConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
}
