import Link from "next/link";
import { Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center romantic-bg">
      <div className="glass-card max-w-md rounded-3xl p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pink/50 text-brand-roseDark">
          <Heart className="h-7 w-7" fill="currentColor" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand-dark">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-brand-brown">
          Halaman yang kamu cari tidak tersedia di ruang pasangan ini.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-rose to-brand-roseDark px-6 py-2.5 text-sm font-semibold text-white shadow-romantic hover:brightness-105 transition"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
