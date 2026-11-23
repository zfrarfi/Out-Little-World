"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Heart,
  KeyRound,
  Palette,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  completeOnboardingAction,
  joinCoupleByCodeAction,
} from "@/services/auth.actions";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  FileUploadField,
  Input,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { THEME_PRESETS } from "@/lib/utils/themes";
import type {
  AnimationStyleOption,
  CoupleInvitationRow,
  CoupleSpaceRow,
  FontFamilyOption,
  GenderOption,
  ProfileRow,
  RelationshipSettingsRow,
  ThemePreset,
} from "@/types/database";

const STEPS = [
  { id: 1, title: "Your Profile", subtitle: "Identitas dirimu", icon: User },
  { id: 2, title: "Your Partner", subtitle: "Info pasangan (opsional)", icon: Users },
  { id: 3, title: "Our Relationship", subtitle: "Tanggal & cerita kalian", icon: Heart },
  { id: 4, title: "Personalization", subtitle: "Tema & suasana ruang", icon: Palette },
] as const;

export function OnboardingWizard({
  userId,
  initialProfile,
  initialSpace,
  initialSettings,
  initialInvite,
  initialInviteCodeFromUrl,
  isAlreadyInCouple,
}: {
  userId: string;
  initialProfile: ProfileRow | null;
  initialSpace: CoupleSpaceRow | null;
  initialSettings: RelationshipSettingsRow | null;
  initialInvite: CoupleInvitationRow | null;
  initialInviteCodeFromUrl: string;
  isAlreadyInCouple: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { uploadFile, isUploading } = useStorageUpload();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinedSpace, setJoinedSpace] = useState(isAlreadyInCouple);
  const [inviteCodeInput, setInviteCodeInput] = useState(initialInviteCodeFromUrl);
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(
    initialInvite?.invite_code ?? null
  );
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1 — Your Profile
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [avatarPath, setAvatarPath] = useState<string | null>(initialProfile?.avatar_path ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState(initialProfile?.birth_date ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [gender, setGender] = useState<GenderOption | "">(initialProfile?.gender ?? "");

  // Step 2 — Partner (optional!)
  const [partnerName, setPartnerName] = useState(
    initialSettings?.partner_placeholder_name ?? ""
  );
  const [partnerNickname, setPartnerNickname] = useState(
    initialSettings?.partner_placeholder_nickname ?? ""
  );
  const [partnerAvatarPath, setPartnerAvatarPath] = useState<string | null>(
    initialSettings?.partner_placeholder_avatar_path ?? null
  );
  const [partnerAvatarPreview, setPartnerAvatarPreview] = useState<string | null>(null);
  const [partnerBirthDate, setPartnerBirthDate] = useState(
    initialSettings?.partner_placeholder_birth_date ?? ""
  );
  const [partnerBio, setPartnerBio] = useState(initialSettings?.partner_placeholder_bio ?? "");

  // Step 3 — Relationship
  const [firstMetOnlineDate, setFirstMetOnlineDate] = useState(
    initialSettings?.first_met_online_date ?? ""
  );
  const [firstMetInPersonDate, setFirstMetInPersonDate] = useState(
    initialSettings?.first_met_in_person_date ?? ""
  );
  const [anniversaryDate, setAnniversaryDate] = useState(
    initialSettings?.anniversary_date ?? ""
  );
  const [firstMeetingPlace, setFirstMeetingPlace] = useState(
    initialSettings?.first_meeting_place ?? ""
  );
  const [originStory, setOriginStory] = useState(initialSettings?.origin_story ?? "");
  const [firstPhotoPath, setFirstPhotoPath] = useState<string | null>(
    initialSettings?.first_photo_path ?? null
  );
  const [firstPhotoPreview, setFirstPhotoPreview] = useState<string | null>(null);
  const [mainPhotoPath, setMainPhotoPath] = useState<string | null>(
    initialSettings?.main_photo_path ?? null
  );
  const [mainPhotoPreview, setMainPhotoPreview] = useState<string | null>(null);

  // Step 4 — Personalization
  const [coupleSpaceName, setCoupleSpaceName] = useState(
    initialSpace?.name ?? "Our Little World"
  );
  const [themePreset, setThemePreset] = useState<ThemePreset>(
    initialSettings?.theme_preset ?? "soft-pink"
  );
  const [fontFamily, setFontFamily] = useState<FontFamilyOption>(
    initialSettings?.font_family ?? "poppins"
  );
  const [animationStyle, setAnimationStyle] = useState<AnimationStyleOption>(
    initialSettings?.animation_style ?? "gentle"
  );
  const [dashboardBannerPath, setDashboardBannerPath] = useState<string | null>(
    initialSettings?.dashboard_banner_path ?? null
  );
  const [dashboardBannerPreview, setDashboardBannerPreview] = useState<string | null>(null);
  const [romanticMessage, setRomanticMessage] = useState(
    initialSettings?.romantic_message ?? ""
  );

  async function handleJoinByCode() {
    if (!inviteCodeInput.trim()) return;
    setJoining(true);
    try {
      const res = await joinCoupleByCodeAction(inviteCodeInput);
      if (!res.success) {
        showToast({ type: "error", title: "Gagal bergabung", description: res.error });
        return;
      }
      setJoinedSpace(true);
      showToast({
        type: "success",
        title: "Berhasil terhubung ke Couple Space pasangan!",
        description: "Sekarang lengkapi profilmu untuk masuk ke dashboard.",
      });
      router.refresh();
    } finally {
      setJoining(false);
    }
  }

  async function handleUploadImage(
    file: File,
    onDone: (path: string, url: string | null) => void
  ) {
    const res = await uploadFile("profile-photos", userId, file);
    if (!res) {
      showToast({ type: "error", title: "Upload foto gagal", description: "Periksa format/ukuran file (maks 5 MB)." });
      return;
    }
    onDone(res.path, res.signedUrl);
    showToast({ type: "success", title: "Foto berhasil diunggah" });
  }

  function handleNextStep() {
    if (step === 1 && (!fullName.trim() || !nickname.trim())) {
      showToast({
        type: "error",
        title: "Lengkapi Step 1",
        description: "Nama lengkap dan nama panggilan wajib diisi.",
      });
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  async function handleComplete() {
    if (!coupleSpaceName.trim()) {
      showToast({ type: "error", title: "Nama ruang pasangan wajib diisi." });
      return;
    }
    setSaving(true);
    try {
      const res = await completeOnboardingAction({
        fullName,
        nickname,
        avatarPath,
        birthDate,
        bio,
        gender: gender || null,
        partnerName,
        partnerNickname,
        partnerAvatarPath,
        partnerBirthDate,
        partnerBio,
        firstMetOnlineDate,
        firstMetInPersonDate,
        anniversaryDate,
        firstMeetingPlace,
        originStory,
        firstPhotoPath,
        mainPhotoPath,
        coupleSpaceName,
        themePreset,
        fontFamily,
        animationStyle,
        dashboardBannerPath,
        romanticMessage,
      });

      if (!res.success) {
        showToast({ type: "error", title: "Gagal menyimpan setup", description: res.error });
        return;
      }

      if (res.data?.inviteCode) {
        setGeneratedInviteCode(res.data.inviteCode);
      }

      showToast({
        type: "success",
        title: "Ruang Pasangan Siap!",
        description: "Semua informasi profil dan personalisasi telah disimpan ke database.",
      });
      setCompleted(true);
    } finally {
      setSaving(false);
    }
  }

  async function copyInviteCode() {
    if (!generatedInviteCode) return;
    await navigator.clipboard.writeText(generatedInviteCode);
    setCopied(true);
    showToast({ type: "info", title: "Kode undangan disalin!" });
    setTimeout(() => setCopied(false), 2000);
  }

  if (completed) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-pink to-brand-roseDark text-white shadow-romantic">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-brand-dark">
          Selamat Datang di {coupleSpaceName}!
        </h2>
        <p className="mt-2 text-sm text-brand-brown leading-relaxed">
          Profil dinamis dan pengaturan hubunganmu sudah tersimpan aman di database.
        </p>

        {generatedInviteCode && !joinedSpace && (
          <div className="mt-6 rounded-3xl border border-brand-rose/40 bg-brand-cream p-5 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-roseDark">
                Kode Undangan Untuk Pasanganmu
              </span>
              <Badge variant="pink">Berlaku 72 jam &bull; 1x pakai</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 border border-brand-pink/50">
              <code className="text-xl font-bold tracking-widest text-brand-dark">
                {generatedInviteCode}
              </code>
              <Button variant="secondary" size="sm" onClick={copyInviteCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <p className="mt-2.5 text-xs text-brand-brown">
              Bagikan kode ini ke pasanganmu agar dia bisa mendaftar dan terhubung otomatis ke
              ruang pasangan kalian (maksimal 2 akun).
            </p>
          </div>
        )}

        <div className="mt-7">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            Masuk ke Dashboard Kami
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Partner Join Banner */}
      {!joinedSpace && (
        <Card className="border-brand-rose/45 bg-gradient-to-r from-white/95 to-brand-pink/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-roseDark">
                <KeyRound className="h-4 w-4" />
                Sudah Punya Kode Undangan Dari Pasangan?
              </div>
              <Input
                placeholder="Masukkan kode undangan (misal: OLW-XXXXXXXX)"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              loading={joining}
              onClick={handleJoinByCode}
              disabled={!inviteCodeInput.trim()}
            >
              Gabung Ruang Pasangan
            </Button>
          </div>
        </Card>
      )}

      {/* Stepper */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => s.id < step && setStep(s.id)}
              className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
                active
                  ? "border-brand-roseDark bg-white shadow-romantic"
                  : done
                  ? "border-brand-pink/60 bg-brand-pink/25"
                  : "border-brand-pink/30 bg-white/60 opacity-75"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active || done
                    ? "bg-gradient-to-br from-brand-rose to-brand-roseDark text-white"
                    : "bg-brand-pink/35 text-brand-brown"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-brand-dark">Step {s.id}</p>
                <p className="truncate text-[11px] text-brand-brown">{s.title}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Card */}
      <Card>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {step === 1 && (
              <>
                <div>
                  <Badge variant="pink">Step 1 — Your Profile</Badge>
                  <h2 className="mt-2 text-xl font-bold text-brand-dark">Kenalkan Dirimu</h2>
                  <p className="text-xs text-brand-brown">
                    Data ini akan tampil pada profil dan aktivitasmu di ruang pasangan.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nama Lengkap *"
                    required
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="Nama Panggilan *"
                    required
                    placeholder="Panggilan sayang / sehari-hari"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <Input
                    label="Tanggal Lahir (Opsional)"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                  <Select
                    label="Jenis Kelamin (Opsional)"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderOption | "")}
                  >
                    <option value="">Pilih (opsional)</option>
                    <option value="female">Perempuan</option>
                    <option value="male">Laki-laki</option>
                    <option value="non_binary">Non-biner</option>
                    <option value="prefer_not_to_say">Memilih tidak menyebutkan</option>
                  </Select>
                </div>

                <FileUploadField
                  label="Foto Profil (Opsional)"
                  accept="image/*"
                  previewUrl={avatarPreview}
                  isUploading={isUploading}
                  helperText="JPG, PNG, WEBP maksimal 5 MB"
                  onFileSelected={(file) =>
                    handleUploadImage(file, (path, url) => {
                      setAvatarPath(path);
                      setAvatarPreview(url);
                    })
                  }
                />

                <Textarea
                  label="Bio Singkat (Opsional)"
                  rows={3}
                  placeholder="Ceritakan sedikit tentang dirimu..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Badge variant="pink">Step 2 — Your Partner (Opsional)</Badge>
                  <h2 className="mt-2 text-xl font-bold text-brand-dark">Profil Pasanganmu</h2>
                  <p className="text-xs text-brand-brown">
                    Seluruh kolom di langkah ini <strong>tidak wajib diisi</strong>. Pasanganmu
                    dapat melengkapi dan memperbarui profilnya sendiri setelah bergabung dengan kode
                    undangan.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nama Pasangan (Opsional)"
                    placeholder="Nama pasangan"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                  <Input
                    label="Nama Panggilan Pasangan (Opsional)"
                    placeholder="Panggilan untuk pasangan"
                    value={partnerNickname}
                    onChange={(e) => setPartnerNickname(e.target.value)}
                  />
                  <Input
                    label="Tanggal Lahir Pasangan (Opsional)"
                    type="date"
                    value={partnerBirthDate}
                    onChange={(e) => setPartnerBirthDate(e.target.value)}
                  />
                </div>

                <FileUploadField
                  label="Foto Profil Pasangan Sementara (Opsional)"
                  accept="image/*"
                  previewUrl={partnerAvatarPreview}
                  isUploading={isUploading}
                  helperText="Otomatis terganti saat pasangan mengunggah fotonya sendiri"
                  onFileSelected={(file) =>
                    handleUploadImage(file, (path, url) => {
                      setPartnerAvatarPath(path);
                      setPartnerAvatarPreview(url);
                    })
                  }
                />

                <Textarea
                  label="Catatan / Bio Pasangan (Opsional)"
                  rows={3}
                  placeholder="Hal manis tentang pasanganmu..."
                  value={partnerBio}
                  onChange={(e) => setPartnerBio(e.target.value)}
                />
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Badge variant="pink">Step 3 — Our Relationship</Badge>
                  <h2 className="mt-2 text-xl font-bold text-brand-dark">Cerita Awal Hubungan</h2>
                  <p className="text-xs text-brand-brown">
                    Tanggal mulai pacaran akan digunakan secara otomatis untuk menghitung lama
                    hubungan, total hari bersama, dan countdown anniversary.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Tanggal Pertama Kenal"
                    type="date"
                    value={firstMetOnlineDate}
                    onChange={(e) => setFirstMetOnlineDate(e.target.value)}
                  />
                  <Input
                    label="Tanggal Pertama Bertemu"
                    type="date"
                    value={firstMetInPersonDate}
                    onChange={(e) => setFirstMetInPersonDate(e.target.value)}
                  />
                  <Input
                    label="Tanggal Mulai Pacaran"
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                  />
                </div>

                <Input
                  label="Tempat Pertama Bertemu"
                  placeholder="Misal: Kafe dekat kampus, taman kota, dll."
                  value={firstMeetingPlace}
                  onChange={(e) => setFirstMeetingPlace(e.target.value)}
                />

                <Textarea
                  label="Cerita Awal Hubungan"
                  rows={3}
                  placeholder="Bagaimana kalian pertama kali bertemu dan mulai dekat?"
                  value={originStory}
                  onChange={(e) => setOriginStory(e.target.value)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FileUploadField
                    label="Foto Pertama Bersama (Opsional)"
                    accept="image/*"
                    previewUrl={firstPhotoPreview}
                    isUploading={isUploading}
                    onFileSelected={(file) =>
                      handleUploadImage(file, (path, url) => {
                        setFirstPhotoPath(path);
                        setFirstPhotoPreview(url);
                      })
                    }
                  />
                  <FileUploadField
                    label="Foto Utama Pasangan (Opsional)"
                    accept="image/*"
                    previewUrl={mainPhotoPreview}
                    isUploading={isUploading}
                    onFileSelected={(file) =>
                      handleUploadImage(file, (path, url) => {
                        setMainPhotoPath(path);
                        setMainPhotoPreview(url);
                      })
                    }
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <Badge variant="pink">Step 4 — Personalization</Badge>
                  <h2 className="mt-2 text-xl font-bold text-brand-dark">Personalisasi Ruang</h2>
                  <p className="text-xs text-brand-brown">
                    Sesuaikan nama ruang, palet warna, font, animasi, dan pesan romantis dashboard.
                  </p>
                </div>

                <Input
                  label="Nama Ruang Pasangan *"
                  required
                  placeholder="Misal: Our Little World, Rumah Cerita Kita..."
                  value={coupleSpaceName}
                  onChange={(e) => setCoupleSpaceName(e.target.value)}
                />

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-brown">
                    Tema Warna
                  </span>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {Object.values(THEME_PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setThemePreset(preset.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          themePreset === preset.id
                            ? "border-brand-roseDark bg-brand-pink/20 shadow-soft"
                            : "border-brand-pink/35 bg-white hover:bg-brand-cream"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {preset.previewSwatches.map((hex) => (
                            <span
                              key={hex}
                              style={{ backgroundColor: hex }}
                              className="h-5 w-5 rounded-full border border-black/10"
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-xs font-semibold text-brand-dark">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Font Website"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamilyOption)}
                  >
                    <option value="poppins">Poppins (Modern &amp; Elegan)</option>
                    <option value="nunito">Nunito (Lembut &amp; Hangat)</option>
                  </Select>
                  <Select
                    label="Gaya Animasi"
                    value={animationStyle}
                    onChange={(e) => setAnimationStyle(e.target.value as AnimationStyleOption)}
                  >
                    <option value="gentle">Gentle (Floating Hearts Halus)</option>
                    <option value="playful">Playful (Lebih Hidup)</option>
                    <option value="minimal">Minimal (Tanpa Floating Hearts)</option>
                  </Select>
                </div>

                <FileUploadField
                  label="Foto Banner Dashboard (Opsional)"
                  accept="image/*"
                  previewUrl={dashboardBannerPreview}
                  isUploading={isUploading}
                  onFileSelected={(file) =>
                    handleUploadImage(file, (path, url) => {
                      setDashboardBannerPath(path);
                      setDashboardBannerPreview(url);
                    })
                  }
                />

                <Textarea
                  label="Pesan Romantis Dashboard (Opsional)"
                  rows={2}
                  placeholder="Tulis kalimat manis yang ingin selalu muncul di halaman utama..."
                  value={romanticMessage}
                  onChange={(e) => setRomanticMessage(e.target.value)}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-brand-pink/35 pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
          >
            <ArrowLeft className="h-4 w-4" />
            Sebelumnya
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={handleNextStep}>
              {step === 2 ? "Lanjut / Lewati" : "Langkah Berikutnya"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" loading={saving} onClick={handleComplete}>
              <Check className="h-4 w-4" />
              Selesaikan Setup
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
