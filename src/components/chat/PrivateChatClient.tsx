"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, ImagePlus, Loader2, Send, Smile, Trash2 } from "lucide-react";
import {
  deleteChatMessageAction,
  markChatMessagesReadAction,
  sendChatMessageAction,
} from "@/services/chat.actions";
import { useStorageUpload } from "@/hooks/useStorageUpload";
import { useToast } from "@/components/ui/ToastProvider";
import { Avatar, Badge, Button, Card } from "@/components/ui/Primitives";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type { ChatMessageRow } from "@/types/database";

export interface ChatMessageWithUrl extends ChatMessageRow {
  imageUrl: string | null;
}

const QUICK_EMOJIS = ["❤️", "🥰", "😘", "🤗", "🥺", "✨", "🌸", "🫶", "😊", "💐", "🎉", "🌙"];

export function PrivateChatClient({
  coupleId,
  currentUserId,
  partnerNickname,
  partnerAvatarUrl,
  showOnlineStatus,
  initialMessages,
}: {
  coupleId: string;
  currentUserId: string;
  userNickname: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  showOnlineStatus: boolean;
  initialMessages: ChatMessageWithUrl[];
}) {
  const { showToast } = useToast();
  const { uploadFile, isUploading } = useStorageUpload();

  const [messages, setMessages] = useState<ChatMessageWithUrl[]>(initialMessages);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, partnerTyping]);

  useEffect(() => {
    if (messages.some((m) => m.sender_id !== currentUserId && m.status !== "read")) {
      markChatMessagesReadAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/realtime/stream");

    const onChatInsert = (evt: MessageEvent) => {
      try {
        const incoming = JSON.parse(evt.data) as ChatMessageWithUrl;
        setMessages((prev) =>
          prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
        );
        if (incoming.sender_id !== currentUserId) {
          markChatMessagesReadAction();
        }
      } catch {
        // ignore
      }
    };

    const onChatUpdate = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data) as { readerId?: string; readAt?: string };
        if (payload.readerId && payload.readerId !== currentUserId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.sender_id === currentUserId
                ? { ...m, status: "read", read_at: payload.readAt ?? new Date().toISOString() }
                : m
            )
          );
        }
      } catch {
        // ignore
      }
    };

    const onChatDelete = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data) as { id?: string };
        if (payload.id) {
          setMessages((prev) => prev.filter((m) => m.id !== payload.id));
        }
      } catch {
        // ignore
      }
    };

    const onTyping = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data) as { userId?: string; isTyping?: boolean };
        if (payload.userId && payload.userId !== currentUserId) {
          setPartnerTyping(Boolean(payload.isTyping));
        }
      } catch {
        // ignore
      }
    };

    const onPresence = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data) as { onlineUserIds?: string[] };
        if (showOnlineStatus && Array.isArray(payload.onlineUserIds)) {
          setPartnerOnline(payload.onlineUserIds.some((id) => id !== currentUserId));
        }
      } catch {
        // ignore
      }
    };

    source.addEventListener("chat_insert", onChatInsert as EventListener);
    source.addEventListener("chat_update", onChatUpdate as EventListener);
    source.addEventListener("chat_delete", onChatDelete as EventListener);
    source.addEventListener("typing", onTyping as EventListener);
    source.addEventListener("presence", onPresence as EventListener);

    // Serverless-compatible MySQL sync (guarantees realtime delivery on Vercel too)
    const syncTimer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/realtime/sync?scope=chat", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          messages?: ChatMessageWithUrl[];
          partnerOnline?: boolean;
          partnerTyping?: boolean;
        };
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          if (data.messages.some((m) => m.sender_id !== currentUserId && m.status !== "read")) {
            markChatMessagesReadAction();
          }
        }
        if (showOnlineStatus && typeof data.partnerOnline === "boolean") {
          setPartnerOnline(data.partnerOnline);
        }
        if (typeof data.partnerTyping === "boolean") {
          setPartnerTyping(data.partnerTyping);
        }
      } catch {
        // ignore transient error
      }
    }, 2500);

    return () => {
      clearInterval(syncTimer);
      source.close();
    };
  }, [currentUserId, showOnlineStatus]);

  function broadcastTyping(isTyping: boolean) {
    fetch("/api/realtime/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping }),
    }).catch(() => null);
  }

  function handleInputChange(value: string) {
    setText(value);
    broadcastTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => broadcastTyping(false), 1800);
  }

  async function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    broadcastTyping(false);
    try {
      const res = await sendChatMessageAction({ content: text.trim() });
      if (!res.success || !res.data) {
        showToast({ type: "error", title: "Pesan gagal terkirim", description: res.error });
        return;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === res.data!.id)
          ? prev
          : [...prev, { ...res.data!, imageUrl: null }]
      );
      setText("");
      setShowEmojiPicker(false);
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage(file: File) {
    const uploaded = await uploadFile("chat-images", coupleId, file);
    if (!uploaded) {
      showToast({ type: "error", title: "Upload gambar gagal" });
      return;
    }
    const res = await sendChatMessageAction({
      content: text.trim() || null,
      imagePath: uploaded.path,
    });
    if (!res.success || !res.data) {
      showToast({ type: "error", title: "Gagal mengirim gambar", description: res.error });
      return;
    }
    setMessages((prev) =>
      prev.some((m) => m.id === res.data!.id)
        ? prev
        : [...prev, { ...res.data!, imageUrl: uploaded.signedUrl }]
    );
    setText("");
  }

  async function handleDelete(id: string) {
    const res = await deleteChatMessageAction(id);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex h-[calc(100vh-9.5rem)] min-h-[540px] flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-brand-pink/35 bg-white/85 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={partnerAvatarUrl} name={partnerNickname} size="md" />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  partnerOnline ? "bg-emerald-400" : "bg-stone-300"
                }`}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-brand-dark">{partnerNickname}</h1>
              <p className="text-xs text-brand-brown">
                {partnerTyping
                  ? "Sedang mengetik..."
                  : partnerOnline
                  ? "Sedang online"
                  : "Private Chat Realtime"}
              </p>
            </div>
          </div>
          <Badge variant="pink">Realtime SSE &bull; MySQL</Badge>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-brand-dark">
                Mulai percakapan pribadi dengan {partnerNickname}
              </p>
              <p className="mt-1 text-xs text-brand-brown">
                Pesan teks dan foto tersimpan permanen di MySQL &amp; muncul secara realtime.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group relative max-w-[82%] sm:max-w-[68%] rounded-3xl px-4 py-3 shadow-soft ${
                    isMine
                      ? "rounded-br-md bg-gradient-to-br from-brand-rose to-brand-roseDark text-white"
                      : "rounded-bl-md bg-white text-brand-dark border border-brand-pink/35"
                  }`}
                >
                  {msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="block mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="Lampiran chat"
                        className="max-h-64 rounded-2xl object-cover"
                      />
                    </a>
                  )}
                  {msg.content && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  )}

                  <div
                    className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                      isMine ? "text-white/85" : "text-brand-brown"
                    }`}
                  >
                    <span>{formatDateTimeIndo(msg.created_at)}</span>
                    {isMine &&
                      (msg.status === "read" ? (
                        <CheckCheck className="h-3.5 w-3.5 text-sky-100" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      ))}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="ml-1 opacity-0 transition group-hover:opacity-100"
                        title="Hapus pesan"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {partnerTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-2 text-xs italic text-brand-brown shadow-soft">
                {partnerNickname} sedang mengetik...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {showEmojiPicker && (
          <div className="flex flex-wrap gap-1.5 border-t border-brand-pink/25 bg-brand-cream/90 px-4 py-2.5">
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setText((prev) => prev + em)}
                className="rounded-xl p-1.5 text-xl transition hover:scale-125 hover:bg-white"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSendText}
          className="flex items-center gap-2 border-t border-brand-pink/35 bg-white/90 px-4 py-3"
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker((s) => !s)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-brand-brown hover:bg-brand-pink/30 transition"
            aria-label="Pilih emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-brand-brown hover:bg-brand-pink/30 transition">
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSendImage(f);
                e.target.value = "";
              }}
            />
          </label>

          <input
            type="text"
            placeholder={`Tulis pesan untuk ${partnerNickname}...`}
            value={text}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 rounded-2xl border border-brand-rose/35 bg-brand-cream/60 px-4 py-2.5 text-sm text-brand-dark outline-none focus:border-brand-roseDark focus:bg-white"
          />

          <Button type="submit" loading={sending} disabled={!text.trim()} size="md">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Kirim</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
