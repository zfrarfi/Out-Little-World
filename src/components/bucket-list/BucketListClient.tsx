"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  Circle,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createBucketItemAction,
  deleteBucketItemAction,
  toggleBucketCompletionAction,
  updateBucketItemAction,
} from "@/services/bucket-list.actions";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FileUploadField,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { formatDateIndo } from "@/lib/utils/relationship";
import type { BucketCategory, BucketListRow } from "@/types/database";

export interface BucketItemWithUrl extends BucketListRow {
  photoUrl: string | null;
}

const CATEGORIES: Record<BucketCategory, string> = {
  travel: "Liburan & Travel",
  food: "Kuliner",
  adventure: "Petualangan",
  home: "Rumah & Kehidupan",
  milestone: "Milestone Besar",
  creative: "Kreatif & Hobi",
  other: "Lainnya",
};

export function BucketListClient({
  coupleId,
  initialItems,
}: {
  coupleId: string;
  initialItems: BucketItemWithUrl[];
}) {
  const { showToast } = useToast();
  const { uploadFile, isUploading } = useStorageUpload();

  const [items, setItems] = useState<BucketItemWithUrl[]>(initialItems);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BucketItemWithUrl | null>(null);
  const [photoModalItem, setPhotoModalItem] = useState<BucketItemWithUrl | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BucketItemWithUrl | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BucketCategory>("travel");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const completedCount = items.filter((i) => i.is_completed).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const visibleItems = useMemo(() => {
    return items.filter((i) => (filterCat === "all" ? true : i.category === filterCat));
  }, [items, filterCat]);

  function openNew() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCategory("travel");
    setTargetDate("");
    setModalOpen(true);
  }

  function openEdit(item: BucketItemWithUrl) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setCategory(item.category);
    setTargetDate(item.target_date ?? "");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title, description, category, targetDate: targetDate || null };
      if (editing) {
        const res = await updateBucketItemAction(editing.id, payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal memperbarui", description: res.error });
          return;
        }
        setItems((prev) =>
          prev.map((it) => (it.id === editing.id ? { ...res.data!, photoUrl: it.photoUrl } : it))
        );
        showToast({ type: "success", title: "Impian diperbarui!" });
      } else {
        const res = await createBucketItemAction(payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal menambahkan", description: res.error });
          return;
        }
        setItems((prev) => [{ ...res.data!, photoUrl: null }, ...prev]);
        showToast({ type: "success", title: "Impian ditambahkan ke Bucket List!" });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: BucketItemWithUrl) {
    const next = !item.is_completed;
    const res = await toggleBucketCompletionAction(item.id, next);
    if (!res.success || !res.data) {
      showToast({ type: "error", title: "Gagal memperbarui status", description: res.error });
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...res.data!, photoUrl: it.photoUrl } : it))
    );
    showToast({
      type: "success",
      title: next ? "Yeay! Satu impian tercapai!" : "Status dikembalikan ke belum selesai",
    });
  }

  async function handleUploadAchievementPhoto(file: File) {
    if (!photoModalItem) return;
    const uploaded = await uploadFile("bucket-list-images", coupleId, file);
    if (!uploaded) {
      showToast({ type: "error", title: "Upload foto gagal" });
      return;
    }
    const res = await toggleBucketCompletionAction(photoModalItem.id, true, uploaded.path);
    if (!res.success || !res.data) {
      showToast({ type: "error", title: "Gagal menyimpan foto pencapaian", description: res.error });
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === photoModalItem.id ? { ...res.data!, photoUrl: uploaded.signedUrl } : it
      )
    );
    setPhotoModalItem(null);
    showToast({ type: "success", title: "Foto pencapaian tersimpan!" });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await deleteBucketItemAction(
        deleteTarget.id,
        deleteTarget.achievement_photo_path
      );
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
        showToast({ type: "info", title: "Item dihapus" });
      }
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Our Bucket List</h1>
          <p className="text-sm text-brand-brown">
            Daftar impian yang ingin kalian wujudkan berdua beserta foto pencapaiannya.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Tambah Impian
        </Button>
      </div>

      {/* Progress Card */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
              Progress Impian Bersama
            </p>
            <p className="mt-1 text-2xl font-bold text-brand-dark">
              {completedCount} dari {items.length} Impian Tercapai ({progressPct}%)
            </p>
          </div>
          <Badge variant={progressPct === 100 && items.length > 0 ? "emerald" : "pink"}>
            {progressPct}% Selesai
          </Badge>
        </div>
        <div className="mt-4 h-3.5 overflow-hidden rounded-full bg-brand-pink/35">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-brand-rose to-brand-roseDark"
          />
        </div>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterCat("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            filterCat === "all"
              ? "bg-brand-roseDark text-white"
              : "bg-white/80 text-brand-brown hover:bg-brand-pink/30"
          }`}
        >
          Semua ({items.length})
        </button>
        {Object.entries(CATEGORIES).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilterCat(id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCat === id
                ? "bg-brand-roseDark text-white"
                : "bg-white/80 text-brand-brown hover:bg-brand-pink/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-7 w-7" />}
          title="Belum ada impian di kategori ini"
          description="Tambahkan tempat impian, makanan yang ingin dicoba, atau target besar yang ingin kalian raih bersama."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Tambah Impian Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <Card
              key={item.id}
              className={`flex flex-col justify-between gap-4 ${
                item.is_completed ? "border-emerald-300/70 bg-emerald-50/40" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className="mt-0.5 text-brand-roseDark transition hover:scale-110"
                    aria-label="Ubah status selesai"
                  >
                    {item.is_completed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm font-bold ${
                        item.is_completed ? "line-through text-brand-brown" : "text-brand-dark"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="cream">{CATEGORIES[item.category]}</Badge>
                      {item.target_date && (
                        <Badge variant="pink">
                          <Calendar className="h-3 w-3" /> {formatDateIndo(item.target_date)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-lg p-1 text-brand-brown hover:bg-brand-pink/30"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-lg p-1 text-brand-brown hover:bg-rose-100 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-3 text-xs text-brand-brown leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.photoUrl && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-brand-pink/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-brand-pink/25 pt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPhotoModalItem(item)}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {item.photoUrl ? "Ganti Foto Pencapaian" : "Unggah Foto Pencapaian"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Impian" : "Tambah Impian Baru"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Impian Bersama *"
            required
            placeholder="Misal: Liburan ke Jepang saat musim sakura"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value as BucketCategory)}
            >
              {Object.entries(CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Target Tanggal (Opsional)"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <Textarea
            label="Detail / Rencana (Opsional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Achievement Photo Modal */}
      <Modal
        open={Boolean(photoModalItem)}
        onClose={() => setPhotoModalItem(null)}
        title="Foto Pencapaian Bucket List"
        subtitle={photoModalItem?.title}
        maxWidth="max-w-md"
      >
        <FileUploadField
          label="Pilih Foto Pencapaian"
          accept="image/*"
          previewUrl={photoModalItem?.photoUrl}
          isUploading={isUploading}
          helperText="Otomatis menandai impian ini sebagai tercapai!"
          onFileSelected={handleUploadAchievementPhoto}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Impian?"
        message={`Hapus "${deleteTarget?.title ?? ""}" dari Bucket List kalian?`}
        confirmLabel="Hapus"
        loading={saving}
      />
    </div>
  );
}
