"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, normalizeBool, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { getPrivateMediaUrl } from "@/lib/storage/local";
import { publishCoupleEvent } from "@/lib/realtime/bus";
import type { ActionResult } from "@/types/domain";
import type { ChatMessageRow } from "@/types/database";

export async function sendChatMessageAction(input: {
  content?: string | null;
  imagePath?: string | null;
}): Promise<ActionResult<ChatMessageRow>> {
  try {
    const text = input.content?.trim() || null;
    const imagePath = input.imagePath?.trim() || null;

    if (!text && !imagePath) {
      return { success: false, error: "Tulis pesan atau lampirkan gambar terlebih dahulu." };
    }

    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO chat_messages (id, couple_id, sender_id, content, image_path, status)
       VALUES (?, ?, ?, ?, ?, 'sent')`,
      [id, ctx.coupleId, ctx.userId, text, imagePath]
    );

    const created = await queryOne<ChatMessageRow>("SELECT * FROM chat_messages WHERE id = ?", [id]);

    if (created) {
      publishCoupleEvent(ctx.coupleId, {
        event: "chat_insert",
        data: {
          ...created,
          imageUrl: getPrivateMediaUrl("chat-images", created.image_path),
        },
      });
    }

    await notifyPartner(
      ctx,
      "message",
      `Pesan Baru dari ${ctx.actorName}`,
      text ? text.slice(0, 100) : "Mengirim sebuah gambar",
      "/chat"
    );

    return { success: true, data: created! };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengirim pesan." };
  }
}

export async function markChatMessagesReadAction(): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    const profile = await queryOne<{ show_read_receipts: number }>(
      "SELECT show_read_receipts FROM profiles WHERE id = ? LIMIT 1",
      [ctx.userId]
    );

    if (profile && !normalizeBool(profile.show_read_receipts)) {
      return { success: true };
    }

    const res = await execSql(
      `UPDATE chat_messages
       SET status = 'read', read_at = NOW()
       WHERE couple_id = ? AND sender_id <> ? AND status <> 'read'`,
      [ctx.coupleId, ctx.userId]
    );

    if (res.affectedRows > 0) {
      publishCoupleEvent(ctx.coupleId, {
        event: "chat_update",
        data: { readerId: ctx.userId, readAt: new Date().toISOString() },
      });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui status baca." };
  }
}

export async function deleteChatMessageAction(messageId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    const res = await execSql(
      "DELETE FROM chat_messages WHERE id = ? AND couple_id = ? AND sender_id = ?",
      [messageId, ctx.coupleId, ctx.userId]
    );
    if (res.affectedRows > 0) {
      publishCoupleEvent(ctx.coupleId, {
        event: "chat_delete",
        data: { id: messageId },
      });
    }
    revalidatePath("/chat");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus pesan." };
  }
}
