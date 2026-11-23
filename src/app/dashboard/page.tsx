import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryOne, queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { ActivityFeedItem } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  const [
    memCountRow,
    letCountRow,
    bucketRows,
    gardenRow,
    recentMemories,
    recentLetters,
    recentCheckins,
    recentHugs,
  ] = await Promise.all([
    queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM memories WHERE couple_id = ?", [
      coupleId,
    ]),
    queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM love_letters WHERE couple_id = ?", [
      coupleId,
    ]),
    queryRows<{ id: string; is_completed: number }>(
      "SELECT id, is_completed FROM bucket_list WHERE couple_id = ?",
      [coupleId]
    ),
    queryOne<{ level: number; growth_points: number }>(
      "SELECT level, growth_points FROM love_garden WHERE couple_id = ? LIMIT 1",
      [coupleId]
    ),
    queryRows<{ id: string; title: string; caption: string | null; created_at: string }>(
      "SELECT id, title, caption, created_at FROM memories WHERE couple_id = ? ORDER BY created_at DESC LIMIT 3",
      [coupleId]
    ),
    queryRows<{ id: string; title: string; created_at: string }>(
      "SELECT id, title, created_at FROM love_letters WHERE couple_id = ? ORDER BY created_at DESC LIMIT 3",
      [coupleId]
    ),
    queryRows<{
      id: string;
      emoji: string;
      happiness_level: number;
      daily_story: string | null;
      created_at: string;
    }>(
      "SELECT id, emoji, happiness_level, daily_story, created_at FROM daily_checkins WHERE couple_id = ? ORDER BY created_at DESC LIMIT 3",
      [coupleId]
    ),
    queryRows<{ id: string; message: string; created_at: string }>(
      "SELECT id, message, created_at FROM virtual_hugs WHERE couple_id = ? ORDER BY created_at DESC LIMIT 3",
      [coupleId]
    ),
  ]);

  const activities: ActivityFeedItem[] = [];

  for (const m of recentMemories) {
    activities.push({
      id: `mem-${m.id}`,
      kind: "memory",
      title: `Kenangan: ${m.title}`,
      subtitle: m.caption || "Kenangan baru ditambahkan ke galeri.",
      actorName: "",
      createdAt: m.created_at,
      href: "/memories",
    });
  }
  for (const l of recentLetters) {
    activities.push({
      id: `let-${l.id}`,
      kind: "letter",
      title: `Surat Cinta: ${l.title}`,
      subtitle: "Surat baru tersimpan di kotak surat.",
      actorName: "",
      createdAt: l.created_at,
      href: "/letters",
    });
  }
  for (const c of recentCheckins) {
    activities.push({
      id: `chk-${c.id}`,
      kind: "checkin",
      title: `Daily Check-in ${c.emoji}`,
      subtitle: c.daily_story || `Tingkat kebahagiaan ${c.happiness_level}/10`,
      actorName: "",
      createdAt: c.created_at,
      href: "/check-in",
    });
  }
  for (const h of recentHugs) {
    activities.push({
      id: `hug-${h.id}`,
      kind: "hug",
      title: "Virtual Hug Terkirim",
      subtitle: h.message,
      actorName: "",
      createdAt: h.created_at,
      href: "/virtual-hug",
    });
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <WorkspaceShell workspace={workspace}>
      <DashboardClient
        workspace={workspace}
        stats={{
          memoriesCount: Number(memCountRow?.total ?? 0),
          lettersCount: Number(letCountRow?.total ?? 0),
          bucketCompleted: bucketRows.filter((b) => normalizeBool(b.is_completed)).length,
          bucketTotal: bucketRows.length,
          gardenLevel: gardenRow?.level ?? 1,
          gardenPoints: gardenRow?.growth_points ?? 0,
        }}
        recentActivities={activities.slice(0, 8)}
      />
    </WorkspaceShell>
  );
}
