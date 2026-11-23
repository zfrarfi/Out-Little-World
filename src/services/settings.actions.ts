"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql, withTransaction } from "@/lib/db/mysql";
import type { ActionResult } from "@/types/domain";
import type {
  AnimationStyleOption,
  FontFamilyOption,
  GenderOption,
  ThemePreset,
} from "@/types/database";

export async function updateProfileAction(input: {
  fullName: string;
  nickname: string;
  avatarPath?: string | null;
  birthDate?: string | null;
  bio?: string | null;
  gender?: GenderOption | null;
}): Promise<ActionResult> {
  try {
    if (!input.fullName.trim() || !input.nickname.trim()) {
      return { success: false, error: "Nama lengkap dan nama panggilan wajib diisi." };
    }
    const ctx = await getAuthorizedActionContext();
    if (input.avatarPath !== undefined) {
      await execSql(
        `UPDATE profiles
         SET full_name = ?, nickname = ?, avatar_path = ?, birth_date = ?, bio = ?, gender = ?
         WHERE id = ?`,
        [
          input.fullName.trim(),
          input.nickname.trim(),
          input.avatarPath,
          input.birthDate || null,
          input.bio?.trim() || null,
          input.gender || null,
          ctx.userId,
        ]
      );
    } else {
      await execSql(
        `UPDATE profiles
         SET full_name = ?, nickname = ?, birth_date = ?, bio = ?, gender = ?
         WHERE id = ?`,
        [
          input.fullName.trim(),
          input.nickname.trim(),
          input.birthDate || null,
          input.bio?.trim() || null,
          input.gender || null,
          ctx.userId,
        ]
      );
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui profil." };
  }
}

export async function updateRelationshipSettingsAction(input: {
  coupleSpaceName: string;
  firstMetOnlineDate?: string | null;
  firstMetInPersonDate?: string | null;
  anniversaryDate?: string | null;
  firstMeetingPlace?: string | null;
  originStory?: string | null;
  firstPhotoPath?: string | null;
  mainPhotoPath?: string | null;
  dashboardBannerPath?: string | null;
  romanticMessage?: string | null;
  themePreset: ThemePreset;
  fontFamily: FontFamilyOption;
  animationStyle: AnimationStyleOption;
  partnerPlaceholderName?: string | null;
  partnerPlaceholderNickname?: string | null;
  partnerPlaceholderAvatarPath?: string | null;
}): Promise<ActionResult> {
  try {
    if (!input.coupleSpaceName.trim()) {
      return { success: false, error: "Nama ruang pasangan tidak boleh kosong." };
    }
    const ctx = await getAuthorizedActionContext();

    await withTransaction(async (conn) => {
      await conn.execute("UPDATE couple_spaces SET name = ? WHERE id = ?", [
        input.coupleSpaceName.trim(),
        ctx.coupleId,
      ]);

      await conn.execute(
        `UPDATE relationship_settings
         SET first_met_online_date = ?,
             first_met_in_person_date = ?,
             anniversary_date = ?,
             first_meeting_place = ?,
             origin_story = ?,
             first_photo_path = ?,
             main_photo_path = ?,
             dashboard_banner_path = ?,
             romantic_message = ?,
             theme_preset = ?,
             font_family = ?,
             animation_style = ?,
             partner_placeholder_name = ?,
             partner_placeholder_nickname = ?,
             partner_placeholder_avatar_path = ?
         WHERE couple_id = ?`,
        [
          input.firstMetOnlineDate || null,
          input.firstMetInPersonDate || null,
          input.anniversaryDate || null,
          input.firstMeetingPlace?.trim() || null,
          input.originStory?.trim() || null,
          input.firstPhotoPath ?? null,
          input.mainPhotoPath ?? null,
          input.dashboardBannerPath ?? null,
          input.romanticMessage?.trim() || null,
          input.themePreset,
          input.fontFamily,
          input.animationStyle,
          input.partnerPlaceholderName?.trim() || null,
          input.partnerPlaceholderNickname?.trim() || null,
          input.partnerPlaceholderAvatarPath ?? null,
          ctx.coupleId,
        ]
      );
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui pengaturan hubungan.",
    };
  }
}

export async function updateNotificationPrivacyAction(input: {
  notify_messages: boolean;
  notify_letters: boolean;
  notify_memories: boolean;
  notify_calendar: boolean;
  notify_checkins: boolean;
  notify_hugs: boolean;
  notify_bucket_list: boolean;
  show_online_status: boolean;
  show_read_receipts: boolean;
  allow_partner_edit_shared: boolean;
}): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql(
      `UPDATE profiles
       SET notify_messages = ?, notify_letters = ?, notify_memories = ?,
           notify_calendar = ?, notify_checkins = ?, notify_hugs = ?, notify_bucket_list = ?,
           show_online_status = ?, show_read_receipts = ?, allow_partner_edit_shared = ?
       WHERE id = ?`,
      [
        input.notify_messages ? 1 : 0,
        input.notify_letters ? 1 : 0,
        input.notify_memories ? 1 : 0,
        input.notify_calendar ? 1 : 0,
        input.notify_checkins ? 1 : 0,
        input.notify_hugs ? 1 : 0,
        input.notify_bucket_list ? 1 : 0,
        input.show_online_status ? 1 : 0,
        input.show_read_receipts ? 1 : 0,
        input.allow_partner_edit_shared ? 1 : 0,
        ctx.userId,
      ]
    );
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui preferensi.",
    };
  }
}
