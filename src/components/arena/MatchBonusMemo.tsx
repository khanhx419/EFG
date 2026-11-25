import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, Volume2, FastForward, Clock } from 'lucide-react';
import { VocabWord } from '../../types/vocab';
import { audioService } from '../../services/audio';

interface MatchBonusMemoProps {
  bonusWords: VocabWord[];
  onComplete: () => void;
  accentPreference: 'en-US' | 'en-GB';
}

export const MatchBonusMemo: React.FC<MatchBonusMemoProps> = ({
  bonusWords,
  onComplete,
  accentPreference
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const finishedRef = useRef<boolean>(false);

  // Play celebration sound on mount
  useEffect(() => {
    audioService.playSound('combo');
    // Read first word automatically
    if (bonusWords[0]) {
      audioService.speak(bonusWords[0].word, accentPreference);
    }
  }, [bonusWords, accentPreference]);

  // 20s countdown timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 animate-fadeIn px-2 sm:px-0">
      {/* Celebratory Bonus Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-3 sm:p-4 shadow-lg border border-amber-300/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Flame className="w-5 h-5 text-amber-200 fill-amber-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base uppercase tracking-tight">
                🎁 Vòng Bonus Bất Ngờ!
              </span>
              <span className="text-[10px] bg-white text-orange-600 font-extrabold px-1.5 py-0.2 rounded-md">
                +{bonusWords.length} Từ mới
              </span>
            </div>
            <p className="text-[11px] text-white/90">
              Chen vào giữa trận đấu: Bạn có 20s để ghi nhớ nhanh trước khi thi đấu!
            </p>
          </div>
        </div>

        {/* 20s Radial / Circular badge */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 bg-black/25 px-2.5 py-1 rounded-xl text-amber-200 font-mono font-black text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{secondsLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar for 20s */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${(secondsLeft / 20) * 100}%` }}
        />
      </div>

      {/* Bonus Words Cards Grid */}
      <div className={`grid gap-3 ${bonusWords.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {bonusWords.map((word) => (
          <div
            key={word.id}
            className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-sm space-y-2.5 text-center relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Cấp {word.cefr_level}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                {word.part_of_speech}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {word.word}
            </h3>

            {/* IPA & Pronounce Button */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {word.phonetic}
              </span>
              <button
                type="button"
                onClick={() => audioService.speak(word.word, accentPreference)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg font-semibold text-xs border border-amber-200 transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe</span>
              </button>
            </div>

            {/* Meaning */}
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70">
              <span className="text-[10px] font-bold text-amber-900/70 uppercase block mb-0.5">
                Nghĩa tiếng Việt
              </span>
              <p className="text-base font-bold text-slate-900">{word.meaning_vi}</p>
            </div>

            {/* Example sentence */}
            <div className="text-left bg-slate-50 p-2.5 rounded-xl text-xs space-y-0.5 border border-slate-100">
              <p className="font-semibold text-slate-800 text-[11px]">"{word.example_en}"</p>
              <p className="text-slate-500 italic text-[11px]">
                {word.example_vi
                  ? `"${word.example_vi.replace(/^Dịch:\s*/i, '').replace(/^"|"$/g, '').replace(/^Nghĩa chính:\s*/i, '')}"`
                  : `"${word.meaning_vi}"`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button: Skip Countdown & Fight Right Away */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-98"
        >
          <FastForward className="w-4 h-4 fill-white" />
          <span>Thuộc rồi! Thi đấu ngay cùng {bonusWords.length} từ bonus ({secondsLeft}s)</span>
        </button>
      </div>
    </div>
  );
};
