import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shuffle, Sparkles, AlertTriangle, BookOpen, RefreshCw, FastForward } from 'lucide-react';
import { VocabWord } from '../../types/vocab';
import { audioService } from '../../services/audio';
import { pickSmartSessionWords, prepareMatchWords } from '../../services/questionGen';

interface MatchCountdownProps {
  pool: VocabWord[];
  allVocabularies: VocabWord[];
  wordCount: number;
  recentWordIds?: string[];
  levelTitle: string;
  onReady: (preparedWords: VocabWord[]) => void;
}

export const MatchCountdown: React.FC<MatchCountdownProps> = ({
  pool,
  allVocabularies,
  wordCount,
  recentWordIds = [],
  levelTitle,
  onReady,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [tickerWords, setTickerWords] = useState<string[]>([]);
  const finishedRef = useRef<boolean>(false);

  // Run the smart SRS + unlearned + anti-repeat algorithm once per countdown
  const selection = useMemo(() => {
    const result = pickSmartSessionWords(pool, wordCount, recentWordIds);
    const prepared = prepareMatchWords(result.words, allVocabularies);
    return { prepared, breakdown: result.breakdown };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerReady = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    audioService.playSound('combo');
    onReady(selection.prepared);
  };

  // 5 -> 4 -> 3 -> 2 -> 1 -> 0 countdown timer
  useEffect(() => {
    audioService.playSound('countdown');

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next > 0) {
          audioService.playSound('countdown');
          return next;
        }
        window.clearInterval(interval);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // Auto-launch right after hitting 0
  useEffect(() => {
    if (secondsLeft !== 0) return;
    const t = window.setTimeout(() => triggerReady(), 380);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Fast slot-shuffle visual ticker cycling through words in the pool
  useEffect(() => {
    const source = pool.length > 0 ? pool : selection.prepared;
    const displayCount = Math.min(5, Math.max(3, wordCount));

    const pickTicker = () => {
      if (secondsLeft === 0) {
        setTickerWords(selection.prepared.slice(0, displayCount).map((w) => w.word));
        return;
      }
      const next: string[] = [];
      for (let i = 0; i < displayCount; i++) {
        const idx = Math.floor(Math.random() * source.length);
        next.push(source[idx]?.word || '...');
      }
      setTickerWords(next);
    };

    pickTicker();
    if (secondsLeft === 0) return;

    const speedMs = secondsLeft <= 1 ? 180 : 90;
    const timer = window.setInterval(pickTicker, speedMs);
    return () => window.clearInterval(timer);
  }, [pool, selection.prepared, wordCount, secondsLeft]);

  const statusText =
    secondsLeft >= 4
      ? `Đang quét ${selection.breakdown.poolSize} từ vựng trong Vocab-Dex của bạn...`
      : secondsLeft >= 2
      ? 'Ưu tiên lọc các từ chưa học và từ còn hay sai...'
      : secondsLeft === 1
      ? 'Xáo trộn ngữ cảnh & đáp án ngẫu nhiên chống học vẹt...'
      : 'Bộ từ đã sẵn sàng — Bắt đầu trận đấu!';

  const priorityReviewCount = selection.breakdown.weakCount + selection.breakdown.dueCount;
  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Top progress strip */}
        <div className="w-full h-1.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-4 sm:p-6 text-center space-y-3.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Shuffle className="w-3.5 h-3.5 animate-spin" />
            <span>Thuật toán Vocab-Dex • {levelTitle} ({selection.prepared.length} từ)</span>
          </div>

          {/* Big Countdown Number */}
          <div className="relative flex items-center justify-center my-1">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-50">
              <span
                key={secondsLeft}
                className={`font-mono font-black tracking-tight animate-bounce ${
                  secondsLeft === 0 ? 'text-2xl text-emerald-400' : 'text-4xl sm:text-5xl'
                }`}
              >
                {secondsLeft === 0 ? 'GO!' : secondsLeft}
              </span>
            </div>
          </div>

          {/* Live Algorithm Status */}
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
              {statusText}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mỗi trận đấu được xáo trộn riêng dựa trên lịch sử học và độ chính xác của bạn
            </p>
          </div>

          {/* Slot / Shuffle Word Ticker */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{secondsLeft === 0 ? 'Đã khóa bộ từ thi đấu' : 'Đang xáo trộn ngẫu nhiên'}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {tickerWords.map((w, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all ${
                    secondsLeft === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-left">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Sai nhiều / Cần ôn</span>
              </div>
              <div className="text-xl font-mono font-extrabold text-amber-900 mt-1">
                {priorityReviewCount} <span className="text-[11px] font-normal text-amber-700">từ</span>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Chưa học</span>
              </div>
              <div className="text-xl font-mono font-extrabold text-emerald-900 mt-1">
                {selection.breakdown.unlearnedCount}{' '}
                <span className="text-[11px] font-normal text-emerald-700">từ</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold">
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Củng cố</span>
              </div>
              <div className="text-xl font-mono font-extrabold text-slate-800 mt-1">
                {selection.breakdown.reviewCount}{' '}
                <span className="text-[11px] font-normal text-slate-500">từ</span>
              </div>
            </div>
          </div>

          {/* Optional Skip Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={triggerReady}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Bỏ qua đếm ngược & Vào ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
