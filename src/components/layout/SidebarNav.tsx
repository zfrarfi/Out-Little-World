"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Calendar,
  Camera,
  CheckSquare,
  Flower2,
  GitCommitVertical,
  Heart,
  HeartHandshake,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  Menu,
  MessageCircleHeart,
  Music,
  Settings,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { signOutAction } from "@/services/auth.actions";
import { Avatar } from "@/components/ui/Primitives";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { CoupleWorkspaceContext } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/memories", label: "Memories", icon: Camera },
  { href: "/letters", label: "Love Letters", icon: Mail },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/check-in", label: "Daily Check-in", icon: Smile },
  { href: "/garden", label: "Love Garden", icon: Flower2 },
  { href: "/bucket-list", label: "Bucket List", icon: CheckSquare },
  { href: "/quiz", label: "Couple Quiz", icon: HelpCircle },
  { href: "/playlist", label: "Our Playlist", icon: Music },
  { href: "/love-jar", label: "Jar of Love", icon: Sparkles },
  { href: "/chat", label: "Private Chat", icon: MessageCircleHeart },
  { href: "/timeline", label: "Relationship Timeline", icon: GitCommitVertical },
  { href: "/virtual-hug", label: "Virtual Hug", icon: HeartHandshake },
  { href: "/ai-assistant", label: "AI Love Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({
  workspace,
  children,
}: {
  workspace: CoupleWorkspaceContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userDisplayName = workspace.profile.nickname || workspace.profile.full_name || "Kamu";

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand + Couple Space header */}
      <div className="border-b border-brand-pink/35 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink via-brand-rose to-brand-roseDark text-white shadow-romantic">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-dark">
              {workspace.coupleSpace.name}
            </p>
            <p className="truncate text-[11px] text-brand-brown">
              {userDisplayName} &amp; {workspace.partner.nickname}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-brand-pink/75 to-brand-rose/45 text-brand-dark shadow-soft"
                  : "text-brand-brown hover:bg-brand-pink/25 hover:text-brand-dark"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-brand-roseDark" : "text-brand-brown/80"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom user card */}
      <div className="border-t border-brand-pink/35 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-cream/90 p-2.5">
          <Avatar src={workspace.userAvatarUrl} name={userDisplayName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-dark">{userDisplayName}</p>
            <p className="truncate text-[11px] text-brand-brown">
              {workspace.partner.isConnected ? "Terhubung berdua" : "Menunggu pasangan"}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Keluar"
              className="rounded-xl p-2 text-brand-brown hover:bg-brand-pink/35 hover:text-brand-dark transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r border-brand-pink/35 bg-white/85 backdrop-blur-xl">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-brand-dark/35 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative z-10 flex h-full w-72 flex-col bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-xl p-1.5 text-brand-brown hover:bg-brand-pink/30"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
              {navContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 xl:pl-72 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-brand-pink/30 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-rose/30 bg-white text-brand-dark lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-dark sm:text-base">
                {workspace.coupleSpace.name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-brand-brown">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    workspace.partner.isConnected ? "bg-emerald-400" : "bg-amber-400"
                  )}
                />
                <span className="truncate">
                  {workspace.partner.isConnected
                    ? `Terhubung dengan ${workspace.partner.nickname}`
                    : "Bagikan kode undangan di Settings agar pasangan bergabung"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell
              userId={workspace.userId}
              initialNotifications={workspace.unreadNotifications}
            />
            <Link
              href="/settings"
              className="hidden sm:flex items-center gap-2 rounded-2xl border border-brand-rose/30 bg-white/85 py-1 pl-1.5 pr-3 transition hover:bg-brand-pink/25"
            >
              <Avatar src={workspace.userAvatarUrl} name={userDisplayName} size="sm" />
              <span className="text-xs font-semibold text-brand-dark">{userDisplayName}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
