import { describe, expect, it } from "vitest";
import {
  calculateRelationshipDuration,
  computeGardenUpdate,
  getDailyRomanticGreeting,
  parseSpotifyEmbedUrl,
  parseYoutubeEmbedUrl,
  resolvePlantStage,
  scoreQuizAttempt,
} from "@/lib/utils/relationship";
import {
  buildLoveAssistantSystemPrompt,
  generateLocalLoveAssistantReply,
} from "@/lib/ai/love-assistant";
import {
  calendarEventSchema,
  loveLetterSchema,
  onboardingSchema,
  registerSchema,
} from "@/lib/utils/validators";

describe("Relationship Duration & Anniversary Countdown", () => {
  it("computes exact years, months, days, totalDays and countdown dynamically", () => {
    const ref = new Date(2026, 10, 23); // 2026-11-23
    const result = calculateRelationshipDuration("2024-02-14", ref);
    expect(result).not.toBeNull();
    expect(result!.years).toBe(2);
    expect(result!.months).toBe(9);
    expect(result!.days).toBe(9);
    expect(result!.totalDays).toBeGreaterThan(1000);
    expect(result!.isAnniversaryToday).toBe(false);
    expect(result!.nextAnniversaryDate).toBe("2027-02-14");
    expect(result!.nextAnniversaryNumber).toBe(3);
  });

  it("detects when today is the couple anniversary", () => {
    const ref = new Date(2026, 4, 10); // 2026-05-10
    const result = calculateRelationshipDuration("2023-05-10", ref);
    expect(result!.isAnniversaryToday).toBe(true);
    expect(result!.daysUntilNextAnniversary).toBe(0);
    expect(result!.years).toBe(3);
  });

  it("returns null gracefully when anniversary date is unset", () => {
    expect(calculateRelationshipDuration(null)).toBeNull();
    expect(calculateRelationshipDuration("")).toBeNull();
  });
});

describe("Dynamic Romantic Greeting", () => {
  it("uses dynamic user and partner names without hardcoding", () => {
    const g = getDailyRomanticGreeting("Alya", "Rafi", null, 8);
    expect(g.headline).toContain("Selamat pagi");
    expect(g.headline).toContain("Alya");
    expect(g.subtext).toContain("Rafi");
  });

  it("prefers custom romantic message when set by user", () => {
    const g = getDailyRomanticGreeting("Alya", "Rafi", "Tetap saling genggam ya!", 21);
    expect(g.headline).toContain("Selamat malam");
    expect(g.subtext).toBe("Tetap saling genggam ya!");
  });
});

describe("Virtual Love Garden Growth Engine", () => {
  it("advances growth points, levels, flowers and plant stages accurately", () => {
    expect(resolvePlantStage(0)).toBe("seed");
    expect(resolvePlantStage(35)).toBe("sprout");
    expect(resolvePlantStage(100)).toBe("sapling");
    expect(resolvePlantStage(200)).toBe("blooming");
    expect(resolvePlantStage(350)).toBe("flourishing");
    expect(resolvePlantStage(520)).toBe("eternal_tree");

    const updated = computeGardenUpdate(
      {
        growth_points: 40,
        water_count: 1,
        sunlight_count: 0,
        fertilizer_count: 0,
        flowers_bloomed: 1,
      },
      "fertilize"
    );
    expect(updated.growth_points).toBe(65);
    expect(updated.level).toBe(2);
    expect(updated.fertilizer_count).toBe(1);
    expect(updated.plant_stage).toBe("sprout");
  });
});

describe("Playlist Official Embed URL Parsers", () => {
  it("parses valid Spotify track/playlist URLs to official embed URLs", () => {
    expect(parseSpotifyEmbedUrl("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=123")).toBe(
      "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator"
    );
    expect(parseSpotifyEmbedUrl("https://evil.example.com/track/123")).toBeNull();
  });

  it("parses valid YouTube watch, youtu.be, and shorts URLs to privacy-enhanced embed URLs", () => {
    expect(parseYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(parseYoutubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(parseYoutubeEmbedUrl("not-a-url")).toBeNull();
  });
});

describe("Couple Quiz Scoring & Compatibility", () => {
  it("scores case-insensitive answers and computes compatibility percent", () => {
    const res = scoreQuizAttempt(
      [
        { id: "q1", correct_answer: "Matcha Latte" },
        { id: "q2", correct_answer: "Bandung" },
        { id: "q3", correct_answer: "Kucing" },
      ],
      {
        q1: "  matcha latte ",
        q2: "Jakarta",
        q3: "KUCING",
      }
    );
    expect(res.totalQuestions).toBe(3);
    expect(res.correctCount).toBe(2);
    expect(res.score).toBe(200);
    expect(res.compatibilityPercent).toBe(66.67);
  });
});

describe("AI Love Assistant Ethical System Prompt & Zod Validators", () => {
  it("enforces Indonesian primary language and healthy non-manipulative boundaries", () => {
    const prompt = buildLoveAssistantSystemPrompt({
      userNickname: "Nadia",
      partnerNickname: "Dimas",
      coupleSpaceName: "Rumah Kita",
      anniversaryDate: "2024-06-01",
    });
    expect(prompt).toContain("Bahasa Indonesia");
    expect(prompt).toContain("JANGAN PERNAH mengklaim mengetahui");
    expect(prompt).toContain("TIDAK PERNAH manipulatif");
    expect(prompt).toContain("Nadia");
    expect(prompt).toContain("Dimas");
  });

  it("provides personalized Indonesian local fallback replies without requiring an external key", () => {
    const res = generateLocalLoveAssistantReply("Buatkan ucapan anniversary dong", {
      userNickname: "Nadia",
      partnerNickname: "Dimas",
      coupleSpaceName: "Rumah Kita",
      anniversaryDate: "2024-06-01",
    });
    expect(res.mode).toBe("local_fallback");
    expect(res.reply).toContain("Dimas");
    expect(res.reply.toLowerCase()).toContain("anniversary");
  });

  it("validates onboarding with optional Step 2 partner info", () => {
    const ok = onboardingSchema.safeParse({
      fullName: "Nadia Putri",
      nickname: "Nadia",
      coupleSpaceName: "Dunia Kecil Kita",
      themePreset: "soft-pink",
      fontFamily: "poppins",
      animationStyle: "gentle",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects weak registration passwords and invalid payloads", () => {
    expect(
      registerSchema.safeParse({
        email: "user@example.com",
        password: "123",
        fullName: "User",
      }).success
    ).toBe(false);

    expect(
      loveLetterSchema.safeParse({
        title: "Judul",
        content: "Isi surat cinta",
        designTheme: "rose-petal",
        isSecret: true,
      }).success
    ).toBe(true);

    expect(
      calendarEventSchema.safeParse({
        title: "Anniversary",
        eventType: "anniversary",
        eventDate: "2026-08-17",
        reminderDaysBefore: 7,
        isRecurringYearly: true,
      }).success
    ).toBe(true);
  });
});
