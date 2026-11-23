"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Calendar,
  Camera,
  Check,
  CheckSquare,
  Copy,
  Flower2,
  GitCommitVertical,
  Heart,
  HeartHandshake,
  HelpCircle,
  KeyRound,
  Mail,
  MessageCircleHeart,
  Music,
  Settings,
  Smile,
  Sparkles,
} from "lucide-react";
import { generateInviteCodeAction } from "@/services/auth.actions";
import { useToast } from "@/components/ui/ToastProvider";
import { Avatar, Badge, Button, Card } from "@/components/ui/Primitives";
import {
  calculateRelationshipDuration,
  formatDateIndo,
  formatDateTimeIndo,
  getDailyRomanticGreeting,
} from "@/lib/utils/relationship";
import type { ActivityFeedItem, CoupleWorkspaceContext } from "@/types/domain";

const QUICK_FEATURES = [
  { href: "/memories", label: "Memories", desc: "Galeri foto & video", icon: Camera },
  { href: "/letters", label: "Love Letters", desc: "Surat & amplop", icon: Mail },
  { href: "/calendar", label: "Calendar", desc: "Jadwal & pengingat", icon: Calendar },
  { href: "/check-in", label: "Daily Check-in", desc: "Mood & cerita harian", icon: Smile },
  { href: "/garden", label: "Love Garden", desc: "Rawat pohon cinta", icon: Flower2 },
  { href: "/bucket-list", label: "Bucket List", desc: "Impian bersama", icon: CheckSquare },
  { href: "/quiz", label: "Couple Quiz", desc: "Uji kecocokan", icon: HelpCircle },
  { href: "/playlist", label: "Our Playlist", desc: "Lagu kenangan", icon: Music },
  { href: "/love-jar", label: "Jar of Love", desc: "Pesan acak toples", icon: Sparkles },
  { href: "/chat", label: "Private Chat", desc: "Obrolan realtime", icon: MessageCircleHeart },
  { href: "/timeline", label: "Timeline", desc: "Jejak perjalanan", icon: GitCommitVertical },
  { href: "/virtual-hug", label: "Virtual Hug", desc: "Kirim pelukan", icon: HeartHandshake },
  { href: "/ai-assistant", label: "AI Assistant", desc: "Asisten romantis", icon: Bot },
  { href: "/settings", label: "Settings", desc: "Profil & tema", icon: Settings },
];

export function DashboardClient({
  workspace,
  stats,
  recentActivities,
}: {
  workspace: CoupleWorkspaceContext;
  stats: {
    memoriesCount: number;
    lettersCount: number;
    bucketCompleted: number;
    bucketTotal: number;
    gardenLevel: number;
    gardenPoints: number;
  };
  recentActivities: ActivityFeedItem[];
}) {
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState(workspace.activeInvitation?.invite_code ?? null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const userNickname = workspace.profile.nickname || workspace.profile.full_name || "Kamu";
  const partnerNickname = workspace.partner.nickname;
  const greeting = getDailyRomanticGreeting(
    userNickname,
    partnerNickname,
    workspace.settings.romantic_message
  );
  const duration = calculateRelationshipDuration(workspace.settings.anniversary_date);

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const res = await generateInviteCodeAction(72);
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal membuat kode", description: res.error });
        return;
      }
      setInviteCode(res.data.inviteCode);
      showToast({ type: "success", title: "Kode undangan baru dibuat!" });
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleCopyInvite() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    showToast({ type: "info", title: "Kode undangan disalin" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-brand-pink/45 bg-gradient-to-br from-white via-brand-cream to-brand-pink/35 p-6 sm:p-8 shadow-romantic"
      >
        {workspace.dashboardBannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={workspace.dashboardBannerUrl}
            alt="Dashboard Banner"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15"
          />
        )}

        <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-4">
            <Badge variant="pink">
              <Sparkles className="h-3.5 w-3.5" />
              Sapaan Romantis Hari Ini
            </Badge>

            <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl lg:text-4xl">
              {greeting.headline}
            </h1>
            <p className="max-w-xl text-sm text-brand-brown leading-relaxed sm:text-base">
              {greeting.subtext}
            </p>

            {/* Couple Avatars */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2.5 shadow-soft border border-brand-pink/30">
                <Avatar src={workspace.userAvatarUrl} name={userNickname} size="md" />
                <div>
                  <p className="text-xs font-bold text-brand-dark">{userNickname}</p>
                  <p className="text-[11px] text-brand-brown">{workspace.profile.full_name}</p>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-roseDark text-white shadow-romantic animate-heartbeat">
                <Heart className="h-5 w-5" fill="currentColor" />
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2.5 shadow-soft border border-brand-pink/30">
                <Avatar src={workspace.partner.avatarUrl} name={partnerNickname} size="md" />
                <div>
                  <p className="text-xs font-bold text-brand-dark">{partnerNickname}</p>
                  <p className="text-[11px] text-brand-brown">
                    {workspace.partner.isConnected ? workspace.partner.fullName : "Menunggu bergabung"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Couple Photo */}
          <div className="lg:col-span-5">
            {workspace.mainPhotoUrl ? (
              <div className="polaroid-card overflow-hidden rounded-3xl p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workspace.mainPhotoUrl}
                  alt="Foto Utama Pasangan"
                  className="h-56 w-full rounded-2xl object-cover sm:h-64"
                />
                <p className="mt-2.5 text-center text-xs font-medium text-brand-brown">
                  {workspace.coupleSpace.name}
                </p>
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-rose/45 bg-white/70 p-6 text-center">
                <Camera className="h-8 w-8 text-brand-rose" />
                <p className="mt-2 text-sm font-semibold text-brand-dark">Foto Utama Pasangan</p>
                <p className="mt-1 text-xs text-brand-brown">
                  Tambahkan foto utama kalian di halaman Settings.
                </p>
                <Link href="/settings" className="mt-3">
                  <Button variant="secondary" size="sm">
                    Unggah Foto
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Connect Partner Callout if partner hasn't joined yet */}
      {!workspace.partner.isConnected && (
        <Card className="border-brand-rose/45 bg-gradient-to-r from-brand-pink/25 via-white to-brand-cream">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                <KeyRound className="h-4 w-4 text-brand-roseDark" />
                Undang Pasanganmu Ke Ruang Ini
              </div>
              <p className="text-xs text-brand-brown">
                Pasanganmu belum terhubung. Bagikan kode undangan unik agar kedua akun terhubung
                secara realtime.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {inviteCode ? (
                <>
                  <code className="rounded-2xl border border-brand-rose/40 bg-white px-4 py-2 text-sm font-bold tracking-widest text-brand-dark">
                    {inviteCode}
                  </code>
                  <Button variant="secondary" size="sm" onClick={handleCopyInvite}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Tersalin" : "Salin"}
                  </Button>
                </>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                loading={generatingInvite}
                onClick={handleGenerateInvite}
              >
                {inviteCode ? "Buat Kode Baru" : "Buat Kode Undangan"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Relationship Duration & Countdown Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
            Lama Hubungan
          </p>
          {duration ? (
            <>
              <p className="mt-2 text-2xl font-bold text-brand-dark">
                {duration.years} Thn {duration.months} Bln {duration.days} Hr
              </p>
              <p className="mt-1 text-xs text-brand-brown">
                Sejak {formatDateIndo(workspace.settings.anniversary_date)}
              </p>
            </>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-brand-brown">Tanggal jadian belum diatur</p>
              <Link href="/settings" className="text-xs font-semibold text-brand-roseDark hover:underline">
                Atur di Settings &rarr;
              </Link>
            </div>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
            Total Hari Bersama
          </p>
          <p className="mt-2 text-3xl font-bold text-brand-roseDark">
            {duration ? duration.totalDays.toLocaleString("id-ID") : "—"}
          </p>
          <p className="mt-1 text-xs text-brand-brown">Hari penuh cerita berdua</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
            Countdown Anniversary
          </p>
          {duration ? (
            <>
              <p className="mt-2 text-3xl font-bold text-brand-dark">
                {duration.isAnniversaryToday
                  ? "Hari Ini!"
                  : `${duration.daysUntilNextAnniversary} Hari`}
              </p>
              <p className="mt-1 text-xs text-brand-brown">
                Menuju Anniversary ke-{duration.nextAnniversaryNumber} (
                {formatDateIndo(duration.nextAnniversaryDate)})
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-brand-brown">Otomatis setelah isi tanggal jadian</p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
            Ringkasan Dunia Kita
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-brand-cream px-2.5 py-2">
              <span className="block font-bold text-brand-dark">{stats.memoriesCount}</span>
              <span className="text-brand-brown">Kenangan</span>
            </div>
            <div className="rounded-xl bg-brand-cream px-2.5 py-2">
              <span className="block font-bold text-brand-dark">{stats.lettersCount}</span>
              <span className="text-brand-brown">Surat</span>
            </div>
            <div className="rounded-xl bg-brand-cream px-2.5 py-2">
              <span className="block font-bold text-brand-dark">
                {stats.bucketCompleted}/{stats.bucketTotal}
              </span>
              <span className="text-brand-brown">Bucket List</span>
            </div>
            <div className="rounded-xl bg-brand-cream px-2.5 py-2">
              <span className="block font-bold text-brand-dark">Lv. {stats.gardenLevel}</span>
              <span className="text-brand-brown">Love Garden</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Lower Section: Quick Access + Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Quick Access Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-dark">Akses Cepat Semua Fitur</h2>
            <Badge variant="cream">14 Modul Aktif</Badge>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {QUICK_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <Link
                  key={feat.href}
                  href={feat.href}
                  className="glass-card group flex items-center gap-3 rounded-2xl p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-roseDark/50 hover:shadow-romantic"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink/40 text-brand-roseDark transition group-hover:scale-105 group-hover:bg-brand-rose group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-brand-dark">{feat.label}</p>
                    <p className="truncate text-[11px] text-brand-brown">{feat.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-bold text-brand-dark">Aktivitas Terbaru</h2>
          <Card className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-brand-rose" />
                <p className="mt-2 text-sm font-medium text-brand-dark">Belum ada aktivitas</p>
                <p className="mt-1 text-xs text-brand-brown">
                  Mulai unggah kenangan pertama, tulis surat cinta, atau isi daily check-in!
                </p>
              </div>
            ) : (
              recentActivities.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-brand-pink/25 bg-white/80 p-3 transition hover:bg-brand-pink/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-brand-dark">{item.title}</p>
                    <span className="shrink-0 text-[10px] text-brand-brown">
                      {formatDateTimeIndo(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-brand-brown line-clamp-2">{item.subtitle}</p>
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
