import React, { useState, useEffect } from 'react';
import { Volume2, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Phase Header & Timer */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Giai đoạn 1 / 4
          </span>
          <h2 className="text-lg font-extrabold text-slate-800 mt-0.5">
            Ghi Nhớ Danh Sách Từ Vựng
          </h2>
          <p className="text-xs text-slate-500">
            Nắm chắc âm tiết trọng âm, phiên âm IPA và nghĩa tiếng Việt trước khi bước vào đấu tốc độ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{secondsLeft}s</span>
          </div>

          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <span>Tôi đã sẵn sàng!</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {words.map((w, idx) => (
          <div
            key={w.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                  {w.part_of_speech}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                  {w.word}
                </h3>
                <button
                  type="button"
                  onClick={() => audioService.speak(w.word, accentPreference)}
                  className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Syllables breakdown with stressed syllable emphasized */}
              <div className="flex items-center gap-1 my-1.5 flex-wrap">
                {w.syllables.map((s, sIdx) => {
                  const isStressed = sIdx === w.stressedIndex;
                  return (
                    <span
                      key={sIdx}
                      className={`px-1.5 py-0.5 rounded text-xs font-mono transition ${
                        isStressed
                          ? 'bg-emerald-600 text-white font-extrabold shadow-2xs'
                          : 'bg-slate-100 text-slate-600 font-medium'
                      }`}
                    >
                      {s}
                      {isStressed && <span className="ml-0.5 text-emerald-200 text-[10px]">ˈ</span>}
                    </span>
                  );
                })}
              </div>

              {/* IPA */}
              <p className="text-xs font-mono text-slate-500 mb-2">{w.phonetic}</p>

              {/* Meaning */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-800">{w.meaning_vi}</p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic line-clamp-1">
              "{w.example_en}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
