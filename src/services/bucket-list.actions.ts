"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, normalizeBool, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { deleteLocalStorageFile } from "@/lib/storage/local";
import { bucketListSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { BucketListRow } from "@/types/database";

function mapBucket(row: BucketListRow): BucketListRow {
  return { ...row, is_completed: normalizeBool(row.is_completed) };
}

export async function createBucketItemAction(
  rawInput: unknown
): Promise<ActionResult<BucketListRow>> {
  try {
    const parsed = bucketListSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data bucket list tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO bucket_list (id, couple_id, created_by, title, description, category, target_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        ctx.userId,
        parsed.data.title,
        parsed.data.description,
        parsed.data.category,
        parsed.data.targetDate,
      ]
    );
    const created = await queryOne<BucketListRow>("SELECT * FROM bucket_list WHERE id = ?", [id]);
    revalidatePath("/bucket-list");
    return { success: true, data: mapBucket(created!) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambahkan impian." };
  }
}

export async function updateBucketItemAction(
  itemId: string,
  rawInput: unknown
): Promise<ActionResult<BucketListRow>> {
  try {
    const parsed = bucketListSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    await execSql(
      `UPDATE bucket_list SET title = ?, description = ?, category = ?, target_date = ?
       WHERE id = ? AND couple_id = ?`,
      [
        parsed.data.title,
        parsed.data.description,
        parsed.data.category,
        parsed.data.targetDate,
        itemId,
        ctx.coupleId,
      ]
    );
    const updated = await queryOne<BucketListRow>(
      "SELECT * FROM bucket_list WHERE id = ? AND couple_id = ?",
      [itemId, ctx.coupleId]
    );
    if (!updated) return { success: false, error: "Item tidak ditemukan." };
    revalidatePath("/bucket-list");
    return { success: true, data: mapBucket(updated) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui impian." };
  }
}

export async function toggleBucketCompletionAction(
  itemId: string,
  isCompleted: boolean,
  achievementPhotoPath?: string | null
): Promise<ActionResult<BucketListRow>> {
  try {
    const ctx = await getAuthorizedActionContext();
    if (achievementPhotoPath !== undefined) {
      await execSql(
        `UPDATE bucket_list
         SET is_completed = ?, completed_at = ?, achievement_photo_path = ?
         WHERE id = ? AND couple_id = ?`,
        [isCompleted ? 1 : 0, isCompleted ? new Date() : null, achievementPhotoPath, itemId, ctx.coupleId]
      );
    } else {
      await execSql(
        `UPDATE bucket_list
         SET is_completed = ?, completed_at = ?
         WHERE id = ? AND couple_id = ?`,
        [isCompleted ? 1 : 0, isCompleted ? new Date() : null, itemId, ctx.coupleId]
      );
    }

    const updated = await queryOne<BucketListRow>(
      "SELECT * FROM bucket_list WHERE id = ? AND couple_id = ?",
      [itemId, ctx.coupleId]
    );
    if (!updated) return { success: false, error: "Item tidak ditemukan." };

    if (isCompleted) {
      await notifyPartner(
        ctx,
        "bucket_list",
        "Impian Bucket List Tercapai!",
        `${ctx.actorName} menandai "${updated.title}" sebagai selesai.`,
        "/bucket-list"
      );
    }

    revalidatePath("/bucket-list");
    revalidatePath("/dashboard");
    return { success: true, data: mapBucket(updated) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui status." };
  }
}

export async function deleteBucketItemAction(
  itemId: string,
  photoPath?: string | null
): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    const res = await execSql("DELETE FROM bucket_list WHERE id = ? AND couple_id = ?", [
      itemId,
      ctx.coupleId,
    ]);
    if (res.affectedRows > 0 && photoPath) {
      await deleteLocalStorageFile("bucket-list-images", photoPath);
    }
    revalidatePath("/bucket-list");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus item." };
  }
}
