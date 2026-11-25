import React, { useState } from 'react';
import { 
  Zap, 
  Swords, 
  BookOpen, 
  Layers, 
  History, 
  Flame, 
  Volume2, 
  VolumeX, 
  Info, 
  Sparkles,
  Compass,
  X
} from 'lucide-react';
import { CEFRLevel, UserProfile } from '../../types/vocab';
import { audioService } from '../../services/audio';

interface HeaderProps {
  currentTab: 'arena' | 'selfStudy' | 'vocabDex' | 'history';
  onSelectTab: (tab: 'arena' | 'selfStudy' | 'vocabDex' | 'history') => void;
  userProfile: UserProfile;
  collectedCount: number;
  totalVocabCount: number;
  onOpenPlacementTest: () => void;
  onOpenPhoneticsGuide: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  collectedCount,
  totalVocabCount,
  onOpenPlacementTest,
  onOpenPhoneticsGuide,
  onUpdateProfile
}) => {
  // Running ticker state (default shown, persisted in localStorage)
  const [isTickerVisible, setIsTickerVisible] = useState<boolean>(() => {
    return localStorage.getItem('vocabclash_ticker_enabled') !== 'false';
  });

  // Top-right info (i) tooltip popover state
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  const toggleTicker = () => {
    const nextVal = !isTickerVisible;
    setIsTickerVisible(nextVal);
    localStorage.setItem('vocabclash_ticker_enabled', nextVal ? 'true' : 'false');
  };

  const toggleSound = () => {
    const nextMuted = !userProfile.soundEnabled;
    audioService.setMuted(!nextMuted);
    onUpdateProfile({ soundEnabled: nextMuted });
  };

  const toggleAccent = () => {
    const nextAccent = userProfile.accentPreference === 'en-US' ? 'en-GB' : 'en-US';
    onUpdateProfile({ accentPreference: nextAccent });
  };

  const getLevelBadgeColor = (lvl: CEFRLevel) => {
    switch (lvl) {
      case 'A1':
      case 'A2':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'B1':
      case 'B2':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'C1':
      case 'C2':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* 1. Dòng chữ chạy trên đầu web rõ nét, sáng, có nút X trực tiếp để đóng nhanh */}
      {isTickerVisible && (
        <div className="w-full bg-slate-900 text-amber-200 py-1.5 px-3 border-b border-amber-500/40 relative flex items-center select-none shadow-xs">
          <div className="overflow-hidden flex-1 mr-2">
            <div className="animate-marquee flex items-center gap-14 font-semibold text-xs sm:text-sm">
              {/* Instance 1 */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                </span>
                <span className="font-extrabold uppercase text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 tracking-wider">
                  Tinh thần học tập:
                </span>
                <span className="text-white font-medium text-xs sm:text-sm tracking-wide">
                  "Nếu bạn thực sự muốn học, hãy tự lực thi đấu để cùng giữ một cộng đồng lành mạnh."
                </span>
                <span className="flex items-center gap-1 text-orange-400 ml-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                </span>
              </div>

              {/* Instance 2 (vòng lặp liên tục) */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                </span>
                <span className="font-extrabold uppercase text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 tracking-wider">
                  Tinh thần học tập:
                </span>
                <span className="text-white font-medium text-xs sm:text-sm tracking-wide">
                  "Nếu bạn thực sự muốn học, hãy tự lực thi đấu để cùng giữ một cộng đồng lành mạnh."
                </span>
                <span className="flex items-center gap-1 text-orange-400 ml-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                </span>
              </div>
            </div>
          </div>

          {/* Dấu X nổi bật, dễ nhìn để tắt trực tiếp dòng chữ chạy */}
          <button
            type="button"
            onClick={toggleTicker}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0 border border-slate-700 hover:border-rose-500 shadow-xs"
            title="Tắt dòng chữ chạy (X)"
            aria-label="Tắt dòng chữ chạy"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-13 sm:h-14">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Vocab<span className="text-emerald-600">Clash</span>
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                  PWA OFFLINE
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => onSelectTab('arena')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'arena'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              Thi Đấu 1v1
            </button>

            <button
              onClick={() => onSelectTab('selfStudy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'selfStudy'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Tự Học Offline
            </button>

            <button
              onClick={() => onSelectTab('vocabDex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'vocabDex'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Vocab-Dex
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                {collectedCount}/{totalVocabCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Lịch Sử Đấu
            </button>
          </nav>

          {/* Quick Actions & Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* IPA & Stress Guide Button */}
            <button
              onClick={onOpenPhoneticsGuide}
              title="Mở Bảng quy tắc trọng âm & Phiên âm IPA"
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">Tra cứu</span> IPA
            </button>

            {/* Level Badge / Placement Trigger */}
            <button
              onClick={onOpenPlacementTest}
              title="Bấm để kiểm tra lại trình độ đầu vào CEFR"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition hover:scale-102 ${getLevelBadgeColor(
                userProfile.currentLevel
              )}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Cấp {userProfile.currentLevel}</span>
            </button>

            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{userProfile.streakDays} ngày</span>
            </div>

            {/* Accent US/UK Switch */}
            <button
              onClick={toggleAccent}
              title={`Chuyển giọng đọc: Hiện tại ${userProfile.accentPreference}`}
              className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            >
              {userProfile.accentPreference === 'en-US' ? '🇺🇸 US' : '🇬🇧 UK'}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={userProfile.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              {userProfile.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* 2. Cái (i) ở góc trên bên phải: di chuột / click hiện thông điệp & thẻ xoá dòng chữ chạy */}
            <div 
              className="relative"
              onMouseEnter={() => setIsInfoOpen(true)}
              onMouseLeave={() => setIsInfoOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsInfoOpen(!isInfoOpen)}
                className={`p-1.5 rounded-full transition flex items-center justify-center ${
                  isInfoOpen 
                    ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Thông điệp tinh thần học tập & cài đặt chữ chạy"
                aria-label="Thông tin tinh thần học tập"
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Popover Card */}
              {isInfoOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 p-3.5 bg-slate-900 text-white text-xs rounded-2xl shadow-2xl border border-slate-700 z-50 animate-fadeIn space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1.5 text-xs">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                      Tinh Thần Học Tập Fair-Play
                    </span>
                    {/* Dấu X to, nổi bật, dễ nhìn */}
                    <button
                      type="button"
                      onClick={() => setIsInfoOpen(false)}
                      className="w-6 h-6 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 hover:border-rose-500"
                      title="Đóng (X)"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-400">
                      <Flame className="w-3 h-3 fill-orange-400" />
                      <span>Thông điệp gửi người học:</span>
                    </div>
                    <p className="text-slate-200 italic text-xs leading-relaxed">
                      "Nếu bạn thực sự muốn học, hãy tự lực thi đấu để cùng giữ một cộng đồng lành mạnh."
                    </p>
                  </div>

                  {/* Thẻ xoá / bật tắt dòng chữ chạy trên đầu web */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={toggleTicker}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border shadow-sm ${
                        isTickerVisible
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isTickerVisible ? (
                        <>
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Xoá / Tắt dòng chữ chạy trên đầu web</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                          <span>Bật lại dòng chữ chạy tinh thần học</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-1.5 border-t border-slate-100">
          <button
            onClick={() => onSelectTab('arena')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              currentTab === 'arena' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Đấu 1v1
          </button>
          <button
            onClick={() => onSelectTab('selfStudy')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              currentTab === 'selfStudy' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Tự Học
          </button>
          <button
            onClick={() => onSelectTab('vocabDex')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              currentTab === 'vocabDex' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Từ Điển
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              currentTab === 'history' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch Sử
          </button>
        </div>
      </div>
    </header>
  );
};
