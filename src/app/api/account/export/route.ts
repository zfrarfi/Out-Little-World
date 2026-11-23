import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { queryOne, queryRows } from "@/lib/db/mysql";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );

  if (!member?.couple_id) {
    return NextResponse.json({ error: "Couple Space tidak ditemukan." }, { status: 404 });
  }

  const coupleId = member.couple_id;
  const scope = new URL(request.url).searchParams.get("scope") ?? "full";

  if (scope === "memories") {
    const [albums, memories] = await Promise.all([
      queryRows("SELECT * FROM memory_albums WHERE couple_id = ?", [coupleId]),
      queryRows("SELECT * FROM memories WHERE couple_id = ? ORDER BY memory_date DESC", [coupleId]),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      exportType: "memories",
      coupleId,
      albums,
      memories,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="our-little-world-memories-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  const [
    coupleSpace,
    relationshipSettings,
    albums,
    memories,
    letters,
    events,
    checkins,
    garden,
    bucketList,
    quizQuestions,
    quizSessions,
    playlists,
    loveJar,
    timeline,
    virtualHugs,
    chatMessages,
  ] = await Promise.all([
    queryOne("SELECT * FROM couple_spaces WHERE id = ?", [coupleId]),
    queryOne("SELECT * FROM relationship_settings WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM memory_albums WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM memories WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM love_letters WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM calendar_events WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM daily_checkins WHERE couple_id = ?", [coupleId]),
    queryOne("SELECT * FROM love_garden WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM bucket_list WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM quiz_questions WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM quiz_sessions WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM playlists WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM love_jar_messages WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM relationship_timeline WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM virtual_hugs WHERE couple_id = ?", [coupleId]),
    queryRows("SELECT * FROM chat_messages WHERE couple_id = ?", [coupleId]),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    exportType: "full_backup",
    coupleSpace,
    relationshipSettings,
    memoryAlbums: albums,
    memories,
    loveLetters: letters,
    calendarEvents: events,
    dailyCheckins: checkins,
    loveGarden: garden,
    bucketList,
    quizQuestions,
    quizSessions,
    playlists,
    loveJarMessages: loveJar,
    relationshipTimeline: timeline,
    virtualHugs,
    chatMessages,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="our-little-world-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
