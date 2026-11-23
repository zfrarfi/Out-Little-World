"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext } from "./action-context";
import { execSql, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { playlistSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { PlaylistRow } from "@/types/database";

export async function addPlaylistSongAction(
  rawInput: unknown
): Promise<ActionResult<PlaylistRow>> {
  try {
    const parsed = playlistSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data lagu tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO playlists (id, couple_id, added_by, title, artist, spotify_url, youtube_url, cover_url, memory_note, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        ctx.userId,
        parsed.data.title,
        parsed.data.artist,
        parsed.data.spotifyUrl,
        parsed.data.youtubeUrl,
        parsed.data.coverUrl,
        parsed.data.memoryNote,
        parsed.data.category,
      ]
    );
    const created = await queryOne<PlaylistRow>("SELECT * FROM playlists WHERE id = ?", [id]);
    revalidatePath("/playlist");
    return { success: true, data: created! };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambahkan lagu." };
  }
}

export async function updatePlaylistSongAction(
  songId: string,
  rawInput: unknown
): Promise<ActionResult<PlaylistRow>> {
  try {
    const parsed = playlistSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data lagu tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    await execSql(
      `UPDATE playlists
       SET title = ?, artist = ?, spotify_url = ?, youtube_url = ?, cover_url = ?, memory_note = ?, category = ?
       WHERE id = ? AND couple_id = ?`,
      [
        parsed.data.title,
        parsed.data.artist,
        parsed.data.spotifyUrl,
        parsed.data.youtubeUrl,
        parsed.data.coverUrl,
        parsed.data.memoryNote,
        parsed.data.category,
        songId,
        ctx.coupleId,
      ]
    );
    const updated = await queryOne<PlaylistRow>(
      "SELECT * FROM playlists WHERE id = ? AND couple_id = ?",
      [songId, ctx.coupleId]
    );
    if (!updated) return { success: false, error: "Lagu tidak ditemukan." };
    revalidatePath("/playlist");
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui lagu." };
  }
}

export async function deletePlaylistSongAction(songId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM playlists WHERE id = ? AND couple_id = ?", [songId, ctx.coupleId]);
    revalidatePath("/playlist");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus lagu." };
  }
}
