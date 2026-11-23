"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Calendar,
  Edit3,
  Film,
  FolderPlus,
  Grid,
  Heart,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  createAlbumAction,
  createMemoryAction,
  deleteAlbumAction,
  deleteMemoryAction,
  toggleFavoriteMemoryAction,
  updateMemoryAction,
} from "@/services/memories.actions";
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
import type { MemoryAlbumRow, MemoryRow } from "@/types/database";

export interface MemoryWithUrl extends MemoryRow {
  signedUrl: string | null;
}

export function MemoriesClient({
  coupleId,
  initialMemories,
  initialAlbums,
}: {
  coupleId: string;
  initialMemories: MemoryWithUrl[];
  initialAlbums: MemoryAlbumRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { uploadFile, isUploading } = useStorageUpload();

  const [memories, setMemories] = useState<MemoryWithUrl[]>(initialMemories);
  const [albums, setAlbums] = useState<MemoryAlbumRow[]>(initialAlbums);

  // Filters & view mode
  const [viewMode, setViewMode] = useState<"scrapbook" | "grid">("scrapbook");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryWithUrl | null>(null);
  const [lightboxMemory, setLightboxMemory] = useState<MemoryWithUrl | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemoryWithUrl | null>(null);

  // Create / Edit memory form
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [mediaPath, setMediaPath] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Album form
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      if (selectedAlbumId === "favorites" && !m.is_favorite) return false;
      if (selectedAlbumId !== "all" && selectedAlbumId !== "favorites" && m.album_id !== selectedAlbumId)
        return false;
      if (dateFrom && m.memory_date < dateFrom) return false;
      if (dateTo && m.memory_date > dateTo) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${m.title} ${m.caption ?? ""} ${m.location ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [memories, selectedAlbumId, dateFrom, dateTo, searchQuery]);

  function resetMemoryForm() {
    setTitle("");
    setCaption("");
    setAlbumId("");
    setMemoryDate(new Date().toISOString().slice(0, 10));
    setLocation("");
    setMediaPath("");
    setMediaType("photo");
    setMediaPreview(null);
    setEditingMemory(null);
  }

  function openEditModal(mem: MemoryWithUrl) {
    setEditingMemory(mem);
    setTitle(mem.title);
    setCaption(mem.caption ?? "");
    setAlbumId(mem.album_id ?? "");
    setMemoryDate(mem.memory_date);
    setLocation(mem.location ?? "");
    setMediaPath(mem.media_path);
    setMediaType(mem.media_type);
    setMediaPreview(mem.signedUrl);
    setAddModalOpen(true);
  }

  async function handleFileSelected(file: File) {
    const res = await uploadFile("memories", coupleId, file);
    if (!res) {
      showToast({
        type: "error",
        title: "Upload media gagal",
        description: "Pastikan format gambar/video valid dan ukuran maks 50 MB.",
      });
      return;
    }
    setMediaPath(res.path);
    setMediaType(res.mediaType);
    setMediaPreview(res.signedUrl);
    showToast({ type: "success", title: "Media berhasil diunggah!" });
  }

  async function handleSaveMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMemory && !mediaPath) {
      showToast({ type: "error", title: "Unggah foto atau video terlebih dahulu." });
      return;
    }
    setSubmitting(true);
    try {
      if (editingMemory) {
        const res = await updateMemoryAction(editingMemory.id, {
          title,
          caption,
          albumId: albumId || null,
          memoryDate,
          location,
        });
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal memperbarui", description: res.error });
          return;
        }
        setMemories((prev) =>
          prev.map((m) => (m.id === editingMemory.id ? { ...res.data!, signedUrl: m.signedUrl } : m))
        );
        showToast({ type: "success", title: "Kenangan diperbarui!" });
      } else {
        const res = await createMemoryAction({
          title,
          caption,
          albumId: albumId || null,
          mediaType,
          mediaPath,
          memoryDate,
          location,
        });
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal menyimpan", description: res.error });
          return;
        }
        setMemories((prev) => [{ ...res.data!, signedUrl: mediaPreview }, ...prev]);
        showToast({ type: "success", title: "Kenangan baru tersimpan!" });
      }
      setAddModalOpen(false);
      resetMemoryForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createAlbumAction({ title: albumTitle, description: albumDesc });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Gagal membuat album", description: res.error });
        return;
      }
      setAlbums((prev) => [res.data!, ...prev]);
      setAlbumTitle("");
      setAlbumDesc("");
      setAlbumModalOpen(false);
      showToast({ type: "success", title: "Album kenangan dibuat!" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAlbum(id: string) {
    const res = await deleteAlbumAction(id);
    if (res.success) {
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      if (selectedAlbumId === id) setSelectedAlbumId("all");
      showToast({ type: "info", title: "Album dihapus" });
    }
  }

  async function handleToggleFavorite(mem: MemoryWithUrl) {
    const next = !mem.is_favorite;
    setMemories((prev) => prev.map((m) => (m.id === mem.id ? { ...m, is_favorite: next } : m)));
    await toggleFavoriteMemoryAction(mem.id, next);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await deleteMemoryAction(deleteTarget.id, deleteTarget.media_path);
      if (res.success) {
        setMemories((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        if (lightboxMemory?.id === deleteTarget.id) setLightboxMemory(null);
        showToast({ type: "info", title: "Kenangan dihapus" });
      } else {
        showToast({ type: "error", title: "Gagal menghapus", description: res.error });
      }
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Our Memories</h1>
          <p className="text-sm text-brand-brown">
            Scrapbook foto &amp; video kenangan privat kalian berdua ({memories.length} kenangan)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={() => setAlbumModalOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            Album Baru
          </Button>
          <Button
            onClick={() => {
              resetMemoryForm();
              setAddModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Unggah Kenangan
          </Button>
        </div>
      </div>

      {/* Album Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedAlbumId("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            selectedAlbumId === "all"
              ? "bg-brand-roseDark text-white shadow-soft"
              : "bg-white/80 text-brand-brown hover:bg-brand-pink/30"
          }`}
        >
          Semua ({memories.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedAlbumId("favorites")}
          className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            selectedAlbumId === "favorites"
              ? "bg-brand-roseDark text-white shadow-soft"
              : "bg-white/80 text-brand-brown hover:bg-brand-pink/30"
          }`}
        >
          <Heart className="h-3.5 w-3.5" /> Favorit
        </button>
        {albums.map((alb) => (
          <div key={alb.id} className="inline-flex items-center gap-1 rounded-full bg-white/80 pr-1.5">
            <button
              type="button"
              onClick={() => setSelectedAlbumId(alb.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedAlbumId === alb.id
                  ? "bg-brand-roseDark text-white"
                  : "text-brand-brown hover:text-brand-dark"
              }`}
            >
              {alb.title}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteAlbum(alb.id)}
              title="Hapus album"
              className="rounded-full p-1 text-brand-brown/60 hover:text-rose-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Filters & Scrapbook/Grid Switcher */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="lg:col-span-2">
            <Input
              label="Cari Kenangan"
              placeholder="Cari judul, caption, atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Input
            label="Dari Tanggal"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Sampai Tanggal"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={viewMode === "scrapbook" ? "primary" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setViewMode("scrapbook")}
            >
              <LayoutGrid className="h-4 w-4" />
              Scrapbook
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "primary" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
              Grid
            </Button>
          </div>
        </div>
      </Card>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Camera className="h-7 w-7" />}
          title="Belum ada kenangan yang cocok"
          description="Abadikan momen pertama kalian dengan mengunggah foto atau video beserta caption, tanggal, dan lokasinya."
          action={
            <Button
              onClick={() => {
                resetMemoryForm();
                setAddModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Unggah Kenangan Pertama
            </Button>
          }
        />
      ) : (
        <div
          className={
            viewMode === "scrapbook"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }
        >
          {filtered.map((mem, idx) => (
            <motion.article
              key={mem.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.3) }}
              className={
                viewMode === "scrapbook"
                  ? "polaroid-card relative rounded-3xl p-3.5"
                  : "glass-card overflow-hidden rounded-3xl"
              }
            >
              {viewMode === "scrapbook" && (
                <div className="mx-auto -mt-5 mb-2 h-4 w-20 rounded-sm bg-brand-pink/70 opacity-85 shadow-sm" />
              )}

              <div
                onClick={() => setLightboxMemory(mem)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-brand-cream aspect-[4/3]"
              >
                {mem.signedUrl ? (
                  mem.media_type === "video" ? (
                    <video
                      src={mem.signedUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mem.signedUrl}
                      alt={mem.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-brown/60">
                    <Search className="h-6 w-6" />
                  </div>
                )}

                {mem.media_type === "video" && (
                  <Badge variant="rose" className="absolute left-2.5 top-2.5 bg-white/90">
                    <Film className="h-3 w-3" /> Video
                  </Badge>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(mem);
                  }}
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow transition hover:scale-110"
                  aria-label="Favoritkan"
                >
                  <Heart className="h-4 w-4" fill={mem.is_favorite ? "currentColor" : "none"} />
                </button>
              </div>

              <div className={viewMode === "scrapbook" ? "pt-3.5" : "p-4"}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-brand-dark line-clamp-1">{mem.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(mem)}
                      className="rounded-lg p-1.5 text-brand-brown hover:bg-brand-pink/30"
                      aria-label="Edit kenangan"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(mem)}
                      className="rounded-lg p-1.5 text-brand-brown hover:bg-rose-100 hover:text-rose-600"
                      aria-label="Hapus kenangan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {mem.caption && (
                  <p className="mt-1 text-xs text-brand-brown line-clamp-2 leading-relaxed">
                    {mem.caption}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-brand-brown/85">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-brand-roseDark" />
                    {formatDateIndo(mem.memory_date)}
                  </span>
                  {mem.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand-roseDark" />
                      {mem.location}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Upload / Edit Memory Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          resetMemoryForm();
        }}
        title={editingMemory ? "Edit Kenangan" : "Unggah Kenangan Baru"}
        subtitle="File disimpan secara privat pada server khusus Couple Space kalian dan metadata di MySQL."
      >
        <form onSubmit={handleSaveMemory} className="space-y-4">
          {!editingMemory && (
            <FileUploadField
              label="Foto atau Video *"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              previewUrl={mediaType === "photo" ? mediaPreview : null}
              isUploading={isUploading}
              helperText={
                mediaPath
                  ? `File siap (${mediaType === "video" ? "Video" : "Foto"})`
                  : "JPG, PNG, WEBP, GIF, MP4, WEBM (maks 50 MB)"
              }
              onFileSelected={handleFileSelected}
            />
          )}

          <Input
            label="Judul Kenangan *"
            required
            placeholder="Misal: Jalan sore di pantai"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Caption / Cerita"
            rows={3}
            placeholder="Ceritakan apa yang membuat momen ini istimewa..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Tanggal *"
              type="date"
              required
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
            />
            <Input
              label="Lokasi"
              placeholder="Kota / tempat spesial"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Select
            label="Album Kenangan (Opsional)"
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
          >
            <option value="">Tanpa album khusus</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitting} disabled={isUploading}>
              {editingMemory ? "Simpan Perubahan" : "Simpan Kenangan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Album Modal */}
      <Modal
        open={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
        title="Buat Album Kenangan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAlbum} className="space-y-4">
          <Input
            label="Nama Album *"
            required
            placeholder="Misal: Liburan Pertama, Wisuda, Kencan Akhir Pekan"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
          />
          <Textarea
            label="Deskripsi (Opsional)"
            rows={2}
            value={albumDesc}
            onChange={(e) => setAlbumDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAlbumModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Buat Album
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      <Modal
        open={Boolean(lightboxMemory)}
        onClose={() => setLightboxMemory(null)}
        title={lightboxMemory?.title ?? ""}
        subtitle={
          lightboxMemory
            ? `${formatDateIndo(lightboxMemory.memory_date)}${
                lightboxMemory.location ? ` • ${lightboxMemory.location}` : ""
              }`
            : undefined
        }
        maxWidth="max-w-3xl"
      >
        {lightboxMemory && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl bg-black/5">
              {lightboxMemory.signedUrl ? (
                lightboxMemory.media_type === "video" ? (
                  <video
                    src={lightboxMemory.signedUrl}
                    controls
                    className="max-h-[62vh] w-full rounded-2xl bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lightboxMemory.signedUrl}
                    alt={lightboxMemory.title}
                    className="max-h-[62vh] w-full object-contain rounded-2xl"
                  />
                )
              ) : (
                <p className="p-8 text-center text-sm text-brand-brown">Media tidak tersedia.</p>
              )}
            </div>
            {lightboxMemory.caption && (
              <p className="rounded-2xl bg-brand-cream p-4 text-sm text-brand-dark leading-relaxed">
                {lightboxMemory.caption}
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kenangan?"
        message={`Kenangan "${deleteTarget?.title ?? ""}" beserta file medianya akan dihapus permanen.`}
        confirmLabel="Hapus Permanen"
        loading={submitting}
      />
    </div>
  );
}
