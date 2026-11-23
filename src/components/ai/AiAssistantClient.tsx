"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, MessageSquarePlus, Send, ShieldCheck, Sparkles } from "lucide-react";
import { AI_QUICK_PROMPTS } from "@/lib/ai/love-assistant";
import { useToast } from "@/components/ui/ToastProvider";
import { Badge, Button, Card } from "@/components/ui/Primitives";
import { formatDateTimeIndo } from "@/lib/utils/relationship";
import type { AiConversationRow, AiMessageRow } from "@/types/database";

export function AiAssistantClient({
  aiConfigured,
  initialConversations,
  initialMessagesByConv,
}: {
  aiConfigured: boolean;
  initialConversations: AiConversationRow[];
  initialMessagesByConv: Record<string, AiMessageRow[]>;
}) {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<AiConversationRow[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  const [messagesByConv, setMessagesByConv] =
    useState<Record<string, AiMessageRow[]>>(initialMessagesByConv);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const currentMessages = activeConvId ? messagesByConv[activeConvId] ?? [] : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, loading]);

  async function sendPrompt(promptText: string, topic?: string) {
    const clean = promptText.trim();
    if (!clean) return;
    setLoading(true);
    setInput("");

    const tempKey = activeConvId ?? "draft";
    const optimisticUser: AiMessageRow = {
      id: `temp-${Date.now()}`,
      conversation_id: tempKey,
      couple_id: "",
      role: "user",
      content: clean,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [tempKey]: [...(prev[tempKey] ?? []), optimisticUser],
    }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: clean,
          topic: topic ?? null,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        conversationId?: string;
        userMessage?: AiMessageRow;
        assistantMessage?: AiMessageRow;
      };

      if (!response.ok || !data.assistantMessage || !data.conversationId) {
        showToast({
          type: "error",
          title: "Love Assistant belum dapat merespons",
          description: data.error ?? "Periksa konfigurasi AI_API_KEY di server.",
        });
        setMessagesByConv((prev) => ({
          ...prev,
          [tempKey]: (prev[tempKey] ?? []).filter((m) => m.id !== optimisticUser.id),
        }));
        return;
      }

      const convId = data.conversationId;
      if (!activeConvId) {
        const newConv: AiConversationRow = {
          id: convId,
          couple_id: data.userMessage?.couple_id ?? "",
          user_id: "",
          title: clean.slice(0, 60),
          topic: topic ?? "general",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(convId);
      }

      setMessagesByConv((prev) => {
        const existing = (prev[convId] ?? prev[tempKey] ?? []).filter(
          (m) => m.id !== optimisticUser.id
        );
        const updated = [...existing];
        if (data.userMessage) updated.push(data.userMessage);
        updated.push(data.assistantMessage!);
        const next = { ...prev, [convId]: updated };
        if (tempKey === "draft") delete next.draft;
        return next;
      });
    } catch {
      showToast({ type: "error", title: "Koneksi ke AI server gagal" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">AI Love Assistant</h1>
          <p className="text-sm text-brand-brown">
            Asisten romantis berbahasa Indonesia untuk surat cinta, ide kencan, permintaan maaf, dan
            saran komunikasi sehat.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setActiveConvId(null);
            setInput("");
          }}
        >
          <MessageSquarePlus className="h-4 w-4" />
          Obrolan Baru
        </Button>
      </div>

      {!aiConfigured && (
        <div className="rounded-3xl border border-brand-rose/40 bg-brand-cream/90 p-4 text-xs text-brand-dark flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-brand-roseDark mt-0.5" />
          <div>
            <p className="font-bold">Mode Lokal Aktif (Langsung Bisa Dipakai Tanpa API Key)</p>
            <p className="mt-0.5 text-brand-brown leading-relaxed">
              Saat ini Love Assistant memakai mesin panduan Bahasa Indonesia lokal dan seluruh
              riwayat obrolan tetap tersimpan di MySQL. Jika ingin meng-upgrade ke LLM generatif
              penuh (Gemini / Groq gratis atau OpenAI), tambahkan{" "}
              <code className="rounded bg-white px-1">AI_API_KEY</code> di{" "}
              <code className="rounded bg-white px-1">.env.local</code> sesuai{" "}
              <code className="rounded bg-white px-1">docs/AI_SETUP.md</code>.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Conversation Sidebar */}
        <Card className="lg:col-span-4 space-y-3 h-fit">
          <h2 className="text-sm font-bold text-brand-dark">Riwayat Percakapan</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-brand-brown py-4">
                Belum ada obrolan tersimpan. Mulai pertanyaan di sebelah kanan!
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    activeConvId === conv.id
                      ? "border-brand-roseDark bg-brand-pink/30"
                      : "border-brand-pink/25 bg-white/80 hover:bg-brand-cream"
                  }`}
                >
                  <p className="truncate text-xs font-semibold text-brand-dark">{conv.title}</p>
                  <p className="mt-1 text-[10px] text-brand-brown">
                    {formatDateTimeIndo(conv.updated_at)}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="rounded-2xl bg-brand-cream/90 p-3.5 text-[11px] text-brand-brown leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-brand-dark mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-roseDark" />
              Prinsip Komunikasi Sehat
            </div>
            Love Assistant memberikan saran yang suportif, menghargai batasan kedua pihak, tidak
            manipulatif, dan tidak mengklaim mengetahui perasaan pasangan secara pasti.
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-8 flex h-[calc(100vh-14rem)] min-h-[500px] flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-brand-pink/35 bg-white/85 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-roseDark text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-dark">Love Assistant</p>
                <p className="text-[11px] text-brand-brown">Server-Side AI • Bahasa Indonesia</p>
              </div>
            </div>
            <Badge variant={aiConfigured ? "emerald" : "pink"}>
              {aiConfigured ? "AI API Aktif" : "Mode Lokal Siap"}
            </Badge>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {currentMessages.length === 0 ? (
              <div className="space-y-5 py-6">
                <div className="text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-brand-roseDark" />
                  <h3 className="mt-2 text-base font-bold text-brand-dark">
                    Ada yang ingin kamu diskusikan hari ini?
                  </h3>
                  <p className="mt-1 text-xs text-brand-brown">
                    Pilih topik cepat di bawah atau ketik pertanyaanmu sendiri.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {AI_QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.id}
                      type="button"
                      disabled={loading}
                      onClick={() => sendPrompt(qp.prompt, qp.id)}
                      className="rounded-2xl border border-brand-pink/40 bg-white/90 p-3.5 text-left transition hover:border-brand-roseDark hover:bg-brand-pink/15"
                    >
                      <p className="text-xs font-bold text-brand-roseDark">{qp.label}</p>
                      <p className="mt-1 text-xs text-brand-brown line-clamp-2">{qp.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-soft ${
                      msg.role === "user"
                        ? "rounded-br-md bg-gradient-to-br from-brand-rose to-brand-roseDark text-white"
                        : "rounded-bl-md bg-white text-brand-dark border border-brand-pink/35"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-brand-pink/25 px-4 py-2.5 text-xs text-brand-brown animate-pulse">
                  Love Assistant sedang menuliskan saran hangat untukmu...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="flex items-center gap-2 border-t border-brand-pink/35 bg-white/90 p-3.5"
          >
            <input
              type="text"
              placeholder="Tanyakan ide kencan, draf surat cinta, atau tips komunikasi sehat..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-2xl border border-brand-rose/35 bg-brand-cream/60 px-4 py-2.5 text-sm text-brand-dark outline-none focus:border-brand-roseDark focus:bg-white"
            />
            <Button type="submit" loading={loading} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
              Kirim
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
