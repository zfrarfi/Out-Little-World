export interface MysqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  useSsl: boolean;
}

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL);
}

export function getStorageDriver(): "local" | "database" {
  const configured = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (configured === "database" || configured === "local") {
    return configured;
  }
  // Automatically store uploads in MySQL LONGBLOB on Vercel serverless where local disk is ephemeral
  return isVercelRuntime() ? "database" : "local";
}

export function getMysqlConfig(): MysqlConfig {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://"))) {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname;
    const isLocal = host === "127.0.0.1" || host === "localhost";
    const sslParam = parsed.searchParams.get("ssl") ?? parsed.searchParams.get("ssl-mode");
    const explicitDisable = sslParam === "false" || sslParam === "DISABLED" || process.env.MYSQL_SSL === "false";

    return {
      host,
      port: Number(parsed.port || "3306"),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "our_little_world",
      useSsl: !isLocal && !explicitDisable,
    };
  }

  const host = process.env.MYSQL_HOST?.trim() || "127.0.0.1";
  const isLocal = host === "127.0.0.1" || host === "localhost";
  const useSsl =
    process.env.MYSQL_SSL === "true" || (!isLocal && process.env.MYSQL_SSL !== "false");

  return {
    host,
    port: Number(process.env.MYSQL_PORT?.trim() || "3306"),
    user: process.env.MYSQL_USER?.trim() || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE?.trim() || "our_little_world",
    useSsl,
  };
}

export function isAiConfigured(): boolean {
  const key = process.env.AI_API_KEY?.trim() ?? "";
  return key.length > 10 && !key.includes("YOUR_AI_API_KEY");
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
