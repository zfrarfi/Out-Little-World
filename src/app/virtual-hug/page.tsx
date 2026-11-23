import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { VirtualHugClient } from "@/components/virtual-hug/VirtualHugClient";
import type { VirtualHugRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function VirtualHugPage() {
  const { workspace } = await requireCoupleWorkspace();

  const rows = await queryRows<VirtualHugRow>(
    "SELECT * FROM virtual_hugs WHERE couple_id = ? ORDER BY created_at DESC LIMIT 40",
    [workspace.coupleSpace.id]
  );

  const hugs = rows.map((h) => ({ ...h, is_received: normalizeBool(h.is_received) }));

  return (
    <WorkspaceShell workspace={workspace}>
      <VirtualHugClient
        coupleId={workspace.coupleSpace.id}
        currentUserId={workspace.userId}
        userNickname={workspace.profile.nickname || workspace.profile.full_name || "Kamu"}
        partnerNickname={workspace.partner.nickname}
        initialHugs={hugs}
      />
    </WorkspaceShell>
  );
}
