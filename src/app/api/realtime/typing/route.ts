import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { execSql, queryOne } from "@/lib/db/mysql";
import { publishCoupleEvent } from "@/lib/realtime/bus";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );
  if (!member?.couple_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { isTyping?: boolean } | null;
  const isTyping = Boolean(body?.isTyping);

  // Persist typing state briefly in MySQL so it works across serverless Vercel instances
  await execSql(
    `INSERT INTO couple_presence (user_id, couple_id, last_seen_at, typing_until)
     VALUES (?, ?, NOW(), ${isTyping ? "DATE_ADD(NOW(), INTERVAL 5 SECOND)" : "NULL"})
     ON DUPLICATE KEY UPDATE
       last_seen_at = NOW(),
       typing_until = ${isTyping ? "DATE_ADD(NOW(), INTERVAL 5 SECOND)" : "NULL"}`,
    [user.id, member.couple_id]
  ).catch(() => null);

  // Also push instant SSE event for single-server / local XAMPP
  publishCoupleEvent(member.couple_id, {
    event: "typing",
    data: { userId: user.id, isTyping },
  });

  return NextResponse.json({ ok: true });
}
