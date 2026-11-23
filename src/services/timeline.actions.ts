"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { deleteLocalStorageFile } from "@/lib/storage/local";
import { timelineSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { RelationshipTimelineRow } from "@/types/database";

export async function createTimelineMilestoneAction(
  rawInput: unknown
): Promise<ActionResult<RelationshipTimelineRow>> {
  try {
    const parsed = timelineSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data timeline tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO relationship_timeline (id, couple_id, created_by, title, milestone_type, event_date, description, location, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        ctx.userId,
        parsed.data.title,
        parsed.data.milestoneType,
        parsed.data.eventDate,
        parsed.data.description,
        parsed.data.location,
        parsed.data.photoPath,
      ]
    );
    const created = await queryOne<RelationshipTimelineRow>(
      "SELECT * FROM relationship_timeline WHERE id = ?",
      [id]
    );
    revalidatePath("/timeline");
    revalidatePath("/dashboard");
    return { success: true, data: created! };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambahkan milestone." };
  }
}

export async function updateTimelineMilestoneAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<RelationshipTimelineRow>> {
  try {
    const parsed = timelineSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data timeline tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    await execSql(
      `UPDATE relationship_timeline
       SET title = ?, milestone_type = ?, event_date = ?, description = ?, location = ?, photo_path = ?
       WHERE id = ? AND couple_id = ?`,
      [
        parsed.data.title,
        parsed.data.milestoneType,
        parsed.data.eventDate,
        parsed.data.description,
        parsed.data.location,
        parsed.data.photoPath,
        id,
        ctx.coupleId,
      ]
    );
    const updated = await queryOne<RelationshipTimelineRow>(
      "SELECT * FROM relationship_timeline WHERE id = ? AND couple_id = ?",
      [id, ctx.coupleId]
    );
    if (!updated) return { success: false, error: "Milestone tidak ditemukan." };
    revalidatePath("/timeline");
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui milestone." };
  }
}

export async function deleteTimelineMilestoneAction(
  id: string,
  photoPath?: string | null
): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    const res = await execSql("DELETE FROM relationship_timeline WHERE id = ? AND couple_id = ?", [
      id,
      ctx.coupleId,
    ]);
    if (res.affectedRows > 0 && photoPath) {
      await deleteLocalStorageFile("timeline-images", photoPath);
    }
    revalidatePath("/timeline");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus milestone." };
  }
}
