import React from 'react';
import { X, Volume2, Sparkles, Calendar, RotateCcw, Lock, CheckCircle2, BookOpen } from 'lucide-react';
import { VocabWord } from '../../types/vocab';
import { audioService } from '../../services/audio';
import { SRSService } from '../../services/srs';

interface WordDetailModalProps {
  word: VocabWord | null;
  onClose: () => void;
  onUnlockWord?: (wordId: string) => void;
  accentPreference?: 'en-US' | 'en-GB';
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  onClose,
  onUnlockWord,
  accentPreference = 'en-US'
}) => {
  if (!word) return null;

  const retention = SRSService.calculateRetention(word.srs_status);
  const isDue = word.isCollected && SRSService.isDueForReview(word.srs_status);

  const handleSpeak = () => {
    audioService.speak(word.word, accentPreference);
  };

  const getPartOfSpeechLabel = (pos: VocabWord['part_of_speech']) => {
    switch (pos) {
      case 'noun': return 'Danh từ (n)';
      case 'verb': return 'Động từ (v)';
      case 'adjective': return 'Tính từ (adj)';
      case 'adverb': return 'Phó từ (adv)';
      case 'phrase': return 'Cụm từ (phrase)';
      default: return pos;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
              Cấp {word.cefr_level}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-700">
              {getPartOfSpeechLabel(word.part_of_speech)}
            </span>
            {word.isCollected ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã thu thập
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                <Lock className="w-3 h-3" />
                Chưa mở khóa
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Word & Pronunciation */}
          <div className="text-center pb-4 border-b border-slate-100">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {word.word}
            </h1>

            {/* Syllables breakdown with stressed syllable emphasized */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap my-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mr-1">
                Tách âm tiết:
              </span>
              {word.syllables.map((syl, sIdx) => {
                const isStressed = sIdx === word.stressedIndex;
                return (
                  <span
                    key={sIdx}
                    className={`px-2 py-1 rounded-md font-mono text-sm transition ${
                      isStressed
                        ? 'bg-emerald-600 text-white font-extrabold shadow-xs shadow-emerald-200 scale-105'
                        : 'bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    {syl}
                    {isStressed && <span className="ml-0.5 text-emerald-200 text-xs">ˈ</span>}
                  </span>
                );
              })}
            </div>

            {/* IPA & Audio button */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-sm font-mono font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                {word.phonetic}
              </span>
              <button
                type="button"
                onClick={handleSpeak}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs border border-emerald-200 transition active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                Phát âm ({accentPreference === 'en-US' ? 'US' : 'UK'})
              </button>
            </div>
          </div>

          {/* Meaning */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nghĩa tiếng Việt
            </h3>
            <p className="text-base font-bold text-slate-800">{word.meaning_vi}</p>
          </div>

          {/* Bilingual Examples */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Câu ví dụ song ngữ
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              "{word.example_en}"
            </p>
            <p className="text-xs text-slate-500 italic">
              "{word.example_vi}"
            </p>
          </div>

          {/* Context Cloze Question */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-2">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Ngữ cảnh vận dụng
            </h3>
            <p className="text-xs text-slate-700 font-mono">
              {word.context_question.sentence}
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Dịch: {word.context_question.translation_vi}
            </p>
          </div>

          {/* SRS Status */}
          {word.isCollected ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  Độ bền trí nhớ (SRS)
                </span>
                <span className={`text-xs font-bold ${isDue ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {isDue ? 'Cần ôn lại ngay!' : `${retention}% ổn định`}
                </span>
              </div>

              {/* Retention bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDue ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${retention}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Khoảng cách: {word.srs_status.interval} ngày</span>
                </div>
                <div className="text-right">
                  <span>Số lần ôn thành công: {word.srs_status.repetitions}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 flex items-center justify-between">
              <span>Từ vựng này chưa được mở khóa vào bộ sưu tập.</span>
              {onUnlockWord && (
                <button
                  type="button"
                  onClick={() => onUnlockWord(word.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs transition"
                >
                  Mở khóa ngay
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
