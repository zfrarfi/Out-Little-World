"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql, normalizeBool, queryOne, queryRows } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { loveJarSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { LoveJarCategory, LoveJarMessageRow } from "@/types/database";

function mapJar(row: LoveJarMessageRow): LoveJarMessageRow {
  return { ...row, is_opened: normalizeBool(row.is_opened) };
}

export async function addLoveJarMessageAction(
  rawInput: unknown
): Promise<ActionResult<LoveJarMessageRow>> {
  try {
    const parsed = loveJarSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Pesan tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      "INSERT INTO love_jar_messages (id, couple_id, author_id, category, message) VALUES (?, ?, ?, ?, ?)",
      [id, ctx.coupleId, ctx.userId, parsed.data.category, parsed.data.message]
    );
    const created = await queryOne<LoveJarMessageRow>(
      "SELECT * FROM love_jar_messages WHERE id = ?",
      [id]
    );
    revalidatePath("/love-jar");
    return { success: true, data: mapJar(created!) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memasukkan pesan ke toples.",
    };
  }
}

export async function drawRandomLoveJarMessageAction(
  category?: LoveJarCategory | "all"
): Promise<ActionResult<LoveJarMessageRow>> {
  try {
    const ctx = await getAuthorizedActionContext();
    const candidates =
      category && category !== "all"
        ? await queryRows<LoveJarMessageRow>(
            "SELECT * FROM love_jar_messages WHERE couple_id = ? AND is_opened = 0 AND category = ?",
            [ctx.coupleId, category]
          )
        : await queryRows<LoveJarMessageRow>(
            "SELECT * FROM love_jar_messages WHERE couple_id = ? AND is_opened = 0",
            [ctx.coupleId]
          );

    if (candidates.length === 0) {
      return {
        success: false,
        error: "Belum ada pesan tertutup di kategori ini. Tambahkan pesan baru terlebih dahulu!",
      };
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    await execSql(
      "UPDATE love_jar_messages SET is_opened = 1, opened_by = ?, opened_at = NOW() WHERE id = ? AND couple_id = ?",
      [ctx.userId, picked.id, ctx.coupleId]
    );
    const updated = await queryOne<LoveJarMessageRow>(
      "SELECT * FROM love_jar_messages WHERE id = ?",
      [picked.id]
    );
    revalidatePath("/love-jar");
    return { success: true, data: mapJar(updated!) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengambil pesan acak." };
  }
}

export async function deleteLoveJarMessageAction(messageId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM love_jar_messages WHERE id = ? AND couple_id = ?", [
      messageId,
      ctx.coupleId,
    ]);
    revalidatePath("/love-jar");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus pesan." };
  }
}
