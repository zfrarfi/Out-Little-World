"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, HeartHandshake, Send, Sparkles } from "lucide-react";
import { markHugReceivedAction, sendVirtualHugAction } from "@/services/virtual-hug.actions";
import { useToast } from "@/components/ui/ToastProvider";
import { Badge, Button, Card, Select, Textarea } from "@/components/ui/Primitives";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type { HugStyle, VirtualHugRow } from "@/types/database";

const HUG_STYLES: Record<HugStyle, { label: string; defaultMsg: string }> = {
  warm_hug: { label: "Pelukan Hangat", defaultMsg: "Pelukan hangat untukmu hari ini, tetap semangat ya!" },
  tight_squeeze: { label: "Pelukan Erat", defaultMsg: "Kangen banget! Ini pelukan paling erat dari jauh." },
  forehead_kiss: { label: "Cium Kening & Peluk", defaultMsg: "Istirahat yang cukup ya, aku selalu ada untukmu." },
  comfort_hug: { label: "Pelukan Penenang", defaultMsg: "Tidak apa-apa kalau hari ini berat, sini peluk dulu." },
};

export function VirtualHugClient({
  coupleId,
  currentUserId,
  userNickname,
  partnerNickname,
  initialHugs,
}: {
  coupleId: string;
  currentUserId: string;
  userNickname: string;
  partnerNickname: string;
  initialHugs: VirtualHugRow[];
}) {
  const { showToast } = useToast();
  const [hugs, setHugs] = useState<VirtualHugRow[]>(initialHugs);
  const [hugStyle, setHugStyle] = useState<HugStyle>("warm_hug");
  const [message, setMessage] = useState(HUG_STYLES.warm_hug.defaultMsg);
  const [isHugging, setIsHugging] = useState(false);
  const [activeCaption, setActiveCaption] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function triggerHugAnimation(caption: string) {
    setActiveCaption(caption);
    setIsHugging(true);
    setTimeout(() => {
      setIsHugging(false);
    }, 3400);
  }

  useEffect(() => {
    const knownIds = new Set(initialHugs.map((h) => h.id));
    const source = new EventSource("/api/realtime/stream");
    const onHug = (evt: MessageEvent) => {
      try {
        const incoming = JSON.parse(evt.data) as VirtualHugRow;
        knownIds.add(incoming.id);
        setHugs((prev) => (prev.some((h) => h.id === incoming.id) ? prev : [incoming, ...prev]));
        if (incoming.sender_id !== currentUserId) {
          triggerHugAnimation(`${partnerNickname}: "${incoming.message}"`);
          showToast({
            type: "info",
            title: `${partnerNickname} mengirim Pelukan Virtual!`,
            description: incoming.message,
          });
        }
      } catch {
        // ignore
      }
    };
    source.addEventListener("virtual_hug", onHug as EventListener);

    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/realtime/sync?scope=hugs", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { hugs?: VirtualHugRow[] };
        if (!Array.isArray(data.hugs)) return;
        for (const h of data.hugs) {
          if (!knownIds.has(h.id)) {
            knownIds.add(h.id);
            if (h.sender_id !== currentUserId) {
              triggerHugAnimation(`${partnerNickname}: "${h.message}"`);
            }
          }
        }
        setHugs(data.hugs);
      } catch {
        // ignore
      }
    }, 4000);

    return () => {
      clearInterval(timer);
      source.removeEventListener("virtual_hug", onHug as EventListener);
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, currentUserId, partnerNickname, showToast]);

  async function handleSendHug(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await sendVirtualHugAction({ hugStyle, message });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal mengirim pelukan", description: res.error });
        return;
      }
      setHugs((prev) => (prev.some((h) => h.id === res.data!.id) ? prev : [res.data!, ...prev]));
      triggerHugAnimation(`Pelukan terkirim ke ${partnerNickname}!`);
      showToast({ type: "success", title: "Virtual Hug Terkirim!" });
    } finally {
      setSending(false);
    }
  }

  async function handleReceiveHug(hug: VirtualHugRow) {
    const res = await markHugReceivedAction(hug.id);
    if (res.success) {
      setHugs((prev) =>
        prev.map((h) => (h.id === hug.id ? { ...h, is_received: true } : h))
      );
      triggerHugAnimation(`Kamu menerima pelukan dari ${partnerNickname}!`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Virtual Hug</h1>
        <p className="text-sm text-brand-brown">
          Kirimkan pelukan virtual penuh kehangatan beserta pesan romantis secara realtime kepada{" "}
          {partnerNickname}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Interactive Hug Stage */}
        <Card className="lg:col-span-7 relative overflow-hidden bg-gradient-to-b from-[#FFF5F9] via-white to-[#FFF8F0]">
          <div className="flex items-center justify-between">
            <Badge variant="pink">
              <HeartHandshake className="h-3.5 w-3.5" /> Interactive Hug Stage
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => triggerHugAnimation("Pratinjau animasi pelukan hangat!")}
            >
              <Sparkles className="h-3.5 w-3.5" /> Putar Animasi
            </Button>
          </div>

          {/* Two Cute Characters Approaching & Embracing */}
          <div className="relative my-6 flex h-64 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-brand-pink/20 to-brand-cream border border-brand-pink/35">
            {/* Floating Hearts Burst */}
            <AnimatePresence>
              {isHugging &&
                [0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, x: (i - 3) * 18, scale: 0.4 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: -115 - (i % 3) * 20,
                      x: (i - 3) * 34,
                      scale: [0.5, 1.25, 0.8],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, delay: i * 0.14 }}
                    className="pointer-events-none absolute top-1/2 text-rose-400"
                  >
                    <Heart size={18 + (i % 3) * 6} fill="currentColor" />
                  </motion.div>
                ))}
            </AnimatePresence>

            {/* Glow Aura when hugging */}
            <motion.div
              animate={{
                scale: isHugging ? [1, 1.35, 1.15] : 0.85,
                opacity: isHugging ? 0.65 : 0.15,
              }}
              transition={{ duration: 0.9 }}
              className="absolute h-40 w-40 rounded-full bg-brand-pink blur-2xl"
            />

            {/* Left Character (User) */}
            <motion.div
              animate={{
                x: isHugging ? 32 : -62,
                rotate: isHugging ? 8 : 0,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#FAD0E0] to-[#E8A0BF] text-white shadow-romantic border-4 border-white">
                <span className="text-2xl">{isHugging ? "🥰" : "😊"}</span>
              </div>
              <span className="mt-2 rounded-full bg-white/90 px-3 py-0.5 text-xs font-bold text-brand-dark shadow-sm">
                {userNickname}
              </span>
            </motion.div>

            {/* Center Heart during hug */}
            <motion.div
              animate={{
                scale: isHugging ? [0, 1.35, 1.1] : 0,
                opacity: isHugging ? 1 : 0,
              }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="z-20 mx-[-10px] mb-6 text-rose-500 drop-shadow"
            >
              <Heart className="h-10 w-10" fill="currentColor" />
            </motion.div>

            {/* Right Character (Partner) */}
            <motion.div
              animate={{
                x: isHugging ? -32 : 62,
                rotate: isHugging ? -8 : 0,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#FDE2B8] to-[#E8A0BF] text-white shadow-romantic border-4 border-white">
                <span className="text-2xl">{isHugging ? "🤗" : "😌"}</span>
              </div>
              <span className="mt-2 rounded-full bg-white/90 px-3 py-0.5 text-xs font-bold text-brand-dark shadow-sm">
                {partnerNickname}
              </span>
            </motion.div>

            {activeCaption && isHugging && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-brand-roseDark shadow"
              >
                {activeCaption}
              </motion.p>
            )}
          </div>

          <form onSubmit={handleSendHug} className="space-y-4">
            <Select
              label="Gaya Pelukan"
              value={hugStyle}
              onChange={(e) => {
                const style = e.target.value as HugStyle;
                setHugStyle(style);
                setMessage(HUG_STYLES[style].defaultMsg);
              }}
            >
              {Object.entries(HUG_STYLES).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.label}
                </option>
              ))}
            </Select>

            <Textarea
              label="Pesan Romantis Bersama Pelukan *"
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <Button type="submit" size="lg" loading={sending} className="w-full">
              <Send className="h-4 w-4" />
              Send Virtual Hug ke {partnerNickname}
            </Button>
          </form>
        </Card>

        {/* Hug History */}
        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-brand-dark">Riwayat Pelukan</h2>
            <Badge variant="cream">{hugs.length} pelukan</Badge>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {hugs.length === 0 ? (
              <p className="py-12 text-center text-xs text-brand-brown">
                Belum ada pelukan virtual yang dikirim. Kirim pelukan pertama sekarang!
              </p>
            ) : (
              hugs.map((hug) => {
                const isMine = hug.sender_id === currentUserId;
                return (
                  <div
                    key={hug.id}
                    className="rounded-2xl border border-brand-pink/35 bg-white/85 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={isMine ? "cream" : "pink"}>
                        {isMine
                          ? `${userNickname} → ${partnerNickname}`
                          : `${partnerNickname} → ${userNickname}`}
                      </Badge>
                      <span className="text-[10px] text-brand-brown">
                        {formatDateTimeIndo(hug.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-brand-roseDark">
                      {HUG_STYLES[hug.hug_style]?.label ?? hug.hug_style}
                    </p>
                    <p className="mt-1 text-sm text-brand-dark">&ldquo;{hug.message}&rdquo;</p>

                    {!isMine && !hug.is_received && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3"
                        onClick={() => handleReceiveHug(hug)}
                      >
                        <Heart className="h-3.5 w-3.5" fill="currentColor" />
                        Terima Pelukan
                      </Button>
                    )}
                    {hug.is_received && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <Check className="h-3.5 w-3.5" /> Pelukan telah diterima
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
  );
}
