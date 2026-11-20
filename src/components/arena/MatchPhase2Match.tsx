import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Zap, Flame, Bot, Swords } from 'lucide-react';
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
}

export const MatchPhase2Match: React.FC<MatchPhase2MatchProps> = ({
  words,
  difficulty,
  onPhaseComplete,
  initialPlayerScore,
  initialBotScore
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

  // Scores & Combo
  const [playerScore, setPlayerScore] = useState<number>(initialPlayerScore);
  const [botScore, setBotScore] = useState<number>(initialBotScore);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);

  // Time decay score per item
  const [currentDecayScore, setCurrentDecayScore] = useState<number>(1000);
  const pairStartTimeRef = useRef<number>(Date.now());
  const decayTimerRef = useRef<number | null>(null);

  // Initialize shuffled columns
  useEffect(() => {
    const shuffledLeft = shuffle(words);
    const shuffledRight = shuffle(words.map((w) => ({ id: w.id, meaning_vi: w.meaning_vi })));

    setLeftWords(shuffledLeft);
    setRightMeanings(shuffledRight);
    pairStartTimeRef.current = Date.now();
  }, [words]);

  // Real-time decay tick
  useEffect(() => {
    decayTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - pairStartTimeRef.current;
      const decayWindow = 8000; // 8 seconds to reach 300 pts
      const fraction = Math.min(1, elapsed / decayWindow);
      const score = Math.max(300, Math.round(1000 - fraction * 700));
      setCurrentDecayScore(score);
    }, 100);

    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, []);

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
    if (matchedIds.includes(id)) return;
    setSelectedWordId(id);

    if (selectedMeaningId) {
      evaluatePair(id, selectedMeaningId);
    }
  };

  const handleSelectMeaning = (id: string) => {
    if (matchedIds.includes(id)) return;
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

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
      {/* Top Header: Scores & Phase Indicator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Giai đoạn 2 / 4
          </span>
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

      {/* Time Decay Score Bar */}
      <TimeDecayScoreBar
        currentScore={currentDecayScore}
        combo={combo}
        label="Điểm nối cặp hiện tại"
      />

      {/* Matching Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: English Words */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Từ tiếng Anh
          </span>
          {leftWords.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedWordId === item.id;
            const isMismatched = mismatchIds?.wordId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleSelectWord(item.id)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all font-mono text-sm flex items-center justify-between ${
                  isMatched
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed line-through'
                    : isMismatched
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 animate-shake'
                    : isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{item.word}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {/* Right: Vietnamese Meanings */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Nghĩa tiếng Việt
          </span>
          {rightMeanings.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedMeaningId === item.id;
            const isMismatched = mismatchIds?.meaningId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleSelectMeaning(item.id)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all text-xs sm:text-sm font-semibold flex items-center justify-between ${
                  isMatched
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed line-through'
                    : isMismatched
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 animate-shake'
                    : isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{item.meaning_vi}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
