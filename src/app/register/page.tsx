"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, KeyRound, MailCheck, UserPlus } from "lucide-react";
import { signUpAction } from "@/services/auth.actions";
import { Button, Card, Input } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";
import { FloatingHearts } from "@/components/animations/FloatingHearts";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") ?? "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await signUpAction({
        fullName,
        email,
        password,
        inviteCode: inviteCode.trim() || null,
      });

      if (!res.success) {
        setErrorMsg(res.error ?? "Registrasi gagal.");
        showToast({ type: "error", title: "Registrasi gagal", description: res.error });
        return;
      }

      if (res.data?.requiresEmailConfirmation) {
        setEmailSent(true);
        showToast({
          type: "success",
          title: "Cek email kamu!",
          description: "Klik tautan verifikasi email lalu lanjutkan onboarding.",
        });
        return;
      }

      showToast({ type: "success", title: "Akun berhasil dibuat!" });
      router.push(res.data?.redirectTo || "/onboarding");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <MailCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-brand-dark">Verifikasi Email Terkirim</h2>
        <p className="mt-2 text-sm text-brand-brown leading-relaxed">
          Kami telah mengirimkan tautan konfirmasi ke <strong>{email}</strong>. Setelah
          terverifikasi, kamu akan diarahkan ke halaman Onboarding untuk mengatur profil dan ruang
          pasangan.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Kembali ke Halaman Masuk
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          required
          placeholder="Nama lengkap kamu"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            required
            minLength={8}
            placeholder="Ulangi password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-brand-pink/50 bg-brand-cream/80 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-roseDark">
            <KeyRound className="h-3.5 w-3.5" />
            Kode Undangan Pasangan (Opsional)
          </div>
          <Input
            placeholder="Contoh: OLW-A7K9M2B4 (kosongkan jika membuat ruang baru)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            hint="Jika pasanganmu sudah membuat Couple Space, masukkan kode undangannya di sini."
          />
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <UserPlus className="h-4 w-4" />
          Daftar Sekarang
        </Button>
      </form>

      <div className="mt-6 border-t border-brand-pink/35 pt-4 text-center text-xs text-brand-brown">
        Sudah memiliki akun?{" "}
        <Link href="/login" className="font-semibold text-brand-roseDark hover:underline">
          Masuk di sini
        </Link>
      </div>
    </Card>
  );
}

export default function RegisterPage() {
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
            <h1 className="text-2xl font-bold text-brand-dark">Buat Akun Baru</h1>
          </Link>
          <p className="mt-1 text-sm text-brand-brown">
            Mulai dunia kecil pribadi kalian atau gabung dengan kode pasangan
          </p>
        </div>

        <Suspense fallback={<Card>Memuat form pendaftaran...</Card>}>
          <RegisterFormContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
