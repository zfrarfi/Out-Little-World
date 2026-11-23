import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { LoveJarClient } from "@/components/love-jar/LoveJarClient";
import type { LoveJarMessageRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LoveJarPage() {
  const { workspace } = await requireCoupleWorkspace();

  const rows = await queryRows<LoveJarMessageRow>(
    `SELECT * FROM love_jar_messages
     WHERE couple_id = ?
     ORDER BY (opened_at IS NULL) ASC, opened_at DESC, created_at DESC`,
    [workspace.coupleSpace.id]
  );

  const messages = rows.map((m) => ({ ...m, is_opened: normalizeBool(m.is_opened) }));

  return (
    <WorkspaceShell workspace={workspace}>
      <LoveJarClient
        currentUserId={workspace.userId}
        userNickname={workspace.profile.nickname || workspace.profile.full_name || "Kamu"}
        partnerNickname={workspace.partner.nickname}
        initialMessages={messages}
      />
    </WorkspaceShell>
  );
}
