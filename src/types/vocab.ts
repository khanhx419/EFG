export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type WordLengthMode = 3 | 5 | 10 | 15 | 20; // 3 từ (Nhanh), 5 từ (Tiêu chuẩn), 10 từ (Thử thách), 15-20 từ (Chuyên sâu)

export type GamePhase = 
  | 'lobby'
  | 'countdown'       // Đếm ngược 5s & thuật toán xáo trộn từ vựng theo Vocab-Dex
  | 'phase1_memo'     // Giai đoạn 1: Ghi nhớ (60s)
  | 'phase2_matching' // Giai đoạn 2: Nối từ & Nghĩa
  | 'bonus_memo'      // Vòng bonus ngẫu nhiên chen vào (1-2 từ mới, 20s học)
  | 'phase3_spelling' // Giai đoạn 3: Viết từ theo nghĩa / Dictation
  | 'phase4_context'  // Giai đoạn 4: Chọn từ theo ngữ cảnh (MCQ)
  | 'result';

export interface SRSStatus {
  repetitions: number;
  interval: number;         // in days
  easeFactor: number;       // SM-2 algorithm standard factor
  dueDate: string;          // ISO timestamp
  lastReviewed: string | null;
  state: 'new' | 'learning' | 'review' | 'due' | 'mastered';
  correctCount: number;
  wrongCount: number;
}

export interface ContextQuestion {
  sentence: string;         // e.g. "Effective leaders must ___ openly with team members."
  blankWord: string;        // The word that fits into the blank
  options: string[];        // 4 choices [A, B, C, D]
  correctAnswer: string;
  translation_vi: string;
}

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;          // IPA e.g. "/kəˈmjuː.nɪ.keɪt/"
  syllables: string[];       // e.g. ["com", "MU", "ni", "cate"] - uppercase denotes stress
  stressedIndex: number;     // 1 for second syllable
  cefr_level: CEFRLevel;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase';
  meaning_vi: string;
  example_en: string;
  example_vi: string;
  context_question: ContextQuestion;
  audio_hint_available: boolean;
  isCollected: boolean;
  srs_status: SRSStatus;
  tags?: string[];
}

export interface CustomDeck {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  wordIds: string[];
  perRoundCount?: number;   // Số từ mỗi lượt đấu (vd: 5 từ từ pool 20 từ)
  timePerQuestion?: number; // Thời gian mỗi câu (giây, mặc định 10s)
}

export interface MatchWordStat {
  wordId: string;
  word: string;
  meaning_vi: string;
  wasIncorrect: boolean;
  reactionTimeMs: number;
  isSlow: boolean; // > 3500ms
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  mode: 'pvp_bot' | 'custom_deck' | 'solo_replay';
  level: CEFRLevel | 'Custom';
  wordCount: WordLengthMode;
  playerScore: number;
  botScore: number;
  isVictory: boolean;
  maxCombo: number;
  accuracy: number; // percentage
  words: MatchWordStat[];
  customDeckName?: string;
}

export interface PlacementQuestion {
  id: string;
  level: CEFRLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type: 'vocab' | 'collocation' | 'cloze';
}

export interface UserProfile {
  name: string;
  currentLevel: CEFRLevel;
  hasTakenPlacement: boolean;
  recommendedRoadmap?: {
    currentLevel: CEFRLevel;
    strengths: string;
    focusAreas: string;
    recommendedDailyWords: number;
  };
  streakDays: number;
  lastActiveDate: string;
  totalMatches: number;
  totalVictories: number;
  soundEnabled: boolean;
  accentPreference: 'en-US' | 'en-GB';
}
