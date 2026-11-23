"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql } from "@/lib/db/mysql";
import type { ActionResult } from "@/types/domain";

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql(
      "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND recipient_id = ?",
      [notificationId, ctx.userId]
    );
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menandai notifikasi." };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql(
      "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE recipient_id = ? AND is_read = 0",
      [ctx.userId]
    );
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menandai semua notifikasi." };
  }
}
