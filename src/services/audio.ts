class AudioService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private defaultRate: number = 0.88;
  private preferredVoiceName: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.voices;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setDefaultRate(rate: number): void {
    this.defaultRate = Math.max(0.5, Math.min(1.5, rate));
  }

  public setPreferredVoice(name: string | null): void {
    this.preferredVoiceName = name;
  }

  public speak(
    text: string,
    accent: string = 'en-US',
    rate?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted || !this.synth) {
        resolve();
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate ?? this.defaultRate;
      utterance.pitch = 1.0;
      utterance.volume = this.volume;
      utterance.lang = accent;

      // Check if user selected a specific voice
      if (this.preferredVoiceName) {
        const found = this.voices.find((v) => v.name === this.preferredVoiceName);
        if (found) {
          utterance.voice = found;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          this.synth.speak(utterance);
          return;
        }
      }

      // Fallback: select natural, premium high quality voices by accent
      const langPrefix = accent.toLowerCase().replace('_', '-');
      const voiceCandidates = this.voices.filter((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
      );

      const naturalVoice =
        voiceCandidates.find((v) =>
          /(natural|neural|google|samantha|karen|daniel|arthur|guy|aria|jenny)/i.test(v.name)
        ) ||
        voiceCandidates.find((v) => !/(desktop|zira|david)/i.test(v.name)) ||
        voiceCandidates[0] ||
        this.voices.find((v) => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Play short interactive Web Audio API sound effects (beeps, success, error) with volume control
  public playSound(type: 'correct' | 'wrong' | 'combo' | 'countdown' | 'victory'): void {
    if (this.isMuted || this.volume <= 0 || typeof window === 'undefined') return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const volMultiplier = this.volume;

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.18 * volMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.setValueAtTime(164.81, now + 0.1); // E3
        gain.gain.setValueAtTime(0.14 * volMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'combo') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.18); // C6
        gain.gain.setValueAtTime(0.2 * volMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'countdown') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.12 * volMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'victory') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        osc.frequency.setValueAtTime(783.99, now + 0.24);
        osc.frequency.setValueAtTime(1046.5, now + 0.36);
        gain.gain.setValueAtTime(0.24 * volMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Audio context might fail on un-interacted policy, ignore gracefully
    }
  }
}

export const audioService = new AudioService();
