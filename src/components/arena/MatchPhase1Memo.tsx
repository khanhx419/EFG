import React, { useState, useEffect } from 'react';
import { Volume2, Clock, ArrowRight } from 'lucide-react';
import { VocabWord } from '../../types/vocab';
import { audioService } from '../../services/audio';

interface MatchPhase1MemoProps {
  words: VocabWord[];
  onComplete: () => void;
  accentPreference: 'en-US' | 'en-GB';
}

export const MatchPhase1Memo: React.FC<MatchPhase1MemoProps> = ({
  words,
  onComplete,
  accentPreference
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(60);

  // Auto countdown from 60 to 0
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2.5 animate-fadeIn px-2 sm:px-0">
      {/* Top Phase Header & Timer */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Giai đoạn 1 / 4
            </span>
            <span className="text-xs text-slate-400 font-semibold">{words.length} từ</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-800 mt-0.5">
            Ghi Nhớ Danh Sách Từ Vựng
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{secondsLeft}s</span>
          </div>

          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <span>Sẵn sàng đấu!</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Words Grid - 3 cols on desktop so all 5 words fit neatly on 1 screen */}
      <div className={`grid gap-2.5 ${words.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
        {words.map((w, idx) => (
          <div
            key={w.id}
            className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  {w.part_of_speech}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                  {w.word}
                </h3>
                <button
                  type="button"
                  onClick={() => audioService.speak(w.word, accentPreference)}
                  className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Syllables breakdown with stressed syllable emphasized */}
              <div className="flex items-center gap-1 my-1 flex-wrap">
                {w.syllables.map((s, sIdx) => {
                  const isStressed = sIdx === w.stressedIndex;
                  return (
                    <span
                      key={sIdx}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                        isStressed
                          ? 'bg-emerald-600 text-white font-extrabold shadow-2xs'
                          : 'bg-slate-100 text-slate-600 font-medium'
                      }`}
                    >
                      {s}
                      {isStressed && <span className="ml-0.5 text-emerald-200 text-[9px]">ˈ</span>}
                    </span>
                  );
                })}
              </div>

              {/* Meaning */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-800 leading-snug">{w.meaning_vi}</p>
              </div>
            </div>

            <div className="mt-1.5 pt-1 border-t border-slate-100 text-[10px] text-slate-500 italic truncate">
              "{w.example_en}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
