"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Plus, Shuffle, Sparkles, Trash2 } from "lucide-react";
import {
  addLoveJarMessageAction,
  deleteLoveJarMessageAction,
  drawRandomLoveJarMessageAction,
} from "@/services/love-jar.actions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type { LoveJarCategory, LoveJarMessageRow } from "@/types/database";

const JAR_CATEGORIES: Record<
  LoveJarCategory,
  { label: string; color: string; pillBg: string }
> = {
  romantic: { label: "Romantis", color: "bg-pink-200", pillBg: "from-pink-100 to-rose-100" },
  motivation: { label: "Motivasi", color: "bg-amber-200", pillBg: "from-amber-100 to-yellow-100" },
  encouragement: { label: "Penyemangat", color: "bg-emerald-200", pillBg: "from-emerald-100 to-teal-100" },
  when_sad: { label: "Ketika Sedih", color: "bg-sky-200", pillBg: "from-sky-100 to-indigo-100" },
  when_missing: { label: "Ketika Rindu", color: "bg-purple-200", pillBg: "from-purple-100 to-pink-100" },
};

export function LoveJarClient({
  currentUserId,
  userNickname,
  partnerNickname,
  initialMessages,
}: {
  currentUserId: string;
  userNickname: string;
  partnerNickname: string;
  initialMessages: LoveJarMessageRow[];
}) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<LoveJarMessageRow[]>(initialMessages);
  const [drawCategory, setDrawCategory] = useState<LoveJarCategory | "all">("all");
  const [revealedMessage, setRevealedMessage] = useState<LoveJarMessageRow | null>(null);
  const [drawing, setDrawing] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState<LoveJarCategory>("romantic");
  const [messageText, setMessageText] = useState("");
  const [saving, setSaving] = useState(false);

  const unopened = messages.filter((m) => !m.is_opened);
  const opened = messages.filter((m) => m.is_opened);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await addLoveJarMessageAction({ category, message: messageText });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal menyimpan pesan", description: res.error });
        return;
      }
      setMessages((prev) => [res.data!, ...prev]);
      setMessageText("");
      setAddOpen(false);
      showToast({ type: "success", title: "Pesan dimasukkan ke Toples Cinta!" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDrawRandom() {
    setDrawing(true);
    try {
      const res = await drawRandomLoveJarMessageAction(drawCategory);
      if (!res.success || !res.data) {
        showToast({ type: "info", title: "Toples kosong", description: res.error });
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === res.data!.id ? res.data! : m)));
      setRevealedMessage(res.data);
    } finally {
      setDrawing(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteLoveJarMessageAction(id);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      showToast({ type: "info", title: "Pesan dihapus" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Jar of Love</h1>
          <p className="text-sm text-brand-brown">
            Toples digital berisi pesan-pesan manis yang bisa diambil acak kapan pun kalian butuh
            semangat atau rindu.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Masukkan Pesan ke Toples
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6 flex flex-col items-center text-center">
          <Badge variant="pink">
            <Sparkles className="h-3.5 w-3.5" /> {unopened.length} gulungan belum dibuka
          </Badge>

          <div className="relative my-6 flex flex-col items-center">
            <div className="h-7 w-32 rounded-t-2xl bg-gradient-to-b from-[#A88473] to-[#8D6E63] shadow-sm" />
            <div className="h-3 w-36 rounded-full bg-brand-rose shadow-sm" />
            <motion.div
              animate={drawing ? { rotate: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="relative flex h-64 w-52 flex-wrap content-end justify-center gap-2 overflow-hidden rounded-b-[2.5rem] rounded-t-3xl border-4 border-white/90 bg-gradient-to-b from-white/55 to-brand-pink/30 p-4 shadow-glass"
            >
              {unopened.slice(0, 18).map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, rotate: ((idx % 5) - 2) * 8 }}
                  className={`h-5 w-11 rounded-full shadow-sm ${
                    JAR_CATEGORIES[m.category].color
                  } border border-white/80`}
                />
              ))}
              {unopened.length === 0 && (
                <p className="my-auto text-xs text-brand-brown/80 px-4">
                  Toples masih kosong. Tambahkan catatan kecil untuk pasanganmu!
                </p>
              )}
            </motion.div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <Select
              label="Pilih Suasana / Kategori"
              value={drawCategory}
              onChange={(e) => setDrawCategory(e.target.value as LoveJarCategory | "all")}
            >
              <option value="all">Semua Kategori (Acak)</option>
              {Object.entries(JAR_CATEGORIES).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.label}
                </option>
              ))}
            </Select>

            <Button
              size="lg"
              className="w-full"
              loading={drawing}
              onClick={handleDrawRandom}
              disabled={unopened.length === 0}
            >
              <Shuffle className="h-4 w-4" />
              Ambil 1 Pesan Acak
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-brand-dark">Riwayat Pesan yang Sudah Dibuka</h2>
            <Badge variant="cream">{opened.length} dibuka</Badge>
          </div>

          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {opened.length === 0 ? (
              <p className="py-12 text-center text-xs text-brand-brown">
                Belum ada pesan yang dibuka. Klik tombol &ldquo;Ambil 1 Pesan Acak&rdquo; di
                samping!
              </p>
            ) : (
              opened.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl bg-gradient-to-br p-4 border border-white/80 shadow-soft ${
                    JAR_CATEGORIES[msg.category].pillBg
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="cream">{JAR_CATEGORIES[msg.category].label}</Badge>
                    <button
                      type="button"
                      onClick={() => handleDelete(msg.id)}
                      className="rounded-lg p-1 text-brand-brown/70 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2.5 text-sm font-medium text-brand-dark leading-relaxed">
                    &ldquo;{msg.message}&rdquo;
                  </p>
                  <p className="mt-2 text-[11px] text-brand-brown">
                    Ditulis oleh {msg.author_id === currentUserId ? userNickname : partnerNickname}{" "}
                    &bull; Dibuka {formatDateTimeIndo(msg.opened_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Masukkan Pesan ke Jar of Love"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Select
            label="Kategori Pesan"
            value={category}
            onChange={(e) => setCategory(e.target.value as LoveJarCategory)}
          >
            {Object.entries(JAR_CATEGORIES).map(([id, info]) => (
              <option key={id} value={id}>
                {info.label}
              </option>
            ))}
          </Select>
          <Textarea
            label="Pesan Hangat *"
            required
            rows={4}
            placeholder="Tulis pesan romantis, motivasi, atau kata penyemangat..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              Masukkan ke Toples
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(revealedMessage)}
        onClose={() => setRevealedMessage(null)}
        title="Gulungan Pesan Terbuka!"
        maxWidth="max-w-md"
      >
        <AnimatePresence>
          {revealedMessage && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className={`rounded-3xl bg-gradient-to-br p-6 text-center shadow-inner ${
                JAR_CATEGORIES[revealedMessage.category].pillBg
              }`}
            >
              <Heart className="mx-auto h-8 w-8 text-brand-roseDark" fill="currentColor" />
              <div className="mt-2">
                <Badge variant="cream">{JAR_CATEGORIES[revealedMessage.category].label}</Badge>
              </div>
              <p className="mt-4 text-base font-semibold text-brand-dark leading-relaxed">
                &ldquo;{revealedMessage.message}&rdquo;
              </p>
              <p className="mt-4 text-xs text-brand-brown">
                — {revealedMessage.author_id === currentUserId ? userNickname : partnerNickname}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
}
