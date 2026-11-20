import { VocabWord, CustomDeck, MatchHistoryItem, UserProfile, SRSStatus } from '../types/vocab';
import { loadFullVocabularies } from '../data/bank/loader';
import { SRSService } from './srs';

type ProgressMap = Record<string, { isCollected: boolean; srs_status: SRSStatus }>;

const DB_NAME = 'VocabClashDB';
const DB_VERSION = 1;
const VOCAB_KEY = 'vocabclash_words'; // legacy (full word array) – migrated to PROGRESS_KEY
const PROGRESS_KEY = 'vocabclash_progress_v2';
const DECKS_KEY = 'vocabclash_custom_decks';
const HISTORY_KEY = 'vocabclash_match_history';
const PROFILE_KEY = 'vocabclash_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'SpeedLearner',
  currentLevel: 'B1',
  hasTakenPlacement: false,
  streakDays: 3,
  lastActiveDate: new Date().toISOString(),
  totalMatches: 8,
  totalVictories: 6,
  soundEnabled: true,
  accentPreference: 'en-US'
};

class StorageService {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initIndexedDB();
  }

  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval');
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async getIDBItem<T>(key: string): Promise<T | null> {
    const db = await this.dbPromise;
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async setIDBItem<T>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ================= VOCABULARY =================
  /**
   * Content (words, meanings, sentences) always comes from code (ALL_VOCABULARIES),
   * only the learner's PROGRESS (isCollected + SRS) is persisted.
   * → Adding new words to the bank automatically shows up for existing users.
   */
  private async loadProgress(): Promise<ProgressMap | null> {
    const idbData = await this.getIDBItem<ProgressMap>(PROGRESS_KEY);
    if (idbData && typeof idbData === 'object') return idbData;
    try {
      const ls = localStorage.getItem(PROGRESS_KEY);
      if (ls) return JSON.parse(ls) as ProgressMap;
    } catch {
      // ignore
    }
    return null;
  }

  /** Migrate legacy storage (full word array) into a progress map. */
  private async migrateLegacy(): Promise<ProgressMap | null> {
    let legacy: VocabWord[] | null = await this.getIDBItem<VocabWord[]>(VOCAB_KEY);
    if (!legacy) {
      try {
        const ls = localStorage.getItem(VOCAB_KEY);
        if (ls) legacy = JSON.parse(ls);
      } catch {
        // ignore
      }
    }
    if (!legacy || !Array.isArray(legacy) || legacy.length === 0) return null;

    const progress = this.toProgress(legacy);
    await this.saveProgress(progress);
    try {
      localStorage.removeItem(VOCAB_KEY);
    } catch {
      // ignore
    }
    return progress;
  }

  private toProgress(words: VocabWord[]): ProgressMap {
    const map: ProgressMap = {};
    words.forEach((w) => {
      const touched =
        w.isCollected || w.srs_status.state !== 'new' || w.srs_status.correctCount + w.srs_status.wrongCount > 0;
      if (touched) map[w.id] = { isCollected: w.isCollected, srs_status: w.srs_status };
    });
    return map;
  }

  private async saveProgress(progress: ProgressMap): Promise<void> {
    await this.setIDBItem(PROGRESS_KEY, progress);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Ignore quota errors
    }
  }

  public async getVocabularies(): Promise<VocabWord[]> {
    const allWords = await loadFullVocabularies();
    let progress = await this.loadProgress();
    if (!progress) progress = await this.migrateLegacy();

    if (!progress) {
      // First launch: seed progress from curated defaults
      await this.saveVocabularies(allWords);
      return this.checkDueStatus(allWords);
    }

    const merged = allWords.map((w) => {
      const p = progress![w.id];
      return p ? { ...w, isCollected: p.isCollected, srs_status: { ...w.srs_status, ...p.srs_status } } : w;
    });
    return this.checkDueStatus(merged);
  }

  public async saveVocabularies(words: VocabWord[]): Promise<void> {
    await this.saveProgress(this.toProgress(words));
  }

  private checkDueStatus(words: VocabWord[]): VocabWord[] {
    return words.map((w) => {
      if (w.isCollected && SRSService.isDueForReview(w.srs_status)) {
        return {
          ...w,
          srs_status: {
            ...w.srs_status,
            state: 'due'
          }
        };
      }
      return w;
    });
  }

  public async unlockWord(wordId: string): Promise<VocabWord[]> {
    const words = await this.getVocabularies();
    const updated = words.map((w) => {
      if (w.id === wordId && !w.isCollected) {
        return {
          ...w,
          isCollected: true,
          srs_status: {
            ...w.srs_status,
            repetitions: 1,
            interval: 1,
            state: 'learning' as const,
            lastReviewed: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000).toISOString()
          }
        };
      }
      return w;
    });
    await this.saveVocabularies(updated);
    return updated;
  }

  public async updateWordSRS(wordId: string, wasCorrect: boolean, reactionTimeMs: number): Promise<VocabWord[]> {
    const words = await this.getVocabularies();
    const updated = words.map((w) => {
      if (w.id === wordId) {
        const newSRS = SRSService.calculateNextReview(w.srs_status, wasCorrect, reactionTimeMs);
        return {
          ...w,
          isCollected: true,
          srs_status: newSRS
        };
      }
      return w;
    });
    await this.saveVocabularies(updated);
    return updated;
  }

  // ================= CUSTOM DECKS =================
  public async getCustomDecks(): Promise<CustomDeck[]> {
    const idbData = await this.getIDBItem<CustomDeck[]>(DECKS_KEY);
    if (idbData && Array.isArray(idbData)) return idbData;

    try {
      const lsData = localStorage.getItem(DECKS_KEY);
      if (lsData) return JSON.parse(lsData);
    } catch {
      // ignore
    }

    // Default starter deck
    const defaultDecks: CustomDeck[] = [
      {
        id: 'deck_starter_5',
        name: 'Bộ 5 từ chiến lược IELTS/Giao tiếp',
        description: 'Tập hợp 5 từ vựng đa dụng từ B1-C1 để bứt phá phản xạ nói và viết.',
        createdAt: new Date().toISOString(),
        wordIds: ['b1_communicate', 'b2_collaborate', 'b2_sustainable', 'c1_ubiquitous', 'c1_alleviate']
      }
    ];
    await this.saveCustomDecks(defaultDecks);
    return defaultDecks;
  }

  public async saveCustomDecks(decks: CustomDeck[]): Promise<void> {
    await this.setIDBItem(DECKS_KEY, decks);
    try {
      localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    } catch {
      // ignore
    }
  }

  public async addCustomDeck(deck: CustomDeck): Promise<CustomDeck[]> {
    const decks = await this.getCustomDecks();
    const updated = [deck, ...decks];
    await this.saveCustomDecks(updated);
    return updated;
  }

  public async deleteCustomDeck(id: string): Promise<CustomDeck[]> {
    const decks = await this.getCustomDecks();
    const updated = decks.filter((d) => d.id !== id);
    await this.saveCustomDecks(updated);
    return updated;
  }

  // ================= MATCH HISTORY =================
  public async getMatchHistory(): Promise<MatchHistoryItem[]> {
    const idbData = await this.getIDBItem<MatchHistoryItem[]>(HISTORY_KEY);
    if (idbData && Array.isArray(idbData)) return idbData;

    try {
      const lsData = localStorage.getItem(HISTORY_KEY);
      if (lsData) return JSON.parse(lsData);
    } catch {
      // ignore
    }

    // Sample initial history
    const sampleHistory: MatchHistoryItem[] = [
      {
        id: 'match_sample_1',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        mode: 'pvp_bot',
        level: 'B1',
        wordCount: 5,
        playerScore: 4250,
        botScore: 3900,
        isVictory: true,
        maxCombo: 5,
        accuracy: 92,
        words: [
          { wordId: 'b1_communicate', word: 'communicate', meaning_vi: 'Giao tiếp, truyền đạt', wasIncorrect: false, reactionTimeMs: 1400, isSlow: false },
          { wordId: 'b1_environment', word: 'environment', meaning_vi: 'Môi trường', wasIncorrect: false, reactionTimeMs: 2100, isSlow: false },
          { wordId: 'b1_opportunity', word: 'opportunity', meaning_vi: 'Cơ hội thuận lợi', wasIncorrect: true, reactionTimeMs: 4200, isSlow: true },
          { wordId: 'b1_experience', word: 'experience', meaning_vi: 'Kinh nghiệm, trải nghiệm', wasIncorrect: false, reactionTimeMs: 1900, isSlow: false },
          { wordId: 'b1_successful', word: 'successful', meaning_vi: 'Thành công', wasIncorrect: false, reactionTimeMs: 1600, isSlow: false }
        ]
      }
    ];
    await this.saveMatchHistory(sampleHistory);
    return sampleHistory;
  }

  public async saveMatchHistory(items: MatchHistoryItem[]): Promise<void> {
    await this.setIDBItem(HISTORY_KEY, items);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  public async addMatchHistoryItem(item: MatchHistoryItem): Promise<MatchHistoryItem[]> {
    const history = await this.getMatchHistory();
    const updated = [item, ...history];
    await this.saveMatchHistory(updated);
    return updated;
  }

  // ================= USER PROFILE =================
  public async getUserProfile(): Promise<UserProfile> {
    const idbData = await this.getIDBItem<UserProfile>(PROFILE_KEY);
    if (idbData) return idbData;

    try {
      const lsData = localStorage.getItem(PROFILE_KEY);
      if (lsData) return JSON.parse(lsData);
    } catch {
      // ignore
    }

    return DEFAULT_PROFILE;
  }

  public async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setIDBItem(PROFILE_KEY, profile);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();
