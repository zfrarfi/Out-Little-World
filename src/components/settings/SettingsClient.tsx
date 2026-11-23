"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Copy,
  Download,
  Heart,
  KeyRound,
  LogOut,
  Palette,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import {
  generateInviteCodeAction,
  signOutAction,
  updatePasswordAction,
} from "@/services/auth.actions";
import {
  updateNotificationPrivacyAction,
  updateProfileAction,
  updateRelationshipSettingsAction,
} from "@/services/settings.actions";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  FileUploadField,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { THEME_PRESETS } from "@/lib/utils/themes";
import type { CoupleWorkspaceContext } from "@/types/domain";
import type {
  AnimationStyleOption,
  FontFamilyOption,
  GenderOption,
  ThemePreset,
} from "@/types/database";

type SettingsTab = "profile" | "relationship" | "theme" | "privacy" | "account";

export function SettingsClient({ workspace }: { workspace: CoupleWorkspaceContext }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { uploadFile, isUploading } = useStorageUpload();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState(workspace.profile.full_name);
  const [nickname, setNickname] = useState(workspace.profile.nickname);
  const [birthDate, setBirthDate] = useState(workspace.profile.birth_date ?? "");
  const [gender, setGender] = useState<GenderOption | "">(workspace.profile.gender ?? "");
  const [bio, setBio] = useState(workspace.profile.bio ?? "");
  const [avatarPath, setAvatarPath] = useState(workspace.profile.avatar_path);
  const [avatarPreview, setAvatarPreview] = useState(workspace.userAvatarUrl);

  // Relationship & Theme fields
  const [coupleSpaceName, setCoupleSpaceName] = useState(workspace.coupleSpace.name);
  const [firstMetOnlineDate, setFirstMetOnlineDate] = useState(
    workspace.settings.first_met_online_date ?? ""
  );
  const [firstMetInPersonDate, setFirstMetInPersonDate] = useState(
    workspace.settings.first_met_in_person_date ?? ""
  );
  const [anniversaryDate, setAnniversaryDate] = useState(
    workspace.settings.anniversary_date ?? ""
  );
  const [firstMeetingPlace, setFirstMeetingPlace] = useState(
    workspace.settings.first_meeting_place ?? ""
  );
  const [originStory, setOriginStory] = useState(workspace.settings.origin_story ?? "");
  const [firstPhotoPath, setFirstPhotoPath] = useState(workspace.settings.first_photo_path);
  const [firstPhotoPreview, setFirstPhotoPreview] = useState(workspace.firstPhotoUrl);
  const [mainPhotoPath, setMainPhotoPath] = useState(workspace.settings.main_photo_path);
  const [mainPhotoPreview, setMainPhotoPreview] = useState(workspace.mainPhotoUrl);
  const [dashboardBannerPath, setDashboardBannerPath] = useState(
    workspace.settings.dashboard_banner_path
  );
  const [dashboardBannerPreview, setDashboardBannerPreview] = useState(
    workspace.dashboardBannerUrl
  );
  const [romanticMessage, setRomanticMessage] = useState(
    workspace.settings.romantic_message ?? ""
  );
  const [themePreset, setThemePreset] = useState<ThemePreset>(workspace.settings.theme_preset);
  const [fontFamily, setFontFamily] = useState<FontFamilyOption>(workspace.settings.font_family);
  const [animationStyle, setAnimationStyle] = useState<AnimationStyleOption>(
    workspace.settings.animation_style
  );

  // Partner invite code
  const [inviteCode, setInviteCode] = useState(workspace.activeInvitation?.invite_code ?? null);
  const [copied, setCopied] = useState(false);

  // Notification & privacy toggles
  const [prefs, setPrefs] = useState({
    notify_messages: workspace.profile.notify_messages,
    notify_letters: workspace.profile.notify_letters,
    notify_memories: workspace.profile.notify_memories,
    notify_calendar: workspace.profile.notify_calendar,
    notify_checkins: workspace.profile.notify_checkins,
    notify_hugs: workspace.profile.notify_hugs,
    notify_bucket_list: workspace.profile.notify_bucket_list,
    show_online_status: workspace.profile.show_online_status,
    show_read_receipts: workspace.profile.show_read_receipts,
    allow_partner_edit_shared: workspace.profile.allow_partner_edit_shared,
  });

  // Security / Account
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handlePhotoUpload(
    file: File,
    onDone: (path: string, url: string | null) => void
  ) {
    const res = await uploadFile("profile-photos", workspace.coupleSpace.id, file);
    if (!res) {
      showToast({ type: "error", title: "Upload foto gagal" });
      return;
    }
    onDone(res.path, res.signedUrl);
    showToast({ type: "success", title: "Foto berhasil diunggah — klik Simpan untuk menerapkan" });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfileAction({
        fullName,
        nickname,
        avatarPath,
        birthDate: birthDate || null,
        bio: bio || null,
        gender: gender || null,
      });
      if (!res.success) {
        showToast({ type: "error", title: "Gagal memperbarui profil", description: res.error });
        return;
      }
      showToast({ type: "success", title: "Profil berhasil diperbarui!" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRelationship(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateRelationshipSettingsAction({
        coupleSpaceName,
        firstMetOnlineDate: firstMetOnlineDate || null,
        firstMetInPersonDate: firstMetInPersonDate || null,
        anniversaryDate: anniversaryDate || null,
        firstMeetingPlace: firstMeetingPlace || null,
        originStory: originStory || null,
        firstPhotoPath,
        mainPhotoPath,
        dashboardBannerPath,
        romanticMessage: romanticMessage || null,
        themePreset,
        fontFamily,
        animationStyle,
        partnerPlaceholderName: workspace.settings.partner_placeholder_name,
        partnerPlaceholderNickname: workspace.settings.partner_placeholder_nickname,
        partnerPlaceholderAvatarPath: workspace.settings.partner_placeholder_avatar_path,
      });
      if (!res.success) {
        showToast({ type: "error", title: "Gagal menyimpan pengaturan", description: res.error });
        return;
      }
      showToast({ type: "success", title: "Pengaturan hubungan & tema tersimpan!" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateNotificationPrivacyAction(prefs);
      if (!res.success) {
        showToast({ type: "error", title: "Gagal menyimpan preferensi", description: res.error });
        return;
      }
      showToast({ type: "success", title: "Preferensi notifikasi & privasi diperbarui!" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast({ type: "error", title: "Konfirmasi password tidak cocok" });
      return;
    }
    setSaving(true);
    try {
      const res = await updatePasswordAction(newPassword);
      if (!res.success) {
        showToast({ type: "error", title: "Gagal mengubah password", description: res.error });
        return;
      }
      setNewPassword("");
      setConfirmNewPassword("");
      showToast({ type: "success", title: "Password berhasil diubah!" });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateInvite() {
    setSaving(true);
    try {
      const res = await generateInviteCodeAction(72);
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal membuat kode", description: res.error });
        return;
      }
      setInviteCode(res.data.inviteCode);
      showToast({ type: "success", title: "Kode undangan pasangan dibuat!" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationText: deleteConfirmation }),
      });
      const data = (await res.json()) as { error?: string; note?: string };
      if (!res.ok) {
        showToast({ type: "error", title: "Gagal menghapus akun", description: data.error });
        return;
      }
      showToast({
        type: "info",
        title: "Akun telah dihapus",
        description: data.note ?? "Terima kasih telah menggunakan Our Little World.",
      });
      router.push("/login");
      router.refresh();
    } finally {
      setDeletingAccount(false);
    }
  }

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
    { id: "profile", label: "Our Profile", icon: User },
    { id: "relationship", label: "Hubungan & Undangan", icon: Heart },
    { id: "theme", label: "Tema & Tampilan", icon: Palette },
    { id: "privacy", label: "Notifikasi & Privasi", icon: Bell },
    { id: "account", label: "Keamanan & Data", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Settings &amp; Account Management</h1>
        <p className="text-sm text-brand-brown">
          Kelola profil dinamis, informasi hubungan, tema website, privasi, ekspor kenangan, dan
          keamanan akun.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-brand-roseDark text-white shadow-soft"
                  : "bg-white/85 text-brand-brown hover:bg-brand-pink/30"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile */}
      {activeTab === "profile" && (
        <Card>
          <h2 className="text-lg font-bold text-brand-dark mb-4">Profil Pribadimu</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nama Lengkap *"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Nama Panggilan *"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <Input
                label="Tanggal Lahir"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <Select
                label="Jenis Kelamin"
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderOption | "")}
              >
                <option value="">Tidak ditentukan</option>
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
                <option value="non_binary">Non-biner</option>
                <option value="prefer_not_to_say">Memilih tidak menyebutkan</option>
              </Select>
            </div>

            <FileUploadField
              label="Foto Profil"
              accept="image/*"
              previewUrl={avatarPreview}
              isUploading={isUploading}
              onFileSelected={(file) =>
                handlePhotoUpload(file, (path, url) => {
                  setAvatarPath(path);
                  setAvatarPreview(url);
                })
              }
            />

            <Textarea
              label="Bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />

            <Button type="submit" loading={saving} disabled={isUploading}>
              Simpan Perubahan Profil
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: Relationship & Partner Invite */}
      {activeTab === "relationship" && (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-brand-dark">Status Koneksi Pasangan</h2>
                <p className="text-xs text-brand-brown">
                  {workspace.partner.isConnected
                    ? `Ruang pasangan penuh (2/2) — terhubung dengan ${workspace.partner.fullName}.`
                    : "Baru 1/2 anggota. Bagikan kode undangan agar pasanganmu dapat bergabung."}
                </p>
              </div>
              <Badge variant={workspace.partner.isConnected ? "emerald" : "amber"}>
                {workspace.partner.isConnected ? "Terhubung Berdua" : "Menunggu Pasangan"}
              </Badge>
            </div>

            {!workspace.partner.isConnected && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-cream p-4">
                {inviteCode ? (
                  <>
                    <code className="rounded-xl bg-white px-4 py-2 text-base font-bold tracking-widest text-brand-dark border border-brand-pink/50">
                      {inviteCode}
                    </code>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteCode);
                        setCopied(true);
                        showToast({ type: "info", title: "Kode undangan disalin" });
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Tersalin" : "Salin Kode"}
                    </Button>
                  </>
                ) : null}
                <Button size="sm" variant="outline" loading={saving} onClick={handleGenerateInvite}>
                  <KeyRound className="h-4 w-4" />
                  {inviteCode ? "Buat Kode Baru" : "Generate Kode Undangan"}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-brand-dark mb-4">Informasi Hubungan</h2>
            <form onSubmit={handleSaveRelationship} className="space-y-4">
              <Input
                label="Nama Ruang Pasangan *"
                required
                value={coupleSpaceName}
                onChange={(e) => setCoupleSpaceName(e.target.value)}
              />
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
                value={firstMeetingPlace}
                onChange={(e) => setFirstMeetingPlace(e.target.value)}
              />
              <Textarea
                label="Cerita Awal Hubungan"
                rows={3}
                value={originStory}
                onChange={(e) => setOriginStory(e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FileUploadField
                  label="Foto Pertama Bersama"
                  accept="image/*"
                  previewUrl={firstPhotoPreview}
                  isUploading={isUploading}
                  onFileSelected={(file) =>
                    handlePhotoUpload(file, (path, url) => {
                      setFirstPhotoPath(path);
                      setFirstPhotoPreview(url);
                    })
                  }
                />
                <FileUploadField
                  label="Foto Utama Pasangan"
                  accept="image/*"
                  previewUrl={mainPhotoPreview}
                  isUploading={isUploading}
                  onFileSelected={(file) =>
                    handlePhotoUpload(file, (path, url) => {
                      setMainPhotoPath(path);
                      setMainPhotoPreview(url);
                    })
                  }
                />
              </div>
              <Button type="submit" loading={saving} disabled={isUploading}>
                Simpan Informasi Hubungan
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 3: Theme & Personalization */}
      {activeTab === "theme" && (
        <Card>
          <h2 className="text-lg font-bold text-brand-dark mb-4">Tema &amp; Personalisasi</h2>
          <form onSubmit={handleSaveRelationship} className="space-y-5">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-brown">
                Pilih Palet Warna
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.values(THEME_PRESETS).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setThemePreset(preset.id)}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      themePreset === preset.id
                        ? "border-brand-roseDark bg-brand-pink/25 shadow-soft"
                        : "border-brand-pink/35 bg-white hover:bg-brand-cream"
                    }`}
                  >
                    <div className="flex gap-1.5">
                      {preset.previewSwatches.map((hex) => (
                        <span
                          key={hex}
                          style={{ backgroundColor: hex }}
                          className="h-5 w-5 rounded-full border border-black/10"
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-bold text-brand-dark">{preset.name}</p>
                    <p className="mt-0.5 text-[11px] text-brand-brown">{preset.description}</p>
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
                <option value="poppins">Poppins</option>
                <option value="nunito">Nunito</option>
              </Select>
              <Select
                label="Gaya Animasi"
                value={animationStyle}
                onChange={(e) => setAnimationStyle(e.target.value as AnimationStyleOption)}
              >
                <option value="gentle">Gentle</option>
                <option value="playful">Playful</option>
                <option value="minimal">Minimal</option>
              </Select>
            </div>

            <FileUploadField
              label="Foto Banner Dashboard"
              accept="image/*"
              previewUrl={dashboardBannerPreview}
              isUploading={isUploading}
              onFileSelected={(file) =>
                handlePhotoUpload(file, (path, url) => {
                  setDashboardBannerPath(path);
                  setDashboardBannerPreview(url);
                })
              }
            />

            <Textarea
              label="Pesan Romantis Dashboard"
              rows={2}
              value={romanticMessage}
              onChange={(e) => setRomanticMessage(e.target.value)}
            />

            <Button type="submit" loading={saving} disabled={isUploading}>
              Terapkan Tema &amp; Tampilan
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 4: Notification & Privacy */}
      {activeTab === "privacy" && (
        <Card>
          <h2 className="text-lg font-bold text-brand-dark mb-4">Pengaturan Notifikasi &amp; Privasi</h2>
          <form onSubmit={handleSavePrefs} className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-roseDark">
                Notifikasi Realtime
              </p>
              {(
                [
                  ["notify_messages", "Notifikasi pesan Private Chat baru"],
                  ["notify_letters", "Notifikasi surat cinta baru"],
                  ["notify_memories", "Notifikasi saat pasangan menambah kenangan"],
                  ["notify_calendar", "Notifikasi acara kalender baru"],
                  ["notify_checkins", "Notifikasi Daily Check-in pasangan"],
                  ["notify_hugs", "Notifikasi saat menerima Virtual Hug"],
                  ["notify_bucket_list", "Notifikasi saat Bucket List diselesaikan"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-2xl bg-brand-cream/80 px-4 py-3 text-sm cursor-pointer"
                >
                  <span className="text-brand-dark">{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                    className="h-4 w-4 accent-brand-roseDark"
                  />
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-roseDark">
                Kontrol Privasi
              </p>
              {(
                [
                  ["show_online_status", "Tampilkan status online di Private Chat"],
                  ["show_read_receipts", "Tampilkan tanda dibaca (centang dua) di Chat"],
                  ["allow_partner_edit_shared", "Izinkan pasangan mengedit konten bersama"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-2xl bg-brand-cream/80 px-4 py-3 text-sm cursor-pointer"
                >
                  <span className="text-brand-dark">{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                    className="h-4 w-4 accent-brand-roseDark"
                  />
                </label>
              ))}
            </div>

            <Button type="submit" loading={saving}>
              Simpan Pengaturan Privasi
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 5: Security, Export, Backup & Account Deletion */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-bold text-brand-dark">Ubah Password</h2>
            <p className="mt-1 text-xs text-brand-brown">
              Email akun saat ini: <strong>{workspace.userEmail}</strong>
            </p>
            <form onSubmit={handleChangePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                label="Password Baru"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Ulangi Password Baru"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
                <Button type="submit" loading={saving}>
                  Perbarui Password
                </Button>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-roseDark hover:underline"
                >
                  Atau reset melalui email (Forgot Password)
                </Link>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="text-base font-bold text-brand-dark">Ekspor Kenangan &amp; Backup Data</h2>
            <p className="mt-1 text-xs text-brand-brown">
              Unduh arsip kenangan atau salinan penuh seluruh data ruang pasangan kalian dalam
              format JSON.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="/api/account/export?scope=memories">
                <Button type="button" variant="secondary">
                  <Download className="h-4 w-4" />
                  Export Memories (.json)
                </Button>
              </a>
              <a href="/api/account/export?scope=full">
                <Button type="button" variant="outline">
                  <Download className="h-4 w-4" />
                  Backup Seluruh Data (.json)
                </Button>
              </a>
            </div>
          </Card>

          <Card className="border-rose-200 bg-rose-50/40">
            <h2 className="text-base font-bold text-rose-700">Sesi &amp; Penghapusan Akun</h2>
            <p className="mt-1 text-xs text-brand-brown leading-relaxed">
              Penghapusan akun bersifat permanen dan mengikuti kebijakan privasi data. Pastikan kamu
              telah mengunduh backup kenangan sebelum menghapus akun.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </form>
              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Hapus Akun Permanen
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Double-Confirmation Account Deletion Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Konfirmasi Penghapusan Akun Permanen"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-brand-brown leading-relaxed">
            Menghapus akun akan mencabut keanggotaanmu dari Couple Space, menghapus data profilmu,
            dan mengeluarkanmu dari semua sesi. Ketik persis{" "}
            <strong className="text-rose-600">HAPUS AKUN SAYA</strong> untuk melanjutkan:
          </p>
          <Input
            placeholder="HAPUS AKUN SAYA"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={deletingAccount}
              disabled={deleteConfirmation.trim().toUpperCase() !== "HAPUS AKUN SAYA"}
              onClick={handleDeleteAccount}
            >
              Hapus Akun Sekarang
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
