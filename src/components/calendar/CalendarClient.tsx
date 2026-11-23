"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  BellRing,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/services/calendar.actions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { formatDateIndo } from "@/lib/utils/relationship";
import type { CalendarEventRow, CalendarEventType } from "@/types/database";

const EVENT_TYPE_META: Record<
  CalendarEventType,
  { label: string; dotColor: string; badgeVariant: "pink" | "rose" | "emerald" | "amber" }
> = {
  anniversary: { label: "Anniversary", dotColor: "bg-rose-500", badgeVariant: "rose" },
  birthday: { label: "Ulang Tahun", dotColor: "bg-amber-400", badgeVariant: "amber" },
  date: { label: "Jadwal Kencan", dotColor: "bg-brand-roseDark", badgeVariant: "pink" },
  special: { label: "Momen Spesial", dotColor: "bg-emerald-400", badgeVariant: "emerald" },
};

export function CalendarClient({
  initialEvents,
}: {
  initialEvents: CalendarEventRow[];
}) {
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEventRow[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEventRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEventRow | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<CalendarEventType>("date");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [isRecurringYearly, setIsRecurringYearly] = useState(false);
  const [saving, setSaving] = useState(false);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventRow[]> = {};
    for (const ev of events) {
      const key = ev.event_date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const upcomingReminders = useMemo(() => {
    const today = new Date();
    return events
      .map((ev) => {
        const dt = parseISO(ev.event_date);
        const diff = differenceInCalendarDays(dt, today);
        return { ev, diff };
      })
      .filter(({ diff }) => diff >= 0 && diff <= 45)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 6);
  }, [events]);

  function openNewModal(dateStr?: string) {
    setEditing(null);
    setTitle("");
    setDescription("");
    setEventType("date");
    setEventDate(dateStr || selectedDate);
    setEventTime("");
    setLocation("");
    setReminderDaysBefore(1);
    setIsRecurringYearly(false);
    setModalOpen(true);
  }

  function openEditModal(ev: CalendarEventRow) {
    setEditing(ev);
    setTitle(ev.title);
    setDescription(ev.description ?? "");
    setEventType(ev.event_type);
    setEventDate(ev.event_date);
    setEventTime(ev.event_time ?? "");
    setLocation(ev.location ?? "");
    setReminderDaysBefore(ev.reminder_days_before);
    setIsRecurringYearly(ev.is_recurring_yearly);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        eventType,
        eventDate,
        eventTime: eventTime || null,
        location,
        reminderDaysBefore,
        isRecurringYearly,
      };
      if (editing) {
        const res = await updateCalendarEventAction(editing.id, payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal memperbarui", description: res.error });
          return;
        }
        setEvents((prev) => prev.map((ev) => (ev.id === editing.id ? res.data! : ev)));
        showToast({ type: "success", title: "Acara diperbarui!" });
      } else {
        const res = await createCalendarEventAction(payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal menambah acara", description: res.error });
          return;
        }
        setEvents((prev) => [...prev, res.data!]);
        showToast({ type: "success", title: "Acara ditambahkan ke kalender!" });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await deleteCalendarEventAction(deleteTarget.id);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        showToast({ type: "info", title: "Acara dihapus" });
      }
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }

  const selectedDayEvents = eventsByDate[selectedDate] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Our Calendar</h1>
          <p className="text-sm text-brand-brown">
            Kelola anniversary, ulang tahun, jadwal kencan, dan pengingat momen spesial kalian.
          </p>
        </div>
        <Button onClick={() => openNewModal()}>
          <Plus className="h-4 w-4" />
          Tambah Acara
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Monthly Calendar Grid */}
        <Card className="lg:col-span-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-dark capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Hari Ini
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-brand-brown mb-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[key] ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = key === selectedDate;
              const isToday = key === format(new Date(), "yyyy-MM-dd");

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`flex min-h-[68px] sm:min-h-[82px] flex-col items-start rounded-2xl border p-2 text-left transition ${
                    isSelected
                      ? "border-brand-roseDark bg-brand-pink/35 shadow-soft"
                      : isToday
                      ? "border-brand-rose bg-brand-cream"
                      : "border-brand-pink/20 bg-white/75 hover:bg-brand-pink/15"
                  } ${!inMonth ? "opacity-40" : ""}`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? "text-brand-roseDark" : "text-brand-dark"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        title={ev.title}
                        className={`h-2 w-2 rounded-full ${
                          EVENT_TYPE_META[ev.event_type].dotColor
                        }`}
                      />
                    ))}
                  </div>
                  {dayEvents[0] && (
                    <span className="mt-1 hidden w-full truncate text-[10px] text-brand-brown sm:block">
                      {dayEvents[0].title}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Side: Selected Day + Upcoming Reminders */}
        <div className="lg:col-span-4 space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-roseDark">
                  Agenda Tanggal
                </p>
                <h3 className="text-base font-bold text-brand-dark">
                  {formatDateIndo(selectedDate)}
                </h3>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openNewModal(selectedDate)}>
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDayEvents.length === 0 ? (
                <p className="rounded-2xl bg-brand-cream p-4 text-center text-xs text-brand-brown">
                  Belum ada acara pada tanggal ini.
                </p>
              ) : (
                selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-brand-pink/35 bg-white p-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant={EVENT_TYPE_META[ev.event_type].badgeVariant}>
                          {EVENT_TYPE_META[ev.event_type].label}
                        </Badge>
                        <h4 className="mt-1.5 text-sm font-bold text-brand-dark">{ev.title}</h4>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
                          className="rounded-lg p-1 text-brand-brown hover:bg-brand-pink/30"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ev)}
                          className="rounded-lg p-1 text-brand-brown hover:bg-rose-100 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {ev.description && (
                      <p className="mt-1.5 text-xs text-brand-brown">{ev.description}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-brand-brown">
                      {ev.event_time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {ev.event_time.slice(0, 5)}
                        </span>
                      )}
                      {ev.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {ev.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <BellRing className="h-3 w-3" /> Pengingat H-{ev.reminder_days_before}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-brand-roseDark" />
              <h3 className="text-sm font-bold text-brand-dark">Pengingat Mendatang</h3>
            </div>
            <div className="mt-3 space-y-2.5">
              {upcomingReminders.length === 0 ? (
                <p className="text-xs text-brand-brown">
                  Tidak ada acara dalam 45 hari ke depan.
                </p>
              ) : (
                upcomingReminders.map(({ ev, diff }) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-brand-cream/85 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-brand-dark">{ev.title}</p>
                      <p className="text-[11px] text-brand-brown">
                        {formatDateIndo(ev.event_date)}
                      </p>
                    </div>
                    <Badge variant={diff <= ev.reminder_days_before ? "rose" : "pink"}>
                      {diff === 0 ? "Hari ini!" : `H-${diff}`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add / Edit Event Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Acara Kalender" : "Tambah Acara Baru"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Judul Acara *"
            required
            placeholder="Misal: Dinner Anniversary, Nonton Bareng..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Jenis Acara"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as CalendarEventType)}
            >
              <option value="anniversary">Anniversary</option>
              <option value="birthday">Ulang Tahun</option>
              <option value="date">Jadwal Kencan</option>
              <option value="special">Momen Spesial</option>
            </Select>
            <Input
              label="Tanggal *"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Jam (Opsional)"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
            <Input
              label="Pengingat (Hari Sebelumnya)"
              type="number"
              min={0}
              max={30}
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
            />
          </div>
          <Input
            label="Lokasi (Opsional)"
            placeholder="Nama tempat atau alamat"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Textarea
            label="Catatan (Opsional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs font-medium text-brand-dark cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurringYearly}
              onChange={(e) => setIsRecurringYearly(e.target.checked)}
              className="h-4 w-4 accent-brand-roseDark"
            />
            Berulang setiap tahun (cocok untuk anniversary &amp; ulang tahun)
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              <CalendarIcon className="h-4 w-4" />
              {editing ? "Simpan Perubahan" : "Simpan Acara"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Acara?"
        message={`Hapus "${deleteTarget?.title ?? ""}" dari kalender bersama?`}
        confirmLabel="Hapus Acara"
        loading={saving}
      />
    </div>
  );
}
