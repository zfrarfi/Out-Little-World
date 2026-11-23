import { isAiConfigured } from "@/lib/db/env";
import { calculateRelationshipDuration } from "@/lib/utils/relationship";

export interface AiChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface LoveAssistantContext {
  userNickname: string;
  partnerNickname: string;
  coupleSpaceName: string;
  anniversaryDate: string | null;
}

export interface LoveAssistantResult {
  reply: string;
  model: string;
  mode: "external_api" | "local_fallback";
}

export const AI_QUICK_PROMPTS = [
  {
    id: "romantic-note",
    label: "Pesan Romantis",
    prompt: "Buatkan pesan romantis yang tulus, hangat, dan tidak berlebihan untuk pasangan saya hari ini.",
  },
  {
    id: "love-letter",
    label: "Surat Cinta",
    prompt: "Bantu saya menulis surat cinta yang hangat untuk mengungkapkan rasa terima kasih saya kepada pasangan.",
  },
  {
    id: "date-ideas",
    label: "Ide Kencan",
    prompt: "Berikan 5 ide kencan kreatif (campuran di rumah dan di luar) yang berkualitas dan ramah budget.",
  },
  {
    id: "surprise-ideas",
    label: "Ide Kejutan",
    prompt: "Berikan ide kejutan kecil yang manis dan penuh makna tanpa harus mahal.",
  },
  {
    id: "anniversary",
    label: "Ucapan Anniversary",
    prompt: "Buatkan beberapa pilihan ucapan anniversary yang menyentuh hati dalam bahasa Indonesia.",
  },
  {
    id: "apology",
    label: "Permintaan Maaf",
    prompt: "Bantu saya menyusun permintaan maaf yang tulus, bertanggung jawab, dan menghargai perasaan pasangan.",
  },
  {
    id: "healthy-comm",
    label: "Komunikasi Sehat",
    prompt: "Bagaimana cara menyampaikan perasaan kecewa secara lembut tanpa menyalahkan pasangan?",
  },
  {
    id: "deep-questions",
    label: "Pertanyaan Deep Talk",
    prompt: "Berikan 7 pertanyaan seru dan bermakna untuk mengenal pasangan lebih dalam malam ini.",
  },
] as const;

export function buildLoveAssistantSystemPrompt(ctx: LoveAssistantContext): string {
  const anniversaryInfo = ctx.anniversaryDate
    ? `Tanggal jadian mereka: ${ctx.anniversaryDate}.`
    : "Tanggal jadian belum diisi.";

  return [
    "Kamu adalah Love Assistant, asisten hubungan hangat, empatik, dan bijaksana di platform pribadi 'Our Little World'.",
    "BAHASA UTAMA: Bahasa Indonesia yang natural, hangat, sopan, dan mudah dipahami.",
    `Konteks ruang pasangan (gunakan secara halus bila relevan): Ruang "${ctx.coupleSpaceName}", pengguna "${ctx.userNickname}", pasangan "${ctx.partnerNickname}". ${anniversaryInfo}`,
    "KEMAMPUAN UTAMA:",
    "- Membantu menulis pesan romantis, surat cinta, ucapan anniversary, dan permintaan maaf yang tulus.",
    "- Memberikan ide kencan, ide kejutan bermakna, serta pertanyaan untuk mengenal pasangan lebih dalam.",
    "- Memberikan saran komunikasi sehat, empatik, dan konstruktif.",
    "BATASAN & ETIKA WAJIB (TIDAK BOLEH DILANGGAR):",
    "1. JANGAN PERNAH mengklaim mengetahui isi hati, pikiran, atau perasaan pasangan secara pasti (misal hindari 'dia pasti mencintaimu' atau 'pasanganmu pasti sedang marah karena...'). Sebaliknya, dorong komunikasi terbuka secara langsung.",
    "2. Berikan saran yang sehat, menghargai batasan (boundaries) kedua pihak, dan TIDAK PERNAH manipulatif, posesif, atau menekan secara emosional.",
    "3. Jika pengguna menceritakan konflik sensitif, bantu mereka mengekspresikan perasaan menggunakan 'I-statements' (pernyataan 'aku merasa...') daripada menyalahkan.",
    "4. Susun jawaban dengan rapi, hangat, ringkas, dan praktis langsung bisa dipakai atau disesuaikan pengguna.",
  ].join("\n");
}

/**
 * Built-in local Indonesian Love Assistant fallback when external AI_API_KEY
 * is not configured yet. Transparently labeled as local mode in the UI,
 * while strictly adhering to healthy communication and ethical boundaries.
 */
export function generateLocalLoveAssistantReply(
  userMessage: string,
  ctx: LoveAssistantContext,
  topic?: string | null
): LoveAssistantResult {
  const q = `${topic ?? ""} ${userMessage}`.toLowerCase();
  const me = ctx.userNickname.trim() || "Aku";
  const partner = ctx.partnerNickname.trim() || "Kamu";
  const duration = calculateRelationshipDuration(ctx.anniversaryDate);
  const daysNote = duration
    ? `${duration.totalDays} hari (${duration.years} tahun ${duration.months} bulan)`
    : "perjalanan yang kita jalani bersama";

  let reply: string;

  if (q.includes("maaf") || q.includes("apology") || q.includes("salah")) {
    reply = [
      `Halo ${me}, ini draf permintaan maaf yang tulus, bertanggung jawab, dan menghargai ruang ${partner} tanpa memaksa:`,
      "",
      `> "Hai ${partner}, aku mau minta maaf dengan tulus atas sikap/ucapanku tadi. Aku sadar hal itu bisa membuatmu tidak nyaman, dan itu tanggung jawabku untuk memperbaikinya. Aku tidak memintamu langsung melupakannya—ambil waktu yang kamu butuhkan. Kalau kamu sudah siap bicara, aku siap mendengarkan sudut pandangmu dengan tenang."`,
      "",
      "**Tips sehat sebelum mengirim:**",
      "- Hindari kata *'tapi'* yang membela diri setelah minta maaf.",
      "- Tanyakan langsung bagaimana perasaan dan kebutuhan pasangan, tanpa menebak-nebak isi hatinya.",
      "- Berikan ruang jika pasangan masih butuh waktu menenangkan diri.",
    ].join("\n");
  } else if (
    q.includes("komunikasi") ||
    q.includes("kecewa") ||
    q.includes("healthy-comm") ||
    q.includes("konflik") ||
    q.includes("marah") ||
    q.includes("bertengkar")
  ) {
    reply = [
      `Menyampaikan rasa kecewa dengan lembut adalah tanda komunikasi yang sehat, ${me}. Karena kita tidak pernah bisa mengetahui secara pasti apa yang ada di pikiran ${partner} tanpa bertanya langsung, gunakan pola **"I-Statement"** agar tidak terdengar menyalahkan:`,
      "",
      "**1. Rumus Sederhana (Perasaan + Situasi + Harapan):**",
      `> *"Aku merasa [sedih/kurang nyaman] ketika [situasi spesifik terjadi]. Aku ingin kita bisa [harapan yang jelas], gimana menurutmu?"*`,
      "",
      "**2. Contoh Kalimat Siap Pakai:**",
      `> *"Hai ${partner}, boleh ngobrol sebentar saat kamu lagi santai? Aku kemarin merasa agak sedih waktu rencana kita berubah mendadak. Aku paham mungkin kamu juga punya kesibukan, bolehkah ke depannya kita saling kabari lebih awal supaya aku bisa menyesuaikan juga?"*`,
      "",
      "**3. Prinsip Batasan Sehat:**",
      "- Pilih waktu yang tenang, bukan saat emosi memuncak.",
      "- Fokus pada satu topik spesifik dan dengarkan respons pasangan dengan terbuka.",
    ].join("\n");
  } else if (q.includes("anniversary") || q.includes("jadian") || q.includes("hari jadi")) {
    reply = [
      `Berikut 3 pilihan ucapan anniversary hangat untuk ${partner} (mengenang ${daysNote}):`,
      "",
      "**Pilihan 1 — Singkat & Tulus:**",
      `> "Selamat anniversary, ${partner}! Terima kasih sudah menemani ${daysNote} dengan sabar, tawa, dan cerita-cerita kecil yang berharga. Semoga kita selalu saling bertumbuh dan menjaga komunikasi dengan baik."`,
      "",
      "**Pilihan 2 — Puitis Lembut:**",
      `> "Dari sekian banyak hari yang lewat, hari-hari bersamamu di ${ctx.coupleSpaceName} selalu jadi bagian yang paling kusyukuri. Selamat merayakan hari jadi kita, ${partner}. Terima kasih sudah menjadi rumah yang hangat."`,
      "",
      "**Pilihan 3 — Santai & Ceria:**",
      `> "Happy Anniversary, ${partner}! Nggak terasa sudah sejauh ini bareng-bareng. Siap bikin lebih banyak kenangan baru dan mencentang Bucket List kita tahun ini?"`,
    ].join("\n");
  } else if (q.includes("surat") || q.includes("love-letter")) {
    reply = [
      `Ini draf surat cinta hangat yang bisa langsung kamu salin ke fitur **Love Letters** untuk ${partner}:`,
      "",
      `**Judul:** Terima Kasih Sudah Hadir di Hariku`,
      "",
      `Untuk ${partner},`,
      "",
      `Hari ini aku cuma ingin meluangkan waktu sebentar untuk bilang terima kasih. Terima kasih untuk hal-hal kecil yang mungkin sering terlihat sederhana—dari obrolan singkat kita, perhatianmu, sampai caramu mendengarkan ceritaku di hari yang melelahkan.`,
      "",
      `Aku tahu tidak setiap hari selalu mudah, tapi aku bersyukur kita selalu berusaha saling memahami dan menghargai satu sama lain. Semoga kamu juga selalu merasa nyaman, dihargai, dan punya ruang untuk menjadi dirimu sendiri di dekatku.`,
      "",
      `Jaga kesehatan selalu ya. Aku senang bisa terus menulis cerita baru bersamamu.`,
      "",
      `Dengan hangat,`,
      `${me}`,
    ].join("\n");
  } else if (q.includes("kencan") || q.includes("date")) {
    reply = [
      `Berikut 5 ide kencan kreatif dan berkualitas untuk kamu dan ${partner}:`,
      "",
      "1. **Home Movie & Homemade Snack Night** — Masing-masing pilih 1 film favorit, buat camilan bersama, lalu diskusikan adegan favorit kalian.",
      "2. **Photo Walk & Scrapbook Date** — Jalan sore sambil memotret 5 hal lucu/indah, lalu unggah hasilnya ke fitur **Our Memories**.",
      "3. **Coffee Shop Deep Talk** — Kunjungi kafe tenang yang belum pernah dicoba, matikan notifikasi HP 1 jam, dan mainkan **Couple Quiz**.",
      "4. **Masak Menu Baru Bersama** — Pilih 1 resep dari negara lain dengan budget terjangkau dan bagi tugas memasak bersama.",
      "5. **Piknik Taman + Playlist Kita** — Bawa tikar kecil, camilan favorit, dan putar lagu dari fitur **Our Playlist**.",
      "",
      "Tips: Tanyakan juga preferensi serta energi pasangan hari ini agar kencan terasa nyaman bagi kalian berdua.",
    ].join("\n");
  } else if (q.includes("kejutan") || q.includes("surprise")) {
    reply = [
      `Ide kejutan kecil yang manis, tulus, dan ramah budget untuk ${partner}:`,
      "",
      "1. **Surat Terjadwal di Love Letters** — Tulis surat rahasia hari ini dan kunci jadwal pembukaannya tepat di pagi hari spesialnya.",
      "2. **Isi 5 Gulungan Baru di Jar of Love** — Masukkan catatan kategori *Ketika Rindu*, *Motivasi*, dan *Romantis* secara diam-diam.",
      "3. **Playlist Khusus 5 Lagu** — Tambahkan 5 lagu di **Our Playlist** lengkap dengan alasan kenapa tiap lagu mengingatkanmu padanya.",
      "4. **Camilan Favorit + Catatan Kecil** — Kirim minuman/makanan favoritnya saat hari kerja/kuliah yang padat dengan pesan penyemangat singkat.",
      "5. **Update Timeline Kenangan** — Lengkapi foto momen lama di **Relationship Timeline** lalu ajak dia melihatnya bersama.",
    ].join("\n");
  } else if (q.includes("deep") || q.includes("pertanyaan") || q.includes("kenal")) {
    reply = [
      `Ini 7 pertanyaan seru & bermakna untuk mengenal ${partner} lebih dalam malam ini:`,
      "",
      "1. Momen kecil apa minggu ini yang diam-diam bikin kamu tersenyum?",
      "2. Cara dukungan seperti apa yang paling kamu sukai ketika kamu sedang lelah atau stres?",
      "3. Kenangan apa dari kita berdua yang paling sering muncul di pikiranmu?",
      "4. Ada kebiasaan kecil atau hobi baru apa yang sedang ingin kamu coba tahun ini?",
      "5. Batasan pribadi atau hal kecil apa yang penting untuk selalu kita jaga agar sama-sama nyaman?",
      "6. Kalau kita punya 3 hari bebas ke mana saja tanpa khawatir jadwal, kamu ingin kita melakukan apa?",
      "7. Hal apa dari dirimu sendiri yang paling kamu banggakan akhir-akhir ini?",
      "",
      "Kamu juga bisa memasukkan pertanyaan favorit kalian ke fitur **Couple Quiz**!",
    ].join("\n");
  } else if (q.includes("romantis") || q.includes("romantic") || q.includes("pesan")) {
    reply = [
      `Ini 3 pilihan pesan romantis yang hangat dan natural untuk ${partner}:`,
      "",
      `1. **Manis & Ringan:** *"Hai ${partner}, cuma mau bilang semoga harimu lancar hari ini. Jangan lupa makan dan istirahat sebentar ya—aku senang banget bisa berbagi hari-hariku bareng kamu."*`,
      `2. **Apresiasi Tulus:** *"Terima kasih ya sudah jadi teman cerita terbaikku. Hal-hal sederhana terasa jauh lebih menyenangkan kalau dibagi bareng kamu."*`,
      `3. **Saat Rindu:** *"Lagi kepikiran kamu nih. Nanti kalau kamu sudah senggang dan nggak capek, boleh cerita gimana harimu hari ini?"*`,
    ].join("\n");
  } else {
    reply = [
      `Terima kasih sudah berbagi, ${me}. Aku siap membantu kamu dan ${partner} merangkai kata atau ide yang hangat dan sehat.`,
      "",
      "Kamu bisa menanyakan secara spesifik, misalnya:",
      "- *\"Buatkan pesan romantis singkat untuk pagi ini\"*",
      "- *\"Bantu tulis surat cinta untuk fitur Love Letters\"*",
      "- *\"Berikan 5 ide kencan hemat akhir pekan\"*",
      "- *\"Bantu susun permintaan maaf yang tulus\"*",
      "- *\"Cara menyampaikan rasa kecewa dengan komunikasi sehat\"*",
      "- *\"7 pertanyaan deep talk untuk malam ini\"*",
      "",
      "Ingat, saran terbaik selalu dimulai dari komunikasi terbuka dan saling menghargai batasan satu sama lain.",
    ].join("\n");
  }

  return {
    reply,
    model: "local-love-assistant-id",
    mode: "local_fallback",
  };
}

export async function generateLoveAssistantReply(
  messages: AiChatMessageInput[],
  context: LoveAssistantContext,
  topic?: string | null
): Promise<LoveAssistantResult> {
  if (!isAiConfigured()) {
    const latestUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    return generateLocalLoveAssistantReply(latestUserMsg, context, topic);
  }

  const apiKey = process.env.AI_API_KEY!.trim();
  const baseUrl = (process.env.AI_API_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";

  const systemPrompt = buildLoveAssistantSystemPrompt(context);
  const recentMessages = messages.slice(-16);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      max_tokens: 900,
      messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Provider AI mengembalikan status ${response.status}. Periksa AI_API_KEY, AI_API_BASE_URL, dan kuota model Anda.${
        errorText ? ` Detail: ${errorText.slice(0, 180)}` : ""
      }`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Respons AI kosong. Silakan coba kirim ulang pesan Anda.");
  }

  return { reply, model, mode: "external_api" };
}
