import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { LettersClient } from "@/components/letters/LettersClient";
import type { LoveLetterRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LettersPage() {
  const { workspace } = await requireCoupleWorkspace();

  const rows = await queryRows<LoveLetterRow>(
    "SELECT * FROM love_letters WHERE couple_id = ? ORDER BY created_at DESC",
    [workspace.coupleSpace.id]
  );

  const nowMs = Date.now();
  const safeLetters: LoveLetterRow[] = rows.map((letter) => {
    const mapped = { ...letter, is_secret: normalizeBool(letter.is_secret) };
    const isRecipient = mapped.sender_id !== workspace.userId;
    const isScheduledLocked =
      mapped.scheduled_open_at &&
      new Date(mapped.scheduled_open_at.replace(" ", "T")).getTime() > nowMs;
    if (isRecipient && isScheduledLocked) {
      return {
        ...mapped,
        content: "[Surat ini masih terkunci sampai jadwal pembukaan tiba]",
      };
    }
    return mapped;
  });

  return (
    <WorkspaceShell workspace={workspace}>
      <LettersClient
        currentUserId={workspace.userId}
        userNickname={workspace.profile.nickname || workspace.profile.full_name || "Kamu"}
        partnerNickname={workspace.partner.nickname}
        initialLetters={safeLetters}
      />
    </WorkspaceShell>
  );
}
