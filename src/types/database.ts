export type GenderOption = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type ThemePreset = "soft-pink" | "warm-rose" | "lavender-blush" | "peach-cream" | "berry-silk";
export type FontFamilyOption = "poppins" | "nunito";
export type AnimationStyleOption = "gentle" | "playful" | "minimal";
export type CoupleRole = "creator" | "partner";
export type InviteStatus = "pending" | "claimed" | "expired" | "revoked";
export type MediaType = "photo" | "video";
export type LetterDesignTheme = "classic-cream" | "rose-petal" | "vintage-wax" | "starlight-pink" | "minimal-blush";
export type CalendarEventType = "anniversary" | "birthday" | "date" | "special";
export type MoodType = "very_happy" | "happy" | "calm" | "tired" | "sad" | "anxious" | "missing_you" | "loved";
export type PlantStage = "seed" | "sprout" | "sapling" | "blooming" | "flourishing" | "eternal_tree";
export type GardenActionType = "water" | "sunlight" | "fertilize" | "love_talk";
export type BucketCategory = "travel" | "food" | "adventure" | "home" | "milestone" | "creative" | "other";
export type QuizQuestionType = "multiple_choice" | "guess_answer";
export type QuizCategory = "about_us" | "favorites" | "memories" | "habits" | "future";
export type QuizMode = "random" | "multiple_choice" | "guess_answer" | "custom";
export type PlaylistCategory = "our_anthem" | "date_night" | "road_trip" | "missing_you" | "chill" | "happy";
export type LoveJarCategory = "romantic" | "motivation" | "encouragement" | "when_sad" | "when_missing";
export type ChatMessageStatus = "sent" | "delivered" | "read";
export type NotificationType =
  | "message"
  | "letter"
  | "memory"
  | "bucket_list"
  | "calendar"
  | "checkin"
  | "virtual_hug"
  | "partner_joined";
export type TimelineMilestoneType =
  | "first_know"
  | "first_meet"
  | "first_date"
  | "anniversary"
  | "vacation"
  | "special"
  | "memory";
export type HugStyle = "warm_hug" | "tight_squeeze" | "forehead_kiss" | "comfort_hug";
export type StorageBucketName =
  | "profile-photos"
  | "memories"
  | "chat-images"
  | "timeline-images"
  | "bucket-list-images";

export interface ProfileRow {
  id: string;
  full_name: string;
  nickname: string;
  avatar_path: string | null;
  birth_date: string | null;
  bio: string | null;
  gender: GenderOption | null;
  onboarding_completed: boolean;
  notify_messages: boolean;
  notify_letters: boolean;
  notify_memories: boolean;
  notify_calendar: boolean;
  notify_checkins: boolean;
  notify_hugs: boolean;
  notify_bucket_list: boolean;
  show_online_status: boolean;
  show_read_receipts: boolean;
  allow_partner_edit_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoupleSpaceRow {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CoupleMemberRow {
  id: string;
  couple_id: string;
  user_id: string;
  role: CoupleRole;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface CoupleInvitationRow {
  id: string;
  couple_id: string;
  inviter_id: string;
  invite_code: string;
  status: InviteStatus;
  expires_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipSettingsRow {
  id: string;
  couple_id: string;
  partner_placeholder_name: string | null;
  partner_placeholder_nickname: string | null;
  partner_placeholder_avatar_path: string | null;
  partner_placeholder_birth_date: string | null;
  partner_placeholder_bio: string | null;
  first_met_online_date: string | null;
  first_met_in_person_date: string | null;
  anniversary_date: string | null;
  first_meeting_place: string | null;
  origin_story: string | null;
  first_photo_path: string | null;
  main_photo_path: string | null;
  theme_preset: ThemePreset;
  font_family: FontFamilyOption;
  animation_style: AnimationStyleOption;
  dashboard_banner_path: string | null;
  romantic_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryAlbumRow {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryRow {
  id: string;
  couple_id: string;
  album_id: string | null;
  uploaded_by: string;
  title: string;
  caption: string | null;
  media_type: MediaType;
  media_path: string;
  memory_date: string;
  location: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoveLetterRow {
  id: string;
  couple_id: string;
  sender_id: string;
  recipient_id: string | null;
  title: string;
  content: string;
  design_theme: LetterDesignTheme;
  is_secret: boolean;
  scheduled_open_at: string | null;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventRow {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  event_date: string;
  event_time: string | null;
  location: string | null;
  reminder_days_before: number;
  is_recurring_yearly: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckinRow {
  id: string;
  couple_id: string;
  user_id: string;
  checkin_date: string;
  mood: MoodType;
  emoji: string;
  happiness_level: number;
  daily_story: string | null;
  message_to_partner: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoveGardenRow {
  id: string;
  couple_id: string;
  tree_name: string;
  plant_stage: PlantStage;
  growth_points: number;
  level: number;
  water_count: number;
  sunlight_count: number;
  fertilizer_count: number;
  flowers_bloomed: number;
  last_cared_by: string | null;
  last_cared_at: string | null;
  last_action_type: GardenActionType | null;
  created_at: string;
  updated_at: string;
}

export interface BucketListRow {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: BucketCategory;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  achievement_photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionRow {
  id: string;
  couple_id: string;
  created_by: string;
  question_text: string;
  question_type: QuizQuestionType;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
  category: QuizCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizSessionRow {
  id: string;
  couple_id: string;
  player_id: string;
  mode: QuizMode;
  total_questions: number;
  correct_answers: number;
  score: number;
  compatibility_percent: number;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswerRow {
  id: string;
  session_id: string;
  couple_id: string;
  question_id: string;
  player_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistRow {
  id: string;
  couple_id: string;
  added_by: string;
  title: string;
  artist: string;
  spotify_url: string | null;
  youtube_url: string | null;
  cover_url: string | null;
  memory_note: string | null;
  category: PlaylistCategory;
  created_at: string;
  updated_at: string;
}

export interface LoveJarMessageRow {
  id: string;
  couple_id: string;
  author_id: string;
  category: LoveJarCategory;
  message: string;
  is_opened: boolean;
  opened_by: string | null;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string | null;
  image_path: string | null;
  status: ChatMessageStatus;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  couple_id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelationshipTimelineRow {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  milestone_type: TimelineMilestoneType;
  event_date: string;
  description: string | null;
  location: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface VirtualHugRow {
  id: string;
  couple_id: string;
  sender_id: string;
  recipient_id: string | null;
  hug_style: HugStyle;
  message: string;
  is_received: boolean;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiConversationRow {
  id: string;
  couple_id: string;
  user_id: string;
  title: string;
  topic: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessageRow {
  id: string;
  conversation_id: string;
  couple_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  updated_at: string;
}
