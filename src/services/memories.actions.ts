"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, normalizeBool, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { deleteLocalStorageFile } from "@/lib/storage/local";
import { memoryAlbumSchema, memorySchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { MemoryAlbumRow, MemoryRow } from "@/types/database";

function mapMemory(row: MemoryRow): MemoryRow {
  return { ...row, is_favorite: normalizeBool(row.is_favorite) };
}

export async function createAlbumAction(rawInput: unknown): Promise<ActionResult<MemoryAlbumRow>> {
  try {
    const parsed = memoryAlbumSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data album tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      "INSERT INTO memory_albums (id, couple_id, created_by, title, description) VALUES (?, ?, ?, ?, ?)",
      [id, ctx.coupleId, ctx.userId, parsed.data.title, parsed.data.description]
    );
    const created = await queryOne<MemoryAlbumRow>("SELECT * FROM memory_albums WHERE id = ?", [id]);
    revalidatePath("/memories");
    return { success: true, data: created! };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal membuat album." };
  }
}

export async function deleteAlbumAction(albumId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM memory_albums WHERE id = ? AND couple_id = ?", [
      albumId,
      ctx.coupleId,
    ]);
    revalidatePath("/memories");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus album." };
  }
}

export async function createMemoryAction(rawInput: unknown): Promise<ActionResult<MemoryRow>> {
  try {
    const parsed = memorySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Data kenangan tidak valid.",
      };
    }

    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO memories (id, couple_id, album_id, uploaded_by, title, caption, media_type, media_path, memory_date, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        parsed.data.albumId,
        ctx.userId,
        parsed.data.title,
        parsed.data.caption,
        parsed.data.mediaType,
        parsed.data.mediaPath,
        parsed.data.memoryDate,
        parsed.data.location,
      ]
    );

    const created = await queryOne<MemoryRow>("SELECT * FROM memories WHERE id = ?", [id]);

    await notifyPartner(
      ctx,
      "memory",
      "Kenangan Baru Ditambahkan",
      `${ctx.actorName} menambahkan kenangan "${parsed.data.title}".`,
      "/memories"
    );

    revalidatePath("/memories");
    revalidatePath("/dashboard");
    return { success: true, data: mapMemory(created!) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan kenangan." };
  }
}

export async function updateMemoryAction(
  memoryId: string,
  input: {
    title: string;
    caption?: string | null;
    albumId?: string | null;
    memoryDate: string;
    location?: string | null;
  }
): Promise<ActionResult<MemoryRow>> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql(
      `UPDATE memories
       SET title = ?, caption = ?, album_id = ?, memory_date = ?, location = ?
       WHERE id = ? AND couple_id = ?`,
      [
        input.title.trim(),
        input.caption?.trim() || null,
        input.albumId || null,
        input.memoryDate,
        input.location?.trim() || null,
        memoryId,
        ctx.coupleId,
      ]
    );

    const updated = await queryOne<MemoryRow>(
      "SELECT * FROM memories WHERE id = ? AND couple_id = ?",
      [memoryId, ctx.coupleId]
    );
    if (!updated) return { success: false, error: "Kenangan tidak ditemukan." };
    revalidatePath("/memories");
    return { success: true, data: mapMemory(updated) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui kenangan." };
  }
}

export async function toggleFavoriteMemoryAction(
  memoryId: string,
  isFavorite: boolean
): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("UPDATE memories SET is_favorite = ? WHERE id = ? AND couple_id = ?", [
      isFavorite ? 1 : 0,
      memoryId,
      ctx.coupleId,
    ]);
    revalidatePath("/memories");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengubah favorit." };
  }
}

export async function deleteMemoryAction(memoryId: string, mediaPath?: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    const res = await execSql("DELETE FROM memories WHERE id = ? AND couple_id = ?", [
      memoryId,
      ctx.coupleId,
    ]);
    if (res.affectedRows > 0 && mediaPath) {
      await deleteLocalStorageFile("memories", mediaPath);
    }
    revalidatePath("/memories");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus kenangan." };
  }
}
