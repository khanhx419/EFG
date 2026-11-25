import { AppSettings, AppTheme, AppFontFamily, AppFontSize } from '../types/vocab';
import { audioService } from './audio';

const SETTINGS_KEY = 'vocabclash_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontFamily: 'system',
  fontSize: 'base',
  soundEnabled: true,
  soundVolume: 0.8,
  voiceRate: 0.88,
  accentPreference: 'en-US',
  autoPlayFlashcardAudio: false,
  showTicker: true,
};

const FONT_MAP: Record<AppFontFamily, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  lexend: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
  serif: "Georgia, 'Times New Roman', Cambria, serif",
};

const FONT_SIZE_MAP: Record<AppFontSize, string> = {
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
};

class SettingsService {
  private currentSettings: AppSettings = DEFAULT_SETTINGS;

  constructor() {
    this.currentSettings = this.load();
    if (typeof window !== 'undefined') {
      this.apply(this.currentSettings);

      // Listen for system theme change if theme is 'system'
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.currentSettings.theme === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  public getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  public save(partial: Partial<AppSettings>): AppSettings {
    this.currentSettings = { ...this.currentSettings, ...partial };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.currentSettings));
    } catch {
      // ignore
    }
    this.apply(this.currentSettings);
    return { ...this.currentSettings };
  }

  public reset(): AppSettings {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // ignore
    }
    this.apply(this.currentSettings);
    return { ...this.currentSettings };
  }

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  }

  public apply(settings: AppSettings): void {
    if (typeof document === 'undefined') return;

    // 1. Theme
    this.applyTheme(settings.theme);

    // 2. Font family
    const fontStr = FONT_MAP[settings.fontFamily] || FONT_MAP.system;
    document.documentElement.style.setProperty('--app-font', fontStr);

    // 3. Font size
    const sizeStr = FONT_SIZE_MAP[settings.fontSize] || FONT_SIZE_MAP.base;
    document.documentElement.style.setProperty('--app-font-size', sizeStr);

    // 4. Audio settings
    audioService.setMuted(!settings.soundEnabled);
    audioService.setVolume(settings.soundVolume);
    audioService.setDefaultRate(settings.voiceRate);
    audioService.setPreferredVoice(settings.selectedVoiceName || null);
  }

  private applyTheme(theme: AppTheme): void {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export const settingsService = new SettingsService();
