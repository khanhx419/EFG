import React, { useState } from 'react';
import { X, BookOpen, Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { IPA_GUIDE, STRESS_RULES } from '../../data/phoneticsGuide';
import { audioService } from '../../services/audio';

interface PhoneticsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneticsGuideModal: React.FC<PhoneticsGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ipa' | 'stress'>('stress');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cẩm Nang Phát Âm & Quy Tắc Trọng Âm</h2>
              <p className="text-xs text-slate-500">Tra cứu nhanh bảng ký hiệu IPA và 4 quy tắc trọng âm tiếng Anh cốt lõi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-500 text-slate-500 hover:text-white border border-slate-200 hover:border-rose-500 transition shadow-xs"
            title="Đóng (X)"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab('stress')}
            className={`py-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'stress'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            4 Quy Tắc Trọng Âm Cốt Lõi
          </button>
          <button
            onClick={() => setActiveTab('ipa')}
            className={`py-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'ipa'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            Bảng Ký Tự Phiên Âm Quốc Tế (IPA)
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'stress' ? (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                💡 <strong>Mẹo thi đấu tốc độ:</strong> Trong VocabClash, các từ đều được phân tách âm tiết và viết hoa trọng âm chính (ví dụ: <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono font-bold text-emerald-800">com - MU - ni - cate</code>). Nắm vững 4 quy tắc này giúp bạn phản xạ gõ và phát âm chuẩn ngay từ cái nhìn đầu tiên!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STRESS_RULES.map((rule, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-sm text-slate-800">{rule.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">{rule.rule}</p>
                      
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 mb-3 text-xs font-mono font-bold text-emerald-700">
                        {rule.formula}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ví dụ tiêu biểu:</span>
                        {rule.examples.map((ex, eIdx) => (
                          <div key={eIdx} className="flex items-center justify-between text-xs bg-white/70 px-2.5 py-1.5 rounded border border-slate-200/50">
                            <span className="font-mono font-semibold text-slate-800">{ex.word}</span>
                            <span className="text-emerald-700 font-medium font-mono">{ex.stress}</span>
                            <span className="text-slate-500 text-[11px]">{ex.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rule.exception && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-amber-700">
                        ⚠️ {rule.exception}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {IPA_GUIDE.map((cat, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <h3 className="font-bold text-sm text-slate-800 mb-1">{cat.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{cat.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {cat.sounds.map((sound, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-base text-emerald-700">
                            {sound.symbol}
                          </span>
                          <button
                            type="button"
                            onClick={() => audioService.speak(sound.example, 'en-US')}
                            title={`Nghe phát âm từ "${sound.example}"`}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-slate-800">{sound.example}</div>
                        <div className="text-[11px] font-mono text-slate-500">{sound.ipaExample}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5 truncate">{sound.meaning_vi}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Đã hiểu, đóng cẩm nang
          </button>
        </div>
      </div>
    </div>
  );
};
