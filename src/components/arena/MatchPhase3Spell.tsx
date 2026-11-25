import React, { useState, useEffect, useRef } from 'react';
import { Bot, Headphones, Eye, EyeOff, Sparkles, AlertCircle, SkipForward } from 'lucide-react';
import { VocabWord, MatchWordStat } from '../../types/vocab';
import { TimeDecayScoreBar } from '../common/TimeDecayScoreBar';
import { AudioHintButton } from '../common/AudioHintButton';
import { audioService } from '../../services/audio';
import { BotDifficulty, BotAIService } from '../../services/botAi';

interface MatchPhase3SpellProps {
  words: VocabWord[];
  difficulty: BotDifficulty;
  onPhaseComplete: (
    playerPhaseScore: number,
    botPhaseScore: number,
    playerCombo: number,
    wordStats: MatchWordStat[]
  ) => void;
  initialPlayerScore: number;
  initialBotScore: number;
  initialCombo: number;
  accentPreference: 'en-US' | 'en-GB';
  timePerQuestion?: number;
}

export const MatchPhase3Spell: React.FC<MatchPhase3SpellProps> = ({
  words,
  difficulty,
  onPhaseComplete,
  initialPlayerScore,
  initialBotScore,
  initialCombo,
  accentPreference,
  timePerQuestion = 10
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [hasAttemptError, setHasAttemptError] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  // Dictation mode (toggle available especially for B2, C1, C2)
  const [dictationMode, setDictationMode] = useState<boolean>(false);

  // Scores & Combo
  const [playerScore, setPlayerScore] = useState<number>(initialPlayerScore);
  const [botScore, setBotScore] = useState<number>(initialBotScore);
  const [combo, setCombo] = useState<number>(initialCombo);
  const [maxCombo, setMaxCombo] = useState<number>(initialCombo);

  // Stats collected for history
  const [collectedStats, setCollectedStats] = useState<MatchWordStat[]>([]);

  // Time decay score per question
  const [currentDecayScore, setCurrentDecayScore] = useState<number>(1000);
  const questionStartTimeRef = useRef<number>(Date.now());
  const decayTimerRef = useRef<number | null>(null);
  const autoTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentWordIndex];
  const isHighLevel = currentWord && ['B2', 'C1', 'C2'].includes(currentWord.cefr_level);

  // Focus input automatically on question change
  useEffect(() => {
    inputRef.current?.focus();
    questionStartTimeRef.current = Date.now();
    setCurrentDecayScore(1000);
    setHasAttemptError(false);
    setInputVal('');

    // If dictation mode is active, play audio automatically
    if (dictationMode && currentWord) {
      audioService.speak(currentWord.word, accentPreference);
    }
  }, [currentWordIndex, dictationMode]);

  // Real-time decay tick: 1.5s freeze at 1000, decays to 0 over 10s
  useEffect(() => {
    decayTimerRef.current = window.setInterval(() => {
      if (isTimedOut) return;
      const elapsed = Date.now() - questionStartTimeRef.current;
      const gracePeriodMs = 1500;
      const totalDurationMs = Math.max(8000, timePerQuestion * 1000);

      if (elapsed <= gracePeriodMs) {
        setCurrentDecayScore(1000);
      } else {
        const decayWindow = totalDurationMs - gracePeriodMs;
        const decayElapsed = elapsed - gracePeriodMs;
        const fraction = Math.min(1, decayElapsed / decayWindow);
        const score = Math.max(0, Math.round(1000 - fraction * 1000));
        setCurrentDecayScore(score);

        // Auto timeout at 0 pts: show answer for 5s
        if (score <= 0 && !isTimedOut) {
          handleTimeoutExpire();
        }
      }
    }, 100);

    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, [isTimedOut, timePerQuestion]);

  const handleTimeoutExpire = () => {
    setIsTimedOut(true);
    setCombo(0);
    audioService.playSound('wrong');

    const stat: MatchWordStat = {
      wordId: currentWord.id,
      word: currentWord.word,
      meaning_vi: currentWord.meaning_vi,
      wasIncorrect: true,
      reactionTimeMs: 10000,
      isSlow: true
    };
    const updatedStats = [...collectedStats, stat];
    setCollectedStats(updatedStats);

    autoTimeoutRef.current = window.setTimeout(() => {
      advanceNextWord(playerScore, botScore, maxCombo, updatedStats);
    }, 5000);
  };

  // Bot simulation for this question
  useEffect(() => {
    const timer = setTimeout(() => {
      const botRes = BotAIService.simulateQuestionResult(difficulty);
      if (botRes.isCorrect) {
        setBotScore((prev) => prev + botRes.score);
      }
    }, 2800 + Math.random() * 2000);

    return () => clearTimeout(timer);
  }, [currentWordIndex, difficulty]);

  const advanceNextWord = (
    pScore: number,
    bScore: number,
    mCombo: number,
    stats: MatchWordStat[]
  ) => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
    } else {
      onPhaseComplete(pScore, bScore, mCombo, stats);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || !inputVal.trim() || isTimedOut) return;

    const trimmed = inputVal.trim().toLowerCase();
    const correctTarget = currentWord.word.trim().toLowerCase();

    const reactionTimeMs = Date.now() - questionStartTimeRef.current;
    const isSlow = reactionTimeMs > 3500;

    if (trimmed === correctTarget) {
      // Correct!
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const comboBonus = nextCombo >= 3 ? 50 : 0;
      const earned = currentDecayScore + comboBonus;
      const updatedPlayerScore = playerScore + earned;
      setPlayerScore(updatedPlayerScore);

      audioService.playSound(nextCombo >= 3 ? 'combo' : 'correct');

      // Record stat
      const stat: MatchWordStat = {
        wordId: currentWord.id,
        word: currentWord.word,
        meaning_vi: currentWord.meaning_vi,
        wasIncorrect: hasAttemptError,
        reactionTimeMs,
        isSlow
      };
      const updatedStats = [...collectedStats, stat];
      setCollectedStats(updatedStats);

      advanceNextWord(updatedPlayerScore, botScore, Math.max(maxCombo, nextCombo), updatedStats);
    } else {
      // Wrong typing!
      setIsShaking(true);
      setHasAttemptError(true);
      audioService.playSound('wrong');

      setTimeout(() => {
        setIsShaking(false);
      }, 350);
    }
  };

  // Nút bỏ qua từ khi thi đấu
  const handleSkipWord = () => {
    if (isTimedOut) return;
    setCombo(0);
    audioService.playSound('wrong');

    const stat: MatchWordStat = {
      wordId: currentWord.id,
      word: currentWord.word,
      meaning_vi: currentWord.meaning_vi,
      wasIncorrect: true,
      reactionTimeMs: Date.now() - questionStartTimeRef.current,
      isSlow: true
    };
    const updatedStats = [...collectedStats, stat];
    setCollectedStats(updatedStats);
    advanceNextWord(playerScore, botScore, maxCombo, updatedStats);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-fadeIn px-2 sm:px-0">
      {/* Top Header: Scores & Phase Indicator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Giai đoạn 3 / 4
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Từ {currentWordIndex + 1}/{words.length}
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-800 mt-0.5">
            Viết Từ Theo Nghĩa (Recall & Spelling)
          </h2>
        </div>

        {/* Live Scoreboard */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">BẠN</span>
            <span className="text-base font-mono font-extrabold text-emerald-700">
              {playerScore} <span className="text-xs font-normal">pts</span>
            </span>
          </div>
          <div className="text-slate-300 font-bold text-xs">VS</div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1">
              <Bot className="w-3 h-3 text-purple-500" />
              BOT
            </span>
            <span className="text-base font-mono font-extrabold text-purple-700">
              {botScore} <span className="text-xs font-normal">pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Time Decay Score Bar (10s decay, 1.5s freeze) */}
      <TimeDecayScoreBar
        currentScore={currentDecayScore}
        combo={combo}
        minScore={0}
        maxScore={1000}
        label="Điểm gõ từ câu này (10s)"
      />

      {/* Main Spelling Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        {/* Top bar in card: Dictation toggle and Skip button */}
        <div className="flex items-center justify-between gap-2">
          {/* Dictation Mode Toggle for High Levels */}
          {isHighLevel ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDictationMode(!dictationMode)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100/60 transition"
              >
                {dictationMode ? <EyeOff className="w-3.5 h-3.5 text-purple-700" /> : <Eye className="w-3.5 h-3.5 text-purple-700" />}
                <span>{dictationMode ? 'Đang ẩn nghĩa' : 'Ẩn nghĩa (Dictation)'}</span>
              </button>
            </div>
          ) : <div />}

          {/* Nút bỏ qua từ khi thi đấu */}
          <button
            type="button"
            onClick={handleSkipWord}
            disabled={isTimedOut}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition"
            title="Bỏ qua từ này (chuyển từ kế tiếp)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Bỏ qua</span>
          </button>
        </div>

        {/* Prompt: Vietnamese Meaning (or Audio Dictation Wave) */}
        <div className="text-center py-3 bg-slate-50/70 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {dictationMode ? 'Nghe phát âm & gõ chính xác' : 'Nghĩa tiếng Việt'}
          </span>

          {dictationMode ? (
            <div className="py-2 flex items-center justify-center gap-2 text-purple-800 font-bold text-base">
              <Headphones className="w-5 h-5 text-purple-600 animate-pulse" />
              <span>[Nghe từ qua loa gợi ý bên dưới để gõ]</span>
            </div>
          ) : (
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {currentWord?.meaning_vi}
            </h3>
          )}

          <div className="text-xs text-slate-400 mt-1 font-mono">
            Loại từ: {currentWord?.part_of_speech} • Cấp {currentWord?.cefr_level}
          </div>
        </div>

        {/* Hộp thông báo hết thời gian (5s hiện đáp án và nghĩa để ôn lại) */}
        {isTimedOut && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between text-left animate-fadeIn">
            <div>
              <span className="font-bold block">⏰ Hết thời gian 10s (0 pts)!</span>
              <span>Từ đúng là <strong className="text-emerald-700 font-mono text-sm uppercase">{currentWord.word}</strong>: {currentWord.meaning_vi}. Tự chuyển từ sau 5s...</span>
            </div>
            <button
              onClick={() => advanceNextWord(playerScore, botScore, maxCombo, collectedStats)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 ml-2 text-[11px]"
            >
              Chuyển ngay
            </button>
          </div>
        )}

        {/* Input Field + 5s Circular Radial Countdown Audio Hint Button */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            {/* Input with shake animation on typo */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                disabled={isTimedOut}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Gõ từ tiếng Anh rồi Enter..."
                className={`w-full px-5 py-3.5 rounded-2xl border text-base font-mono font-semibold transition-all duration-150 focus:outline-none ${
                  isShaking
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-400 animate-shake'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />

              {hasAttemptError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Xóa gõ lại ngay!</span>
                </div>
              )}
            </div>

            {/* Audio Hint Button with 5s Radial Countdown */}
            <AudioHintButton
              word={currentWord?.word || ''}
              accent={accentPreference}
              cooldownSeconds={5}
              autoPlayFirstTime={dictationMode}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>💡 Nhấn <strong>Enter</strong> để kiểm tra phản xạ</span>
            <span>Gõ sai ô sẽ rung và cho gõ lại ngay</span>
          </div>
        </form>
      </div>
    </div>
  );
};
