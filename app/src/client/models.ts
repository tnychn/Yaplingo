export type User = {
  id: string;
  name: string;
  language: string;
  timezone: string;
  streak: number;
  milestone: number;
  points: [number, number]; // [today, total]
  activity: Record<string, number>;
};

export type LeaderboardEntry = {
  uid: string;
  name: string;
  rank: number;
  score: number;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  me: LeaderboardEntry;
};

export type LeaderboardPeriod = "this-week" | "all-time";

export type PronunciationAlignment = {
  token: string;
  score: number;
  interval: [number, number];
};

export type PronunciationDifference = {
  operation: "~" | "+" | "-";
  word: string;
  expected?: string;
  predicted?: string;
};

export type Pronunciation = {
  score: number;
  phonemes: string[];
  alignments: PronunciationAlignment[];
  differences: PronunciationDifference[];
  words: [string, Pronunciation][];
};

export type Transcript = {
  text: string;
  audio: string;
  sequence: string;
};

// ── Gamification Types ─────────────────────────────────────────────────────

export type HistoryEntry = {
  date_key: string;
  xp_earned: number;
  goal_met: boolean;
  lessons_completed: number;
};

export type StatsResponse = {
  seven_day_avg_xp: number;
  thirty_day_best_streak: number;
  completion_rate_30d: number;
  lifetime_xp: number;
};

export type MasteryTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export type TopicMasteryResponse = {
  topic: string;
  total_xp: number;
  lesson_count: number;
  avg_accuracy: number;
  avg_speed_ms: number;
  mastery_score: number;
  tier: MasteryTier;
  updated_at: string | null;
};
