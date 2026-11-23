"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSessionForUser,
  destroyCurrentSession,
  getSessionUser,
} from "@/lib/auth/cookie";
import {
  generateInviteCodeString,
  generateSecureToken,
  generateUuid,
  hashPassword,
  sha256Hex,
  verifyPassword,
} from "@/lib/auth/crypto";
import {
  execSql,
  normalizeBool,
  queryOne,
  toMysqlDatetime,
  withTransaction,
} from "@/lib/db/mysql";
import { publishUserNotification } from "@/lib/realtime/bus";
import { loginSchema, onboardingSchema, registerSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { CoupleInvitationRow, NotificationRow } from "@/types/database";

async function claimInviteInternal(
  userId: string,
  rawInviteCode: string
): Promise<{ coupleId: string }> {
  const code = rawInviteCode.trim().toUpperCase();
  if (code.length < 6) {
    throw new Error("Format kode undangan tidak valid.");
  }

  return await withTransaction(async (conn) => {
    const [existingMembers] = await conn.execute(
      "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (Array.isArray(existingMembers) && existingMembers.length > 0) {
      throw new Error("Akun Anda sudah tergabung dalam sebuah Couple Space.");
    }

    const [invRows] = await conn.execute(
      "SELECT * FROM couple_invitations WHERE UPPER(invite_code) = ? LIMIT 1 FOR UPDATE",
      [code]
    );
    const inv = Array.isArray(invRows) ? (invRows[0] as CoupleInvitationRow | undefined) : undefined;
    if (!inv) {
      throw new Error("Kode undangan tidak ditemukan.");
    }
    if (inv.status !== "pending") {
      throw new Error("Kode undangan sudah pernah digunakan atau tidak berlaku.");
    }
    if (new Date(inv.expires_at).getTime() <= Date.now()) {
      await conn.execute("UPDATE couple_invitations SET status = 'expired' WHERE id = ?", [inv.id]);
      throw new Error("Kode undangan telah kedaluwarsa.");
    }
    if (inv.inviter_id === userId) {
      throw new Error("Anda tidak dapat mengklaim kode undangan milik sendiri.");
    }

    const [countRows] = await conn.execute(
      "SELECT COUNT(*) AS total FROM couple_members WHERE couple_id = ?",
      [inv.couple_id]
    );
    const memberCount = Number(
      (Array.isArray(countRows) && (countRows[0] as { total: number })?.total) || 0
    );
    if (memberCount >= 2) {
      await conn.execute("UPDATE couple_invitations SET status = 'revoked' WHERE id = ?", [inv.id]);
      throw new Error("Couple Space ini sudah penuh (maksimal 2 anggota).");
    }

    await conn.execute(
      "INSERT INTO couple_members (id, couple_id, user_id, role) VALUES (?, ?, ?, 'partner')",
      [generateUuid(), inv.couple_id, userId]
    );

    await conn.execute(
      "UPDATE couple_invitations SET status = 'claimed', claimed_by = ?, claimed_at = NOW() WHERE id = ?",
      [userId, inv.id]
    );

    const [joinerRows] = await conn.execute(
      "SELECT nickname, full_name FROM profiles WHERE id = ? LIMIT 1",
      [userId]
    );
    const joiner = Array.isArray(joinerRows)
      ? (joinerRows[0] as { nickname?: string; full_name?: string } | undefined)
      : undefined;
    const joinerName = joiner?.nickname?.trim() || joiner?.full_name?.trim() || "Pasanganmu";

    const notifId = generateUuid();
    await conn.execute(
      `INSERT INTO notifications (id, couple_id, recipient_id, actor_id, type, title, body, link_url, is_read)
       VALUES (?, ?, ?, ?, 'partner_joined', 'Pasanganmu Telah Bergabung!', ?, '/dashboard', 0)`,
      [
        notifId,
        inv.couple_id,
        inv.inviter_id,
        userId,
        `${joinerName} berhasil terhubung ke ruang pasangan kalian.`,
      ]
    );

    const [notifRows] = await conn.execute("SELECT * FROM notifications WHERE id = ?", [notifId]);
    if (Array.isArray(notifRows) && notifRows[0]) {
      const n = notifRows[0] as NotificationRow;
      publishUserNotification(inv.inviter_id, { ...n, is_read: false });
    }

    return { coupleId: inv.couple_id };
  });
}

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await queryOne<{ id: string; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return { success: false, error: "Email atau password salah." };
    }

    await createSessionForUser(user.id);

    const [profile, member] = await Promise.all([
      queryOne<{ onboarding_completed: number }>(
        "SELECT onboarding_completed FROM profiles WHERE id = ? LIMIT 1",
        [user.id]
      ),
      queryOne<{ couple_id: string }>(
        "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
        [user.id]
      ),
    ]);

    const needsOnboarding = !profile || !normalizeBool(profile.onboarding_completed) || !member;
    revalidatePath("/", "layout");
    return {
      success: true,
      data: { redirectTo: needsOnboarding ? "/onboarding" : "/dashboard" },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? `Gagal terhubung ke MySQL XAMPP: ${err.message}`
          : "Gagal masuk. Pastikan MySQL di XAMPP aktif.",
    };
  }
}

export async function signUpAction(input: {
  email: string;
  password: string;
  fullName: string;
  inviteCode?: string | null;
}): Promise<ActionResult<{ requiresEmailConfirmation: boolean; redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing) {
      return { success: false, error: "Email ini sudah terdaftar. Silakan masuk." };
    }

    const userId = generateUuid();
    const passwordHash = hashPassword(parsed.data.password);
    const defaultNickname = parsed.data.fullName.trim().split(/\s+/)[0] || parsed.data.fullName;

    await withTransaction(async (conn) => {
      await conn.execute("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)", [
        userId,
        email,
        passwordHash,
      ]);
      await conn.execute(
        "INSERT INTO profiles (id, full_name, nickname, onboarding_completed) VALUES (?, ?, ?, 0)",
        [userId, parsed.data.fullName.trim(), defaultNickname]
      );
    });

    await createSessionForUser(userId);

    let inviteErrorParam = "";
    if (parsed.data.inviteCode) {
      try {
        await claimInviteInternal(userId, parsed.data.inviteCode);
      } catch (err) {
        inviteErrorParam = `?inviteError=${encodeURIComponent(
          err instanceof Error ? err.message : "Kode undangan tidak valid"
        )}`;
      }
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      data: {
        requiresEmailConfirmation: false,
        redirectTo: `/onboarding${inviteErrorParam}`,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? `Registrasi gagal: ${err.message}`
          : "Gagal mendaftar. Pastikan MySQL XAMPP aktif.",
    };
  }
}

export async function signOutAction() {
  await destroyCurrentSession();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordResetAction(
  email: string
): Promise<ActionResult<{ resetToken?: string }>> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Masukkan alamat email yang valid." };
  }

  try {
    const user = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );
    if (!user) {
      return { success: false, error: "Email tidak ditemukan di database." };
    }

    const rawToken = generateSecureToken(20);
    const tokenHash = sha256Hex(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await execSql(
      "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      [generateUuid(), user.id, tokenHash, toMysqlDatetime(expires)]
    );

    return { success: true, data: { resetToken: rawToken } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat token reset password.",
    };
  }
}

export async function resetPasswordWithTokenAction(input: {
  token: string;
  newPassword: string;
}): Promise<ActionResult> {
  if (!input.newPassword || input.newPassword.length < 8) {
    return { success: false, error: "Password baru minimal 8 karakter." };
  }
  const tokenHash = sha256Hex(input.token.trim());
  try {
    const row = await queryOne<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    if (!row) {
      return { success: false, error: "Token reset password tidak valid atau sudah kedaluwarsa." };
    }

    const newHash = hashPassword(input.newPassword);
    await withTransaction(async (conn) => {
      await conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
        newHash,
        row.user_id,
      ]);
      await conn.execute("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [
        row.id,
      ]);
      await conn.execute("DELETE FROM user_sessions WHERE user_id = ?", [row.user_id]);
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mereset password.",
    };
  }
}

export async function updatePasswordAction(newPassword: string): Promise<ActionResult> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password baru minimal 8 karakter." };
  }
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Sesi login berakhir." };
  }
  try {
    await execSql("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashPassword(newPassword),
      user.id,
    ]);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah password.",
    };
  }
}

export async function joinCoupleByCodeAction(
  inviteCode: string
): Promise<ActionResult<{ coupleId: string }>> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Silakan masuk terlebih dahulu." };
  }
  try {
    const res = await claimInviteInternal(user.id, inviteCode);
    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal bergabung dengan kode undangan.",
    };
  }
}

export async function generateInviteCodeAction(
  expiresHours = 72
): Promise<ActionResult<{ inviteId: string; inviteCode: string; expiresAt: string }>> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Silakan masuk terlebih dahulu." };
  }

  try {
    const member = await queryOne<{ couple_id: string }>(
      "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
      [user.id]
    );
    if (!member) {
      return { success: false, error: "Anda belum memiliki Couple Space." };
    }

    const countRow = await queryOne<{ total: number }>(
      "SELECT COUNT(*) AS total FROM couple_members WHERE couple_id = ?",
      [member.couple_id]
    );
    if (Number(countRow?.total ?? 0) >= 2) {
      return { success: false, error: "Couple Space sudah terhubung dengan 2 anggota." };
    }

    const inviteId = generateUuid();
    const inviteCode = generateInviteCodeString();
    const hours = Math.max(1, Math.min(expiresHours, 168));
    const expiresDate = new Date(Date.now() + hours * 60 * 60 * 1000);
    const expiresMysql = toMysqlDatetime(expiresDate);

    await withTransaction(async (conn) => {
      await conn.execute(
        "UPDATE couple_invitations SET status = 'revoked' WHERE couple_id = ? AND status = 'pending'",
        [member.couple_id]
      );
      await conn.execute(
        `INSERT INTO couple_invitations (id, couple_id, inviter_id, invite_code, status, expires_at)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [inviteId, member.couple_id, user.id, inviteCode, expiresMysql]
      );
    });

    revalidatePath("/onboarding");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: {
        inviteId,
        inviteCode,
        expiresAt: expiresDate.toISOString(),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat kode undangan.",
    };
  }
}

export async function completeOnboardingAction(
  rawInput: unknown
): Promise<ActionResult<{ coupleId: string; inviteCode?: string }>> {
  const parsed = onboardingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data onboarding tidak valid.",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Sesi login berakhir. Silakan masuk kembali." };
  }

  const input = parsed.data;

  try {
    const result = await withTransaction(async (conn) => {
      // 1. Update profile (Step 1)
      await conn.execute(
        `UPDATE profiles
         SET full_name = ?, nickname = ?, avatar_path = ?, birth_date = ?, bio = ?, gender = ?, onboarding_completed = 1
         WHERE id = ?`,
        [
          input.fullName,
          input.nickname,
          input.avatarPath,
          input.birthDate,
          input.bio,
          input.gender ?? null,
          user.id,
        ]
      );

      // 2. Check or create Couple Space
      const [memberRows] = await conn.execute(
        "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
        [user.id]
      );
      const existingMember = Array.isArray(memberRows)
        ? (memberRows[0] as { couple_id: string } | undefined)
        : undefined;

      let coupleId = existingMember?.couple_id;
      let isNewSpace = false;

      if (!coupleId) {
        coupleId = generateUuid();
        isNewSpace = true;

        await conn.execute(
          "INSERT INTO couple_spaces (id, name, created_by) VALUES (?, ?, ?)",
          [coupleId, input.coupleSpaceName, user.id]
        );
        await conn.execute(
          "INSERT INTO couple_members (id, couple_id, user_id, role) VALUES (?, ?, ?, 'creator')",
          [generateUuid(), coupleId, user.id]
        );
        await conn.execute("INSERT INTO love_garden (id, couple_id) VALUES (?, ?)", [
          generateUuid(),
          coupleId,
        ]);
      } else {
        await conn.execute("UPDATE couple_spaces SET name = ? WHERE id = ?", [
          input.coupleSpaceName,
          coupleId,
        ]);
      }

      // 3. Upsert relationship_settings (Steps 2, 3, 4)
      await conn.execute(
        `INSERT INTO relationship_settings (
          id, couple_id,
          partner_placeholder_name, partner_placeholder_nickname,
          partner_placeholder_avatar_path, partner_placeholder_birth_date, partner_placeholder_bio,
          first_met_online_date, first_met_in_person_date, anniversary_date,
          first_meeting_place, origin_story, first_photo_path, main_photo_path,
          theme_preset, font_family, animation_style, dashboard_banner_path, romantic_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          partner_placeholder_name = VALUES(partner_placeholder_name),
          partner_placeholder_nickname = VALUES(partner_placeholder_nickname),
          partner_placeholder_avatar_path = VALUES(partner_placeholder_avatar_path),
          partner_placeholder_birth_date = VALUES(partner_placeholder_birth_date),
          partner_placeholder_bio = VALUES(partner_placeholder_bio),
          first_met_online_date = VALUES(first_met_online_date),
          first_met_in_person_date = VALUES(first_met_in_person_date),
          anniversary_date = VALUES(anniversary_date),
          first_meeting_place = VALUES(first_meeting_place),
          origin_story = VALUES(origin_story),
          first_photo_path = VALUES(first_photo_path),
          main_photo_path = VALUES(main_photo_path),
          theme_preset = VALUES(theme_preset),
          font_family = VALUES(font_family),
          animation_style = VALUES(animation_style),
          dashboard_banner_path = VALUES(dashboard_banner_path),
          romantic_message = VALUES(romantic_message)`,
        [
          generateUuid(),
          coupleId,
          input.partnerName,
          input.partnerNickname,
          input.partnerAvatarPath,
          input.partnerBirthDate,
          input.partnerBio,
          input.firstMetOnlineDate,
          input.firstMetInPersonDate,
          input.anniversaryDate,
          input.firstMeetingPlace,
          input.originStory,
          input.firstPhotoPath,
          input.mainPhotoPath,
          input.themePreset,
          input.fontFamily,
          input.animationStyle,
          input.dashboardBannerPath,
          input.romanticMessage,
        ]
      );

      // 4. Auto-populate timeline & anniversary calendar from user's own dates on new space
      if (isNewSpace) {
        if (input.firstMetOnlineDate) {
          await conn.execute(
            `INSERT INTO relationship_timeline (id, couple_id, created_by, title, milestone_type, event_date, description, location)
             VALUES (?, ?, ?, 'Pertama Kali Kenal', 'first_know', ?, ?, ?)`,
            [
              generateUuid(),
              coupleId,
              user.id,
              input.firstMetOnlineDate,
              input.originStory ?? "Awal mula perjalanan cerita kita.",
              input.firstMeetingPlace,
            ]
          );
        }
        if (input.firstMetInPersonDate) {
          await conn.execute(
            `INSERT INTO relationship_timeline (id, couple_id, created_by, title, milestone_type, event_date, description, location, photo_path)
             VALUES (?, ?, ?, 'Pertama Kali Bertemu', 'first_meet', ?, ?, ?, ?)`,
            [
              generateUuid(),
              coupleId,
              user.id,
              input.firstMetInPersonDate,
              input.firstMeetingPlace
                ? `Pertemuan pertama di ${input.firstMeetingPlace}.`
                : "Momen pertemuan pertama kita.",
              input.firstMeetingPlace,
              input.firstPhotoPath,
            ]
          );
        }
        if (input.anniversaryDate) {
          await conn.execute(
            `INSERT INTO relationship_timeline (id, couple_id, created_by, title, milestone_type, event_date, description, photo_path)
             VALUES (?, ?, ?, 'Hari Jadian Kita', 'anniversary', ?, 'Hari di mana kita resmi memulai perjalanan bersama.', ?)`,
            [generateUuid(), coupleId, user.id, input.anniversaryDate, input.mainPhotoPath]
          );

          await conn.execute(
            `INSERT INTO calendar_events (id, couple_id, created_by, title, description, event_type, event_date, reminder_days_before, is_recurring_yearly)
             VALUES (?, ?, ?, ?, 'Perayaan hari jadi hubungan kita.', 'anniversary', ?, 7, 1)`,
            [
              generateUuid(),
              coupleId,
              user.id,
              `Anniversary ${input.coupleSpaceName}`,
              input.anniversaryDate,
            ]
          );
        }
      }

      // 5. Generate initial invite code if space has only 1 member
      let inviteCode: string | undefined;
      const [cntRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM couple_members WHERE couple_id = ?",
        [coupleId]
      );
      const count = Number(
        (Array.isArray(cntRows) && (cntRows[0] as { total: number })?.total) || 1
      );
      if (count < 2) {
        inviteCode = generateInviteCodeString();
        const expires = toMysqlDatetime(new Date(Date.now() + 72 * 60 * 60 * 1000));
        await conn.execute(
          "UPDATE couple_invitations SET status = 'revoked' WHERE couple_id = ? AND status = 'pending'",
          [coupleId]
        );
        await conn.execute(
          `INSERT INTO couple_invitations (id, couple_id, inviter_id, invite_code, status, expires_at)
           VALUES (?, ?, ?, ?, 'pending', ?)`,
          [generateUuid(), coupleId, user.id, inviteCode, expires]
        );
      }

      return { coupleId, inviteCode };
    });

    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan data onboarding.",
    };
  }
}
