"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedActionContext, notifyPartner } from "./action-context";
import { execSql, normalizeBool, queryOne } from "@/lib/db/mysql";
import { generateUuid } from "@/lib/auth/crypto";
import { calendarEventSchema } from "@/lib/utils/validators";
import type { ActionResult } from "@/types/domain";
import type { CalendarEventRow } from "@/types/database";

function mapEvent(row: CalendarEventRow): CalendarEventRow {
  return { ...row, is_recurring_yearly: normalizeBool(row.is_recurring_yearly) };
}

export async function createCalendarEventAction(
  rawInput: unknown
): Promise<ActionResult<CalendarEventRow>> {
  try {
    const parsed = calendarEventSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data acara tidak valid." };
    }

    const ctx = await getAuthorizedActionContext();
    const id = generateUuid();
    await execSql(
      `INSERT INTO calendar_events (id, couple_id, created_by, title, description, event_type, event_date, event_time, location, reminder_days_before, is_recurring_yearly)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ctx.coupleId,
        ctx.userId,
        parsed.data.title,
        parsed.data.description,
        parsed.data.eventType,
        parsed.data.eventDate,
        parsed.data.eventTime,
        parsed.data.location,
        parsed.data.reminderDaysBefore,
        parsed.data.isRecurringYearly ? 1 : 0,
      ]
    );

    const created = await queryOne<CalendarEventRow>("SELECT * FROM calendar_events WHERE id = ?", [
      id,
    ]);

    await notifyPartner(
      ctx,
      "calendar",
      "Acara Baru di Kalender",
      `${ctx.actorName} menambahkan "${parsed.data.title}" pada ${parsed.data.eventDate}.`,
      "/calendar"
    );

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { success: true, data: mapEvent(created!) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambahkan acara." };
  }
}

export async function updateCalendarEventAction(
  eventId: string,
  rawInput: unknown
): Promise<ActionResult<CalendarEventRow>> {
  try {
    const parsed = calendarEventSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Data acara tidak valid." };
    }
    const ctx = await getAuthorizedActionContext();
    await execSql(
      `UPDATE calendar_events
       SET title = ?, description = ?, event_type = ?, event_date = ?, event_time = ?, location = ?, reminder_days_before = ?, is_recurring_yearly = ?
       WHERE id = ? AND couple_id = ?`,
      [
        parsed.data.title,
        parsed.data.description,
        parsed.data.eventType,
        parsed.data.eventDate,
        parsed.data.eventTime,
        parsed.data.location,
        parsed.data.reminderDaysBefore,
        parsed.data.isRecurringYearly ? 1 : 0,
        eventId,
        ctx.coupleId,
      ]
    );

    const updated = await queryOne<CalendarEventRow>(
      "SELECT * FROM calendar_events WHERE id = ? AND couple_id = ?",
      [eventId, ctx.coupleId]
    );
    if (!updated) return { success: false, error: "Acara tidak ditemukan." };
    revalidatePath("/calendar");
    return { success: true, data: mapEvent(updated) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui acara." };
  }
}

export async function deleteCalendarEventAction(eventId: string): Promise<ActionResult> {
  try {
    const ctx = await getAuthorizedActionContext();
    await execSql("DELETE FROM calendar_events WHERE id = ? AND couple_id = ?", [
      eventId,
      ctx.coupleId,
    ]);
    revalidatePath("/calendar");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus acara." };
  }
}
