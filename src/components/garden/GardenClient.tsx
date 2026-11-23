"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Edit3, Flower2, Heart, Sparkles, Sun } from "lucide-react";
import { careForGardenAction, renameGardenTreeAction } from "@/services/garden.actions";
import { useToast } from "@/components/ui/ToastProvider";
import { Badge, Button, Card, Input } from "@/components/ui/Primitives";
import { GARDEN_ACTION_POINTS, formatDateTimeIndo } from "@/lib/utils/relationship";
import type { GardenActionType, LoveGardenRow, PlantStage } from "@/types/database";

const STAGE_META: Record<PlantStage, { label: string; desc: string; scale: number; nextAt: number }> = {
  seed: { label: "Benih Harapan", desc: "Awal mula taman kecil kalian berdua.", scale: 0.45, nextAt: 30 },
  sprout: { label: "Tunas Muda", desc: "Tunas hijau mulai tumbuh subur.", scale: 0.62, nextAt: 90 },
  sapling: { label: "Pohon Remaja", desc: "Akar cinta semakin kuat dan kokoh.", scale: 0.78, nextAt: 180 },
  blooming: { label: "Mulai Bermekaran", desc: "Kuncup bunga merah muda bermekaran indah.", scale: 0.9, nextAt: 320 },
  flourishing: { label: "Taman Rindang", desc: "Rindang penuh bunga dan kehangatan.", scale: 1.0, nextAt: 500 },
  eternal_tree: { label: "Pohon Cinta Abadi", desc: "Tahap tertinggi — taman penuh bunga mekar!", scale: 1.08, nextAt: 500 },
};

export function GardenClient({
  coupleId,
  initialGarden,
  partnerNickname,
}: {
  coupleId: string;
  initialGarden: LoveGardenRow;
  partnerNickname: string;
}) {
  const { showToast } = useToast();
  const [garden, setGarden] = useState<LoveGardenRow>(initialGarden);
  const [busyAction, setBusyAction] = useState<GardenActionType | null>(null);
  const [floatingXp, setFloatingXp] = useState<{ id: number; text: string } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [treeNameDraft, setTreeNameDraft] = useState(initialGarden.tree_name);

  useEffect(() => {
    const source = new EventSource("/api/realtime/stream");
    const onGarden = (evt: MessageEvent) => {
      try {
        setGarden(JSON.parse(evt.data) as LoveGardenRow);
      } catch {
        // ignore
      }
    };
    source.addEventListener("love_garden", onGarden as EventListener);

    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/realtime/sync?scope=garden", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { garden?: LoveGardenRow | null };
        if (data.garden) setGarden(data.garden);
      } catch {
        // ignore
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      source.removeEventListener("love_garden", onGarden as EventListener);
      source.close();
    };
  }, [coupleId]);

  const stageInfo = STAGE_META[garden.plant_stage] ?? STAGE_META.seed;
  const levelProgress = garden.growth_points % 50;
  const visibleFlowers = Math.min(12, Math.max(garden.flowers_bloomed, garden.plant_stage === "blooming" ? 3 : 0));

  async function handleCare(action: GardenActionType) {
    setBusyAction(action);
    try {
      const res = await careForGardenAction(action);
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal merawat taman", description: res.error });
        return;
      }
      setGarden(res.data.garden);
      setFloatingXp({ id: Date.now(), text: `+${res.data.earnedPoints} Poin Cinta!` });
      showToast({
        type: "success",
        title: `${GARDEN_ACTION_POINTS[action].label} berhasil!`,
        description: `Pohon hubungan kalian bertambah +${res.data.earnedPoints} poin.`,
      });
      setTimeout(() => setFloatingXp(null), 1600);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const res = await renameGardenTreeAction(treeNameDraft);
    if (!res.success || !res.data) {
      showToast({ type: "error", title: "Gagal mengganti nama", description: res.error });
      return;
    }
    setGarden(res.data);
    setRenaming(false);
    showToast({ type: "success", title: "Nama pohon diperbarui!" });
  }

  const flowerCoords = [
    { cx: 145, cy: 112 },
    { cx: 190, cy: 88 },
    { cx: 235, cy: 115 },
    { cx: 162, cy: 148 },
    { cx: 218, cy: 146 },
    { cx: 188, cy: 124 },
    { cx: 128, cy: 138 },
    { cx: 252, cy: 140 },
    { cx: 170, cy: 76 },
    { cx: 212, cy: 78 },
    { cx: 192, cy: 62 },
    { cx: 204, cy: 112 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Virtual Love Garden</h1>
          <p className="text-sm text-brand-brown">
            Rawat pohon hubungan bersama {partnerNickname} agar terus tumbuh dan bermekaran.
          </p>
        </div>
        <Badge variant="pink">
          Level {garden.level} &bull; {garden.growth_points} Poin
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Interactive Tree Stage Canvas */}
        <Card className="lg:col-span-7 relative overflow-hidden bg-gradient-to-b from-[#FFF6FA] via-[#FFF8F0] to-[#EAF5E4]">
          <div className="flex items-center justify-between gap-2">
            {renaming ? (
              <form onSubmit={handleRename} className="flex items-center gap-2 flex-1">
                <Input
                  value={treeNameDraft}
                  onChange={(e) => setTreeNameDraft(e.target.value)}
                  className="py-1.5 text-sm"
                />
                <Button type="submit" size="sm">
                  Simpan
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                  Batal
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-brand-dark">{garden.tree_name}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setTreeNameDraft(garden.tree_name);
                    setRenaming(true);
                  }}
                  className="rounded-xl p-1.5 text-brand-brown hover:bg-white/80"
                  title="Ganti nama pohon"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
            <Badge variant="rose">{stageInfo.label}</Badge>
          </div>

          <p className="mt-1 text-xs text-brand-brown">{stageInfo.desc}</p>

          {/* Animated Floating XP popup */}
          <AnimatePresence>
            {floatingXp && (
              <motion.div
                key={floatingXp.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: -24, scale: 1.05 }}
                exit={{ opacity: 0, y: -48 }}
                className="pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-full bg-brand-roseDark px-4 py-1.5 text-xs font-bold text-white shadow-romantic"
              >
                {floatingXp.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Botanical SVG */}
          <div className="my-4 flex items-center justify-center">
            <motion.svg
              viewBox="0 0 380 300"
              className="h-72 w-full max-w-md"
              animate={{ scale: stageInfo.scale }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
            >
              {/* Soft sun */}
              <motion.circle
                cx="315"
                cy="55"
                r="26"
                fill="#FDE68A"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              {/* Ground hill */}
              <ellipse cx="190" cy="272" rx="145" ry="26" fill="#B8D8A8" />
              <ellipse cx="190" cy="275" rx="95" ry="15" fill="#9BC489" />

              {garden.plant_stage === "seed" ? (
                <g>
                  <ellipse cx="190" cy="258" rx="14" ry="10" fill="#8D6E63" />
                  <path d="M190 250 Q192 232 204 226" stroke="#6BA368" strokeWidth="4" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  {/* Trunk */}
                  <path
                    d="M180 266 Q184 210 186 165 L196 165 Q198 210 202 266 Z"
                    fill="#8D6E63"
                  />
                  {/* Branches */}
                  <path d="M188 195 Q162 175 152 155" stroke="#8D6E63" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <path d="M194 190 Q220 172 230 152" stroke="#8D6E63" strokeWidth="6" strokeLinecap="round" fill="none" />

                  {/* Foliage Canopy */}
                  <motion.g
                    animate={{ rotate: [-1.2, 1.2, -1.2] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ originX: "190px", originY: "170px" }}
                  >
                    <circle cx="190" cy="122" r="58" fill="#86B97F" />
                    <circle cx="145" cy="140" r="42" fill="#9AC993" />
                    <circle cx="235" cy="140" r="42" fill="#9AC993" />
                    <circle cx="190" cy="88" r="44" fill="#A9D6A2" />

                    {/* Blooming Romantic Pink Flowers */}
                    {flowerCoords.slice(0, visibleFlowers).map((pos, idx) => (
                      <motion.g
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.06, type: "spring" }}
                      >
                        <circle cx={pos.cx} cy={pos.cy} r="9" fill="#F8C8DC" />
                        <circle cx={pos.cx} cy={pos.cy} r="4.2" fill="#E8A0BF" />
                      </motion.g>
                    ))}
                  </motion.g>
                </g>
              )}
            </motion.svg>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 rounded-2xl bg-white/80 p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-brand-dark">
              <span>Progress Menuju Level {garden.level + 1}</span>
              <span>{levelProgress} / 50 Poin</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-brand-pink/35">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(levelProgress / 50) * 100}%` }}
                className="h-full rounded-full bg-gradient-to-r from-brand-rose to-brand-roseDark"
              />
            </div>
            {garden.last_cared_at && (
              <p className="text-[11px] text-brand-brown">
                Terakhir dirawat: {formatDateTimeIndo(garden.last_cared_at)}
              </p>
            )}
          </div>
        </Card>

        {/* Care Actions & Stats */}
        <div className="lg:col-span-5 space-y-5">
          <Card>
            <h3 className="text-base font-bold text-brand-dark">Aktivitas Merawat Taman</h3>
            <p className="mt-1 text-xs text-brand-brown">
              Setiap perawatan tersimpan permanen di database dan langsung menyinkronkan taman kalian.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                loading={busyAction === "water"}
                onClick={() => handleCare("water")}
                className="flex-col items-start h-auto py-3.5 text-left"
              >
                <div className="flex items-center gap-2 text-sky-600 font-semibold">
                  <Droplets className="h-4 w-4" /> Siram (+15)
                </div>
                <span className="text-[11px] font-normal text-brand-brown">
                  Segarkan daun &amp; akar
                </span>
              </Button>

              <Button
                variant="outline"
                loading={busyAction === "sunlight"}
                onClick={() => handleCare("sunlight")}
                className="flex-col items-start h-auto py-3.5 text-left"
              >
                <div className="flex items-center gap-2 text-amber-600 font-semibold">
                  <Sun className="h-4 w-4" /> Sinar (+12)
                </div>
                <span className="text-[11px] font-normal text-brand-brown">
                  Hangatkan bunga mekar
                </span>
              </Button>

              <Button
                variant="outline"
                loading={busyAction === "fertilize"}
                onClick={() => handleCare("fertilize")}
                className="flex-col items-start h-auto py-3.5 text-left"
              >
                <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <Sparkles className="h-4 w-4" /> Pupuk (+25)
                </div>
                <span className="text-[11px] font-normal text-brand-brown">
                  Nutrisi pertumbuhan cepat
                </span>
              </Button>

              <Button
                variant="primary"
                loading={busyAction === "love_talk"}
                onClick={() => handleCare("love_talk")}
                className="flex-col items-start h-auto py-3.5 text-left"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Heart className="h-4 w-4" fill="currentColor" /> Bisikan (+18)
                </div>
                <span className="text-[11px] font-normal text-white/90">
                  Kirim energi cinta
                </span>
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Flower2 className="h-4 w-4 text-brand-roseDark" />
              <h3 className="text-sm font-bold text-brand-dark">Statistik Taman Cinta</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-brand-cream p-3">
                <p className="text-xl font-bold text-brand-roseDark">{garden.flowers_bloomed}</p>
                <p className="text-[11px] text-brand-brown">Bunga Mekar</p>
              </div>
              <div className="rounded-2xl bg-brand-cream p-3">
                <p className="text-xl font-bold text-sky-600">{garden.water_count}</p>
                <p className="text-[11px] text-brand-brown">Kali Disiram</p>
              </div>
              <div className="rounded-2xl bg-brand-cream p-3">
                <p className="text-xl font-bold text-amber-600">{garden.sunlight_count}</p>
                <p className="text-[11px] text-brand-brown">Sinar Matahari</p>
              </div>
              <div className="rounded-2xl bg-brand-cream p-3">
                <p className="text-xl font-bold text-emerald-600">{garden.fertilizer_count}</p>
                <p className="text-[11px] text-brand-brown">Pupuk Cinta</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
