import React, { useState } from 'react';
import { Swords, Bot, Sparkles, ShieldAlert, ArrowRight, Zap, Layers, Play } from 'lucide-react';
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
    wordCount: WordLengthMode
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

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleLaunchMatch = () => {
    let matchWords: VocabWord[] = [];
    let title: CEFRLevel | 'Custom' = selectedLevel;

    if (preselectedWords && preselectedWords.length > 0) {
      matchWords = [...preselectedWords];
      title = (preselectedDeckTitle as CEFRLevel) || 'Custom';
    } else if (deckSource === 'standard') {
      const pool = vocabularies.filter((w) => w.cefr_level === selectedLevel);
      // Randomly pick wordCount words from pool
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      matchWords = shuffled.slice(0, Math.min(wordCount, shuffled.length));
      title = selectedLevel;
    } else {
      const customDeck = customDecks.find((d) => d.id === selectedCustomDeckId);
      if (customDeck) {
        const pool = vocabularies.filter((w) => customDeck.wordIds.includes(w.id));
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        matchWords = shuffled.slice(0, Math.min(wordCount, shuffled.length));
        title = 'Custom';
      }
    }

    if (matchWords.length === 0) return;

    onStartMatch(
      matchWords,
      difficulty,
      deckSource === 'custom' ? 'custom_deck' : 'pvp_bot',
      title,
      wordCount
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Fair-Play Community Reminder Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-300 italic leading-relaxed">
          <span className="font-semibold text-emerald-400 not-italic mr-1">Thông điệp tinh thần học tập:</span>
          "Nếu bạn thực sự muốn học, hãy tự lực thi đấu để cùng giữ một cộng đồng lành mạnh."
        </p>
      </div>

      {/* Main Lobby Setup Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
            <Swords className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Phòng Đấu 1v1 Tính Điểm Tốc Độ (Pure Score)
            </h2>
            <p className="text-xs text-slate-500">
              Hệ thống 4 giai đoạn chuẩn Esports học thuật: Ghi nhớ ➔ Nối từ ➔ Viết từ ➔ Ngữ cảnh
            </p>
          </div>
        </div>

        {/* 1. Chọn Nguồn Bộ Từ */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            1. Chọn Nguồn Bộ Từ Vựng
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeckSource('standard')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                deckSource === 'standard'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                CEFR
              </div>
              <div>
                <div className="text-xs font-bold">Cấp độ chuẩn (A1 - C2)</div>
                <div className="text-[11px] text-slate-500 font-normal">Từ vựng phân tầng chính thức</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeckSource('custom')}
              disabled={customDecks.length === 0}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                deckSource === 'custom'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                  : customDecks.length === 0
                  ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Bộ từ tự tạo (Custom Deck)</div>
                <div className="text-[11px] text-slate-500 font-normal">
                  {customDecks.length > 0 ? `${customDecks.length} bộ có sẵn` : 'Chưa tạo bộ nào'}
                </div>
              </div>
            </button>
          </div>

          {/* Sub-selector: CEFR level or Custom Deck picker */}
          {deckSource === 'standard' ? (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
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
            <div className="pt-1">
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
            </div>
          )}
        </div>

        {/* 2. Chọn Độ Dài Trận Đấu */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            2. Quy Mô Trận Đấu (Số Lượng Từ)
          </label>

          <div className="grid grid-cols-3 gap-3">
            {[
              { count: 3 as WordLengthMode, label: '3 Từ', sub: 'Chớp nhoáng (~2 phút)' },
              { count: 5 as WordLengthMode, label: '5 Từ', sub: 'Tiêu chuẩn (~4 phút)' },
              { count: 10 as WordLengthMode, label: '10 Từ', sub: 'Thử thách (~8 phút)' }
            ].map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setWordCount(opt.count)}
                className={`p-3 rounded-xl border text-center transition ${
                  wordCount === opt.count
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-extrabold">{opt.label}</div>
                <div className="text-[10px] text-slate-500">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Đối Thủ Bot AI */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            3. Độ Khó Bot AI Đối Thủ (Mô Phỏng Phản Xạ & Gõ Phím)
          </label>

          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((diff) => {
              const cfg = BOT_PROFILES[diff];
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`p-3 rounded-xl border text-left transition ${
                    difficulty === diff
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{cfg.avatar}</span>
                    <span className="text-xs font-bold">{cfg.name.split(' ')[1]}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Chính xác: {Math.round(cfg.accuracyRate * 100)}% • {cfg.typingWpm} WPM
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLaunchMatch}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            Bắt Đầu Trận Đấu 1v1 Ngay
          </button>
        </div>
      </div>
    </div>
  );
};
