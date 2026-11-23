import { NextResponse } from "next/server";
import { checkMysqlHealth } from "@/lib/db/mysql";
import { getStorageDriver, isAiConfigured, isVercelRuntime } from "@/lib/db/env";

export async function GET() {
  const mysql = await checkMysqlHealth();

  return NextResponse.json({
    status: mysql.connected ? "ok" : "degraded",
    app: "Our Little World",
    runtime: isVercelRuntime() ? "vercel-serverless" : "node-local",
    storageDriver: getStorageDriver(),
    database: {
      engine: "MySQL / MariaDB",
      host: mysql.host,
      ssl: mysql.ssl,
      connected: mysql.connected,
      name: mysql.database,
      tableCount: mysql.tableCount,
      error: mysql.error ?? null,
    },
    integrations: {
      aiAssistantMode: isAiConfigured() ? "external_api" : "local_fallback",
    },
    timestamp: new Date().toISOString(),
  });
}
