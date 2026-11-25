import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Bot, 
  Sparkles, 
  Layers, 
  Play, 
  Zap, 
  Clock, 
  Gift, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { CEFRLevel, CustomDeck, VocabWord, WordLengthMode } from '../../types/vocab';
import { BotDifficulty } from '../../services/botAi';

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
  // Mode: standard CEFR or Custom Deck
  const [deckSource, setDeckSource] = useState<'standard' | 'custom'>(
    preselectedDeckTitle ? 'custom' : 'standard'
  );
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(userCurrentLevel);
  const [selectedCustomDeckId, setSelectedCustomDeckId] = useState<string>(
    customDecks[0]?.id || ''
  );
  const [wordCount, setWordCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');

  // Advanced settings (collapsed by default to prevent cognitive overload)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [perRoundCount, setPerRoundCount] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(10);
  const [enableRandomBonus, setEnableRandomBonus] = useState<boolean>(false);

  const activeDeck = customDecks.find((d) => d.id === selectedCustomDeckId);

  // Sync custom deck defaults if deck selected
  useEffect(() => {
    if (deckSource === 'custom' && activeDeck) {
      if (activeDeck.perRoundCount) setPerRoundCount(activeDeck.perRoundCount);
      if (activeDeck.timePerQuestion) setTimePerQuestion(activeDeck.timePerQuestion);
      setWordCount(activeDeck.wordIds.length >= 5 ? 5 : activeDeck.wordIds.length);
    }
  }, [selectedCustomDeckId, deckSource, activeDeck]);

  const levelConfigs: { level: CEFRLevel; label: string; desc: string; color: string }[] = [
    { level: 'A1', label: 'Cơ bản', desc: 'Từ vựng nền tảng', color: 'from-blue-500 to-cyan-500' },
    { level: 'A2', label: 'Sơ cấp', desc: 'Đời sống hàng ngày', color: 'from-teal-500 to-emerald-500' },
    { level: 'B1', label: 'Trung cấp', desc: 'Giao tiếp tự tin', color: 'from-emerald-500 to-green-600' },
    { level: 'B2', label: 'Nâng cao', desc: 'Học thuật & Đi làm', color: 'from-amber-500 to-orange-500' },
    { level: 'C1', label: 'Thành thạo', desc: 'Từ vựng chuyên sâu', color: 'from-purple-500 to-indigo-600' },
    { level: 'C2', label: 'Chuyên gia', desc: 'Đỉnh cao ngôn ngữ', color: 'from-rose-500 to-pink-600' },
  ];

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

  const getDifficultyTitle = () => {
    if (difficulty === 'easy') return 'Dễ';
    if (difficulty === 'medium') return 'Vừa';
    return 'Khó';
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 animate-fadeIn px-2 sm:px-0">
      {/* Lobby Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
        
        {/* Header thân thiện, dễ hiểu */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Swords className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Đấu 1v1 Luyện Phản Xạ Từ Vựng
              </h1>
              <p className="text-xs text-slate-500">
                4 chặng đấu tốc độ: Ghi nhớ ➔ Nối từ ➔ Viết từ ➔ Điền ngữ cảnh
              </p>
            </div>
          </div>

          {/* Quick source switch */}
          {customDecks.length > 0 && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeckSource('standard')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  deckSource === 'standard' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Cấp chuẩn
              </button>
              <button
                type="button"
                onClick={() => setDeckSource('custom')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  deckSource === 'custom' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Bộ tự tạo ({customDecks.length})
              </button>
            </div>
          )}
        </div>

        {/* 1. CHỌN CẤP ĐỘ / BỘ TỪ */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              {deckSource === 'standard' ? '1. Chọn Cấp Độ Của Bạn' : '1. Chọn Bộ Từ Tự Tạo'}
            </span>
            {deckSource === 'standard' && (
              <span className="text-[11px] font-semibold text-emerald-600">
                Đang chọn: Cấp {selectedLevel}
              </span>
            )}
          </label>

          {deckSource === 'standard' ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {levelConfigs.map((cfg) => {
                const isSelected = selectedLevel === cfg.level;
                return (
                  <button
                    key={cfg.level}
                    type="button"
                    onClick={() => setSelectedLevel(cfg.level)}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-500/20 scale-102'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm sm:text-base font-black">{cfg.level}</div>
                    <div className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {cfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <select
                value={selectedCustomDeckId}
                onChange={(e) => setSelectedCustomDeckId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {customDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.wordIds.length} từ)
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 italic">
                {activeDeck?.description || 'Bộ từ do bạn tự tạo để ôn luyện.'}
              </div>
            </div>
          )}
        </div>

        {/* 2. CHỌN SỐ LƯỢNG TỪ (ĐƠN GIẢN, TRỰC QUAN) */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              2. Số Lượng Từ Trong Trận
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { count: 3, label: '3 Từ', time: '~1 phút', tag: 'Chớp nhoáng' },
              { count: 5, label: '5 Từ', time: '~3 phút', tag: 'Khuyên dùng ⭐' },
              { count: 10, label: '10 Từ', time: '~6 phút', tag: 'Thử thách' },
            ].map((item) => {
              const isSelected = wordCount === item.count;
              return (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setWordCount(item.count)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-500/20 scale-102'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-black">{item.label}</div>
                  <div className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {item.tag}
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">{item.time}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ĐỘ KHÓ ĐỐI THỦ BOT AI (THÂN THIỆN, DỄ HIỂU) */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            3. Mức Độ Bot Đối Thủ
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'easy' as BotDifficulty, icon: '🐣', label: 'Tập sự', desc: 'Dễ (Bot gõ chậm)' },
              { id: 'medium' as BotDifficulty, icon: '⚡', label: 'Cân sức', desc: 'Vừa (Mặc định)' },
              { id: 'hard' as BotDifficulty, icon: '🔥', label: 'Cao thủ', desc: 'Khó (Tốc độ cao)' },
            ].map((diff) => {
              const isSelected = difficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-2 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{diff.icon}</span>
                  <div>
                    <span className="text-xs font-black block">{diff.label}</span>
                    <span className={`text-[10px] block ${isSelected ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {diff.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. CÀI ĐẶT NÂNG CAO (GẬP/MỞ GỌN GÀNG - KHÔNG RỐI MẮT NGƯỜI MỚI) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 py-1.5 px-3 rounded-xl hover:bg-slate-50 transition border border-dashed border-slate-200"
          >
            <span className="flex items-center gap-1.5">
              <span>⚙️ Tùy chọn nâng cao (Bonus từ ngẫu nhiên, thời gian...)</span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-2 p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn text-xs">
              {/* Bonus Random Words Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                    Bonus ngẫu nhiên (+1-2 từ mới chen giữa trận)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Cho 20s ghi nhớ nhanh từ mới bất ngờ rút từ kho từ vựng
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableRandomBonus(!enableRandomBonus)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    enableRandomBonus ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {enableRandomBonus ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              {/* Time per question */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Thời gian mỗi câu:
                </span>
                <div className="flex items-center gap-1">
                  {[8, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimePerQuestion(sec)}
                      className={`px-2.5 py-0.5 rounded-lg font-bold text-xs transition ${
                        timePerQuestion === sec ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NÚT BẮT ĐẦU TRẬN ĐẤU - TO, NỔI BẬT, RÕ RÀNG */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLaunchMatch}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-98 flex flex-col items-center justify-center gap-0.5"
          >
            <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU TRẬN ĐẤU 1V1 NGAY</span>
            </div>
            <div className="text-[11px] text-emerald-100 font-medium">
              {deckSource === 'standard' ? `Cấp ${selectedLevel}` : activeDeck?.name || 'Tự tạo'} • {wordCount} từ • Đối thủ: {getDifficultyTitle()}
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
