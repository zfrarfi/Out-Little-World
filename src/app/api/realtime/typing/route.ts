import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { queryOne } from "@/lib/db/mysql";
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
  publishCoupleEvent(member.couple_id, {
    event: "typing",
    data: { userId: user.id, isTyping: Boolean(body?.isTyping) },
  });

  return NextResponse.json({ ok: true });
}
