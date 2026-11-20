import { SRSStatus } from '../types/vocab';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation
 * Calculates memory retention decay, review intervals, and ease factor.
 */
export class SRSService {
  /**
   * Process a review attempt for a word
   * @param current current SRS status
   * @param wasCorrect whether user got it right
   * @param reactionTimeMs time spent in milliseconds
   */
  public static calculateNextReview(
    current: SRSStatus,
    wasCorrect: boolean,
    reactionTimeMs: number
  ): SRSStatus {
    // Determine recall quality (0 - 5)
    // 5: Perfect recall under 2.5 seconds
    // 4: Correct recall with slight hesitation (2.5s - 5s)
    // 3: Correct recall after serious effort or retry (> 5s)
    // 2: Incorrect on first try, remembered upon seeing hint
    // 1: Incorrect, barely recalled
    // 0: Complete blackout
    let quality = 0;
    if (wasCorrect) {
      if (reactionTimeMs < 2500) {
        quality = 5;
      } else if (reactionTimeMs < 5000) {
        quality = 4;
      } else {
        quality = 3;
      }
    } else {
      quality = 1;
    }

    let { repetitions, interval, easeFactor } = current;
    const correctCount = current.correctCount + (wasCorrect ? 1 : 0);
    const wrongCount = current.wrongCount + (wasCorrect ? 0 : 1);

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    // SM-2 Ease Factor calculation
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();

    let state: SRSStatus['state'] = 'learning';
    if (repetitions >= 5) {
      state = 'mastered';
    } else if (repetitions > 1) {
      state = 'review';
    }

    return {
      repetitions,
      interval,
      easeFactor: Number(easeFactor.toFixed(2)),
      dueDate,
      lastReviewed: now.toISOString(),
      state,
      correctCount,
      wrongCount
    };
  }

  /**
   * Check if a word is due for review based on current time
   */
  public static isDueForReview(srs: SRSStatus): boolean {
    if (!srs.dueDate) return false;
    return new Date(srs.dueDate).getTime() <= Date.now();
  }

  /**
   * Calculate retention percentage (0 - 100%) for UI display
   */
  public static calculateRetention(srs: SRSStatus): number {
    if (srs.repetitions === 0) return 0;
    if (srs.state === 'mastered') return 100;
    const daysSinceReview = srs.lastReviewed
      ? (Date.now() - new Date(srs.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // Forgetting curve: R = e^(-t / S)
    const stability = Math.max(1, srs.interval);
    const retention = Math.exp(-daysSinceReview / stability);
    return Math.min(100, Math.max(10, Math.round(retention * 100)));
  }
}
