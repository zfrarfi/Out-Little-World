"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Lock, Mail } from "lucide-react";
import { signInAction } from "@/services/auth.actions";
import { Button, Card, Input } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";
import { FloatingHearts } from "@/components/animations/FloatingHearts";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await signInAction({ email, password });
      if (!res.success) {
        setErrorMsg(res.error ?? "Gagal masuk.");
        showToast({ type: "error", title: "Login gagal", description: res.error });
        return;
      }
      showToast({ type: "success", title: "Selamat datang kembali!" });
      router.push(res.data?.redirectTo || "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 romantic-bg">
      <FloatingHearts style="gentle" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-pink via-brand-rose to-brand-roseDark text-white shadow-romantic">
              <Heart className="h-7 w-7" fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-brand-dark">Our Little World</h1>
          </Link>
          <p className="mt-1 text-sm text-brand-brown">
            Masuk ke ruang pasangan pribadi kalian
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-roseDark hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <Lock className="h-4 w-4" />
              Masuk Sekarang
            </Button>
          </form>

          <div className="mt-6 border-t border-brand-pink/35 pt-4 text-center text-xs text-brand-brown">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-brand-roseDark hover:underline">
              Daftar &amp; Buat Couple Space
            </Link>
          </div>
        </Card>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-brand-brown/80">
          <Mail className="h-3.5 w-3.5" />
          Tersimpan Aman di MySQL (XAMPP / phpMyAdmin) &amp; Sesi HTTP-Only
        </p>
      </motion.div>
    </div>
  );
}
