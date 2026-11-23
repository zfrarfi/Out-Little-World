import { requireCoupleWorkspace } from "@/lib/auth/session";
import { queryRows } from "@/lib/db/mysql";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import {
  TimelineClient,
  type TimelineItemWithUrl,
} from "@/components/timeline/TimelineClient";
import type { RelationshipTimelineRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  const rows = await queryRows<RelationshipTimelineRow>(
    "SELECT * FROM relationship_timeline WHERE couple_id = ? ORDER BY event_date ASC, created_at ASC",
    [coupleId]
  );

  const items: TimelineItemWithUrl[] = rows.map((r) => ({
    ...r,
    photoUrl: getPrivateMediaUrl("timeline-images", r.photo_path),
  }));

  return (
    <WorkspaceShell workspace={workspace}>
      <TimelineClient coupleId={coupleId} initialItems={items} />
    </WorkspaceShell>
  );
}
