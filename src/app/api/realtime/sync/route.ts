import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { execSql, normalizeBool, queryOne, queryRows } from "@/lib/db/mysql";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import type {
  ChatMessageRow,
  LoveGardenRow,
  NotificationRow,
  VirtualHugRow,
} from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Serverless-compatible MySQL Realtime Sync endpoint (works across Vercel Lambda
 * instances AND local XAMPP!). Updates user's online heartbeat and returns fresh
 * notifications, chat messages, typing/online status, virtual hugs, or love garden.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );
  if (!member?.couple_id) {
    return NextResponse.json({ error: "No couple space" }, { status: 403 });
  }

  const coupleId = member.couple_id;
  const scope = new URL(request.url).searchParams.get("scope") ?? "notifications";

  // Heartbeat presence in MySQL so partner online status works across serverless instances
  await execSql(
    `INSERT INTO couple_presence (user_id, couple_id, last_seen_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_seen_at = NOW(), couple_id = VALUES(couple_id)`,
    [user.id, coupleId]
  ).catch(() => null);

  if (scope === "notifications") {
    const rows = await queryRows<NotificationRow>(
      "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 20",
      [user.id]
    );
    return NextResponse.json({
      notifications: rows.map((n) => ({ ...n, is_read: normalizeBool(n.is_read) })),
    });
  }

  if (scope === "chat") {
    const [rawMessages, partnerPresence] = await Promise.all([
      queryRows<ChatMessageRow>(
        "SELECT * FROM chat_messages WHERE couple_id = ? ORDER BY created_at ASC LIMIT 120",
        [coupleId]
      ),
      queryOne<{
        is_online: number;
        is_typing: number;
      }>(
        `SELECT
           (last_seen_at >= DATE_SUB(NOW(), INTERVAL 15 SECOND)) AS is_online,
           (typing_until IS NOT NULL AND typing_until > NOW()) AS is_typing
         FROM couple_presence
         WHERE couple_id = ? AND user_id <> ?
         LIMIT 1`,
        [coupleId, user.id]
      ),
    ]);

    return NextResponse.json({
      messages: rawMessages.map((m) => ({
        ...m,
        imageUrl: getPrivateMediaUrl("chat-images", m.image_path),
      })),
      partnerOnline: normalizeBool(partnerPresence?.is_online),
      partnerTyping: normalizeBool(partnerPresence?.is_typing),
    });
  }

  if (scope === "hugs") {
    const rows = await queryRows<VirtualHugRow>(
      "SELECT * FROM virtual_hugs WHERE couple_id = ? ORDER BY created_at DESC LIMIT 40",
      [coupleId]
    );
    return NextResponse.json({
      hugs: rows.map((h) => ({ ...h, is_received: normalizeBool(h.is_received) })),
    });
  }

  if (scope === "garden") {
    const garden = await queryOne<LoveGardenRow>(
      "SELECT * FROM love_garden WHERE couple_id = ? LIMIT 1",
      [coupleId]
    );
    return NextResponse.json({ garden });
  }

  return NextResponse.json({ ok: true });
}
