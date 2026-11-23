import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import type { CalendarEventRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { workspace } = await requireCoupleWorkspace();

  const rows = await queryRows<CalendarEventRow>(
    "SELECT * FROM calendar_events WHERE couple_id = ? ORDER BY event_date ASC",
    [workspace.coupleSpace.id]
  );

  const events = rows.map((e) => ({
    ...e,
    is_recurring_yearly: normalizeBool(e.is_recurring_yearly),
  }));

  return (
    <WorkspaceShell workspace={workspace}>
      <CalendarClient initialEvents={events} />
    </WorkspaceShell>
  );
}
