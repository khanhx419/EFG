import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  Lock, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  BookOpen, 
  AlertTriangle 
} from 'lucide-react';
import { CEFRLevel, VocabWord } from '../../types/vocab';
import { WordDetailModal } from './WordDetailModal';
import { SRSService } from '../../services/srs';
import { audioService } from '../../services/audio';

interface VocabDexViewProps {
  vocabularies: VocabWord[];
  onUnlockWord: (wordId: string) => void;
  onOpenPhoneticsGuide: () => void;
  accentPreference: 'en-US' | 'en-GB';
}

export const VocabDexView: React.FC<VocabDexViewProps> = ({
  vocabularies,
  onUnlockWord,
  onOpenPhoneticsGuide,
  accentPreference
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<'all' | 'collected' | 'due' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeWordModal, setActiveWordModal] = useState<VocabWord | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(48);

  const levels: (CEFRLevel | 'ALL')[] = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // Calculate statistics & per-level counts in a single pass (fast for 10,000+ words)
  const { stats, levelCounts } = useMemo(() => {
    let collected = 0;
    let due = 0;
    const counts: Record<CEFRLevel, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    for (const w of vocabularies) {
      counts[w.cefr_level] = (counts[w.cefr_level] || 0) + 1;
      if (w.isCollected) {
        collected++;
        if (SRSService.isDueForReview(w.srs_status)) due++;
      }
    }
    return {
      stats: { total: vocabularies.length, collected, due },
      levelCounts: counts,
    };
  }, [vocabularies]);

  // Filtered vocabulary list
  const filteredWords = useMemo(() => {
    return vocabularies.filter((word) => {
      // Level filter
      if (selectedLevel !== 'ALL' && word.cefr_level !== selectedLevel) {
        return false;
      }

      // Type filter
      if (filterType === 'collected' && !word.isCollected) return false;
      if (filterType === 'locked' && word.isCollected) return false;
      if (filterType === 'due') {
        if (!word.isCollected || !SRSService.isDueForReview(word.srs_status)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchWord = word.word.toLowerCase().includes(query);
        const matchMeaning = word.meaning_vi.toLowerCase().includes(query);
        if (!matchWord && !matchMeaning) return false;
      }

      return true;
    });
  }, [vocabularies, selectedLevel, filterType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Quick Lookup Banner (Phonetics & Stress Rules) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Bảng Tra Cứu Quy Tắc Trọng Âm & Ký Hiệu IPA
            </h3>
            <p className="text-xs text-slate-600">
              Đối chiếu nhanh các nguyên âm ngắn/dài, cặp phụ âm và 4 quy tắc trọng âm tiếng Anh cốt lõi
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPhoneticsGuide}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <BookOpen className="w-4 h-4" />
          Mở Cẩm Nang Tra Cứu
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Tổng từ vựng</span>
          <span className="text-xl font-extrabold text-slate-800 font-mono">{stats.total}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-emerald-600 block">Đã mở khóa</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono">
            {stats.collected} <span className="text-xs text-slate-400 font-normal">({Math.round((stats.collected / (stats.total || 1)) * 100)}%)</span>
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-amber-600 block">Cần ôn lại (SRS)</span>
          <span className="text-xl font-extrabold text-amber-700 font-mono flex items-center gap-1.5">
            {stats.due}
            {stats.due > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </span>
        </div>
      </div>

      {/* Control Bar: CEFR Tabs, Search, and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* CEFR Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                setVisibleCount(48);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedLevel === lvl
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {lvl === 'ALL'
                ? `Tất cả (${vocabularies.length.toLocaleString('vi-VN')})`
                : `Cấp ${lvl} (${(levelCounts[lvl] || 0).toLocaleString('vi-VN')})`}
            </button>
          ))}
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo từ tiếng Anh hoặc nghĩa tiếng Việt..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === 'all'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('collected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === 'collected'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Đã thu thập ({stats.collected})
            </button>
            <button
              onClick={() => setFilterType('due')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === 'due'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Cần ôn lại ({stats.due})
            </button>
            <button
              onClick={() => setFilterType('locked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === 'locked'
                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Chưa mở khóa
            </button>
          </div>
        </div>
      </div>

      {/* Vocab Cards Grid */}
      {filteredWords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">Không tìm thấy từ vựng phù hợp</h4>
          <p className="text-xs text-slate-400">Hãy thử đổi cấp độ hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredWords.slice(0, visibleCount).map((word) => {
            const isDue = word.isCollected && SRSService.isDueForReview(word.srs_status);
            const retention = SRSService.calculateRetention(word.srs_status);

            return (
              <div
                key={word.id}
                onClick={() => setActiveWordModal(word)}
                className={`relative bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  !word.isCollected
                    ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 border-dashed border-slate-300'
                    : isDue
                    ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Top row badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Cấp {word.cefr_level}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isDue && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Cần ôn lại
                        </span>
                      )}

                      {!word.isCollected ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                          <Lock className="w-3 h-3" />
                          Khóa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {retention}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Word title and syllables */}
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-extrabold text-lg text-slate-900 tracking-tight">
                      {word.word}
                    </h4>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audioService.speak(word.word, accentPreference);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stressed syllable breakdown */}
                  <div className="text-xs font-mono text-slate-500 my-1 flex items-center gap-1 flex-wrap">
                    {word.syllables.map((s, idx) => (
                      <span
                        key={idx}
                        className={
                          idx === word.stressedIndex
                            ? 'font-bold text-emerald-700 bg-emerald-100/70 px-1 rounded'
                            : 'text-slate-500'
                        }
                      >
                        {s}
                        {idx < word.syllables.length - 1 && <span className="text-slate-300 ml-1">•</span>}
                      </span>
                    ))}
                  </div>

                  {/* IPA & Meaning */}
                  <p className="text-[11px] font-mono text-slate-400 mb-1.5">{word.phonetic}</p>
                  <p className="text-xs font-semibold text-slate-700 line-clamp-1">{word.meaning_vi}</p>
                </div>

                {/* Footer SRS retention bar if collected */}
                {word.isCollected ? (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Trí nhớ SRS</span>
                      <span>Khoảng cách: {word.srs_status.interval} ngày</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isDue ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${retention}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Nhấn vào để xem đầy đủ chi tiết</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {visibleCount < filteredWords.length && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 48)}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition"
            >
              Xem thêm ({filteredWords.length - visibleCount} từ còn lại)
            </button>
          </div>
        )}
        </>
      )}

      {/* Word Detail Modal */}
      <WordDetailModal
        word={activeWordModal}
        onClose={() => setActiveWordModal(null)}
        onUnlockWord={(wordId) => {
          onUnlockWord(wordId);
          setActiveWordModal(null);
        }}
        accentPreference={accentPreference}
      />
    </div>
  );
};
