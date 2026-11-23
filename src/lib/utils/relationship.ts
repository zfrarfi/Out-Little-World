import {
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
  addYears,
  addMonths,
  format,
  isValid,
  parseISO,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { GardenActionType, PlantStage } from "@/types/database";
import type { RelationshipDuration } from "@/types/domain";

/**
 * Calculates exact relationship duration & next anniversary countdown dynamically
 * from user-entered anniversary date (never hardcoded).
 */
export function calculateRelationshipDuration(
  anniversaryDateStr: string | null | undefined,
  referenceDate: Date = new Date()
): RelationshipDuration | null {
  if (!anniversaryDateStr) return null;
  const start = parseISO(anniversaryDateStr);
  if (!isValid(start)) return null;

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (startDay > today) {
    const daysUntilStart = differenceInCalendarDays(startDay, today);
    return {
      totalDays: 0,
      years: 0,
      months: 0,
      days: 0,
      daysUntilNextAnniversary: daysUntilStart,
      nextAnniversaryNumber: 0,
      nextAnniversaryDate: format(startDay, "yyyy-MM-dd"),
      isAnniversaryToday: false,
    };
  }

  const totalDays = differenceInCalendarDays(today, startDay);
  const years = differenceInYears(today, startDay);
  const afterYears = addYears(startDay, years);
  const months = differenceInMonths(today, afterYears);
  const afterMonths = addMonths(afterYears, months);
  const days = differenceInCalendarDays(today, afterMonths);

  const isAnniversaryToday =
    today.getMonth() === startDay.getMonth() &&
    today.getDate() === startDay.getDate() &&
    years >= 1;

  let nextAnniv = new Date(today.getFullYear(), startDay.getMonth(), startDay.getDate());
  let nextNumber = today.getFullYear() - startDay.getFullYear();

  if (nextAnniv < today || (nextAnniv.getTime() === today.getTime() && years === 0)) {
    nextAnniv = new Date(today.getFullYear() + 1, startDay.getMonth(), startDay.getDate());
    nextNumber = today.getFullYear() + 1 - startDay.getFullYear();
  }

  const daysUntilNextAnniversary = isAnniversaryToday
    ? 0
    : differenceInCalendarDays(nextAnniv, today);

  return {
    totalDays,
    years,
    months,
    days,
    daysUntilNextAnniversary,
    nextAnniversaryNumber: Math.max(1, nextNumber),
    nextAnniversaryDate: format(nextAnniv, "yyyy-MM-dd"),
    isAnniversaryToday,
  };
}

export function getDailyRomanticGreeting(
  userNickname: string,
  partnerNickname: string,
  customMessage?: string | null,
  hour: number = new Date().getHours()
): { headline: string; subtext: string } {
  const safeUser = userNickname.trim() || "Sayang";
  const safePartner = partnerNickname.trim() || "Pasanganmu";

  let timeGreeting = "Halo";
  if (hour >= 4 && hour < 11) timeGreeting = "Selamat pagi";
  else if (hour >= 11 && hour < 15) timeGreeting = "Selamat siang";
  else if (hour >= 15 && hour < 18) timeGreeting = "Selamat sore";
  else timeGreeting = "Selamat malam";

  const headline = `${timeGreeting}, ${safeUser}`;
  const subtext =
    customMessage?.trim() ||
    `Semoga harimu seindah setiap cerita kecil yang kamu dan ${safePartner} simpan di sini.`;

  return { headline, subtext };
}

export const GARDEN_ACTION_POINTS: Record<
  GardenActionType,
  { points: number; label: string; description: string }
> = {
  water: {
    points: 15,
    label: "Siram Tanaman",
    description: "Memberikan kesegaran & +15 poin pertumbuhan",
  },
  sunlight: {
    points: 12,
    label: "Sinar Matahari",
    description: "Menghangatkan daun & +12 poin pertumbuhan",
  },
  fertilize: {
    points: 25,
    label: "Pupuk Cinta",
    description: "Nutrisi ekstra & +25 poin pertumbuhan",
  },
  love_talk: {
    points: 18,
    label: "Bisikan Sayang",
    description: "Menyemangati bunga mekar & +18 poin pertumbuhan",
  },
};

export function resolvePlantStage(points: number): PlantStage {
  if (points >= 500) return "eternal_tree";
  if (points >= 320) return "flourishing";
  if (points >= 180) return "blooming";
  if (points >= 90) return "sapling";
  if (points >= 30) return "sprout";
  return "seed";
}

export function computeGardenUpdate(
  current: {
    growth_points: number;
    water_count: number;
    sunlight_count: number;
    fertilizer_count: number;
    flowers_bloomed: number;
  },
  action: GardenActionType
) {
  const earned = GARDEN_ACTION_POINTS[action].points;
  const nextPoints = current.growth_points + earned;
  const nextLevel = Math.floor(nextPoints / 50) + 1;
  const nextStage = resolvePlantStage(nextPoints);
  const nextFlowers = Math.floor(nextPoints / 40);

  return {
    growth_points: nextPoints,
    level: nextLevel,
    plant_stage: nextStage,
    water_count: current.water_count + (action === "water" ? 1 : 0),
    sunlight_count: current.sunlight_count + (action === "sunlight" ? 1 : 0),
    fertilizer_count: current.fertilizer_count + (action === "fertilize" ? 1 : 0),
    flowers_bloomed: Math.max(current.flowers_bloomed, nextFlowers),
    earnedPoints: earned,
  };
}

export function parseSpotifyEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (!parsed.hostname.includes("spotify.com")) return null;
    const match = parsed.pathname.match(/\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
  } catch {
    return null;
  }
}

export function parseYoutubeEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    let videoId: string | null = null;
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || null;
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      }
    }
    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

export function scoreQuizAttempt(
  questions: Array<{ id: string; correct_answer: string }>,
  answersByQuestionId: Record<string, string>
): {
  totalQuestions: number;
  correctCount: number;
  score: number;
  compatibilityPercent: number;
  graded: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>;
} {
  const graded = questions.map((q) => {
    const selected = (answersByQuestionId[q.id] ?? "").trim();
    const expected = q.correct_answer.trim();
    const isCorrect =
      selected.length > 0 && selected.toLowerCase() === expected.toLowerCase();
    return {
      questionId: q.id,
      selectedAnswer: selected,
      isCorrect,
    };
  });

  const totalQuestions = questions.length;
  const correctCount = graded.filter((g) => g.isCorrect).length;
  const score = correctCount * 100;
  const compatibilityPercent =
    totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;

  return {
    totalQuestions,
    correctCount,
    score,
    compatibilityPercent,
    graded,
  };
}

export function formatDateIndo(dateStr: string | null | undefined, pattern = "d MMMM yyyy"): string {
  if (!dateStr) return "-";
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return dateStr;
  return format(parsed, pattern, { locale: idLocale });
}

export function formatDateTimeIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const normalized = dateStr.includes(" ") && !dateStr.includes("T")
    ? dateStr.replace(" ", "T")
    : dateStr;
  const parsed = parseISO(normalized);
  if (!isValid(parsed)) return dateStr;
  return format(parsed, "d MMM yyyy, HH:mm", { locale: idLocale });
}
