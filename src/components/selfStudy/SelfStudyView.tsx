import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Play, 
  Swords, 
  Volume2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Layers,
  Check,
  Search
} from 'lucide-react';
import { CEFRLevel, CustomDeck, VocabWord } from '../../types/vocab';
import { audioService } from '../../services/audio';
import { pickSessionWords } from '../../services/questionGen';

interface SelfStudyViewProps {
  vocabularies: VocabWord[];
  customDecks: CustomDeck[];
  onSaveCustomDeck: (deck: CustomDeck) => void;
  onDeleteCustomDeck: (id: string) => void;
  onUnlockWord: (wordId: string) => void;
  onStart1v1Match: (words: VocabWord[], deckName?: string) => void;
  accentPreference: 'en-US' | 'en-GB';
}

export const SelfStudyView: React.FC<SelfStudyViewProps> = ({
  vocabularies,
  customDecks,
  onSaveCustomDeck,
  onDeleteCustomDeck,
  onUnlockWord,
  onStart1v1Match,
  accentPreference
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('B1');
  const [activeDeck, setActiveDeck] = useState<CustomDeck | null>(null);

  // Studying state
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [studyWordIndex, setStudyWordIndex] = useState<number>(0);
  const [studyWords, setStudyWords] = useState<VocabWord[]>([]);
  const [spellingInput, setSpellingInput] = useState<string>('');
  const [spellingFeedback, setSpellingFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Custom deck creation modal state
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckDesc, setNewDeckDesc] = useState<string>('');
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [deckSearchQuery, setDeckSearchQuery] = useState<string>('');
  const [deckLevelFilter, setDeckLevelFilter] = useState<CEFRLevel | 'ALL'>('ALL');

  // Start study session for standard CEFR level (smart 10-word SRS batch)
  const startStandardStudy = (lvl: CEFRLevel) => {
    const words = vocabularies.filter((w) => w.cefr_level === lvl);
    if (words.length === 0) return;
    setActiveDeck(null);
    setStudyWords(pickSessionWords(words, Math.min(10, words.length)));
    setStudyWordIndex(0);
    setSpellingInput('');
    setSpellingFeedback('idle');
    setIsStudying(true);
  };

  // Start study session for custom deck
  const startCustomStudy = (deck: CustomDeck) => {
    const words = vocabularies.filter((w) => deck.wordIds.includes(w.id));
    if (words.length === 0) return;
    setActiveDeck(deck);
    setStudyWords(words);
    setStudyWordIndex(0);
    setSpellingInput('');
    setSpellingFeedback('idle');
    setIsStudying(true);
  };

  const currentWord = studyWords[studyWordIndex];

  // Auto unlock current word into Vocab-Dex when studied
  const handleWordLearned = (wordId: string) => {
    onUnlockWord(wordId);
    audioService.playSound('correct');
  };

  // Verify spelling reflex drill
  const handleCheckSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    if (spellingInput.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setSpellingFeedback('correct');
      audioService.playSound('correct');
      handleWordLearned(currentWord.id);
    } else {
      setSpellingFeedback('wrong');
      audioService.playSound('wrong');
    }
  };

  const handleNextWord = () => {
    if (studyWordIndex < studyWords.length - 1) {
      setStudyWordIndex((prev) => prev + 1);
      setSpellingInput('');
      setSpellingFeedback('idle');
    }
  };

  const handlePrevWord = () => {
    if (studyWordIndex > 0) {
      setStudyWordIndex((prev) => prev - 1);
      setSpellingInput('');
      setSpellingFeedback('idle');
    }
  };

  // Create Custom Deck
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim() || selectedWordIds.length < 3) return;

    const newDeck: CustomDeck = {
      id: `deck_${Date.now()}`,
      name: newDeckName.trim(),
      description: newDeckDesc.trim() || `Bộ từ vựng gồm ${selectedWordIds.length} từ`,
      createdAt: new Date().toISOString(),
      wordIds: selectedWordIds
    };

    onSaveCustomDeck(newDeck);
    setIsCreatingDeck(false);
    setNewDeckName('');
    setNewDeckDesc('');
    setSelectedWordIds([]);
  };

  const toggleWordSelection = (id: string) => {
    if (selectedWordIds.includes(id)) {
      setSelectedWordIds(selectedWordIds.filter((wId) => wId !== id));
    } else {
      if (selectedWordIds.length >= 10) return; // Max 10 words
      setSelectedWordIds([...selectedWordIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* If currently studying */}
      {isStudying && currentWord ? (
        <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
          {/* Top navigation back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsStudying(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Thoát phiên tự học
            </button>

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Từ {studyWordIndex + 1} / {studyWords.length}
            </span>

            <button
              onClick={() => onStart1v1Match(studyWords, activeDeck?.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Swords className="w-3.5 h-3.5" />
              Đưa vào Đấu 1v1
            </button>
          </div>

          {/* Flashcard with syllable stress and pronunciation */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                Cấp {currentWord.cefr_level}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                {currentWord.part_of_speech}
              </span>
            </div>

            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {currentWord.word}
            </h2>

            {/* Syllables Breakdown */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold mr-1">Trọng âm:</span>
              {currentWord.syllables.map((syl, sIdx) => {
                const isStressed = sIdx === currentWord.stressedIndex;
                return (
                  <span
                    key={sIdx}
                    className={`px-3 py-1.5 rounded-xl font-mono text-base transition ${
                      isStressed
                        ? 'bg-emerald-600 text-white font-extrabold shadow-sm scale-105'
                        : 'bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    {syl}
                    {isStressed && <span className="ml-1 text-emerald-200 text-xs">ˈ</span>}
                  </span>
                );
              })}
            </div>

            {/* IPA & Pronunciation Audio */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                {currentWord.phonetic}
              </span>
              <button
                type="button"
                onClick={() => audioService.speak(currentWord.word, accentPreference)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold text-xs border border-emerald-200 transition"
              >
                <Volume2 className="w-4 h-4" />
                Nghe phát âm ({accentPreference})
              </button>
            </div>

            {/* Vietnamese Meaning */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nghĩa tiếng Việt
              </span>
              <p className="text-lg font-bold text-slate-800">{currentWord.meaning_vi}</p>
            </div>

            {/* Example sentence */}
            <div className="text-left bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Ví dụ thực tế:
              </span>
              <p className="text-sm text-slate-800 font-medium">"{currentWord.example_en}"</p>
              <p className="text-xs text-slate-500 italic">"{currentWord.example_vi}"</p>
            </div>

            {/* Spelling Reflex Practice Drill */}
            <form onSubmit={handleCheckSpelling} className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Luyện phản xạ gõ từ này:</span>
                <span className="text-slate-400">Gõ lại để ghi nhớ vào Vocab-Dex</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={spellingInput}
                  onChange={(e) => {
                    setSpellingInput(e.target.value);
                    if (spellingFeedback !== 'idle') setSpellingFeedback('idle');
                  }}
                  placeholder="Gõ từ tiếng Anh tại đây..."
                  className={`flex-1 px-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none transition ${
                    spellingFeedback === 'correct'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : spellingFeedback === 'wrong'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 animate-shake'
                      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Kiểm tra
                </button>
              </div>

              {spellingFeedback === 'correct' && (
                <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4" />
                  Chính xác! Từ đã được mở khóa vào Vocab-Dex!
                </p>
              )}
              {spellingFeedback === 'wrong' && (
                <p className="text-xs font-bold text-rose-600 animate-fadeIn">
                  Chưa chính xác, hãy xóa và gõ lại thử nhé!
                </p>
              )}
            </form>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevWord}
              disabled={studyWordIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Từ trước
            </button>

            <button
              onClick={handleNextWord}
              disabled={studyWordIndex === studyWords.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <span>Từ tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Deck Selection View */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Tự Học Offline & Tùy Biến Bộ Từ (Custom Deck)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Luyện tập sâu không áp lực thời gian. Tự chọn bộ từ 5-10 từ bất kỳ để ôn kỹ trước khi bước vào võ đài 1v1.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingDeck(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tạo Bộ Từ Mới (5-10 từ)
            </button>
          </div>

          {/* Tabs switch */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab('standard')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'standard'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Bộ từ theo chuẩn CEFR (A1 - C2)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'custom'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Bộ từ tự tạo cá nhân ({customDecks.length})
            </button>
          </div>

          {/* Standard CEFR Section */}
          {activeTab === 'standard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((lvl) => {
                const wordsInLvl = vocabularies.filter((w) => w.cefr_level === lvl);
                const unlockedInLvl = wordsInLvl.filter((w) => w.isCollected).length;

                return (
                  <div
                    key={lvl}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          CEFR Cấp {lvl}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          {unlockedInLvl}/{wordsInLvl.length} đã mở
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-800">
                        Từ vựng tầng {lvl}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {lvl === 'A1' || lvl === 'A2'
                          ? 'Từ vựng giao tiếp hàng ngày, nền tảng phản xạ âm vị cơ bản.'
                          : lvl === 'B1' || lvl === 'B2'
                          ? 'Từ vựng công sở, học thuật, báo chí và lập luận thuyết phục.'
                          : 'Từ vựng tinh hoa, triết học, sắc thái biểu đạt cao cấp bậc thầy.'}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {wordsInLvl.slice(0, 3).map((w) => (
                          <span
                            key={w.id}
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[11px] font-mono"
                          >
                            {w.word}
                          </span>
                        ))}
                        {wordsInLvl.length > 3 && (
                          <span className="text-[11px] text-slate-400">+{wordsInLvl.length - 3} từ</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => startStandardStudy(lvl)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Tự học ngay
                      </button>

                      <button
                        onClick={() => onStart1v1Match(wordsInLvl, lvl)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                        title="Đưa bộ này vào đấu 1v1"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        Đấu 1v1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Decks Section */}
          {activeTab === 'custom' && (
            <div>
              {customDecks.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                  <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">Chưa có bộ từ vựng tự tạo nào</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy tạo một bộ đề 5-10 từ vựng mục tiêu của riêng bạn để tự rèn luyện trước khi thi đấu!
                  </p>
                  <button
                    onClick={() => setIsCreatingDeck(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Tạo bộ đề đầu tiên
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customDecks.map((deck) => {
                    const deckWords = vocabularies.filter((w) => deck.wordIds.includes(w.id));

                    return (
                      <div
                        key={deck.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                              Custom ({deck.wordIds.length} từ)
                            </span>
                            <button
                              onClick={() => onDeleteCustomDeck(deck.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Xóa bộ đề này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h3 className="font-extrabold text-base text-slate-800">{deck.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deck.description}</p>

                          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                            {deckWords.slice(0, 4).map((w) => (
                              <span
                                key={w.id}
                                className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[11px] font-mono"
                              >
                                {w.word}
                              </span>
                            ))}
                            {deckWords.length > 4 && (
                              <span className="text-[11px] text-slate-400">+{deckWords.length - 4}</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => startCustomStudy(deck)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Ôn tập
                          </button>

                          <button
                            onClick={() => onStart1v1Match(deckWords, deck.name)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                            title="Đưa bộ này vào đấu 1v1"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            Đấu 1v1
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Custom Deck (5 - 10 words) */}
      {isCreatingDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Tạo Bộ Từ Vựng Tùy Chọn</h3>
                  <p className="text-xs text-slate-500">Chọn từ 5 đến 10 từ vựng mục tiêu cho bộ đề của bạn</p>
                </div>
              </div>

              <button
                onClick={() => setIsCreatingDeck(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bộ từ vựng *</label>
                <input
                  type="text"
                  required
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Ví dụ: 5 từ học thuật trọng tâm B2..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="Ví dụ: Ôn luyện phản xạ trước trận đấu 1v1..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    Chọn từ vựng ({selectedWordIds.length}/10 từ đã chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">Tối thiểu 3 từ, tối đa 10 từ</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={deckSearchQuery}
                      onChange={(e) => setDeckSearchQuery(e.target.value)}
                      placeholder="Tìm từ tiếng Anh hoặc nghĩa..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as (CEFRLevel | 'ALL')[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDeckLevelFilter(lvl)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                          deckLevelFilter === lvl
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {vocabularies
                    .filter((w) => {
                      if (deckLevelFilter !== 'ALL' && w.cefr_level !== deckLevelFilter) return false;
                      if (deckSearchQuery.trim()) {
                        const q = deckSearchQuery.toLowerCase().trim();
                        return w.word.toLowerCase().includes(q) || w.meaning_vi.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .slice(0, 120)
                    .map((w) => {
                    const isSelected = selectedWordIds.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWordSelection(w.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="font-mono">{w.word}</span>
                          <span className="ml-1 text-[9px] text-slate-400 font-semibold">{w.cefr_level}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{w.meaning_vi}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingDeck(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newDeckName.trim() || selectedWordIds.length < 3}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Lưu bộ đề ({selectedWordIds.length} từ)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
