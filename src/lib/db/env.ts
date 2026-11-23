export interface MysqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function getMysqlConfig(): MysqlConfig {
  return {
    host: process.env.MYSQL_HOST?.trim() || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT?.trim() || "3306"),
    user: process.env.MYSQL_USER?.trim() || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE?.trim() || "our_little_world",
  };
}

export function isAiConfigured(): boolean {
  const key = process.env.AI_API_KEY?.trim() ?? "";
  return key.length > 10 && !key.includes("YOUR_AI_API_KEY");
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}
