import { requireCoupleWorkspace } from "@/lib/auth/session";
import { queryRows } from "@/lib/db/mysql";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import {
  PrivateChatClient,
  type ChatMessageWithUrl,
} from "@/components/chat/PrivateChatClient";
import type { ChatMessageRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { workspace } = await requireCoupleWorkspace();
  const coupleId = workspace.coupleSpace.id;

  const raw = await queryRows<ChatMessageRow>(
    "SELECT * FROM chat_messages WHERE couple_id = ? ORDER BY created_at ASC LIMIT 120",
    [coupleId]
  );

  const messages: ChatMessageWithUrl[] = raw.map((m) => ({
    ...m,
    imageUrl: getPrivateMediaUrl("chat-images", m.image_path),
  }));

  return (
    <WorkspaceShell workspace={workspace}>
      <PrivateChatClient
        coupleId={coupleId}
        currentUserId={workspace.userId}
        userNickname={workspace.profile.nickname || workspace.profile.full_name || "Kamu"}
        partnerNickname={workspace.partner.nickname}
        partnerAvatarUrl={workspace.partner.avatarUrl}
        showOnlineStatus={workspace.profile.show_online_status}
        initialMessages={messages}
      />
    </WorkspaceShell>
  );
}
