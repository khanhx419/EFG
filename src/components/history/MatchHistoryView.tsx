import React from 'react';
import { 
  History, 
  RotateCcw, 
  Trophy, 
  Frown, 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Layers
} from 'lucide-react';
import { MatchHistoryItem, VocabWord } from '../../types/vocab';

interface MatchHistoryViewProps {
  history: MatchHistoryItem[];
  vocabularies: VocabWord[];
  onSoloReplay: (words: VocabWord[]) => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  history,
  vocabularies,
  onSoloReplay
}) => {
  const handleReplayMatch = (item: MatchHistoryItem) => {
    // Resolve full VocabWord objects for this match
    const targetWordIds = item.words.map((w) => w.wordId);
    const resolvedWords = vocabularies.filter((v) => targetWordIds.includes(v.id));
    if (resolvedWords.length > 0) {
      onSoloReplay(resolvedWords);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('vi-VN')} • ${d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Lịch Sử Thi Đấu & Ôn Luyện Solo
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
              {history.length} trận
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi sự tiến bộ, xem lại các từ gõ sai/phản xạ chậm (được đánh dấu đỏ) và bấm Ôn Luyện Lại bất kỳ lúc nào
          </p>
        </div>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">Chưa có lịch sử trận đấu nào</h4>
          <p className="text-xs text-slate-400">
            Hãy tham gia một trận đấu 1v1 để bắt đầu lưu lại nhật ký phản xạ của bạn!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-4"
            >
              {/* Match Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      item.isVictory
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.isVictory ? <Trophy className="w-5 h-5 text-emerald-700" /> : <Frown className="w-5 h-5 text-rose-700" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">
                        {item.isVictory ? 'Chiến Thắng' : 'Thua Trận'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.level === 'Custom' ? 'Bộ Custom' : `Cấp ${item.level}`}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {item.wordCount} từ
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Score badge & Replay Action Button */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-extrabold text-slate-800">
                      <span className="text-emerald-700">{item.playerScore}</span>
                      <span className="text-slate-400 font-normal mx-1">vs</span>
                      <span className="text-purple-700">{item.botScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                      <span>Độ chính xác: {item.accuracy}%</span>
                      <span>• Combo x{item.maxCombo}</span>
                    </div>
                  </div>

                  {/* Requested feature: "Ôn luyện lại ván này" */}
                  <button
                    onClick={() => handleReplayMatch(item)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 shrink-0"
                    title="Mở lại đúng bộ từ vựng dưới dạng chơi đơn không cần đối thủ"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ôn luyện lại ván này</span>
                  </button>
                </div>
              </div>

              {/* Words breakdown list with RED highlight for wrong or slow words */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Chi tiết từ vựng trận đấu (Đánh dấu đỏ từ gõ sai hoặc phản xạ chậm):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {item.words.map((w, wIdx) => {
                    const isFlagged = w.wasIncorrect || w.isSlow;

                    return (
                      <div
                        key={wIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                          isFlagged
                            ? 'bg-rose-50/60 border-rose-300 text-rose-950 ring-1 ring-rose-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className={`font-mono font-bold block ${isFlagged ? 'text-rose-700' : 'text-slate-800'}`}>
                            {w.word}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {w.meaning_vi}
                          </span>
                        </div>

                        <div className="shrink-0 text-right">
                          {w.wasIncorrect ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800 block">
                              Gõ sai
                            </span>
                          ) : w.isSlow ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 block">
                              Chậm {(w.reactionTimeMs / 1000).toFixed(1)}s
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {(w.reactionTimeMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
