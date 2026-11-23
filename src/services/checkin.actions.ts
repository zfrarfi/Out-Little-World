"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { dailyCheckinSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { DailyCheckinRow } from "@/types/database";

export async function upsertDailyCheckinAction(
  rawInput: unknown
): Promise<ActionResult<DailyCheckinRow>> {
  try {
    const parsed = dailyCheckinSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data check-in tidak valid." };
    }

    const ctx = await getAuthorizedActionContext();
    const checkinDate = parsed.data.checkinDate ?? new Date().toISOString().slice(0, 10);

    await execSql(
      `INSERT INTO daily_checkins (id, couple_id, user_id, checkin_date, mood, emoji, happiness_level, daily_story, message_to_partner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         mood = VALUES(mood),
         emoji = VALUES(emoji),
         happiness_level = VALUES(happiness_level),
         daily_story = VALUES(daily_story),
         message_to_partner = VALUES(message_to_partner)`,
      [
        generateUuid(),
        ctx.coupleId,
        ctx.userId,
        checkinDate,
        parsed.data.mood,
        parsed.data.emoji,
        parsed.data.happinessLevel,
        parsed.data.dailyStory,
        parsed.data.messageToPartner,
      ]
    );

    const saved = await queryOne<DailyCheckinRow>(
      "SELECT * FROM daily_checkins WHERE couple_id = ? AND user_id = ? AND checkin_date = ? LIMIT 1",
      [ctx.coupleId, ctx.userId, checkinDate]
    );

    await notifyPartner(
      ctx,
      "checkin",
      `${ctx.actorName} Mengisi Daily Check-in ${parsed.data.emoji}`,
      parsed.data.messageToPartner
        ? `Pesan untukmu: "${parsed.data.messageToPartner.slice(0, 90)}"`
        : `Tingkat kebahagiaan hari ini: ${parsed.data.happinessLevel}/10.`,
      "/check-in"
    );

    revalidatePath("/check-in");
    revalidatePath("/dashboard");
    return { success: true, data: saved! };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan check-in." };
  }
}

export async function deleteDailyCheckinAction(checkinId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM daily_checkins WHERE id = ? AND couple_id = ? AND user_id = ?", [
      checkinId,
      ctx.coupleId,
      ctx.userId,
    ]);
    revalidatePath("/check-in");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus check-in." };
  }
}
