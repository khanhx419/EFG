import type { VocabWord } from '../../types/vocab';

/**
 * Compact word-bank entry (tuple) to keep data files small & easy to extend.
 *
 * [0] word        – headword, lowercase (e.g. 'communicate')
 * [1] phonetic    – IPA with slashes (e.g. '/kəˈmjuː.nɪ.keɪt/')
 * [2] syllables   – hyphen-separated, stressed syllable in UPPERCASE (e.g. 'com-MU-ni-cate', 'CAT')
 * [3] pos         – part of speech
 * [4] meaning_vi  – Vietnamese meaning
 * [5] example_en  – example sentence (shown when learning)
 * [6] example_vi  – translation of example
 * [7] cloze_en    – a DIFFERENT sentence containing exactly one '___' that is filled by the exact headword
 * [8] cloze_vi    – translation of cloze sentence (full meaning)
 * [9] tags        – topic tags
 */
export type RawWord = [
  word: string,
  phonetic: string,
  syllables: string,
  pos: VocabWord['part_of_speech'],
  meaning_vi: string,
  example_en: string,
  example_vi: string,
  cloze_en: string,
  cloze_vi: string,
  tags: string[],
];
