import React, { useState, useEffect, useRef } from 'react';
import { Bot, Headphones, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
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
}

export const MatchPhase3Spell: React.FC<MatchPhase3SpellProps> = ({
  words,
  difficulty,
  onPhaseComplete,
  initialPlayerScore,
  initialBotScore,
  initialCombo,
  accentPreference
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [hasAttemptError, setHasAttemptError] = useState<boolean>(false);

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

  // Real-time decay tick
  useEffect(() => {
    decayTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - questionStartTimeRef.current;
      const decayWindow = 8000; // 8 seconds to 300 pts
      const fraction = Math.min(1, elapsed / decayWindow);
      const score = Math.max(300, Math.round(1000 - fraction * 700));
      setCurrentDecayScore(score);
    }, 100);

    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, []);

  // Bot simulation for this question
  useEffect(() => {
    const timer = setTimeout(() => {
      const botRes = BotAIService.simulateQuestionResult(difficulty);
      if (botRes.isCorrect) {
        setBotScore((prev) => prev + botRes.score);
      }
    }, 2500 + Math.random() * 2000);

    return () => clearTimeout(timer);
  }, [currentWordIndex, difficulty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || !inputVal.trim()) return;

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

      // Advance or complete
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          onPhaseComplete(updatedPlayerScore, botScore, Math.max(maxCombo, nextCombo), updatedStats);
        }, 500);
      }
    } else {
      // Wrong typing!
      // Requirement: "báo rung nhẹ ô nhập và cho phép xóa đi gõ lại tiếp ngay lập tức (không khóa phím, không trừ điểm thẳng, chỉ mất thời gian khiến thanh điểm tụt xuống)"
      setIsShaking(true);
      setHasAttemptError(true);
      audioService.playSound('wrong');

      setTimeout(() => {
        setIsShaking(false);
      }, 350);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
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

      {/* Time Decay Score Bar (1000 -> 300, 3 color zones) */}
      <TimeDecayScoreBar
        currentScore={currentDecayScore}
        combo={combo}
        label="Điểm phản xạ câu này"
      />

      {/* Main Spelling Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Dictation Mode Toggle for High Levels */}
        {isHighLevel && (
          <div className="flex items-center justify-between p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <Headphones className="w-4 h-4 text-purple-700" />
              <span>Chế độ Nghe & Viết (Dictation - B2/C1/C2)</span>
            </div>
            <button
              type="button"
              onClick={() => setDictationMode(!dictationMode)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-purple-800 border border-purple-200 shadow-2xs hover:bg-purple-100/50 transition"
            >
              {dictationMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {dictationMode ? 'Đang ẩn nghĩa (Bật hiển thị)' : 'Ẩn nghĩa tiếng Việt'}
            </button>
          </div>
        )}

        {/* Prompt: Vietnamese Meaning (or Audio Dictation Wave) */}
        <div className="text-center py-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {dictationMode ? 'Nghe phát âm & gõ chính xác' : 'Nghĩa tiếng Việt'}
          </span>

          {dictationMode ? (
            <div className="py-2 flex items-center justify-center gap-2 text-purple-800 font-bold text-base">
              <Headphones className="w-5 h-5 text-purple-600 animate-pulse" />
              <span>[Nghe từ qua loa gợi ý bên dưới để gõ]</span>
            </div>
          ) : (
            <h3 className="text-2xl font-extrabold text-slate-900">
              {currentWord?.meaning_vi}
            </h3>
          )}

          <div className="text-xs text-slate-400 mt-2 font-mono">
            Loại từ: {currentWord?.part_of_speech} • Cấp {currentWord?.cefr_level}
          </div>
        </div>

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
            <span>Gõ sai ô sẽ rung và cho gõ lại ngay mà không bị khóa phím</span>
          </div>
        </form>
      </div>
    </div>
  );
};
