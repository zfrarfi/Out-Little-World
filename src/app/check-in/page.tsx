import { requireCoupleWorkspace } from "@/lib/auth/session";
import { queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { CheckinClient } from "@/components/checkin/CheckinClient";
import type { DailyCheckinRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const { workspace } = await requireCoupleWorkspace();

  const rows = await queryRows<DailyCheckinRow>(
    "SELECT * FROM daily_checkins WHERE couple_id = ? ORDER BY checkin_date DESC, created_at DESC LIMIT 40",
    [workspace.coupleSpace.id]
  );

  return (
    <WorkspaceShell workspace={workspace}>
      <CheckinClient
        currentUserId={workspace.userId}
        userNickname={workspace.profile.nickname || workspace.profile.full_name || "Kamu"}
        partnerNickname={workspace.partner.nickname}
        initialCheckins={rows}
      />
    </WorkspaceShell>
  );
}
