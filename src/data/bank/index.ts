import type { CEFRLevel, VocabWord } from '../../types/vocab';
import type { RawWord } from './types';
import { INITIAL_VOCABULARIES } from '../vocabularies';
import { A1_WORDS } from './a1';
import { A2_WORDS } from './a2';
import { B1_WORDS } from './b1';
import { B2_WORDS } from './b2';
import { C1_WORDS } from './c1';
import { C2_WORDS } from './c2';
import { A1_EXTRA_WORDS } from './a1_extra';
import { A2_EXTRA_WORDS } from './a2_extra';
import { B1_EXTRA_WORDS } from './b1_extra';
import { B2_EXTRA_WORDS } from './b2_extra';
import { C1_EXTRA_WORDS } from './c1_extra';
import { C2_EXTRA_WORDS } from './c2_extra';

const RAW_BANK: Record<CEFRLevel, RawWord[]> = {
  A1: [...A1_WORDS, ...A1_EXTRA_WORDS],
  A2: [...A2_WORDS, ...A2_EXTRA_WORDS],
  B1: [...B1_WORDS, ...B1_EXTRA_WORDS],
  B2: [...B2_WORDS, ...B2_EXTRA_WORDS],
  C1: [...C1_WORDS, ...C1_EXTRA_WORDS],
  C2: [...C2_WORDS, ...C2_EXTRA_WORDS],
};

const newSRS = (): VocabWord['srs_status'] => ({
  repetitions: 0,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  lastReviewed: null,
  state: 'new',
  correctCount: 0,
  wrongCount: 0,
});

const slug = (word: string) => word.toLowerCase().replace(/[^a-z0-9]+/g, '_');

/** Convert a compact tuple into a full VocabWord. */
export const rawToVocab = (raw: RawWord, level: CEFRLevel): VocabWord => {
  const [word, phonetic, syllableStr, pos, meaning_vi, example_en, example_vi, cloze_en, cloze_vi, tags] = raw;
  const syllables = syllableStr.split('-').filter(Boolean);
  let stressedIndex = syllables.findIndex((s) => s.length > 1 && s === s.toUpperCase());
  if (stressedIndex < 0) stressedIndex = syllables.findIndex((s) => s === s.toUpperCase());
  if (stressedIndex < 0) stressedIndex = 0;

  return {
    id: `${level.toLowerCase()}_${slug(word)}`,
    word,
    phonetic,
    syllables,
    stressedIndex,
    cefr_level: level,
    part_of_speech: pos,
    meaning_vi,
    example_en,
    example_vi,
    audio_hint_available: true,
    isCollected: false,
    srs_status: newSRS(),
    tags,
    context_question: {
      sentence: cloze_en,
      blankWord: word,
      // Options are (re)generated dynamically at play time – see services/questionGen.ts
      options: [word],
      correctAnswer: word,
      translation_vi: cloze_vi,
    },
  };
};

const buildAll = (): VocabWord[] => {
  const seenWords = new Set<string>();
  const seenIds = new Set<string>();
  const result: VocabWord[] = [];

  const push = (w: VocabWord) => {
    const key = w.word.toLowerCase();
    if (seenWords.has(key) || seenIds.has(w.id)) return; // de-duplicate across levels
    seenWords.add(key);
    seenIds.add(w.id);
    result.push(w);
  };

  // Hand-curated words first (they keep their ids for backward compatibility)
  INITIAL_VOCABULARIES.forEach(push);

  (Object.keys(RAW_BANK) as CEFRLevel[]).forEach((level) => {
    RAW_BANK[level].forEach((raw) => push(rawToVocab(raw, level)));
  });

  return result;
};

/** Full content database: curated words + large word bank (A1 → C2). */
export const ALL_VOCABULARIES: VocabWord[] = buildAll();

/** Bump when content changes in a way that requires re-merging (kept for diagnostics). */
export const CONTENT_VERSION = 2;
