import type { CEFRLevel, ContextQuestion, PlacementQuestion, VocabWord } from '../types/vocab';
import { PLACEMENT_QUESTIONS } from '../data/placementData';
import { SRSService } from './srs';

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Unbiased Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sample = <T,>(arr: readonly T[], n: number): T[] => shuffle(arr).slice(0, n);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Pick `count` distractor words in O(count) random probes (fast even for 10,000+ words):
 * tries same POS & same level first, then same POS & neighbouring levels, then same POS, then any.
 */
function pickDistractors(word: VocabWord, pool: VocabWord[], count: number): VocabWord[] {
  const target = word.word.toLowerCase();
  const lvlIdx = CEFR_LEVELS.indexOf(word.cefr_level);
  const chosen: VocabWord[] = [];
  const used = new Set<string>([target]);

  const tryProbe = (predicate: (w: VocabWord) => boolean, maxAttempts: number) => {
    const n = pool.length;
    if (n === 0) return;
    for (let a = 0; a < maxAttempts && chosen.length < count; a++) {
      const w = pool[Math.floor(Math.random() * n)];
      if (w.id === word.id) continue;
      const key = w.word.toLowerCase();
      if (used.has(key) || !predicate(w)) continue;
      used.add(key);
      chosen.push(w);
    }
  };

  // Fast random probing works great on large banks (1,000–10,000+ words)
  tryProbe((w) => w.part_of_speech === word.part_of_speech && w.cefr_level === word.cefr_level, 80);
  tryProbe((w) => w.part_of_speech === word.part_of_speech && Math.abs(CEFR_LEVELS.indexOf(w.cefr_level) - lvlIdx) <= 1, 60);
  tryProbe((w) => w.part_of_speech === word.part_of_speech, 40);
  tryProbe(() => true, 40);

  // Fallback linear scan if pool is tiny
  if (chosen.length < count) {
    for (const w of shuffle(pool)) {
      if (chosen.length >= count) break;
      const key = w.word.toLowerCase();
      if (w.id === word.id || used.has(key)) continue;
      used.add(key);
      chosen.push(w);
    }
  }
  return chosen;
}

/**
 * Build a fresh context (fill-in-the-blank) question each time a word is played:
 * - randomly uses the cloze sentence or the example sentence (if it contains the exact word)
 * - distractors are drawn at random from the whole bank (same POS / level)
 * - option order is shuffled → impossible to memorise "answer is always A".
 */
export function buildContextQuestion(word: VocabWord, pool: VocabWord[]): ContextQuestion {
  const base = word.context_question;
  const variants: { sentence: string; translation_vi: string }[] = [];

  if (base?.sentence?.includes('___')) {
    variants.push({ sentence: base.sentence, translation_vi: base.translation_vi });
  }
  const re = new RegExp(`\\b${escapeRegExp(word.word)}\\b`, 'i');
  if (word.example_en && re.test(word.example_en)) {
    variants.push({ sentence: word.example_en.replace(re, '___'), translation_vi: word.example_vi });
  }
  if (variants.length === 0) {
    variants.push({ sentence: `___ : ${word.meaning_vi}`, translation_vi: word.meaning_vi });
  }

  const chosen = variants[Math.floor(Math.random() * variants.length)];
  let distractors = pickDistractors(word, pool, 3).map((w) => w.word);

  // Fallback to the hand-written distractors if the pool is too small
  if (distractors.length < 3 && base?.options) {
    const extra = base.options.filter(
      (o) => o.toLowerCase() !== word.word.toLowerCase() && !distractors.includes(o)
    );
    distractors = [...distractors, ...extra].slice(0, 3);
  }

  return {
    sentence: chosen.sentence,
    blankWord: word.word,
    correctAnswer: word.word,
    translation_vi: chosen.translation_vi,
    options: shuffle([word.word, ...distractors]),
  };
}

/** Attach freshly generated context questions to a list of match words. */
export function prepareMatchWords(words: VocabWord[], pool: VocabWord[]): VocabWord[] {
  return words.map((w) => ({ ...w, context_question: buildContextQuestion(w, pool) }));
}

export interface SelectionBreakdown {
  weakCount: number;       // Từ hay sai / yếu
  dueCount: number;        // Từ đến hạn ôn SRS
  unlearnedCount: number;  // Từ chưa học trong Vocab-Dex
  reviewCount: number;     // Từ củng cố ngẫu nhiên
  poolSize: number;        // Tổng kho từ đã quét
}

export interface SmartSelectionResult {
  words: VocabWord[];
  breakdown: SelectionBreakdown;
}

/**
 * Smart selection based on the player's Vocab-Dex dictionary:
 * 1. Prioritizes words the player gets wrong often (weak) & words due for SRS review
 * 2. Prioritizes unlearned words (!isCollected) so learners expand their vocabulary
 * 3. Deprioritizes words played in the immediately preceding match (recentWordIds)
 * 4. Fills any remaining slots randomly from the pool, then shuffles.
 */
export function pickSmartSessionWords(
  pool: VocabWord[],
  count: number,
  recentWordIds: string[] = []
): SmartSelectionResult {
  const targetCount = Math.min(count, pool.length);
  const recentSet = new Set(recentWordIds);

  // Split pool into non-recent first, fallback to recent only if pool is tight
  const orderWithRecentLast = (list: VocabWord[]) => [
    ...shuffle(list.filter((w) => !recentSet.has(w.id))),
    ...shuffle(list.filter((w) => recentSet.has(w.id))),
  ];

  // 1. Weak words: answered wrong at least once, sorted by error severity with slight jitter
  const weak = pool
    .filter((w) => w.srs_status.wrongCount > 0 && w.srs_status.wrongCount >= w.srs_status.correctCount)
    .sort((a, b) => {
      const scoreA = a.srs_status.wrongCount * 2 - a.srs_status.correctCount + Math.random() * 1.5;
      const scoreB = b.srs_status.wrongCount * 2 - b.srs_status.correctCount + Math.random() * 1.5;
      return scoreB - scoreA;
    });

  // 2. Due for SRS review (collected & due, not already in weak)
  const weakIds = new Set(weak.map((w) => w.id));
  const due = orderWithRecentLast(
    pool.filter((w) => !weakIds.has(w.id) && w.isCollected && SRSService.isDueForReview(w.srs_status))
  );

  // 3. Unlearned words (not yet collected in Vocab-Dex)
  const unlearned = orderWithRecentLast(pool.filter((w) => !w.isCollected && !weakIds.has(w.id)));

  // 4. Everything else
  const rest = orderWithRecentLast(pool);

  const picked = new Map<string, VocabWord>();
  const breakdown: SelectionBreakdown = {
    weakCount: 0,
    dueCount: 0,
    unlearnedCount: 0,
    reviewCount: 0,
    poolSize: pool.length,
  };

  const add = (list: VocabWord[], limit: number, bucket: keyof Omit<SelectionBreakdown, 'poolSize'>) => {
    let added = 0;
    for (const w of list) {
      if (picked.size >= targetCount || added >= limit) break;
      if (!picked.has(w.id)) {
        picked.set(w.id, w);
        added++;
        breakdown[bucket]++;
      }
    }
  };

  // Allocation: up to 35% weak, up to 25% due, up to 45% unlearned, remainder random review
  add(weak, Math.ceil(targetCount * 0.35), 'weakCount');
  add(due, Math.ceil(targetCount * 0.25), 'dueCount');
  add(unlearned, Math.ceil(targetCount * 0.45), 'unlearnedCount');
  // If still short (e.g., player has many unlearned or few weak), top up from unlearned → due → weak → rest
  add(unlearned, targetCount - picked.size, 'unlearnedCount');
  add(due, targetCount - picked.size, 'dueCount');
  add(weak, targetCount - picked.size, 'weakCount');
  add(rest, targetCount - picked.size, 'reviewCount');

  return {
    words: shuffle([...picked.values()]),
    breakdown,
  };
}

/**
 * Convenience wrapper returning only the chosen words.
 */
export function pickSessionWords(pool: VocabWord[], count: number, recentWordIds: string[] = []): VocabWord[] {
  return pickSmartSessionWords(pool, count, recentWordIds).words;
}

// ================= PLACEMENT TEST =================

/** Shuffle a placement question's options and recompute the correct index. */
function shuffleQuestion(q: PlacementQuestion): PlacementQuestion {
  const correct = q.options[q.correctIndex];
  const options = shuffle(q.options);
  return { ...q, options, correctIndex: options.indexOf(correct) };
}

function vocabQuestionFromWord(word: VocabWord, pool: VocabWord[], idx: number): PlacementQuestion {
  const kind = Math.floor(Math.random() * 3);
  const distractors = pickDistractors(word, pool, 3);

  if (kind === 0) {
    // English word → choose the Vietnamese meaning
    const meanings = [word.meaning_vi];
    for (const d of distractors) if (!meanings.includes(d.meaning_vi)) meanings.push(d.meaning_vi);
    return shuffleQuestion({
      id: `pq_gen_${word.id}_${idx}`,
      level: word.cefr_level,
      question: `Từ "${word.word}" (${word.part_of_speech}) có nghĩa là gì?`,
      options: meanings,
      correctIndex: 0,
      explanation: `"${word.word}" nghĩa là: ${word.meaning_vi}. Ví dụ: ${word.example_en}`,
      type: 'vocab',
    });
  }

  if (kind === 1) {
    // Vietnamese meaning → choose the English word
    return shuffleQuestion({
      id: `pq_gen_${word.id}_${idx}`,
      level: word.cefr_level,
      question: `Từ nào có nghĩa là "${word.meaning_vi}"?`,
      options: [word.word, ...distractors.map((d) => d.word)],
      correctIndex: 0,
      explanation: `"${word.word}" ${word.phonetic} — ${word.meaning_vi}.`,
      type: 'vocab',
    });
  }

  // Fill in the blank
  const cq = buildContextQuestion(word, pool);
  return {
    id: `pq_gen_${word.id}_${idx}`,
    level: word.cefr_level,
    question: cq.sentence,
    options: cq.options,
    correctIndex: cq.options.indexOf(word.word),
    explanation: `Đáp án "${word.word}" (${word.meaning_vi}). Dịch: ${cq.translation_vi}`,
    type: 'cloze',
  };
}

/**
 * Generate a new randomized placement test every time:
 * for each CEFR level → 1 hand-written grammar/collocation question + N auto-generated vocab questions.
 */
export function generatePlacementTest(pool: VocabWord[], perLevelGenerated = 2): PlacementQuestion[] {
  const questions: PlacementQuestion[] = [];
  CEFR_LEVELS.forEach((level) => {
    const curated = PLACEMENT_QUESTIONS.filter((q) => q.level === level);
    sample(curated, 1).forEach((q) => questions.push(shuffleQuestion(q)));

    const words = pool.filter((w) => w.cefr_level === level);
    sample(words, perLevelGenerated).forEach((w, i) => questions.push(vocabQuestionFromWord(w, pool, i)));
  });
  return questions;
}
