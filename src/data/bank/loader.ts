import type { CEFRLevel, VocabWord } from '../../types/vocab';
import { ALL_VOCABULARIES } from './index';

type CompactEntry = [
  word: string,
  ipa: string,
  posCode: number,
  levelCode: number,
  meaning_vi: string,
  example_en: string,
];

const POS_LIST: VocabWord['part_of_speech'][] = ['noun', 'verb', 'adjective', 'adverb'];
const LEVEL_LIST: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Lightweight English syllable splitter guided by IPA stress mark (ˈ). */
function splitSyllables(word: string, ipa: string): { syllables: string[]; stressedIndex: number } {
  const clean = word.toLowerCase();
  if (clean.length <= 3) {
    return { syllables: [clean.toUpperCase()], stressedIndex: 0 };
  }

  // Split by vowel groups while keeping consonant clusters reasonable
  const matches = clean.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))*/gi);
  let parts = matches && matches.length > 0 ? [...matches] : [clean];

  // Merge trailing silent 'e' syllable (e.g. 'ma-ke' -> 'make', 'ta-ble' stays 2)
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (/^[^aeiouy]*e$/i.test(last) && !/le$/i.test(last)) {
      parts[parts.length - 2] += last;
      parts.pop();
    }
  }

  // Estimate stressed syllable index from position of ˈ in IPA
  let stressedIndex = 0;
  const stressPos = ipa.indexOf('ˈ');
  if (stressPos > 0 && parts.length > 1) {
    const ipaBody = ipa.replace(/^\/|\/$/g, '');
    const ratio = stressPos / Math.max(1, ipaBody.length);
    stressedIndex = Math.min(parts.length - 1, Math.max(0, Math.floor(ratio * parts.length)));
  }

  const syllables = parts.map((s, i) => (i === stressedIndex ? s.toUpperCase() : s.toLowerCase()));
  return { syllables, stressedIndex };
}

const defaultDueDate = () => new Date(Date.now() + 86400000).toISOString();

function expandCompact(entry: CompactEntry, dueIso: string): VocabWord {
  const [word, ipa, posCode, levelCode, meaning_vi, example_en] = entry;
  const level = LEVEL_LIST[levelCode] || 'B1';
  const pos = POS_LIST[posCode] || 'noun';
  const { syllables, stressedIndex } = splitSyllables(word, ipa);

  const fallbackExample = `We often use the word "${word}" in everyday English.`;
  const finalExample = example_en || fallbackExample;

  const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
  const clozeSentence = re.test(finalExample)
    ? finalExample.replace(re, '___')
    : `Choose the word that means "${meaning_vi}": ___`;

  // Provide an intuitive, natural Vietnamese translation of the example sentence:
  // Show the sentence's contextual meaning with the word's definition clearly indicated.
  const naturalExampleVi = finalExample
    ? `Dịch: "${finalExample.replace(re, `[${word}: ${meaning_vi}]`)}"`
    : `Nghĩa: ${meaning_vi}`;

  return {
    id: `${level.toLowerCase()}_10k_${word}`,
    word,
    phonetic: ipa,
    syllables,
    stressedIndex,
    cefr_level: level,
    part_of_speech: pos,
    meaning_vi,
    example_en: finalExample,
    example_vi: naturalExampleVi,
    audio_hint_available: true,
    isCollected: false,
    srs_status: {
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      dueDate: dueIso,
      lastReviewed: null,
      state: 'new',
      correctCount: 0,
      wrongCount: 0,
    },
    tags: ['common-10k'],
    context_question: {
      sentence: clozeSentence,
      blankWord: word,
      options: [word],
      correctAnswer: word,
      translation_vi: naturalExampleVi,
    },
  };
}

let cachedFullBank: VocabWord[] | null = null;
let loadingPromise: Promise<VocabWord[]> | null = null;

/**
 * Load the full 10,000+ word bank (curated 1,124 words + public/data/vocab-10k.json).
 * Cached in memory after first load; falls back to curated bank if offline & uncached.
 */
export async function loadFullVocabularies(): Promise<VocabWord[]> {
  if (cachedFullBank) return cachedFullBank;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
      const res = await fetch(`${base}data/vocab-10k.json?v=4`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as CompactEntry[];

      const seen = new Set<string>(ALL_VOCABULARIES.map((w) => w.word.toLowerCase()));
      const dueIso = defaultDueDate();
      const extra: VocabWord[] = [];

      for (let i = 0; i < raw.length; i++) {
        const entry = raw[i];
        const meaning = entry[4] || '';
        // Filter out grammatical inflection duplicates (e.g. tapes, racks, third-person/plural)
        if (/ngôi thứ ba số ít/i.test(meaning) || /dạng số nhiều/i.test(meaning) || /chia ở thì/i.test(meaning)) {
          continue;
        }

        const key = entry[0].toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        extra.push(expandCompact(entry, dueIso));
      }

      cachedFullBank = [...ALL_VOCABULARIES, ...extra];
      return cachedFullBank;
    } catch {
      cachedFullBank = ALL_VOCABULARIES;
      return cachedFullBank;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}
