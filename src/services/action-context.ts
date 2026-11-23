import { getSessionUser } from "@/lib/auth/cookie";
import { execSql, normalizeBool, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { publishUserNotification } from "@/lib/realtime/bus";
import type {
  CoupleMemberRow,
  NotificationRow,
  NotificationType,
  ProfileRow,
} from "@/types/database";

export interface AuthorizedActionContext {
  userId: string;
  userEmail: string;
  coupleId: string;
  partnerId: string | null;
  actorName: string;
}

export async function getAuthorizedActionContext(): Promise<AuthorizedActionContext> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");
  }

  const [member, profile] = await Promise.all([
    queryOne<CoupleMemberRow>("SELECT * FROM couple_members WHERE user_id = ? LIMIT 1", [user.id]),
    queryOne<Pick<ProfileRow, "full_name" | "nickname">>(
      "SELECT full_name, nickname FROM profiles WHERE id = ? LIMIT 1",
      [user.id]
    ),
  ]);

  if (!member) {
    throw new Error(
      "Anda belum tergabung dalam Couple Space. Selesaikan onboarding terlebih dahulu."
    );
  }

  const partnerMember = await queryOne<{ user_id: string }>(
    "SELECT user_id FROM couple_members WHERE couple_id = ? AND user_id <> ? LIMIT 1",
    [member.couple_id, user.id]
  );

  const actorName = profile?.nickname?.trim() || profile?.full_name?.trim() || "Pasanganmu";

  return {
    userId: user.id,
    userEmail: user.email,
    coupleId: member.couple_id,
    partnerId: partnerMember?.user_id ?? null,
    actorName,
  };
}

export async function notifyPartner(
  ctx: Pick<AuthorizedActionContext, "userId" | "coupleId" | "partnerId">,
  type: NotificationType,
  title: string,
  body: string,
  linkUrl: string
): Promise<void> {
  if (!ctx.partnerId) return;

  try {
    const partnerProfile = await queryOne<ProfileRow>(
      "SELECT * FROM profiles WHERE id = ? LIMIT 1",
      [ctx.partnerId]
    );
    if (!partnerProfile) return;

    const prefMap: Record<NotificationType, boolean> = {
      message: normalizeBool(partnerProfile.notify_messages),
      letter: normalizeBool(partnerProfile.notify_letters),
      memory: normalizeBool(partnerProfile.notify_memories),
      calendar: normalizeBool(partnerProfile.notify_calendar),
      checkin: normalizeBool(partnerProfile.notify_checkins),
      virtual_hug: normalizeBool(partnerProfile.notify_hugs),
      bucket_list: normalizeBool(partnerProfile.notify_bucket_list),
      partner_joined: true,
    };

    if (!prefMap[type]) return;

    const notifId = generateUuid();
    await execSql(
      `INSERT INTO notifications (id, couple_id, recipient_id, actor_id, type, title, body, link_url, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [notifId, ctx.coupleId, ctx.partnerId, ctx.userId, type, title, body, linkUrl]
    );

    const saved = await queryOne<NotificationRow>("SELECT * FROM notifications WHERE id = ?", [
      notifId,
    ]);
    if (saved) {
      publishUserNotification(ctx.partnerId, {
        ...saved,
        is_read: normalizeBool(saved.is_read),
      });
    }
  } catch {
    // Non-blocking notification failure
  }
}
