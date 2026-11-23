"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Heart, Mail, Calendar, MessageCircle, Camera, Sparkles } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/services/notifications.actions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type { NotificationRow } from "@/types/database";

function notifIcon(type: NotificationRow["type"]) {
  switch (type) {
    case "message":
      return <MessageCircle className="h-4 w-4 text-brand-roseDark" />;
    case "letter":
      return <Mail className="h-4 w-4 text-brand-roseDark" />;
    case "memory":
      return <Camera className="h-4 w-4 text-brand-roseDark" />;
    case "calendar":
      return <Calendar className="h-4 w-4 text-brand-roseDark" />;
    case "virtual_hug":
      return <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />;
    default:
      return <Sparkles className="h-4 w-4 text-brand-roseDark" />;
  }
}

export function NotificationBell({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: NotificationRow[];
}) {
  const [items, setItems] = useState<NotificationRow[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const unreadCount = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    const source = new EventSource("/api/realtime/stream");
    const onNotification = (evt: MessageEvent) => {
      try {
        const incoming = JSON.parse(evt.data) as NotificationRow;
        if (incoming.recipient_id !== userId) return;
        setItems((prev) => {
          if (prev.some((n) => n.id === incoming.id)) return prev;
          return [incoming, ...prev.slice(0, 29)];
        });
        showToast({
          type: "info",
          title: incoming.title,
          description: incoming.body,
        });
      } catch {
        // ignore malformed event
      }
    };

    source.addEventListener("notification", onNotification as EventListener);
    return () => {
      source.removeEventListener("notification", onNotification as EventListener);
      source.close();
    };
  }, [userId, showToast]);

  async function handleReadOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await markNotificationReadAction(id);
  }

  async function handleReadAll() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsReadAction();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-rose/30 bg-white/85 text-brand-dark shadow-soft transition hover:bg-brand-pink/30"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-3xl border border-brand-pink/40 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-brand-pink/30 px-4 py-3.5">
                <div>
                  <h4 className="text-sm font-semibold text-brand-dark">Notifikasi</h4>
                  <p className="text-[11px] text-brand-brown">
                    {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah terbaca"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReadAll}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-brand-roseDark hover:bg-brand-pink/25 transition"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai semua
                  </button>
                )}
              </div>

              <div className="max-h-96 divide-y divide-brand-pink/20 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Bell className="mx-auto h-7 w-7 text-brand-rose/60" />
                    <p className="mt-2 text-xs text-brand-brown">
                      Belum ada notifikasi. Aktivitas pasanganmu akan muncul secara realtime di sini.
                    </p>
                  </div>
                ) : (
                  items.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3.5 transition ${
                        notif.is_read ? "bg-white" : "bg-brand-pink/15"
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-pink/35">
                        {notifIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={notif.link_url || "/dashboard"}
                          onClick={() => {
                            if (!notif.is_read) handleReadOne(notif.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          <p className="text-xs font-semibold text-brand-dark">{notif.title}</p>
                          <p className="mt-0.5 text-xs text-brand-brown line-clamp-2">
                            {notif.body}
                          </p>
                          <p className="mt-1 text-[10px] text-brand-brown/70">
                            {formatDateTimeIndo(notif.created_at)}
                          </p>
                        </Link>
                      </div>
                      {!notif.is_read && (
                        <button
                          type="button"
                          onClick={() => handleReadOne(notif.id)}
                          title="Tandai dibaca"
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-roseDark"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
