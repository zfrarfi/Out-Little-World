import { requireCoupleWorkspace } from "@/lib/auth/session";
import { execSql, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { GardenClient } from "@/components/garden/GardenClient";
import type { LoveGardenRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function GardenPage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  let garden = await queryOne<LoveGardenRow>(
    "SELECT * FROM love_garden WHERE couple_id = ? LIMIT 1",
    [coupleId]
  );

  if (!garden) {
    const id = generateUuid();
    await execSql("INSERT INTO love_garden (id, couple_id) VALUES (?, ?)", [id, coupleId]);
    garden = await queryOne<LoveGardenRow>("SELECT * FROM love_garden WHERE id = ?", [id]);
  }

  return (
    <WorkspaceShell workspace={workspace}>
      <GardenClient
        coupleId={coupleId}
        initialGarden={garden!}
        partnerNickname={workspace.partner.nickname}
      />
    </WorkspaceShell>
  );
}
