import { requireCoupleWorkspace } from "@/lib/auth/session";
import { isAiConfigured } from "@/lib/db/env";
import { queryRows } from "@/lib/db/mysql";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AiAssistantClient } from "@/components/ai/AiAssistantClient";
import type { AiConversationRow, AiMessageRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AiAssistantPage() {
  const { workspace } = await requireCoupleWorkspace();

  const conversations = await queryRows<AiConversationRow>(
    "SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20",
    [workspace.userId]
  );

  const messagesByConv: Record<string, AiMessageRow[]> = {};
  if (conversations.length > 0) {
    const placeholders = conversations.map(() => "?").join(",");
    const msgs = await queryRows<AiMessageRow>(
      `SELECT * FROM ai_messages WHERE conversation_id IN (${placeholders}) ORDER BY created_at ASC`,
      conversations.map((c) => c.id)
    );
    for (const msg of msgs) {
      if (!messagesByConv[msg.conversation_id]) {
        messagesByConv[msg.conversation_id] = [];
      }
      messagesByConv[msg.conversation_id].push(msg);
    }
  }

  return (
    <WorkspaceShell workspace={workspace}>
      <AiAssistantClient
        aiConfigured={isAiConfigured()}
        initialConversations={conversations}
        initialMessagesByConv={messagesByConv}
      />
    </WorkspaceShell>
  );
}
