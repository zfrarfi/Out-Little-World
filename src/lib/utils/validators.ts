import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalText = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null));

export const registerSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(100),
  inviteCode: optionalText(24),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const onboardingSchema = z.object({
  // Step 1 — Your Profile
  fullName: z.string().trim().min(2, "Nama lengkap wajib diisi").max(100),
  nickname: z.string().trim().min(1, "Nama panggilan wajib diisi").max(50),
  avatarPath: optionalText(500),
  birthDate: optionalDate,
  bio: optionalText(400),
  gender: z
    .enum(["male", "female", "non_binary", "prefer_not_to_say"])
    .optional()
    .nullable(),
  // Step 2 — Partner (optional!)
  partnerName: optionalText(100),
  partnerNickname: optionalText(50),
  partnerAvatarPath: optionalText(500),
  partnerBirthDate: optionalDate,
  partnerBio: optionalText(400),
  // Step 3 — Relationship
  firstMetOnlineDate: optionalDate,
  firstMetInPersonDate: optionalDate,
  anniversaryDate: optionalDate,
  firstMeetingPlace: optionalText(160),
  originStory: optionalText(2000),
  firstPhotoPath: optionalText(500),
  mainPhotoPath: optionalText(500),
  // Step 4 — Personalization
  coupleSpaceName: z.string().trim().min(2, "Nama ruang pasangan wajib diisi").max(120),
  themePreset: z.enum(["soft-pink", "warm-rose", "lavender-blush", "peach-cream", "berry-silk"]),
  fontFamily: z.enum(["poppins", "nunito"]),
  animationStyle: z.enum(["gentle", "playful", "minimal"]),
  dashboardBannerPath: optionalText(500),
  romanticMessage: optionalText(300),
});

export const memoryAlbumSchema = z.object({
  title: z.string().trim().min(1, "Judul album wajib diisi").max(120),
  description: optionalText(500),
});

export const memorySchema = z.object({
  title: z.string().trim().min(1, "Judul kenangan wajib diisi").max(160),
  caption: optionalText(1200),
  albumId: optionalText(64),
  mediaType: z.enum(["photo", "video"]),
  mediaPath: z.string().trim().min(1, "File media wajib diunggah"),
  memoryDate: z.string().trim().min(8, "Tanggal kenangan wajib diisi"),
  location: optionalText(160),
});

export const loveLetterSchema = z.object({
  title: z.string().trim().min(1, "Judul surat wajib diisi").max(180),
  content: z.string().trim().min(1, "Isi surat tidak boleh kosong").max(10000),
  designTheme: z.enum([
    "classic-cream",
    "rose-petal",
    "vintage-wax",
    "starlight-pink",
    "minimal-blush",
  ]),
  isSecret: z.boolean().default(false),
  scheduledOpenAt: optionalDate,
});

export const calendarEventSchema = z.object({
  title: z.string().trim().min(1, "Judul acara wajib diisi").max(160),
  description: optionalText(1000),
  eventType: z.enum(["anniversary", "birthday", "date", "special"]),
  eventDate: z.string().trim().min(8, "Tanggal acara wajib diisi"),
  eventTime: optionalText(20),
  location: optionalText(160),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).default(1),
  isRecurringYearly: z.boolean().default(false),
});

export const dailyCheckinSchema = z.object({
  mood: z.enum([
    "very_happy",
    "happy",
    "calm",
    "tired",
    "sad",
    "anxious",
    "missing_you",
    "loved",
  ]),
  emoji: z.string().trim().min(1).max(16),
  happinessLevel: z.coerce.number().int().min(1).max(10),
  dailyStory: optionalText(1500),
  messageToPartner: optionalText(600),
  checkinDate: optionalDate,
});

export const bucketListSchema = z.object({
  title: z.string().trim().min(1, "Judul impian wajib diisi").max(180),
  description: optionalText(1000),
  category: z.enum(["travel", "food", "adventure", "home", "milestone", "creative", "other"]),
  targetDate: optionalDate,
});

export const quizQuestionSchema = z.object({
  questionText: z.string().trim().min(3, "Pertanyaan minimal 3 karakter").max(500),
  questionType: z.enum(["multiple_choice", "guess_answer"]),
  optionA: optionalText(200),
  optionB: optionalText(200),
  optionC: optionalText(200),
  optionD: optionalText(200),
  correctAnswer: z.string().trim().min(1, "Jawaban benar wajib diisi").max(200),
  category: z.enum(["about_us", "favorites", "memories", "habits", "future"]),
});

export const playlistSchema = z.object({
  title: z.string().trim().min(1, "Judul lagu wajib diisi").max(180),
  artist: z.string().trim().min(1, "Nama penyanyi wajib diisi").max(160),
  spotifyUrl: optionalText(500),
  youtubeUrl: optionalText(500),
  coverUrl: optionalText(500),
  memoryNote: optionalText(800),
  category: z.enum(["our_anthem", "date_night", "road_trip", "missing_you", "chill", "happy"]),
});

export const loveJarSchema = z.object({
  category: z.enum(["romantic", "motivation", "encouragement", "when_sad", "when_missing"]),
  message: z.string().trim().min(2, "Pesan minimal 2 karakter").max(1500),
});

export const timelineSchema = z.object({
  title: z.string().trim().min(1, "Judul momen wajib diisi").max(180),
  milestoneType: z.enum([
    "first_know",
    "first_meet",
    "first_date",
    "anniversary",
    "vacation",
    "special",
    "memory",
  ]),
  eventDate: z.string().trim().min(8, "Tanggal momen wajib diisi"),
  description: optionalText(2000),
  location: optionalText(160),
  photoPath: optionalText(500),
});

export const virtualHugSchema = z.object({
  hugStyle: z.enum(["warm_hug", "tight_squeeze", "forehead_kiss", "comfort_hug"]),
  message: z.string().trim().min(1, "Tulis pesan manis untuk pelukanmu").max(500),
});

export const aiChatRequestSchema = z.object({
  conversationId: optionalText(64),
  message: z.string().trim().min(1, "Pesan tidak boleh kosong").max(2500),
  topic: optionalText(80),
});
