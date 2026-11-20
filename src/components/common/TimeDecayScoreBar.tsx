import React from 'react';
import { Zap, Flame } from 'lucide-react';

interface TimeDecayScoreBarProps {
  currentScore: number;    // 300 to 1000
  combo: number;
  maxScore?: number;
  minScore?: number;
  label?: string;
}

export const TimeDecayScoreBar: React.FC<TimeDecayScoreBarProps> = ({
  currentScore,
  combo,
  maxScore = 1000,
  minScore = 300,
  label = 'Điểm phản xạ'
}) => {
  // Percentage from minScore to maxScore
  const fraction = Math.max(0, Math.min(1, (currentScore - minScore) / (maxScore - minScore)));
  const percentage = Math.round(fraction * 100);

  // 3 Color zones requirement:
  // 1000 – 750: Emerald/Green
  // 749 – 500: Amber/Orange
  // < 500: Rose/Red
  let colorClass = 'bg-emerald-500';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let zoneText = 'Xuất sắc';

  if (currentScore >= 750) {
    colorClass = 'bg-emerald-500 shadow-emerald-200';
    badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    zoneText = 'Phản xạ vàng';
  } else if (currentScore >= 500) {
    colorClass = 'bg-amber-500 shadow-amber-200';
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    zoneText = 'Tốc độ vừa';
  } else {
    colorClass = 'bg-rose-500 shadow-rose-200';
    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
    zoneText = 'Sắp hết tối ưu';
  }

  // Bonus for combo >= 3 is +50
  const hasComboBonus = combo >= 3;

  return (
    <div className="w-full bg-white rounded-xl p-3 border border-slate-200 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-1.5 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {label}
          </span>
          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeBg}`}>
            {zoneText}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded-full text-orange-700 font-bold text-xs animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>Combo x{combo}</span>
              {hasComboBonus && <span className="text-[10px] text-emerald-600 ml-0.5">(+50)</span>}
            </div>
          )}

          <div className="text-right font-mono font-bold text-sm text-slate-800">
            {currentScore} <span className="text-[11px] text-slate-500 font-normal">pts</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear shadow-sm ${colorClass}`}
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
        <span>Tối thiểu: {minScore} pts</span>
        <span>Mốc tối đa: {maxScore} pts</span>
      </div>
    </div>
  );
};
