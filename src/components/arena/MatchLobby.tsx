import React, { useState, useEffect } from 'react';
import { Swords, Bot, Sparkles, Info, X, Layers, Play, Zap, Clock } from 'lucide-react';
import { CEFRLevel, CustomDeck, VocabWord, WordLengthMode } from '../../types/vocab';
import { BotDifficulty, BOT_PROFILES } from '../../services/botAi';

interface MatchLobbyProps {
  vocabularies: VocabWord[];
  customDecks: CustomDeck[];
  userCurrentLevel: CEFRLevel;
  onStartMatch: (
    words: VocabWord[],
    difficulty: BotDifficulty,
    mode: 'pvp_bot' | 'custom_deck',
    levelTitle: CEFRLevel | 'Custom',
    wordCount: WordLengthMode,
    customSettings?: { perRoundCount?: number; timePerQuestion?: number }
  ) => void;
  preselectedWords?: VocabWord[];
  preselectedDeckTitle?: string;
}

export const MatchLobby: React.FC<MatchLobbyProps> = ({
  vocabularies,
  customDecks,
  userCurrentLevel,
  onStartMatch,
  preselectedWords,
  preselectedDeckTitle
}) => {
  const [deckSource, setDeckSource] = useState<'standard' | 'custom'>(
    preselectedDeckTitle ? 'custom' : 'standard'
  );
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(userCurrentLevel);
  const [selectedCustomDeckId, setSelectedCustomDeckId] = useState<string>(
    customDecks[0]?.id || ''
  );
  const [wordCount, setWordCount] = useState<WordLengthMode>(5);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');

  // Custom Deck parameters: perRoundCount and timePerQuestion
  const [perRoundCount, setPerRoundCount] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(10);

  // Fair-play spirit banner state
  const [isSpiritHidden, setIsSpiritHidden] = useState<boolean>(() => {
    return localStorage.getItem('hide_study_spirit_msg') === 'true';
  });
  const [showSpiritTooltip, setShowSpiritTooltip] = useState<boolean>(false);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // Sync custom deck defaults if deck selected
  useEffect(() => {
    if (deckSource === 'custom') {
      const deck = customDecks.find((d) => d.id === selectedCustomDeckId);
      if (deck) {
        if (deck.perRoundCount) setPerRoundCount(deck.perRoundCount);
        if (deck.timePerQuestion) setTimePerQuestion(deck.timePerQuestion);
        if (deck.wordIds.length >= 20) setWordCount(20);
        else if (deck.wordIds.length >= 10) setWordCount(10);
        else if (deck.wordIds.length >= 5) setWordCount(5);
        else setWordCount(3);
      }
    }
  }, [selectedCustomDeckId, deckSource, customDecks]);

  const handleDismissSpirit = () => {
    localStorage.setItem('hide_study_spirit_msg', 'true');
    setIsSpiritHidden(true);
    setShowSpiritTooltip(false);
  };

  const handleRestoreSpirit = () => {
    localStorage.removeItem('hide_study_spirit_msg');
    setIsSpiritHidden(false);
  };

  const handleLaunchMatch = () => {
    let candidatePool: VocabWord[] = [];
    let title: CEFRLevel | 'Custom' = selectedLevel;

    if (preselectedWords && preselectedWords.length > 0) {
      candidatePool = [...preselectedWords];
      title = (preselectedDeckTitle as CEFRLevel) || 'Custom';
    } else if (deckSource === 'standard') {
      candidatePool = vocabularies.filter((w) => w.cefr_level === selectedLevel);
      title = selectedLevel;
    } else {
      const customDeck = customDecks.find((d) => d.id === selectedCustomDeckId);
      if (customDeck) {
        candidatePool = vocabularies.filter((w) => customDeck.wordIds.includes(w.id));
        title = 'Custom';
      }
    }

    if (candidatePool.length === 0) return;

    onStartMatch(
      candidatePool,
      difficulty,
      deckSource === 'custom' ? 'custom_deck' : 'pvp_bot',
      title,
      wordCount,
      {
        perRoundCount,
        timePerQuestion
      }
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3.5 animate-fadeIn px-2 sm:px-4">
      {/* Fair-Play Community Reminder Banner / Tooltip Card */}
      {!isSpiritHidden ? (
        <div className="bg-slate-900 text-white p-3 sm:p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-300 italic leading-snug">
              <span className="font-semibold text-emerald-400 not-italic mr-1">Thông điệp tinh thần học:</span>
              "Nếu bạn thực sự muốn học, hãy tự lực thi đấu để cùng giữ một cộng đồng lành mạnh."
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismissSpirit}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg shrink-0 transition"
            title="Xóa/Tắt thông điệp này"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa thông điệp</span>
          </button>
        </div>
      ) : (
        /* Khi đã ẩn, giữ icon (i) có hover tooltip để người dùng xem lại khi cần */
        <div className="relative flex justify-end">
          <div
            className="relative inline-block"
            onMouseEnter={() => setShowSpiritTooltip(true)}
            onMouseLeave={() => setShowSpiritTooltip(false)}
          >
            <button
              type="button"
              onClick={() => setShowSpiritTooltip(!showSpiritTooltip)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition"
              title="Xem thông điệp tinh thần học"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tinh thần học</span>
            </button>

            {showSpiritTooltip && (
              <div className="absolute right-0 top-7 z-30 w-72 sm:w-80 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-2 border border-slate-700 animate-fadeIn">
                <p className="italic leading-relaxed text-slate-300">
                  <span className="font-bold text-emerald-400 not-italic">Thông điệp: </span>
                  "Nếu bạn thực sự muốn học, hãy tự lực thi đấu để cùng giữ một cộng đồng lành mạnh."
                </p>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleRestoreSpirit}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold"
                  >
                    Hiện lại biểu ngữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSpiritTooltip(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Lobby Setup Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <Swords className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Phòng Đấu 1v1 Tính Điểm Tốc Độ (Pure Score)
              </h2>
              <p className="text-[11px] text-slate-500">
                Chu trình 4 chặng: Ghi nhớ ➔ Nối từ (5 từ) ➔ Viết từ ➔ Ngữ cảnh
              </p>
            </div>
          </div>
        </div>

        {/* 1. Chọn Nguồn Bộ Từ */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            1. Chọn Nguồn Bộ Từ Vựng
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDeckSource('standard')}
              className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                deckSource === 'standard'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                CEFR
              </div>
              <div>
                <div className="text-xs font-bold">Cấp độ chuẩn (A1 - C2)</div>
                <div className="text-[10px] text-slate-500 font-normal">Từ vựng phân tầng chính thức</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeckSource('custom')}
              disabled={customDecks.length === 0}
              className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                deckSource === 'custom'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                  : customDecks.length === 0
                  ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold">Bộ từ tự tạo (Custom Deck)</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  {customDecks.length > 0 ? `${customDecks.length} bộ có sẵn` : 'Chưa tạo bộ nào'}
                </div>
              </div>
            </button>
          </div>

          {/* Sub-selector: CEFR level or Custom Deck picker */}
          {deckSource === 'standard' ? (
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedLevel === lvl
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cấp {lvl}
                </button>
              ))}
            </div>
          ) : (
            <div className="pt-0.5 space-y-2">
              <select
                value={selectedCustomDeckId}
                onChange={(e) => setSelectedCustomDeckId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {customDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.wordIds.length} từ)
                  </option>
                ))}
              </select>

              {/* Tuỳ chỉnh thông số bộ từ tự tạo: số từ mỗi lượt & thời gian */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-amber-950 flex items-center gap-1 mb-1">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    Chia nhỏ mỗi đợt học (Sub-round)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPerRoundCount(num)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                          perRoundCount === num
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        {num} từ / đợt
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-800/80 block mt-0.5">
                    Ví dụ: 20 từ chia thành các đợt 5 từ đảo pha
                  </span>
                </div>

                <div>
                  <span className="font-bold text-amber-950 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Thời gian mỗi câu
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[8, 10, 15].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTimePerQuestion(sec)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                          timePerQuestion === sec
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        {sec} giây
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-800/80 block mt-0.5">
                    1.5s đầu giữ 1000 điểm trọn vẹn
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Chọn Quy Mô Trận Đấu */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            2. Quy Mô Trận Đấu (Tổng Số Lượng Từ)
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { count: 3 as WordLengthMode, label: '3 Từ', sub: 'Nhanh' },
              { count: 5 as WordLengthMode, label: '5 Từ', sub: 'Tiêu chuẩn' },
              { count: 10 as WordLengthMode, label: '10 Từ', sub: 'Thử thách' },
              { count: 15 as WordLengthMode, label: '15 Từ', sub: 'Chuyên sâu' },
              { count: 20 as WordLengthMode, label: '20 Từ', sub: 'Esports' }
            ].map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setWordCount(opt.count)}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition ${
                  wordCount === opt.count
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs sm:text-sm font-extrabold">{opt.label}</div>
                <div className="text-[10px] text-slate-500">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Đối Thủ Bot AI */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            3. Độ Khó Bot AI Đối Thủ
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((diff) => {
              const cfg = BOT_PROFILES[diff];
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    difficulty === diff
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base">{cfg.avatar}</span>
                    <span className="text-xs font-bold">{cfg.name.split(' ')[1]}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {Math.round(cfg.accuracyRate * 100)}% • {cfg.typingWpm} WPM
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleLaunchMatch}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-emerald-200 hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            Bắt Đầu Trận Đấu 1v1 Ngay
          </button>
        </div>
      </div>
    </div>
  );
};
