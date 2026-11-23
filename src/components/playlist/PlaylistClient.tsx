"use client";

import { useState } from "react";
import { Disc3, Edit3, ExternalLink, Music, Plus, Trash2 } from "lucide-react";
import {
  addPlaylistSongAction,
  deletePlaylistSongAction,
  updatePlaylistSongAction,
} from "@/services/playlist.actions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/Primitives";
import { parseSpotifyEmbedUrl, parseYoutubeEmbedUrl } from "@/lib/utils/relationship";
import type { PlaylistCategory, PlaylistRow } from "@/types/database";

const PLAYLIST_CATEGORIES: Record<PlaylistCategory, string> = {
  our_anthem: "Lagu Kita",
  date_night: "Date Night",
  road_trip: "Road Trip",
  missing_you: "Saat Rindu",
  chill: "Santai",
  happy: "Mood Bahagia",
};

export function PlaylistClient({ initialSongs }: { initialSongs: PlaylistRow[] }) {
  const { showToast } = useToast();
  const [songs, setSongs] = useState<PlaylistRow[]>(initialSongs);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlaylistRow | null>(null);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [memoryNote, setMemoryNote] = useState("");
  const [category, setCategory] = useState<PlaylistCategory>("our_anthem");
  const [saving, setSaving] = useState(false);

  const visibleSongs = songs.filter((s) => (filterCat === "all" ? true : s.category === filterCat));

  function openNew() {
    setEditing(null);
    setTitle("");
    setArtist("");
    setSpotifyUrl("");
    setYoutubeUrl("");
    setCoverUrl("");
    setMemoryNote("");
    setCategory("our_anthem");
    setModalOpen(true);
  }

  function openEdit(song: PlaylistRow) {
    setEditing(song);
    setTitle(song.title);
    setArtist(song.artist);
    setSpotifyUrl(song.spotify_url ?? "");
    setYoutubeUrl(song.youtube_url ?? "");
    setCoverUrl(song.cover_url ?? "");
    setMemoryNote(song.memory_note ?? "");
    setCategory(song.category);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        artist,
        spotifyUrl: spotifyUrl || null,
        youtubeUrl: youtubeUrl || null,
        coverUrl: coverUrl || null,
        memoryNote: memoryNote || null,
        category,
      };
      if (editing) {
        const res = await updatePlaylistSongAction(editing.id, payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal memperbarui lagu", description: res.error });
          return;
        }
        setSongs((prev) => prev.map((s) => (s.id === editing.id ? res.data! : s)));
        showToast({ type: "success", title: "Lagu diperbarui!" });
      } else {
        const res = await addPlaylistSongAction(payload);
        if (!res.success || !res.data) {
          showToast({ type: "error", title: "Gagal menambah lagu", description: res.error });
          return;
        }
        setSongs((prev) => [res.data!, ...prev]);
        showToast({ type: "success", title: "Lagu ditambahkan ke playlist!" });
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
      const res = await deletePlaylistSongAction(deleteTarget.id);
      if (res.success) {
        setSongs((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        showToast({ type: "info", title: "Lagu dihapus" });
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
          <h1 className="text-2xl font-bold text-brand-dark">Our Playlist</h1>
          <p className="text-sm text-brand-brown">
            Kumpulan soundtrack perjalanan cinta kalian dengan embed resmi Spotify &amp; YouTube.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Tambah Lagu
        </Button>
      </div>

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
          Semua ({songs.length})
        </button>
        {Object.entries(PLAYLIST_CATEGORIES).map(([id, label]) => (
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

      {visibleSongs.length === 0 ? (
        <EmptyState
          icon={<Music className="h-7 w-7" />}
          title="Playlist masih kosong"
          description="Tambahkan lagu yang mengingatkanmu pada pasangan lengkap dengan tautan Spotify atau YouTube."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Tambah Lagu Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibleSongs.map((song) => {
            const spotifyEmbed = parseSpotifyEmbedUrl(song.spotify_url);
            const youtubeEmbed = parseYoutubeEmbedUrl(song.youtube_url);
            return (
              <Card key={song.id} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {song.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={song.cover_url}
                        alt={song.title}
                        className="h-14 w-14 rounded-2xl object-cover shadow-soft shrink-0"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-roseDark text-white">
                        <Disc3 className="h-7 w-7" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Badge variant="pink">{PLAYLIST_CATEGORIES[song.category]}</Badge>
                      <h3 className="mt-1 truncate text-base font-bold text-brand-dark">
                        {song.title}
                      </h3>
                      <p className="truncate text-xs text-brand-brown">{song.artist}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(song)}
                      className="rounded-lg p-1.5 text-brand-brown hover:bg-brand-pink/30"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(song)}
                      className="rounded-lg p-1.5 text-brand-brown hover:bg-rose-100 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {song.memory_note && (
                  <p className="rounded-2xl bg-brand-cream px-4 py-3 text-xs italic text-brand-brown">
                    &ldquo;{song.memory_note}&rdquo;
                  </p>
                )}

                {spotifyEmbed && (
                  <iframe
                    src={spotifyEmbed}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-2xl border-0"
                    title={`Spotify ${song.title}`}
                  />
                )}

                {!spotifyEmbed && youtubeEmbed && (
                  <div className="aspect-video overflow-hidden rounded-2xl">
                    <iframe
                      src={youtubeEmbed}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      title={`YouTube ${song.title}`}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {song.spotify_url && (
                    <a
                      href={song.spotify_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Buka di Spotify
                    </a>
                  )}
                  {song.youtube_url && (
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Buka di YouTube
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Lagu" : "Tambah Lagu Kenangan"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Judul Lagu *"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Penyanyi / Band *"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>
          <Select
            label="Kategori Playlist"
            value={category}
            onChange={(e) => setCategory(e.target.value as PlaylistCategory)}
          >
            {Object.entries(PLAYLIST_CATEGORIES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Link Spotify (Opsional)"
            type="url"
            placeholder="https://open.spotify.com/track/..."
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
          />
          <Input
            label="Link YouTube (Opsional)"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
          <Input
            label="URL Cover Lagu (Opsional)"
            type="url"
            placeholder="https://..."
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
          <Textarea
            label="Catatan Kenangan"
            rows={2}
            placeholder="Kenapa lagu ini spesial bagi kalian?"
            value={memoryNote}
            onChange={(e) => setMemoryNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              Simpan Lagu
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Lagu?"
        message={`Hapus "${deleteTarget?.title ?? ""}" dari playlist kalian?`}
        confirmLabel="Hapus"
        loading={saving}
      />
    </div>
  );
}
