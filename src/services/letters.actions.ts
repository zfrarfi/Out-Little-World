"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, normalizeBool, queryOne, toMysqlDatetime } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { loveLetterSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { LoveLetterRow } from "@/types/database";

function mapLetter(row: LoveLetterRow): LoveLetterRow {
  return { ...row, is_secret: normalizeBool(row.is_secret) };
}

export async function createLoveLetterAction(
  rawInput: unknown
): Promise<ActionResult<LoveLetterRow>> {
  try {
    const parsed = loveLetterSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Isi surat tidak valid." };
    }

    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    const scheduledMysql = parsed.data.scheduledOpenAt
      ? toMysqlDatetime(parsed.data.scheduledOpenAt)
      : null;

    await execSql(
      `INSERT INTO love_letters (id, couple_id, sender_id, recipient_id, title, content, design_theme, is_secret, scheduled_open_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        ctx.userId,
        ctx.partnerId,
        parsed.data.title,
        parsed.data.content,
        parsed.data.designTheme,
        parsed.data.isSecret ? 1 : 0,
        scheduledMysql,
      ]
    );

    const created = await queryOne<LoveLetterRow>("SELECT * FROM love_letters WHERE id = ?", [id]);

    await notifyPartner(
      ctx,
      "letter",
      parsed.data.isSecret ? "Surat Rahasia Baru Untukmu" : "Surat Cinta Baru Untukmu",
      `${ctx.actorName} mengirim surat "${parsed.data.title}".`,
      "/letters"
    );

    revalidatePath("/letters");
    revalidatePath("/dashboard");
    return { success: true, data: mapLetter(created!) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengirim surat." };
  }
}

export async function openLoveLetterAction(letterId: string): Promise<ActionResult<LoveLetterRow>> {
  try {
    const ctx = await getAuthorizedActionContext();
    const existing = await queryOne<LoveLetterRow>(
      "SELECT * FROM love_letters WHERE id = ? AND couple_id = ? LIMIT 1",
      [letterId, ctx.coupleId]
    );

    if (!existing) {
      return { success: false, error: "Surat tidak ditemukan." };
    }

    const isSender = existing.sender_id === ctx.userId;
    if (!isSender && existing.scheduled_open_at) {
      const unlockTime = new Date(existing.scheduled_open_at.replace(" ", "T")).getTime();
      if (unlockTime > Date.now()) {
        return {
          success: false,
          error: "Surat ini dijadwalkan terkunci sampai waktu pembukaan tiba.",
        };
      }
    }

    if (!isSender && !existing.opened_at) {
      await execSql("UPDATE love_letters SET opened_at = NOW() WHERE id = ? AND couple_id = ?", [
        letterId,
        ctx.coupleId,
      ]);
      const updated = await queryOne<LoveLetterRow>("SELECT * FROM love_letters WHERE id = ?", [
        letterId,
      ]);
      revalidatePath("/letters");
      return { success: true, data: mapLetter(updated!) };
    }

    return { success: true, data: mapLetter(existing) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal membuka surat." };
  }
}

export async function deleteLoveLetterAction(letterId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM love_letters WHERE id = ? AND couple_id = ? AND sender_id = ?", [
      letterId,
      ctx.coupleId,
      ctx.userId,
    ]);
    revalidatePath("/letters");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus surat." };
  }
}
