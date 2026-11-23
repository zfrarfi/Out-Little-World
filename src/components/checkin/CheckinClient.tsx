"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Send, Smile, Sparkles, TrendingUp } from "lucide-react";
import { upsertDailyCheckinAction } from "@/services/checkin.actions";
import { useToast } from "@/components/ui/ToastProvider";
import { Badge, Button, Card, Textarea } from "@/components/ui/Primitives";
import { formatDateIndo } from "@/lib/utils/relationship";
import type { DailyCheckinRow, MoodType } from "@/types/database";

const MOOD_OPTIONS: Array<{ id: MoodType; emoji: string; label: string }> = [
  { id: "loved", emoji: "🥰", label: "Penuh Cinta" },
  { id: "very_happy", emoji: "😄", label: "Sangat Senang" },
  { id: "happy", emoji: "😊", label: "Bahagia" },
  { id: "calm", emoji: "😌", label: "Tenang" },
  { id: "missing_you", emoji: "🥺", label: "Kangen Kamu" },
  { id: "tired", emoji: "😴", label: "Lelah" },
  { id: "anxious", emoji: "😟", label: "Cemas" },
  { id: "sad", emoji: "😢", label: "Sedih" },
];

export function CheckinClient({
  currentUserId,
  userNickname,
  partnerNickname,
  initialCheckins,
}: {
  currentUserId: string;
  userNickname: string;
  partnerNickname: string;
  initialCheckins: DailyCheckinRow[];
}) {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [checkins, setCheckins] = useState<DailyCheckinRow[]>(initialCheckins);

  const myToday = checkins.find(
    (c) => c.user_id === currentUserId && c.checkin_date === todayStr
  );

  const [mood, setMood] = useState<MoodType>(myToday?.mood ?? "happy");
  const [happinessLevel, setHappinessLevel] = useState<number>(myToday?.happiness_level ?? 8);
  const [dailyStory, setDailyStory] = useState(myToday?.daily_story ?? "");
  const [messageToPartner, setMessageToPartner] = useState(myToday?.message_to_partner ?? "");
  const [saving, setSaving] = useState(false);

  const selectedMoodObj = MOOD_OPTIONS.find((m) => m.id === mood) ?? MOOD_OPTIONS[2];

  const chartData = useMemo(() => {
    // Last 14 unique dates chronologically
    const ordered = [...checkins].reverse().slice(-14);
    return ordered;
  }, [checkins]);

  const avgHappiness = useMemo(() => {
    if (checkins.length === 0) return 0;
    const sum = checkins.reduce((acc, c) => acc + c.happiness_level, 0);
    return Number((sum / checkins.length).toFixed(1));
  }, [checkins]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertDailyCheckinAction({
        mood,
        emoji: selectedMoodObj.emoji,
        happinessLevel,
        dailyStory,
        messageToPartner,
        checkinDate: todayStr,
      });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal menyimpan check-in", description: res.error });
        return;
      }
      setCheckins((prev) => {
        const filtered = prev.filter((item) => item.id !== res.data!.id);
        return [res.data!, ...filtered];
      });
      showToast({
        type: "success",
        title: "Daily Check-in Tersimpan!",
        description: `${partnerNickname} mendapat notifikasi kabar harimu.`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Daily Check-in</h1>
        <p className="text-sm text-brand-brown">
          Bagikan perasaanmu hari ini, tingkat kebahagiaan, cerita singkat, dan pesan manis untuk{" "}
          {partnerNickname}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Check-in Form */}
        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="pink">
              <Smile className="h-3.5 w-3.5" /> Check-in Hari Ini ({formatDateIndo(todayStr)})
            </Badge>
            {myToday && <Badge variant="emerald">Sudah diisi — bisa diperbarui</Badge>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-brown">
                Bagaimana Perasaanmu Hari Ini?
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMood(opt.id)}
                    className={`flex flex-col items-center rounded-2xl border p-3 transition ${
                      mood === opt.id
                        ? "border-brand-roseDark bg-brand-pink/35 shadow-soft scale-[1.02]"
                        : "border-brand-pink/30 bg-white/80 hover:bg-brand-cream"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="mt-1 text-[11px] font-medium text-brand-dark">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
                  Tingkat Kebahagiaan
                </span>
                <span className="text-sm font-bold text-brand-roseDark">
                  {happinessLevel} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={happinessLevel}
                onChange={(e) => setHappinessLevel(Number(e.target.value))}
                className="mt-2 w-full accent-brand-roseDark cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[10px] text-brand-brown">
                <span>1 — Berat</span>
                <span>5 — Biasa</span>
                <span>10 — Sangat Bahagia</span>
              </div>
            </div>

            <Textarea
              label="Cerita Harian"
              rows={3}
              placeholder="Apa hal paling berkesan yang terjadi hari ini?"
              value={dailyStory}
              onChange={(e) => setDailyStory(e.target.value)}
            />

            <Textarea
              label={`Pesan Khusus Untuk ${partnerNickname}`}
              rows={2}
              placeholder="Tulis kalimat hangat untuk pasanganmu..."
              value={messageToPartner}
              onChange={(e) => setMessageToPartner(e.target.value)}
            />

            <Button type="submit" loading={saving} className="w-full" size="lg">
              <Send className="h-4 w-4" />
              {myToday ? "Perbarui Check-in Hari Ini" : "Kirim Daily Check-in"}
            </Button>
          </form>
        </Card>

        {/* Mood Chart & Summary */}
        <div className="lg:col-span-6 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-roseDark" />
                <h2 className="text-base font-bold text-brand-dark">Grafik Mood &amp; Kebahagiaan</h2>
              </div>
              <Badge variant="rose">Rata-rata: {avgHappiness}/10</Badge>
            </div>

            {chartData.length === 0 ? (
              <p className="py-10 text-center text-xs text-brand-brown">
                Grafik akan muncul otomatis setelah kamu atau pasanganmu mengirim check-in.
              </p>
            ) : (
              <div className="flex h-48 items-end gap-2 pt-4">
                {chartData.map((entry) => {
                  const isMine = entry.user_id === currentUserId;
                  const heightPct = Math.max(12, entry.happiness_level * 10);
                  return (
                    <div
                      key={entry.id}
                      className="flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <span className="text-sm" title={`${entry.happiness_level}/10`}>
                        {entry.emoji}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.45 }}
                        className={`w-full max-w-[30px] rounded-t-xl ${
                          isMine
                            ? "bg-gradient-to-t from-brand-roseDark to-brand-pink"
                            : "bg-gradient-to-t from-brand-brown/70 to-amber-300"
                        }`}
                      />
                      <span className="text-[10px] text-brand-brown">
                        {entry.checkin_date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-5 text-[11px] text-brand-brown">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-roseDark" />
                {userNickname}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                {partnerNickname}
              </span>
            </div>
          </Card>

          {/* Check-in History */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-brand-roseDark" />
              <h2 className="text-base font-bold text-brand-dark">Riwayat Check-in</h2>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {checkins.length === 0 ? (
                <p className="py-6 text-center text-xs text-brand-brown">
                  Belum ada riwayat check-in.
                </p>
              ) : (
                checkins.map((c) => {
                  const isMine = c.user_id === currentUserId;
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-brand-pink/30 bg-white/85 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.emoji}</span>
                          <div>
                            <p className="text-xs font-bold text-brand-dark">
                              {isMine ? userNickname : partnerNickname}
                            </p>
                            <p className="text-[11px] text-brand-brown">
                              {formatDateIndo(c.checkin_date)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="pink">
                          <Heart className="h-3 w-3" fill="currentColor" /> {c.happiness_level}/10
                        </Badge>
                      </div>
                      {c.daily_story && (
                        <p className="mt-2 text-xs text-brand-dark leading-relaxed">
                          {c.daily_story}
                        </p>
                      )}
                      {c.message_to_partner && (
                        <p className="mt-2 rounded-xl bg-brand-cream px-3 py-2 text-xs italic text-brand-brown">
                          &ldquo;{c.message_to_partner}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
