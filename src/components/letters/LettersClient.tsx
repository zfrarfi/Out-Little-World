"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Heart, Lock, Mail, MailOpen, Plus, Send, Trash2 } from "lucide-react";
import {
  createLoveLetterAction,
  deleteLoveLetterAction,
  openLoveLetterAction,
} from "@/services/letters.actions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type { LetterDesignTheme, LoveLetterRow } from "@/types/database";

const LETTER_THEMES: Record<
  LetterDesignTheme,
  { name: string; cardClass: string; paperClass: string; sealColor: string }
> = {
  "classic-cream": {
    name: "Classic Cream",
    cardClass: "from-[#FFF8F0] to-[#FDEBD8] border-amber-200/80",
    paperClass: "bg-[#FFFDF9] border-amber-200/70",
    sealColor: "bg-brand-roseDark",
  },
  "rose-petal": {
    name: "Rose Petal",
    cardClass: "from-[#FFF0F6] to-[#F8C8DC]/60 border-brand-rose/50",
    paperClass: "bg-[#FFF7FA] border-brand-pink",
    sealColor: "bg-rose-500",
  },
  "vintage-wax": {
    name: "Vintage Wax",
    cardClass: "from-[#F8EFE6] to-[#EAD7C5] border-[#C9A88C]",
    paperClass: "bg-[#FCF7F0] border-[#D8C0A8]",
    sealColor: "bg-[#8D6E63]",
  },
  "starlight-pink": {
    name: "Starlight Blush",
    cardClass: "from-[#FCE8F4] to-[#EDE1F8] border-purple-200",
    paperClass: "bg-[#FDF9FF] border-purple-200",
    sealColor: "bg-purple-400",
  },
  "minimal-blush": {
    name: "Minimalist White",
    cardClass: "from-white to-[#FFF4F8] border-brand-pink/50",
    paperClass: "bg-white border-brand-pink/45",
    sealColor: "bg-brand-rose",
  },
};

export function LettersClient({
  currentUserId,
  userNickname,
  partnerNickname,
  initialLetters,
}: {
  currentUserId: string;
  userNickname: string;
  partnerNickname: string;
  initialLetters: LoveLetterRow[];
}) {
  const { showToast } = useToast();
  const [letters, setLetters] = useState<LoveLetterRow[]>(initialLetters);
  const [tab, setTab] = useState<"all" | "received" | "sent">("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeLetter, setActiveLetter] = useState<LoveLetterRow | null>(null);
  const [envelopeRevealed, setEnvelopeRevealed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LoveLetterRow | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [designTheme, setDesignTheme] = useState<LetterDesignTheme>("rose-petal");
  const [isSecret, setIsSecret] = useState(false);
  const [scheduledOpenAt, setScheduledOpenAt] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleLetters = letters.filter((l) => {
    if (tab === "received") return l.sender_id !== currentUserId;
    if (tab === "sent") return l.sender_id === currentUserId;
    return true;
  });

  function isLocked(letter: LoveLetterRow): boolean {
    if (letter.sender_id === currentUserId) return false;
    if (!letter.scheduled_open_at) return false;
    return new Date(letter.scheduled_open_at).getTime() > Date.now();
  }

  async function handleSendLetter(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createLoveLetterAction({
        title,
        content,
        designTheme,
        isSecret,
        scheduledOpenAt: scheduledOpenAt || null,
      });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal mengirim surat", description: res.error });
        return;
      }
      setLetters((prev) => [res.data!, ...prev]);
      setTitle("");
      setContent("");
      setIsSecret(false);
      setScheduledOpenAt("");
      setComposeOpen(false);
      showToast({ type: "success", title: "Surat cinta terkirim!" });
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenEnvelope(letter: LoveLetterRow) {
    if (isLocked(letter)) {
      showToast({
        type: "info",
        title: "Surat Masih Terkunci",
        description: `Baru bisa dibuka pada ${formatDateTimeIndo(letter.scheduled_open_at)}.`,
      });
      return;
    }
    setActiveLetter(letter);
    setEnvelopeRevealed(false);

    const res = await openLoveLetterAction(letter.id);
    if (res.success && res.data) {
      setLetters((prev) => prev.map((l) => (l.id === letter.id ? res.data! : l)));
      setActiveLetter(res.data);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await deleteLoveLetterAction(deleteTarget.id);
      if (res.success) {
        setLetters((prev) => prev.filter((l) => l.id !== deleteTarget.id));
        if (activeLetter?.id === deleteTarget.id) setActiveLetter(null);
        showToast({ type: "info", title: "Surat dihapus" });
      }
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Love Letters</h1>
          <p className="text-sm text-brand-brown">
            Tulis surat penuh kasih, pilih desain amplop, atau jadwalkan waktu pembukaannya.
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4" />
          Tulis Surat Cinta
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(
          [
            { id: "all", label: `Semua (${letters.length})` },
            {
              id: "received",
              label: `Diterima (${letters.filter((l) => l.sender_id !== currentUserId).length})`,
            },
            {
              id: "sent",
              label: `Terkirim (${letters.filter((l) => l.sender_id === currentUserId).length})`,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-brand-roseDark text-white shadow-soft"
                : "bg-white/80 text-brand-brown hover:bg-brand-pink/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visibleLetters.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-7 w-7" />}
          title="Kotak surat masih kosong"
          description="Kirim surat cinta pertama untuk pasanganmu atau buat surat rahasia yang terbuka di hari spesial!"
          action={
            <Button onClick={() => setComposeOpen(true)}>
              <Send className="h-4 w-4" />
              Tulis Surat Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleLetters.map((letter) => {
            const theme = LETTER_THEMES[letter.design_theme] ?? LETTER_THEMES["classic-cream"];
            const locked = isLocked(letter);
            const isMine = letter.sender_id === currentUserId;
            return (
              <motion.div
                key={letter.id}
                whileHover={{ y: -4 }}
                onClick={() => handleOpenEnvelope(letter)}
                className={`relative cursor-pointer overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-soft transition hover:shadow-romantic ${theme.cardClass}`}
              >
                {/* Envelope decorative top fold */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={isMine ? "cream" : "pink"}>
                      {isMine ? `Dari ${userNickname}` : `Dari ${partnerNickname}`}
                    </Badge>
                    {letter.is_secret && (
                      <Badge variant="amber">
                        <Lock className="h-3 w-3" /> Rahasia
                      </Badge>
                    )}
                  </div>
                  {isMine && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(letter);
                      }}
                      className="rounded-xl p-1.5 text-brand-brown/70 hover:bg-white/70 hover:text-rose-600"
                      aria-label="Hapus surat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Wax seal emblem */}
                <div className="my-5 flex items-center gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${theme.sealColor}`}
                  >
                    {locked ? (
                      <Lock className="h-5 w-5" />
                    ) : letter.opened_at ? (
                      <MailOpen className="h-5 w-5" />
                    ) : (
                      <Heart className="h-5 w-5" fill="currentColor" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-brand-dark">{letter.title}</h3>
                    <p className="text-xs text-brand-brown">
                      {locked
                        ? `Terbuka ${formatDateTimeIndo(letter.scheduled_open_at)}`
                        : letter.opened_at
                        ? "Sudah dibuka"
                        : "Klik untuk membuka amplop"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-black/5 pt-3 text-[11px] text-brand-brown">
                  <span>{theme.name}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTimeIndo(letter.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Compose Letter Modal */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Tulis Surat Cinta"
        subtitle={`Akan dikirim langsung ke ruang kalian untuk ${partnerNickname}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSendLetter} className="space-y-4">
          <Input
            label="Judul Surat *"
            required
            placeholder="Misal: Untuk kamu yang selalu membuat hariku hangat"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select
            label="Desain Kertas & Amplop"
            value={designTheme}
            onChange={(e) => setDesignTheme(e.target.value as LetterDesignTheme)}
          >
            {Object.entries(LETTER_THEMES).map(([id, t]) => (
              <option key={id} value={id}>
                {t.name}
              </option>
            ))}
          </Select>

          <Textarea
            label="Isi Surat *"
            required
            rows={7}
            placeholder="Tuliskan isi hatimu di sini..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-brand-cream/80 p-3.5">
            <label className="flex items-center gap-2.5 text-xs font-medium text-brand-dark cursor-pointer">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-roseDark"
              />
              Tandai sebagai Surat Rahasia
            </label>
            <Input
              label="Jadwalkan Tanggal Pembukaan (Opsional)"
              type="datetime-local"
              value={scheduledOpenAt}
              onChange={(e) => setScheduledOpenAt(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              <Send className="h-4 w-4" />
              Kirim Surat
            </Button>
          </div>
        </form>
      </Modal>

      {/* Interactive Envelope Opening Modal */}
      <Modal
        open={Boolean(activeLetter)}
        onClose={() => {
          setActiveLetter(null);
          setEnvelopeRevealed(false);
        }}
        title={activeLetter?.title ?? ""}
        subtitle={
          activeLetter
            ? `Dikirim ${formatDateTimeIndo(activeLetter.created_at)}`
            : undefined
        }
        maxWidth="max-w-xl"
      >
        {activeLetter && (
          <AnimatePresence mode="wait">
            {!envelopeRevealed ? (
              <motion.div
                key="sealed-envelope"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.96 }}
                className={`flex flex-col items-center justify-center rounded-3xl border bg-gradient-to-br p-10 text-center ${
                  LETTER_THEMES[activeLetter.design_theme].cardClass
                }`}
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setEnvelopeRevealed(true)}
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl ${
                    LETTER_THEMES[activeLetter.design_theme].sealColor
                  }`}
                >
                  <Heart className="h-9 w-9" fill="currentColor" />
                </motion.button>
                <p className="mt-5 text-base font-bold text-brand-dark">Segel Amplop Terpasang</p>
                <p className="mt-1 text-xs text-brand-brown">
                  Klik segel hati di atas untuk membuka surat ini
                </p>
                <Button className="mt-5" onClick={() => setEnvelopeRevealed(true)}>
                  Buka Amplop
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="opened-letter"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className={`rounded-3xl border p-6 sm:p-8 shadow-inner ${
                  LETTER_THEMES[activeLetter.design_theme].paperClass
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-roseDark">
                  {activeLetter.sender_id === currentUserId
                    ? `Dari ${userNickname} untuk ${partnerNickname}`
                    : `Dari ${partnerNickname} untuk ${userNickname}`}
                </p>
                <h3 className="mt-2 text-xl font-bold text-brand-dark">{activeLetter.title}</h3>
                <div className="my-4 h-px bg-brand-pink/50" />
                <p className="whitespace-pre-wrap text-sm text-brand-dark leading-8">
                  {activeLetter.content}
                </p>
                {activeLetter.opened_at && (
                  <p className="mt-6 text-right text-[11px] text-brand-brown">
                    Dibuka pada {formatDateTimeIndo(activeLetter.opened_at)}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Surat Cinta?"
        message={`Surat "${deleteTarget?.title ?? ""}" akan dihapus dari riwayat surat.`}
        confirmLabel="Hapus Surat"
        loading={saving}
      />
    </div>
  );
}
