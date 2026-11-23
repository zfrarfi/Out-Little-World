import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Calendar,
  Camera,
  CheckSquare,
  Database,
  Flower2,
  GitCommitVertical,
  Heart,
  HeartHandshake,
  HelpCircle,
  Lock,
  Mail,
  MessageCircleHeart,
  Music,
  ShieldCheck,
  Smile,
  Sparkles,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/cookie";
import { checkMysqlHealth } from "@/lib/db/mysql";
import { FloatingHearts } from "@/components/animations/FloatingHearts";

export const dynamic = "force-dynamic";

const FEATURE_SHOWCASE = [
  { icon: Camera, title: "Our Memories", desc: "Galeri foto & video scrapbook privat dengan album & lightbox." },
  { icon: Mail, title: "Love Letters", desc: "Kirim surat cinta, amplop animasi, hingga surat rahasia terjadwal." },
  { icon: Calendar, title: "Our Calendar", desc: "Anniversary, ulang tahun, jadwal kencan, dan pengingat momen." },
  { icon: Smile, title: "Daily Check-in", desc: "Bagikan mood harian, tingkat kebahagiaan, cerita, & grafik mood." },
  { icon: Flower2, title: "Virtual Love Garden", desc: "Rawat pohon hubungan bersama hingga bunga bermekaran." },
  { icon: CheckSquare, title: "Our Bucket List", desc: "Daftar impian berdua lengkap dengan foto pencapaian & progress." },
  { icon: HelpCircle, title: "Couple Quiz", desc: "Tebak jawaban pasangan, buat soal sendiri, skor & statistik kecocokan." },
  { icon: Music, title: "Our Playlist", desc: "Simpan lagu kenangan dengan embed resmi Spotify & YouTube." },
  { icon: Sparkles, title: "Jar of Love", desc: "Toples digital berisi pesan penyemangat, rindu, dan romantis acak." },
  { icon: MessageCircleHeart, title: "Private Chat Realtime", desc: "Chat pribadi khusus berdua lengkap gambar, typing indicator & read receipt." },
  { icon: GitCommitVertical, title: "Relationship Timeline", desc: "Jejak perjalanan hubungan dari pertama kenal hingga hari ini." },
  { icon: HeartHandshake, title: "Virtual Hug", desc: "Kirim pelukan virtual beranimasi beserta pesan hangat realtime." },
  { icon: Bot, title: "AI Love Assistant", desc: "Asisten hubungan berbahasa Indonesia untuk surat, ide kencan & komunikasi sehat." },
  { icon: ShieldCheck, title: "Privasi & Isolasi Ketat", desc: "Setiap pasangan memiliki ruang pribadi terisolasi maksimal 2 akun di MySQL XAMPP." },
];

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  const dbHealth = await checkMysqlHealth();

  return (
    <div className="relative min-h-screen overflow-hidden romantic-bg">
      <FloatingHearts style="gentle" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <header className="glass-card flex items-center justify-between rounded-3xl px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink via-brand-rose to-brand-roseDark text-white shadow-romantic">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <div>
              <span className="block text-base font-bold text-brand-dark">Our Little World</span>
              <span className="block text-[11px] text-brand-brown">
                Private Couple Platform &bull; XAMPP MySQL
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-2xl px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-pink/30 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-gradient-to-r from-brand-rose to-brand-roseDark px-4 py-2 text-sm font-medium text-white shadow-romantic hover:brightness-105 transition"
            >
              Buat Ruang Berdua
            </Link>
          </div>
        </header>

        {/* Live XAMPP MySQL Status Banner */}
        {!dbHealth.connected ? (
          <div className="mt-6 rounded-3xl border border-amber-300 bg-amber-50/90 p-5 shadow-soft">
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-900">
                  MySQL XAMPP Belum Aktif atau Database Belum Di-import
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  Buka <strong>XAMPP Control Panel</strong>, klik <strong>Start</strong> pada{" "}
                  <strong>MySQL</strong> (dan Apache untuk membuka phpMyAdmin), lalu jalankan{" "}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">
                    npm run db:init
                  </code>{" "}
                  atau import{" "}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">
                    database/our_little_world_mysql.sql
                  </code>{" "}
                  di phpMyAdmin.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/85 px-5 py-3 text-xs text-emerald-800 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Terhubung ke <strong>MySQL XAMPP</strong> (database{" "}
              <code className="font-semibold">{dbHealth.database}</code> &bull; {dbHealth.tableCount}{" "}
              tabel siap digunakan).
            </span>
          </div>
        )}

        <section className="py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-rose/35 bg-white/80 px-4 py-1.5 text-xs font-semibold text-brand-roseDark shadow-soft">
            <Lock className="h-3.5 w-3.5" />
            Ruang Digital Pribadi Khusus Untuk Dua Orang
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl lg:text-6xl leading-[1.15]">
            Simpan Setiap Cerita Kecil Dalam{" "}
            <span className="bg-gradient-to-r from-brand-roseDark via-brand-rose to-pink-400 bg-clip-text text-transparent">
              Dunia Milik Berdua
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-brand-brown sm:text-lg leading-relaxed">
            Satu rumah digital romantis yang dinamis untuk pasangan mana pun. Atur profil kalian
            sendiri, hubungkan dua akun dengan kode undangan aman, dan abadikan kenangan, surat
            cinta, chat realtime, hingga taman cinta bersama langsung di database MySQL XAMPP.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-rose to-brand-roseDark px-7 py-3.5 text-sm font-semibold text-white shadow-romantic hover:brightness-105 transition"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
              Mulai Buat Couple Space
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-rose/45 bg-white/85 px-7 py-3.5 text-sm font-semibold text-brand-dark hover:bg-brand-pink/25 transition"
            >
              Sudah Punya Akun / Kode Undangan
            </Link>
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
              15 Fitur Lengkap Dalam Satu Ruang Pasangan
            </h2>
            <p className="mt-2 text-sm text-brand-brown">
              Semua data tersimpan permanen di MySQL (XAMPP / phpMyAdmin) dengan isolasi data per
              pasangan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_SHOWCASE.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="glass-card rounded-3xl p-5 transition duration-200 hover:-translate-y-1 hover:shadow-romantic"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-pink/45 text-brand-roseDark">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-brand-dark">{feat.title}</h3>
                  <p className="mt-1.5 text-xs text-brand-brown leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-brand-pink/35 py-8 text-center text-xs text-brand-brown">
          Our Little World — Next.js App Router, TypeScript, Tailwind CSS, Framer Motion &amp;
          MySQL (XAMPP / phpMyAdmin).
        </footer>
      </div>
    </div>
  );
}
