import { requireCoupleWorkspace } from "@/lib/auth/session";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { workspace } = await requireCoupleWorkspace();

  return (
    <WorkspaceShell workspace={workspace}>
      <SettingsClient workspace={workspace} />
    </WorkspaceShell>
  );
}
