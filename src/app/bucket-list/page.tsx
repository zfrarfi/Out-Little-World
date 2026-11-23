import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import {
  BucketListClient,
  type BucketItemWithUrl,
} from "@/components/bucket-list/BucketListClient";
import type { BucketListRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function BucketListPage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  const rows = await queryRows<BucketListRow>(
    "SELECT * FROM bucket_list WHERE couple_id = ? ORDER BY is_completed ASC, created_at DESC",
    [coupleId]
  );

  const items: BucketItemWithUrl[] = rows.map((r) => ({
    ...r,
    is_completed: normalizeBool(r.is_completed),
    photoUrl: getPrivateMediaUrl("bucket-list-images", r.achievement_photo_path),
  }));

  return (
    <WorkspaceShell workspace={workspace}>
      <BucketListClient coupleId={coupleId} initialItems={items} />
    </WorkspaceShell>
  );
}
