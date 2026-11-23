# Panduan Konfigurasi AI Love Assistant

Fitur **AI Love Assistant** (`/ai-assistant`) memanggil endpoint server-only `/api/ai/chat` dan menyimpan seluruh riwayat percakapan secara privat di database MySQL (`ai_conversations` & `ai_messages`).

## 1. Mode Lokal Bawaan (Otomatis Aktif & Gratis Tanpa API Key)
Jika `AI_API_KEY` belum diisi di `.env.local`, **AI Love Assistant tetap langsung berfungsi** menggunakan mesin panduan Bahasa Indonesia lokal bawaan (`src/lib/ai/love-assistant.ts`) yang melayani 8 topik utama (pesan romantis, surat cinta, ide kencan, ide kejutan, ucapan anniversary, permintaan maaf, saran komunikasi sehat, dan pertanyaan deep talk) serta tetap menghormati batasan etika komunikasi sehat.

## 2. Upgrade ke LLM Generatif Penuh (Gratis atau Berbayar)
Jika ingin menggunakan model AI generatif penuh, tambahkan 3 variabel berikut di `.env.local` (hanya dibaca di server, tidak pernah dikirim ke browser):

```env
AI_API_KEY=isi_api_key_kamu
AI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.0-flash
```

### Pilihan Provider yang Didukung

| Provider | Biaya | `AI_API_BASE_URL` | Contoh `AI_MODEL` |
|----------|-------|-------------------|-------------------|
| **Google Gemini (AI Studio)** | Free tier gratis | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` |
| **Groq** | Free tier gratis | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **OpenRouter** | Ada model `:free` | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| **OpenAI** | Berbayar | `https://api.openai.com/v1` | `gpt-4o-mini` |

Setelah mengubah `.env.local`, restart `npm run dev` di Terminal VS Code.
