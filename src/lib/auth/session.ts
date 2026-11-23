import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/cookie";
import { normalizeBool, queryOne, queryRows } from "@/lib/db/mysql";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import type {
  CoupleInvitationRow,
  CoupleMemberRow,
  CoupleSpaceRow,
  NotificationRow,
  ProfileRow,
  RelationshipSettingsRow,
} from "@/types/database";
import type { CoupleWorkspaceContext, PartnerDisplayInfo } from "@/types/domain";

function mapProfileRow(raw: ProfileRow): ProfileRow {
  return {
    ...raw,
    onboarding_completed: normalizeBool(raw.onboarding_completed),
    notify_messages: normalizeBool(raw.notify_messages),
    notify_letters: normalizeBool(raw.notify_letters),
    notify_memories: normalizeBool(raw.notify_memories),
    notify_calendar: normalizeBool(raw.notify_calendar),
    notify_checkins: normalizeBool(raw.notify_checkins),
    notify_hugs: normalizeBool(raw.notify_hugs),
    notify_bucket_list: normalizeBool(raw.notify_bucket_list),
    show_online_status: normalizeBool(raw.show_online_status),
    show_read_receipts: normalizeBool(raw.show_read_receipts),
    allow_partner_edit_shared: normalizeBool(raw.allow_partner_edit_shared),
  };
}

export async function requireAuthenticatedUser(): Promise<{ user: SessionUser }> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return { user };
}

export async function getUserOnboardingSnapshot() {
  const { user } = await requireAuthenticatedUser();

  const [rawProfile, member] = await Promise.all([
    queryOne<ProfileRow>("SELECT * FROM profiles WHERE id = ? LIMIT 1", [user.id]),
    queryOne<CoupleMemberRow>("SELECT * FROM couple_members WHERE user_id = ? LIMIT 1", [user.id]),
  ]);

  const profile = rawProfile ? mapProfileRow(rawProfile) : null;

  let coupleSpace: CoupleSpaceRow | null = null;
  let settings: RelationshipSettingsRow | null = null;
  let activeInvitation: CoupleInvitationRow | null = null;

  if (member) {
    const [space, relSettings, invite] = await Promise.all([
      queryOne<CoupleSpaceRow>("SELECT * FROM couple_spaces WHERE id = ? LIMIT 1", [
        member.couple_id,
      ]),
      queryOne<RelationshipSettingsRow>(
        "SELECT * FROM relationship_settings WHERE couple_id = ? LIMIT 1",
        [member.couple_id]
      ),
      queryOne<CoupleInvitationRow>(
        `SELECT * FROM couple_invitations
         WHERE couple_id = ? AND status = 'pending' AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [member.couple_id]
      ),
    ]);
    coupleSpace = space;
    settings = relSettings;
    activeInvitation = invite;
  }

  return {
    user,
    profile,
    member,
    coupleSpace,
    settings,
    activeInvitation,
  };
}

export async function requireCoupleWorkspace(): Promise<{
  workspace: CoupleWorkspaceContext;
}> {
  const { user } = await requireAuthenticatedUser();

  const [rawProfile, member] = await Promise.all([
    queryOne<ProfileRow>("SELECT * FROM profiles WHERE id = ? LIMIT 1", [user.id]),
    queryOne<CoupleMemberRow>("SELECT * FROM couple_members WHERE user_id = ? LIMIT 1", [user.id]),
  ]);

  const profile = rawProfile ? mapProfileRow(rawProfile) : null;

  if (!profile || !member || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [coupleSpace, allMembers, settings, activeInvitation, rawNotifications] = await Promise.all([
    queryOne<CoupleSpaceRow>("SELECT * FROM couple_spaces WHERE id = ? LIMIT 1", [
      member.couple_id,
    ]),
    queryRows<CoupleMemberRow>("SELECT * FROM couple_members WHERE couple_id = ?", [
      member.couple_id,
    ]),
    queryOne<RelationshipSettingsRow>(
      "SELECT * FROM relationship_settings WHERE couple_id = ? LIMIT 1",
      [member.couple_id]
    ),
    queryOne<CoupleInvitationRow>(
      `SELECT * FROM couple_invitations
       WHERE couple_id = ? AND status = 'pending' AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [member.couple_id]
    ),
    queryRows<NotificationRow>(
      `SELECT * FROM notifications
       WHERE recipient_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [user.id]
    ),
  ]);

  if (!coupleSpace || !settings) {
    redirect("/onboarding");
  }

  const partnerMember = allMembers.find((m) => m.user_id !== user.id) ?? null;
  let partnerProfile: ProfileRow | null = null;
  if (partnerMember) {
    const rawPartner = await queryOne<ProfileRow>("SELECT * FROM profiles WHERE id = ? LIMIT 1", [
      partnerMember.user_id,
    ]);
    partnerProfile = rawPartner ? mapProfileRow(rawPartner) : null;
  }

  const partnerAvatarPath =
    partnerProfile?.avatar_path ?? settings.partner_placeholder_avatar_path ?? null;

  const partner: PartnerDisplayInfo = {
    isConnected: Boolean(partnerProfile),
    userId: partnerProfile?.id ?? null,
    fullName:
      partnerProfile?.full_name?.trim() ||
      settings.partner_placeholder_name?.trim() ||
      "Pasanganmu",
    nickname:
      partnerProfile?.nickname?.trim() ||
      partnerProfile?.full_name?.trim() ||
      settings.partner_placeholder_nickname?.trim() ||
      settings.partner_placeholder_name?.trim() ||
      "Pasanganmu",
    avatarPath: partnerAvatarPath,
    avatarUrl: getPrivateMediaUrl("profile-photos", partnerAvatarPath),
    birthDate: partnerProfile?.birth_date ?? settings.partner_placeholder_birth_date ?? null,
    bio: partnerProfile?.bio ?? settings.partner_placeholder_bio ?? null,
  };

  const unreadNotifications = rawNotifications.map((n) => ({
    ...n,
    is_read: normalizeBool(n.is_read),
  }));

  return {
    workspace: {
      userId: user.id,
      userEmail: user.email,
      profile,
      userAvatarUrl: getPrivateMediaUrl("profile-photos", profile.avatar_path),
      coupleSpace,
      memberRole: member.role,
      partner,
      settings,
      mainPhotoUrl: getPrivateMediaUrl("profile-photos", settings.main_photo_path),
      firstPhotoUrl: getPrivateMediaUrl("profile-photos", settings.first_photo_path),
      dashboardBannerUrl: getPrivateMediaUrl("profile-photos", settings.dashboard_banner_path),
      activeInvitation,
      unreadNotifications,
    },
  };
}
