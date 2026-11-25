import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Bot, SkipForward, AlertCircle } from 'lucide-react';
import { VocabWord } from '../../types/vocab';
import { TimeDecayScoreBar } from '../common/TimeDecayScoreBar';
import { audioService } from '../../services/audio';
import { BotDifficulty, BotAIService } from '../../services/botAi';
import { shuffle } from '../../services/questionGen';

interface MatchPhase2MatchProps {
  words: VocabWord[];
  difficulty: BotDifficulty;
  onPhaseComplete: (playerPhaseScore: number, botPhaseScore: number, playerCombo: number) => void;
  initialPlayerScore: number;
  initialBotScore: number;
  timePerQuestion?: number;
}

export const MatchPhase2Match: React.FC<MatchPhase2MatchProps> = ({
  words,
  difficulty,
  onPhaseComplete,
  initialPlayerScore,
  initialBotScore,
  timePerQuestion = 10
}) => {
  // English words list (left)
  const [leftWords, setLeftWords] = useState<VocabWord[]>([]);
  // Vietnamese meanings list (right)
  const [rightMeanings, setRightMeanings] = useState<{ id: string; meaning_vi: string }[]>([]);

  // Selection state
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedMeaningId, setSelectedMeaningId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mismatchIds, setMismatchIds] = useState<{ wordId: string; meaningId: string } | null>(null);
  const [autoRevealedWord, setAutoRevealedWord] = useState<VocabWord | null>(null);

  // Scores & Combo
  const [playerScore, setPlayerScore] = useState<number>(initialPlayerScore);
  const [botScore, setBotScore] = useState<number>(initialBotScore);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);

  // Time decay score per pair (1.5s freeze at 1000, 10s down to 0)
  const [currentDecayScore, setCurrentDecayScore] = useState<number>(1000);
  const pairStartTimeRef = useRef<number>(Date.now());
  const decayTimerRef = useRef<number | null>(null);
  const autoTimeoutRef = useRef<number | null>(null);

  // Initialize shuffled columns
  useEffect(() => {
    const shuffledLeft = shuffle(words);
    const shuffledRight = shuffle(words.map((w) => ({ id: w.id, meaning_vi: w.meaning_vi })));

    setLeftWords(shuffledLeft);
    setRightMeanings(shuffledRight);
    pairStartTimeRef.current = Date.now();
  }, [words]);

  // Real-time decay tick: 1.5s freeze, then decay to 0 over 10s
  useEffect(() => {
    decayTimerRef.current = window.setInterval(() => {
      if (autoRevealedWord) return;
      const elapsed = Date.now() - pairStartTimeRef.current;
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

        // Auto timeout at 0 pts: auto reveal one unmatched pair
        if (score <= 0 && !autoRevealedWord) {
          handleAutoTimeout();
        }
      }
    }, 100);

    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, [matchedIds, words, autoRevealedWord, timePerQuestion]);

  // Bot AI simulated progress
  useEffect(() => {
    let botMatchedCount = 0;
    const botInterval = setInterval(() => {
      if (botMatchedCount >= words.length) {
        clearInterval(botInterval);
        return;
      }
      botMatchedCount += 1;
      const botRes = BotAIService.simulateQuestionResult(difficulty);
      if (botRes.isCorrect) {
        setBotScore((prev) => prev + botRes.score);
      }
    }, 2800);

    return () => clearInterval(botInterval);
  }, [words.length, difficulty]);

  // Check matching logic
  const handleSelectWord = (id: string) => {
    if (matchedIds.includes(id) || autoRevealedWord) return;
    setSelectedWordId(id);

    if (selectedMeaningId) {
      evaluatePair(id, selectedMeaningId);
    }
  };

  const handleSelectMeaning = (id: string) => {
    if (matchedIds.includes(id) || autoRevealedWord) return;
    setSelectedMeaningId(id);

    if (selectedWordId) {
      evaluatePair(selectedWordId, id);
    }
  };

  const evaluatePair = (wId: string, mId: string) => {
    if (wId === mId) {
      // Correct match!
      const newMatched = [...matchedIds, wId];
      setMatchedIds(newMatched);
      setSelectedWordId(null);
      setSelectedMeaningId(null);
      setMismatchIds(null);

      // Score + combo
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const comboBonus = nextCombo >= 3 ? 50 : 0;
      const earned = currentDecayScore + comboBonus;
      setPlayerScore((prev) => prev + earned);

      audioService.playSound(nextCombo >= 3 ? 'combo' : 'correct');

      // Reset decay for next pair
      pairStartTimeRef.current = Date.now();
      setCurrentDecayScore(1000);

      // Check if all matched
      if (newMatched.length === words.length) {
        setTimeout(() => {
          onPhaseComplete(playerScore + earned, botScore, Math.max(maxCombo, nextCombo));
        }, 800);
      }
    } else {
      // Wrong match!
      setMismatchIds({ wordId: wId, meaningId: mId });
      setCombo(0);
      audioService.playSound('wrong');

      setTimeout(() => {
        setSelectedWordId(null);
        setSelectedMeaningId(null);
        setMismatchIds(null);
      }, 500);
    }
  };

  // Auto timeout when score drops to 0: reveal first remaining unmatched pair for review
  const handleAutoTimeout = () => {
    const remaining = words.filter((w) => !matchedIds.includes(w.id));
    if (remaining.length === 0) return;

    const toReveal = remaining[0];
    setAutoRevealedWord(toReveal);
    setCombo(0);
    audioService.playSound('wrong');

    autoTimeoutRef.current = window.setTimeout(() => {
      resolveRevealedPair(toReveal);
    }, 5000);
  };

  const handleSkipPair = () => {
    if (autoRevealedWord) return;
    const remaining = words.filter((w) => !matchedIds.includes(w.id));
    if (remaining.length === 0) return;

    const toReveal = remaining[0];
    setAutoRevealedWord(toReveal);
    setCombo(0);
    audioService.playSound('wrong');

    autoTimeoutRef.current = window.setTimeout(() => {
      resolveRevealedPair(toReveal);
    }, 3000);
  };

  const resolveRevealedPair = (revealed: VocabWord) => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    setAutoRevealedWord(null);
    setSelectedWordId(null);
    setSelectedMeaningId(null);

    const newMatched = [...matchedIds, revealed.id];
    setMatchedIds(newMatched);
    pairStartTimeRef.current = Date.now();
    setCurrentDecayScore(1000);

    if (newMatched.length === words.length) {
      setTimeout(() => {
        onPhaseComplete(playerScore, botScore, maxCombo);
      }, 600);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2.5 animate-fadeIn px-2 sm:px-0">
      {/* Top Header: Scores & Phase Indicator */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Giai đoạn 2 / 4
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Đã nối {matchedIds.length}/{words.length} cặp
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-800 mt-0.5">
            Nối Từ Tiếng Anh & Nghĩa Tiếng Việt
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
        label="Điểm nối cặp này (10s)"
      />

      {/* Control bar: Skip button */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400">
          Chọn 1 ô bên trái và 1 ô bên phải tương ứng
        </span>
        <button
          type="button"
          onClick={handleSkipPair}
          disabled={!!autoRevealedWord}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition"
          title="Bỏ qua cặp này (chuyển cặp kế)"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Bỏ qua cặp</span>
        </button>
      </div>

      {/* Auto revealed alert for 5s */}
      {autoRevealedWord && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between animate-fadeIn">
          <div>
            <span className="font-bold block">⏰ Hết thời gian 10s (0 pts)!</span>
            <span>
              Đáp án cặp: <strong className="text-emerald-700 font-mono text-sm uppercase">{autoRevealedWord.word}</strong> = <em>"{autoRevealedWord.meaning_vi}"</em>. Tự chuyển sau giây lát...
            </span>
          </div>
          <button
            onClick={() => resolveRevealedPair(autoRevealedWord)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 ml-2 text-[11px]"
          >
            Tiếp tục
          </button>
        </div>
      )}

      {/* Matching Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Left: English Words */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Từ tiếng Anh
          </span>
          {leftWords.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedWordId === item.id;
            const isMismatched = mismatchIds?.wordId === item.id;
            const isBeingRevealed = autoRevealedWord?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched || !!autoRevealedWord}
                onClick={() => handleSelectWord(item.id)}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all font-mono text-xs sm:text-sm flex items-center justify-between ${
                  isMatched
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed line-through'
                    : isBeingRevealed
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold ring-2 ring-amber-400/50'
                    : isMismatched
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 animate-shake'
                    : isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{item.word}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Right: Vietnamese Meanings */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Nghĩa tiếng Việt
          </span>
          {rightMeanings.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedMeaningId === item.id;
            const isMismatched = mismatchIds?.meaningId === item.id;
            const isBeingRevealed = autoRevealedWord?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched || !!autoRevealedWord}
                onClick={() => handleSelectMeaning(item.id)}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all text-xs sm:text-sm font-semibold flex items-center justify-between ${
                  isMatched
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed line-through'
                    : isBeingRevealed
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold ring-2 ring-amber-400/50'
                    : isMismatched
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 animate-shake'
                    : isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{item.meaning_vi}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
