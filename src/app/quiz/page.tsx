import { requireCoupleWorkspace } from "@/lib/auth/session";
import { normalizeBool, queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { QuizClient } from "@/components/quiz/QuizClient";
import type { QuizQuestionRow, QuizSessionRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  const [rawQuestions, rawSessions] = await Promise.all([
    queryRows<QuizQuestionRow>(
      "SELECT * FROM quiz_questions WHERE couple_id = ? AND is_active = 1 ORDER BY created_at DESC",
      [coupleId]
    ),
    queryRows<QuizSessionRow>(
      "SELECT * FROM quiz_sessions WHERE couple_id = ? ORDER BY completed_at DESC LIMIT 30",
      [coupleId]
    ),
  ]);

  const questions = rawQuestions.map((q) => ({ ...q, is_active: normalizeBool(q.is_active) }));
  const sessions = rawSessions.map((s) => ({
    ...s,
    compatibility_percent: Number(s.compatibility_percent),
  }));

  return (
    <WorkspaceShell workspace={workspace}>
      <QuizClient
        currentUserId={workspace.userId}
        userNickname={workspace.profile.nickname || workspace.profile.full_name || "Kamu"}
        partnerNickname={workspace.partner.nickname}
        initialQuestions={questions}
        initialSessions={sessions}
      />
    </WorkspaceShell>
  );
}
