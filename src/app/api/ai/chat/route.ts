import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { execSql, queryOne, queryRows } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { aiChatRequestSchema } from "@/lib/utils/validators";
import { generateLoveAssistantReply } from "@/lib/ai/love-assistant";
import type { AiMessageRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = aiChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Pesan tidak valid." },
      { status: 400 }
    );
  }

  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );
  if (!member?.couple_id) {
    return NextResponse.json({ error: "Couple Space belum ditemukan." }, { status: 403 });
  }

  const coupleId = member.couple_id;

  const [myProfile, space, settings, partnerMember] = await Promise.all([
    queryOne<{ nickname: string; full_name: string }>(
      "SELECT nickname, full_name FROM profiles WHERE id = ? LIMIT 1",
      [user.id]
    ),
    queryOne<{ name: string }>("SELECT name FROM couple_spaces WHERE id = ? LIMIT 1", [coupleId]),
    queryOne<{
      anniversary_date: string | null;
      partner_placeholder_nickname: string | null;
      partner_placeholder_name: string | null;
    }>(
      "SELECT anniversary_date, partner_placeholder_nickname, partner_placeholder_name FROM relationship_settings WHERE couple_id = ? LIMIT 1",
      [coupleId]
    ),
    queryOne<{ user_id: string }>(
      "SELECT user_id FROM couple_members WHERE couple_id = ? AND user_id <> ? LIMIT 1",
      [coupleId, user.id]
    ),
  ]);

  let partnerNickname =
    settings?.partner_placeholder_nickname || settings?.partner_placeholder_name || "Pasanganmu";
  if (partnerMember?.user_id) {
    const pProf = await queryOne<{ nickname: string; full_name: string }>(
      "SELECT nickname, full_name FROM profiles WHERE id = ? LIMIT 1",
      [partnerMember.user_id]
    );
    if (pProf) {
      partnerNickname = pProf.nickname || pProf.full_name || partnerNickname;
    }
  }

  let conversationId = parsed.data.conversationId;
  if (!conversationId) {
    conversationId = generateUuid();
    await execSql(
      "INSERT INTO ai_conversations (id, couple_id, user_id, title, topic) VALUES (?, ?, ?, ?, ?)",
      [
        conversationId,
        coupleId,
        user.id,
        parsed.data.message.slice(0, 60),
        parsed.data.topic ?? "general",
      ]
    );
  } else {
    const owns = await queryOne<{ id: string }>(
      "SELECT id FROM ai_conversations WHERE id = ? AND user_id = ? AND couple_id = ? LIMIT 1",
      [conversationId, user.id, coupleId]
    );
    if (!owns) {
      return NextResponse.json({ error: "Percakapan AI tidak ditemukan." }, { status: 404 });
    }
  }

  const userMsgId = generateUuid();
  await execSql(
    "INSERT INTO ai_messages (id, couple_id, conversation_id, role, content) VALUES (?, ?, ?, 'user', ?)",
    [userMsgId, coupleId, conversationId, parsed.data.message]
  );

  const savedUserMsg = await queryOne<AiMessageRow>("SELECT * FROM ai_messages WHERE id = ?", [
    userMsgId,
  ]);

  const history = await queryRows<{ role: "user" | "assistant"; content: string }>(
    "SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20",
    [conversationId]
  );

  try {
    const { reply, model, mode } = await generateLoveAssistantReply(
      history,
      {
        userNickname: myProfile?.nickname || myProfile?.full_name || "Kamu",
        partnerNickname,
        coupleSpaceName: space?.name || "Our Little World",
        anniversaryDate: settings?.anniversary_date ?? null,
      },
      parsed.data.topic
    );

    const aiMsgId = generateUuid();
    await execSql(
      "INSERT INTO ai_messages (id, couple_id, conversation_id, role, content) VALUES (?, ?, ?, 'assistant', ?)",
      [aiMsgId, coupleId, conversationId, reply]
    );
    await execSql("UPDATE ai_conversations SET updated_at = NOW() WHERE id = ?", [conversationId]);

    const savedAssistantMsg = await queryOne<AiMessageRow>(
      "SELECT * FROM ai_messages WHERE id = ?",
      [aiMsgId]
    );

    return NextResponse.json({
      conversationId,
      model,
      mode,
      userMessage: savedUserMsg,
      assistantMessage: savedAssistantMsg,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Gagal mendapatkan jawaban dari Love Assistant.",
        conversationId,
      },
      { status: 502 }
    );
  }
}
