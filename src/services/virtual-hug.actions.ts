"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, normalizeBool, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { publishCoupleEvent } from "@/lib/realtime/bus";
import { virtualHugSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { VirtualHugRow } from "@/types/database";

function mapHug(row: VirtualHugRow): VirtualHugRow {
  return { ...row, is_received: normalizeBool(row.is_received) };
}

export async function sendVirtualHugAction(
  rawInput: unknown
): Promise<ActionResult<VirtualHugRow>> {
  try {
    const parsed = virtualHugSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Pesan pelukan tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO virtual_hugs (id, couple_id, sender_id, recipient_id, hug_style, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, ctx.coupleId, ctx.userId, ctx.partnerId, parsed.data.hugStyle, parsed.data.message]
    );

    const created = await queryOne<VirtualHugRow>("SELECT * FROM virtual_hugs WHERE id = ?", [id]);
    const mapped = mapHug(created!);

    publishCoupleEvent(ctx.coupleId, { event: "virtual_hug", data: mapped });

    await notifyPartner(
      ctx,
      "virtual_hug",
      `${ctx.actorName} Mengirimkan Pelukan Virtual!`,
      `"${parsed.data.message.slice(0, 100)}"`,
      "/virtual-hug"
    );

    revalidatePath("/virtual-hug");
    revalidatePath("/dashboard");
    return { success: true, data: mapped };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengirim pelukan virtual." };
  }
}

export async function markHugReceivedAction(hugId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql(
      "UPDATE virtual_hugs SET is_received = 1, received_at = NOW() WHERE id = ? AND couple_id = ?",
      [hugId, ctx.coupleId]
    );
    revalidatePath("/virtual-hug");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menandai pelukan diterima." };
  }
}
