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

// TODO: define this properly
export type UserInsights = {
  summary: string;
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

export type ProximityNeighbour = {
  uid: string;
  name: string;
  rank: number;
  score: number;
  score_gap: number;
};

export type ProximityResponse = {
  above: ProximityNeighbour[];
  below: ProximityNeighbour[];
  my_rank: number;
  my_score: number;
};

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

export type AchievementResponse = {
  key: string;
  title: string;
  desc: string;
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
  gem_reward: number;
};

export type ClaimAchievementRequest = {
  achievement_key: string;
};

export type ClaimAchievementResponse = {
  achievement_key: string;
  gems_awarded: number;
  new_balance: number;
};

export type GemBalanceResponse = {
  balance: number;
};

export type SpendGemsRequest = {
  item_key: string;
};

export type SpendGemsResponse = {
  new_balance: number;
  item_key: string;
  xp_added: number;
};

export type GemConfigResponse = {
  spend_rates: Record<string, number>;
};

export type ActiveEvent = {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  starts_at: string;
  ends_at: string;
};

export type UserInventoryResponse = {
  streak_freezes: number;
};

export type UseSkillResponse = {
  skill_key: string;
  message: string;
  remaining: number;
};
