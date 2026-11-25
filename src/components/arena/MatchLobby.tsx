import React, { useState, useEffect } from 'react';
import { Swords, Bot, Sparkles, Layers, Play, Zap, Clock, Gift } from 'lucide-react';
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
    customSettings?: { perRoundCount?: number; timePerQuestion?: number; enableRandomBonus?: boolean }
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
  const [wordCount, setWordCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');

  // Custom Deck parameters: perRoundCount and timePerQuestion
  const [perRoundCount, setPerRoundCount] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(10);

  // Bonus surprise word toggle (1-2 new words with 20s study)
  const [enableRandomBonus, setEnableRandomBonus] = useState<boolean>(true);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const activeDeck = customDecks.find((d) => d.id === selectedCustomDeckId);

  // Sync custom deck defaults if deck selected
  useEffect(() => {
    if (deckSource === 'custom' && activeDeck) {
      if (activeDeck.perRoundCount) setPerRoundCount(activeDeck.perRoundCount);
      if (activeDeck.timePerQuestion) setTimePerQuestion(activeDeck.timePerQuestion);
      setWordCount(activeDeck.wordIds.length);
    }
  }, [selectedCustomDeckId, deckSource, activeDeck]);

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
      if (activeDeck) {
        candidatePool = vocabularies.filter((w) => activeDeck.wordIds.includes(w.id));
        title = 'Custom';
      }
    }

    if (candidatePool.length === 0) return;

    const effectiveCount = Math.min(wordCount, candidatePool.length) as WordLengthMode;

    onStartMatch(
      candidatePool,
      difficulty,
      deckSource === 'custom' ? 'custom_deck' : 'pvp_bot',
      title,
      effectiveCount,
      {
        perRoundCount,
        timePerQuestion,
        enableRandomBonus
      }
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2.5 animate-fadeIn px-2 sm:px-4">
      {/* Main Lobby Setup Card */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <Swords className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Phòng Đấu 1v1 Tính Điểm Tốc Độ (Pure Score)
              </h2>
              <p className="text-[11px] text-slate-500">
                4 chặng chuẩn: Ghi nhớ ➔ Nối từ ➔ Viết từ ➔ Điền câu ngữ cảnh
              </p>
            </div>
          </div>
        </div>

        {/* 1. Chọn Nguồn Bộ Từ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            1. Nguồn Bộ Từ Vựng
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDeckSource('standard');
                setWordCount(5);
              }}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                deckSource === 'standard'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                CEFR
              </div>
              <div>
                <div className="text-xs font-bold">Cấp độ chuẩn (A1 - C2)</div>
                <div className="text-[10px] text-slate-500 font-normal">Từ vựng phân tầng chính thức</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeckSource('custom');
                if (activeDeck) setWordCount(activeDeck.wordIds.length);
              }}
              disabled={customDecks.length === 0}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                deckSource === 'custom'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                  : customDecks.length === 0
                  ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
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
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {customDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.wordIds.length} từ)
                  </option>
                ))}
              </select>

              {/* Tuỳ chỉnh thông số bộ từ tự tạo: số từ mỗi đợt & thời gian */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-amber-950 flex items-center gap-1 mb-1 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    Chia nhỏ mỗi đợt học (Sub-round)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPerRoundCount(num)}
                        className={`px-2 py-0.5 rounded-lg font-bold text-xs transition ${
                          perRoundCount === num
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        {num} từ/đợt
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-amber-950 flex items-center gap-1 mb-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Thời gian mỗi câu
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[8, 10, 15].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTimePerQuestion(sec)}
                        className={`px-2.5 py-0.5 rounded-lg font-bold text-xs transition ${
                          timePerQuestion === sec
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Chọn Quy Mô Trận Đấu */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            2. Quy Mô Trận Đấu (Số Lượng Từ)
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {deckSource === 'custom' && activeDeck && (
              <button
                type="button"
                onClick={() => setWordCount(activeDeck.wordIds.length)}
                className={`p-2 rounded-xl border text-center transition ${
                  wordCount === activeDeck.wordIds.length
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-extrabold">Tất cả</div>
                <div className="text-[9px] text-slate-500">{activeDeck.wordIds.length} từ</div>
              </button>
            )}

            {[
              { count: 3, label: '3 Từ', sub: 'Nhanh' },
              { count: 5, label: '5 Từ', sub: 'Tiêu chuẩn' },
              { count: 10, label: '10 Từ', sub: 'Thử thách' },
              { count: 15, label: '15 Từ', sub: 'Chuyên sâu' },
              { count: 20, label: '20 Từ', sub: 'Esports' }
            ]
              .filter((opt) => deckSource !== 'custom' || !activeDeck || opt.count <= activeDeck.wordIds.length)
              .map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setWordCount(opt.count)}
                  className={`p-2 rounded-xl border text-center transition ${
                    wordCount === opt.count
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-extrabold">{opt.label}</div>
                  <div className="text-[9px] text-slate-500">{opt.sub}</div>
                </button>
              ))}
          </div>
        </div>

        {/* 3. Đối Thủ Bot AI & Thử thách Bonus ngẫu nhiên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Bot Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-600" />
              3. Độ Khó Bot AI
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((diff) => {
                const cfg = BOT_PROFILES[diff];
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`p-2 rounded-xl border text-left transition ${
                      difficulty === diff
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-sm">{cfg.avatar}</span>
                      <span className="text-[11px] font-bold">{cfg.name.split(' ')[1]}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      {Math.round(cfg.accuracyRate * 100)}% • {cfg.typingWpm}W
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bonus Surprise Word Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-500" />
              Bonus Từ Ngẫu Nhiên (20s Học)
            </label>

            <button
              type="button"
              onClick={() => setEnableRandomBonus(!enableRandomBonus)}
              className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                enableRandomBonus
                  ? 'border-amber-400 bg-amber-50/80 text-amber-950 ring-1 ring-amber-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="pr-1">
                <div className="text-xs font-bold flex items-center gap-1 text-amber-900">
                  <span>🎁 Chen 1-2 từ bonus bất ngờ</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {enableRandomBonus ? 'Cho 20s ghi nhớ nhanh giữa trận' : 'Đang tắt (chỉ đấu từ trong bộ)'}
                </div>
              </div>
              <div
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                  enableRandomBonus ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {enableRandomBonus ? 'BẬT' : 'TẮT'}
              </div>
            </button>
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleLaunchMatch}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            Bắt Đầu Trận Đấu 1v1 Ngay
          </button>
        </div>
      </div>
    </div>
  );
};
