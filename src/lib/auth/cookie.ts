import { cookies } from "next/headers";
import { execSql, queryOne, toMysqlDatetime } from "@/lib/db/mysql";
import { generateSecureToken, generateUuid, sha256Hex } from "./crypto";

export const SESSION_COOKIE_NAME = "olw_session";
const SESSION_DAYS = 14;

export interface SessionUser {
  id: string;
  email: string;
}

export async function createSessionForUser(userId: string): Promise<void> {
  const rawToken = generateSecureToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await execSql(
    "INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [generateUuid(), userId, tokenHash, toMysqlDatetime(expires)]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = sha256Hex(rawToken);
  try {
    const row = await queryOne<SessionUser>(
      `SELECT u.id, u.email
       FROM user_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return row;
  } catch {
    return null;
  }
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    try {
      await execSql("DELETE FROM user_sessions WHERE token_hash = ?", [sha256Hex(rawToken)]);
    } catch {
      // ignore if DB unreachable during signout
    }
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
