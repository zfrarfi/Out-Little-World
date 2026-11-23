import { requireCoupleWorkspace } from "@/lib/auth/session";
import { queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { PlaylistClient } from "@/components/playlist/PlaylistClient";
import type { PlaylistRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PlaylistPage() {
  const { workspace } = await requireCoupleWorkspace();

  const songs = await queryRows<PlaylistRow>(
    "SELECT * FROM playlists WHERE couple_id = ? ORDER BY created_at DESC",
    [workspace.coupleSpace.id]
  );

  return (
    <WorkspaceShell workspace={workspace}>
      <PlaylistClient initialSongs={songs} />
    </WorkspaceShell>
  );
}
