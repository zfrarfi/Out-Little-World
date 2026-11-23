"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Edit3,
  GitCommitVertical,
  Heart,
  MapPin,
  Plane,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  createTimelineMilestoneAction,
  deleteTimelineMilestoneAction,
  updateTimelineMilestoneAction,
} from "@/services/timeline.actions";
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
import type { RelationshipTimelineRow, TimelineMilestoneType } from "@/types/database";

export interface TimelineItemWithUrl extends RelationshipTimelineRow {
  photoUrl: string | null;
}

const MILESTONE_LABELS: Record<TimelineMilestoneType, string> = {
  first_know: "Pertama Kali Kenal",
  first_meet: "Pertama Kali Bertemu",
  first_date: "First Date",
  anniversary: "Anniversary",
  vacation: "Liburan",
  special: "Momen Spesial",
  memory: "Kenangan Penting",
};

export function TimelineClient({
  coupleId,
  initialItems,
}: {
  coupleId: string;
  initialItems: TimelineItemWithUrl[];
}) {
  const { showToast } = useToast();
  const { uploadFile, isUploading } = useStorageUpload();

  const [items, setItems] = useState<TimelineItemWithUrl[]>(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineItemWithUrl | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineItemWithUrl | null>(null);

  const [title, setTitle] = useState("");
  const [milestoneType, setMilestoneType] = useState<TimelineMilestoneType>("special");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setTitle("");
    setMilestoneType("special");
    setEventDate(new Date().toISOString().slice(0, 10));
    setLocation("");
    setDescription("");
    setPhotoPath(null);
    setPhotoPreview(null);
    setModalOpen(true);
  }

  function openEdit(item: TimelineItemWithUrl) {
    setEditing(item);
    setTitle(item.title);
    setMilestoneType(item.milestone_type);
    setEventDate(item.event_date);
    setLocation(item.location ?? "");
    setDescription(item.description ?? "");
    setPhotoPath(item.photo_path);
    setPhotoPreview(item.photoUrl);
    setModalOpen(true);
  }

  async function handlePhotoUpload(file: File) {
    const res = await uploadFile("timeline-images", coupleId, file);
    if (!res) {
      showToast({ type: "error", title: "Upload foto gagal" });
      return;
    }
    setPhotoPath(res.path);
    setPhotoPreview(res.signedUrl);
    showToast({ type: "success", title: "Foto milestone siap disimpan" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        milestoneType,
        eventDate,
        location,
        description,
        photoPath,
      };
      if (editing) {
        const res = await updateTimelineMilestoneAction(editing.id, payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal memperbarui", description: res.error });
          return;
        }
        setItems((prev) =>
          prev
            .map((it) => (it.id === editing.id ? { ...res.data!, photoUrl: photoPreview } : it))
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
        );
        showToast({ type: "success", title: "Milestone diperbarui!" });
      } else {
        const res = await createTimelineMilestoneAction(payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal menyimpan", description: res.error });
          return;
        }
        setItems((prev) =>
          [...prev, { ...res.data!, photoUrl: photoPreview }].sort((a, b) =>
            a.event_date.localeCompare(b.event_date)
          )
        );
        showToast({ type: "success", title: "Momen ditambahkan ke Timeline!" });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await deleteTimelineMilestoneAction(deleteTarget.id, deleteTarget.photo_path);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
        showToast({ type: "info", title: "Milestone dihapus" });
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
          <h1 className="text-2xl font-bold text-brand-dark">Relationship Timeline</h1>
          <p className="text-sm text-brand-brown">
            Garis waktu vertikal perjalanan hubungan kalian dari awal hingga hari ini.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Tambah Momen Timeline
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<GitCommitVertical className="h-7 w-7" />}
          title="Timeline perjalanan masih kosong"
          description="Catat momen pertama kali kenal, first date, liburan, hingga anniversary kalian secara kronologis."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Buat Milestone Pertama
            </Button>
          }
        />
      ) : (
        <div className="relative mx-auto max-w-3xl pl-8 sm:pl-12">
          {/* Vertical line */}
          <div className="absolute bottom-2 left-3.5 top-2 w-0.5 bg-gradient-to-b from-brand-pink via-brand-rose to-brand-roseDark sm:left-5" />

          <div className="space-y-6">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.35) }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[2.15rem] top-5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-pink to-brand-roseDark text-white shadow-romantic sm:-left-[2.85rem]">
                  {item.milestone_type === "vacation" ? (
                    <Plane className="h-4 w-4" />
                  ) : item.milestone_type === "anniversary" ? (
                    <Heart className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>

                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="pink">{MILESTONE_LABELS[item.milestone_type]}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-brown">
                          <Calendar className="h-3.5 w-3.5 text-brand-roseDark" />
                          {formatDateIndo(item.event_date)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-brand-dark">{item.title}</h3>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-xl p-1.5 text-brand-brown hover:bg-brand-pink/30"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-xl p-1.5 text-brand-brown hover:bg-rose-100 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {item.location && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-brown">
                      <MapPin className="h-3.5 w-3.5 text-brand-roseDark" />
                      {item.location}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-brand-dark/90 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {item.photoUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-brand-pink/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.photoUrl}
                        alt={item.title}
                        className="max-h-72 w-full object-cover"
                      />
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Momen Timeline" : "Tambah Momen Perjalanan"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Judul Momen *"
            required
            placeholder="Misal: Kencan pertama menonton film"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Jenis Milestone"
              value={milestoneType}
              onChange={(e) => setMilestoneType(e.target.value as TimelineMilestoneType)}
            >
              {Object.entries(MILESTONE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Tanggal *"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <Input
            label="Lokasi (Opsional)"
            placeholder="Tempat momen ini terjadi"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Textarea
            label="Cerita Singkat"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FileUploadField
            label="Foto Momen (Opsional)"
            accept="image/*"
            previewUrl={photoPreview}
            isUploading={isUploading}
            onFileSelected={handlePhotoUpload}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving} disabled={isUploading}>
              Simpan Milestone
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Momen Timeline?"
        message={`Hapus "${deleteTarget?.title ?? ""}" dari perjalanan kalian?`}
        confirmLabel="Hapus"
        loading={saving}
      />
    </div>
  );
}
