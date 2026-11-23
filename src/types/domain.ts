import type {
  CoupleInvitationRow,
  CoupleSpaceRow,
  NotificationRow,
  ProfileRow,
  RelationshipSettingsRow,
} from "./database";

export interface PartnerDisplayInfo {
  isConnected: boolean;
  userId: string | null;
  fullName: string;
  nickname: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  bio: string | null;
}

export interface CoupleWorkspaceContext {
  userId: string;
  userEmail: string;
  profile: ProfileRow;
  userAvatarUrl: string | null;
  coupleSpace: CoupleSpaceRow;
  memberRole: "creator" | "partner";
  partner: PartnerDisplayInfo;
  settings: RelationshipSettingsRow;
  mainPhotoUrl: string | null;
  firstPhotoUrl: string | null;
  dashboardBannerUrl: string | null;
  activeInvitation: CoupleInvitationRow | null;
  unreadNotifications: NotificationRow[];
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ActivityFeedItem {
  id: string;
  kind: "memory" | "letter" | "checkin" | "bucket" | "hug" | "timeline";
  title: string;
  subtitle: string;
  actorName: string;
  createdAt: string;
  href: string;
}

export interface RelationshipDuration {
  totalDays: number;
  years: number;
  months: number;
  days: number;
  daysUntilNextAnniversary: number;
  nextAnniversaryNumber: number;
  nextAnniversaryDate: string;
  isAnniversaryToday: boolean;
}
