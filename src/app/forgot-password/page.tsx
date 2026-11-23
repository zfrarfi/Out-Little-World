"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, KeyRound, ShieldCheck } from "lucide-react";
import {
  requestPasswordResetAction,
  resetPasswordWithTokenAction,
} from "@/services/auth.actions";
import { Button, Card, Input } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [step, setStep] = useState<"request" | "reset">(
    searchParams.get("token") ? "reset" : "request"
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await requestPasswordResetAction(email);
      if (!res.success || !res.data?.resetToken) {
        setErrorMsg(res.error ?? "Gagal membuat token reset.");
        return;
      }
      setToken(res.data.resetToken);
      setStep("reset");
      showToast({
        type: "success",
        title: "Token reset password dibuat!",
        description: "Silakan masukkan password baru kamu di bawah ini.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordWithTokenAction({ token, newPassword });
      if (!res.success) {
        setErrorMsg(res.error ?? "Gagal mereset password.");
        return;
      }
      showToast({ type: "success", title: "Password berhasil direset! Silakan masuk kembali." });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  if (step === "reset") {
    return (
      <Card>
        <div className="flex items-center gap-2 text-brand-roseDark mb-1">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="text-lg font-bold text-brand-dark">Atur Password Baru</h2>
        </div>
        <p className="text-xs text-brand-brown">
          Token reset sekali pakai telah dibuat dan tersimpan aman (ter-hash) di MySQL.
        </p>

        <form onSubmit={handleResetSubmit} className="mt-4 space-y-4">
          <Input
            label="Token Reset"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Input
            label="Password Baru"
            type="password"
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errorMsg && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMsg}</p>
          )}
          <Button type="submit" loading={loading} className="w-full">
            Simpan Password Baru
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-bold text-brand-dark">Lupa Password</h2>
      <p className="mt-1 text-xs text-brand-brown">
        Masukkan email akunmu yang terdaftar di database MySQL untuk membuat token reset password.
      </p>
      <form onSubmit={handleRequestReset} className="mt-4 space-y-4">
        <Input
          label="Email Akun"
          type="email"
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errorMsg && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMsg}</p>
        )}
        <Button type="submit" loading={loading} className="w-full">
          <KeyRound className="h-4 w-4" />
          Buat Token Reset Password
        </Button>
      </form>
      <div className="mt-5 text-center text-xs text-brand-brown">
        Ingat password?{" "}
        <Link href="/login" className="font-semibold text-brand-roseDark hover:underline">
          Kembali masuk
        </Link>
      </div>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 romantic-bg">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-roseDark text-white shadow-romantic">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-brand-dark">Our Little World</span>
          </Link>
        </div>
        <Suspense fallback={<Card>Memuat...</Card>}>
          <ForgotPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
