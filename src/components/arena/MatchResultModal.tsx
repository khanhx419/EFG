import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Frown, RotateCcw, Swords, History, Layers, X } from 'lucide-react';
import { VocabWord, MatchHistoryItem } from '../../types/vocab';
import { audioService } from '../../services/audio';

interface MatchResultModalProps {
  result: MatchHistoryItem;
  words: VocabWord[];
  onPlayAgain: () => void;
  onSoloReplay: (words: VocabWord[]) => void;
  onViewHistory: () => void;
  onClose?: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  result,
  words,
  onPlayAgain,
  onSoloReplay,
  onViewHistory,
  onClose
}) => {
  useEffect(() => {
    if (result.isVictory) {
      audioService.playSound('victory');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
  }, [result.isVictory]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onPlayAgain();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Nút X đóng popup ở góc trên bên phải */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition"
          aria-label="Đóng popup"
          title="Đóng (X)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner */}
        <div
          className={`p-6 sm:p-8 text-center text-white ${
            result.isVictory
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700'
              : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            {result.isVictory ? (
              <Trophy className="w-9 h-9 text-amber-300" />
            ) : (
              <Frown className="w-9 h-9 text-slate-300" />
            )}
          </div>

          <h2 className="text-3xl font-black tracking-tight">
            {result.isVictory ? 'CHIẾN THẮNG ÁP ĐẢO!' : 'CỐ GẮNG Ở TRẬN TỚI!'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {result.isVictory
              ? 'Tốc độ phản xạ và độ chính xác của bạn vượt trội đối thủ!'
              : 'Đối thủ có tốc độ gõ nhỉnh hơn. Hãy kiên trì ôn luyện nhé!'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Pure Scoreboard Comparison */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-around">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 block uppercase">Bạn (Player)</span>
              <span className="text-3xl font-black font-mono text-emerald-700">
                {result.playerScore}
              </span>
              <span className="text-[11px] text-slate-500 block">Pure Score</span>
            </div>

            <div className="text-slate-300 font-extrabold text-sm">VS</div>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 block uppercase">Bot Đối Thủ</span>
              <span className="text-3xl font-black font-mono text-purple-700">
                {result.botScore}
              </span>
              <span className="text-[11px] text-slate-500 block">Pure Score</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">Độ chính xác</span>
              <span className="text-base font-extrabold text-slate-800 font-mono">
                {result.accuracy}%
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">Max Combo</span>
              <span className="text-base font-extrabold text-orange-600 font-mono flex items-center justify-center gap-1">
                x{result.maxCombo}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 block">Quy mô</span>
              <span className="text-base font-extrabold text-slate-800 font-mono">
                {result.wordCount} từ
              </span>
            </div>
          </div>

          {/* Unlocked Vocab Notification */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block">Vocab-Dex đã cập nhật!</span>
              <span className="text-[11px] text-emerald-800">
                Toàn bộ {words.length} từ vựng trong trận đấu này đã được mở khóa/cập nhật độ bền trí nhớ SRS.
              </span>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-2">
          {/* Solo Replay Button (Special requested feature!) */}
          <button
            type="button"
            onClick={() => onSoloReplay(words)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ôn luyện lại ván này (Solo Replay - Không áp lực điểm số)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" />
              Đấu ván mới
            </button>

            <button
              type="button"
              onClick={onViewHistory}
              className="py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              Lịch sử đấu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
