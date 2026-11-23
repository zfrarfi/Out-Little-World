"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { publishCoupleEvent } from "@/lib/realtime/bus";
import { computeGardenUpdate } from "@/lib/utils/relationship";
import type { ActionResult } from "@/types/domain";
import type { GardenActionType, LoveGardenRow } from "@/types/database";

export async function careForGardenAction(
  actionType: GardenActionType
): Promise<ActionResult<{ garden: LoveGardenRow; earnedPoints: number }>> {
  try {
    const ctx = await getAuthorizedActionContext();

    let existing = await queryOne<LoveGardenRow>(
      "SELECT * FROM love_garden WHERE couple_id = ? LIMIT 1",
      [ctx.coupleId]
    );

    if (!existing) {
      const id = generateUuid();
      await execSql("INSERT INTO love_garden (id, couple_id) VALUES (?, ?)", [id, ctx.coupleId]);
      existing = await queryOne<LoveGardenRow>("SELECT * FROM love_garden WHERE id = ?", [id]);
    }

    const next = computeGardenUpdate(existing!, actionType);

    await execSql(
      `UPDATE love_garden
       SET growth_points = ?, level = ?, plant_stage = ?,
           water_count = ?, sunlight_count = ?, fertilizer_count = ?, flowers_bloomed = ?,
           last_cared_by = ?, last_cared_at = NOW(), last_action_type = ?
       WHERE id = ? AND couple_id = ?`,
      [
        next.growth_points,
        next.level,
        next.plant_stage,
        next.water_count,
        next.sunlight_count,
        next.fertilizer_count,
        next.flowers_bloomed,
        ctx.userId,
        actionType,
        existing!.id,
        ctx.coupleId,
      ]
    );

    const updated = await queryOne<LoveGardenRow>("SELECT * FROM love_garden WHERE id = ?", [
      existing!.id,
    ]);

    if (updated) {
      publishCoupleEvent(ctx.coupleId, { event: "love_garden", data: updated });
    }

    revalidatePath("/garden");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: { garden: updated!, earnedPoints: next.earnedPoints },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal merawat taman." };
  }
}

export async function renameGardenTreeAction(treeName: string): Promise<ActionResult<LoveGardenRow>> {
  try {
    const clean = treeName.trim();
    if (clean.length < 2 || clean.length > 80) {
      return { success: false, error: "Nama pohon harus 2-80 karakter." };
    }
    const ctx = await getAuthorizedActionContext();
    await execSql("UPDATE love_garden SET tree_name = ? WHERE couple_id = ?", [
      clean,
      ctx.coupleId,
    ]);
    const updated = await queryOne<LoveGardenRow>(
      "SELECT * FROM love_garden WHERE couple_id = ? LIMIT 1",
      [ctx.coupleId]
    );
    if (updated) {
      publishCoupleEvent(ctx.coupleId, { event: "love_garden", data: updated });
    }
    revalidatePath("/garden");
    return { success: true, data: updated! };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengganti nama pohon." };
  }
}
