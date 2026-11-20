import { VocabWord, CustomDeck, MatchHistoryItem, UserProfile } from '../types/vocab';
import { INITIAL_VOCABULARIES } from '../data/vocabularies';
import { SRSService } from './srs';

const DB_NAME = 'VocabClashDB';
const DB_VERSION = 1;
const VOCAB_KEY = 'vocabclash_words';
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
  public async getVocabularies(): Promise<VocabWord[]> {
    // Try IndexedDB first
    const idbData = await this.getIDBItem<VocabWord[]>(VOCAB_KEY);
    if (idbData && Array.isArray(idbData) && idbData.length > 0) {
      return this.checkDueStatus(idbData);
    }

    // Try LocalStorage
    try {
      const lsData = localStorage.getItem(VOCAB_KEY);
      if (lsData) {
        const parsed = JSON.parse(lsData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.checkDueStatus(parsed);
        }
      }
    } catch {
      // Fallback to default
    }

    // Initialize with default
    await this.saveVocabularies(INITIAL_VOCABULARIES);
    return INITIAL_VOCABULARIES;
  }

  public async saveVocabularies(words: VocabWord[]): Promise<void> {
    await this.setIDBItem(VOCAB_KEY, words);
    try {
      localStorage.setItem(VOCAB_KEY, JSON.stringify(words));
    } catch {
      // Ignore quota errors
    }
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
