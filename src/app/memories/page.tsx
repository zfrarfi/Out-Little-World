import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { MemoriesClient, type MemoryWithUrl } from "@/components/memories/MemoriesClient";
import type { MemoryAlbumRow, MemoryRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  const [rawMemories, albums] = await Promise.all([
    queryRows<MemoryRow>(
      "SELECT * FROM memories WHERE couple_id = ? ORDER BY memory_date DESC, created_at DESC",
      [coupleId]
    ),
    queryRows<MemoryAlbumRow>(
      "SELECT * FROM memory_albums WHERE couple_id = ? ORDER BY created_at DESC",
      [coupleId]
    ),
  ]);

  const memoriesWithUrls: MemoryWithUrl[] = rawMemories.map((m) => ({
    ...m,
    is_favorite: normalizeBool(m.is_favorite),
    signedUrl: getPrivateMediaUrl("memories", m.media_path),
  }));

  return (
    <WorkspaceShell workspace={workspace}>
      <MemoriesClient
        coupleId={coupleId}
        initialMemories={memoriesWithUrls}
        initialAlbums={albums}
      />
    </WorkspaceShell>
  );
}
