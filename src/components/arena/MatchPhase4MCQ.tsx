import React, { useState, useEffect, useRef } from 'react';
import { Bot, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { VocabWord } from '../../types/vocab';
import { TimeDecayScoreBar } from '../common/TimeDecayScoreBar';
import { audioService } from '../../services/audio';
import { BotDifficulty, BotAIService } from '../../services/botAi';

interface MatchPhase4MCQProps {
  words: VocabWord[];
  difficulty: BotDifficulty;
  onPhaseComplete: (playerFinalScore: number, botFinalScore: number, finalMaxCombo: number) => void;
  initialPlayerScore: number;
  initialBotScore: number;
  initialCombo: number;
  timePerQuestion?: number; // mặc định 10s
}

export const MatchPhase4MCQ: React.FC<MatchPhase4MCQProps> = ({
  words,
  difficulty,
  onPhaseComplete,
  initialPlayerScore,
  initialBotScore,
  initialCombo,
  timePerQuestion = 10
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  // Scores & Combo
  const [playerScore, setPlayerScore] = useState<number>(initialPlayerScore);
  const [botScore, setBotScore] = useState<number>(initialBotScore);
  const [combo, setCombo] = useState<number>(initialCombo);
  const [maxCombo, setMaxCombo] = useState<number>(initialCombo);

  // Time decay score per question
  const [currentDecayScore, setCurrentDecayScore] = useState<number>(1000);
  const questionStartTimeRef = useRef<number>(Date.now());
  const decayTimerRef = useRef<number | null>(null);
  const autoTimeoutRef = useRef<number | null>(null);

  const currentWord = words[currentWordIndex];
  const q = currentWord?.context_question;

  // Reset timers on question change
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setCurrentDecayScore(1000);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsTimedOut(false);
  }, [currentWordIndex]);

  // Real-time decay tick:
  // Giữ nguyên 1000 pts trong 1.5s đầu để người nhanh lấy trọn vẹn điểm!
  // Sau đó tụt dần về 0 pts trong tổng thời gian timePerQuestion (mặc định 10s)
  useEffect(() => {
    decayTimerRef.current = window.setInterval(() => {
      if (isAnswered || isTimedOut) return;
      const elapsed = Date.now() - questionStartTimeRef.current;
      const gracePeriodMs = 1500; // 1.5s đầu giữ nguyên 1000 pts
      const totalDurationMs = Math.max(8000, timePerQuestion * 1000);

      if (elapsed <= gracePeriodMs) {
        setCurrentDecayScore(1000);
      } else {
        const decayWindow = totalDurationMs - gracePeriodMs;
        const decayElapsed = elapsed - gracePeriodMs;
        const fraction = Math.min(1, decayElapsed / decayWindow);
        const score = Math.max(0, Math.round(1000 - fraction * 1000));
        setCurrentDecayScore(score);

        // Khi thanh điểm chạy hết (0 điểm) mà chưa hoàn thành:
        // Tự động tắt, hiện đáp án trong vòng 5s kèm nghĩa để người học ôn luôn!
        if (score <= 0 && !isAnswered && !isTimedOut) {
          handleTimeoutExpire();
        }
      }
    }, 100);

    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, [isAnswered, isTimedOut, timePerQuestion]);

  const handleTimeoutExpire = () => {
    setIsTimedOut(true);
    setIsAnswered(true);
    setCombo(0);
    audioService.playSound('wrong');

    // Hiện đáp án và nghĩa trong 5s để người học kịp ôn lại trước khi qua câu tiếp theo
    autoTimeoutRef.current = window.setTimeout(() => {
      advanceNextQuestion(playerScore, botScore, maxCombo);
    }, 5000);
  };

  // Bot simulation for this question
  useEffect(() => {
    const timer = setTimeout(() => {
      const botRes = BotAIService.simulateQuestionResult(difficulty);
      if (botRes.isCorrect) {
        setBotScore((prev) => prev + botRes.score);
      }
    }, 3000 + Math.random() * 2500);

    return () => clearTimeout(timer);
  }, [currentWordIndex, difficulty]);

  const advanceNextQuestion = (pScore: number, bScore: number, mCombo: number) => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
    } else {
      onPhaseComplete(pScore, bScore, mCombo);
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswered || !q || isTimedOut) return;

    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option.toLowerCase() === q.correctAnswer.toLowerCase();

    let newPlayerScore = playerScore;
    let nextCombo = combo;

    if (isCorrect) {
      nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const comboBonus = nextCombo >= 3 ? 50 : 0;
      const earned = currentDecayScore + comboBonus;
      newPlayerScore = playerScore + earned;
      setPlayerScore(newPlayerScore);

      audioService.playSound(nextCombo >= 3 ? 'combo' : 'correct');
    } else {
      setCombo(0);
      nextCombo = 0;
      audioService.playSound('wrong');
    }

    // Delay before next question
    setTimeout(() => {
      advanceNextQuestion(newPlayerScore, botScore, Math.max(maxCombo, nextCombo));
    }, 1200);
  };

  // Nút bỏ qua từ khi thi đấu
  const handleSkipWord = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setCombo(0);
    audioService.playSound('wrong');
    setTimeout(() => {
      advanceNextQuestion(playerScore, botScore, maxCombo);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2.5 animate-fadeIn px-2 sm:px-0">
      {/* Top Header: Scores & Phase Indicator */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Giai đoạn 4 / 4
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Câu {currentWordIndex + 1}/{words.length}
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-800 mt-0.5">
            Điền Từ Theo Ngữ Cảnh (Context Cloze)
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

      {/* Time Decay Score Bar (10s decay, 1.5s freeze at 1000) */}
      <TimeDecayScoreBar
        currentScore={currentDecayScore}
        combo={combo}
        minScore={0}
        maxScore={1000}
        label="Điểm ngữ cảnh câu này (10s)"
      />

      {/* Question Card */}
      {q && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chọn đáp án thích hợp điền vào chỗ trống:
              </span>

              {/* Nút bỏ qua từ khi thi đấu */}
              <button
                type="button"
                onClick={handleSkipWord}
                disabled={isAnswered}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 px-2.5 py-1 rounded-lg transition"
                title="Bỏ qua từ này (chuyển câu kế tiếp)"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Bỏ qua</span>
              </button>
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {q.sentence.replace('___', '______')}
            </p>
            <p className="text-xs text-slate-500 italic mt-2">
              Dịch: "{q.translation_vi}"
            </p>
          </div>

          {/* Hộp thông báo hết thời gian (5s hiển thị đáp án và nghĩa để ôn lại) */}
          {isTimedOut && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between animate-fadeIn">
              <div>
                <span className="font-bold block">⏰ Hết thời gian 10s (0 pts)!</span>
                <span>Đáp án đúng là <strong className="text-emerald-700 uppercase font-mono">{q.correctAnswer}</strong> ({currentWord.meaning_vi}). Tự chuyển câu sau 5s...</span>
              </div>
              <button
                onClick={() => advanceNextQuestion(playerScore, botScore, maxCombo)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 ml-2 text-[11px]"
              >
                Chuyển ngay
              </button>
            </div>
          )}

          {/* 4 Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, oIdx) => {
              const isSelected = selectedOption === opt;
              const isCorrectAnswer = opt.toLowerCase() === q.correctAnswer.toLowerCase();

              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50';

              if (isAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-2 ring-rose-500/20 animate-shake';
                } else {
                  btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all font-mono text-sm flex items-center justify-between ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected && isCorrectAnswer
                          ? 'bg-emerald-600 text-white'
                          : isSelected && !isCorrectAnswer
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {isAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
