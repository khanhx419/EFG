export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotConfig {
  name: string;
  avatar: string;
  reactionMinMs: number;
  reactionMaxMs: number;
  accuracyRate: number; // 0 to 1
  typingWpm: number;
}

export const BOT_PROFILES: Record<BotDifficulty, BotConfig> = {
  easy: {
    name: 'Bot Rookie (Tập sự)',
    avatar: '🤖',
    reactionMinMs: 3000,
    reactionMaxMs: 5000,
    accuracyRate: 0.72,
    typingWpm: 40
  },
  medium: {
    name: 'Bot Challenger (Kỳ cựu)',
    avatar: '⚡',
    reactionMinMs: 1800,
    reactionMaxMs: 3200,
    accuracyRate: 0.88,
    typingWpm: 65
  },
  hard: {
    name: 'Bot Grandmaster (Cao thủ)',
    avatar: '🔥',
    reactionMinMs: 900,
    reactionMaxMs: 1900,
    accuracyRate: 0.96,
    typingWpm: 90
  }
};

export class BotAIService {
  /**
   * Calculate bot score for a question using the exact same pure score decay formula
   */
  public static simulateQuestionResult(
    difficulty: BotDifficulty,
    basePoints = 1000,
    minPoints = 300
  ): { isCorrect: boolean; reactionTimeMs: number; score: number } {
    const config = BOT_PROFILES[difficulty];
    const isCorrect = Math.random() < config.accuracyRate;

    // Random reaction time within bot profile bracket
    const reactionTimeMs = Math.round(
      config.reactionMinMs + Math.random() * (config.reactionMaxMs - config.reactionMinMs)
    );

    if (!isCorrect) {
      return { isCorrect: false, reactionTimeMs, score: 0 };
    }

    // Time decay: 1000 down to 300 over 8000ms max window
    const maxWindowMs = 8000;
    const timeFraction = Math.min(1, reactionTimeMs / maxWindowMs);
    const score = Math.max(minPoints, Math.round(basePoints - timeFraction * (basePoints - minPoints)));

    return { isCorrect: true, reactionTimeMs, score };
  }
}
