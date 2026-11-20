import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { audioService } from '../../services/audio';

interface AudioHintButtonProps {
  word: string;
  accent?: 'en-US' | 'en-GB';
  onHintUsed?: () => void;
  cooldownSeconds?: number;
  className?: string;
  autoPlayFirstTime?: boolean;
}

export const AudioHintButton: React.FC<AudioHintButtonProps> = ({
  word,
  accent = 'en-US',
  onHintUsed,
  cooldownSeconds = 5,
  className = '',
  autoPlayFirstTime = false
}) => {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Optional auto-play when question appears
  useEffect(() => {
    if (autoPlayFirstTime && word) {
      audioService.speak(word, accent);
    }
  }, [word, autoPlayFirstTime, accent]);

  const triggerAudio = () => {
    if (cooldownRemaining > 0) return;

    // Speak audio via Web Speech API
    audioService.speak(word, accent);
    if (onHintUsed) onHintUsed();

    // Start 5-second countdown with smooth update
    const totalMs = cooldownSeconds * 1000;
    const intervalMs = 100;
    let elapsed = 0;

    setCooldownRemaining(cooldownSeconds);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      elapsed += intervalMs;
      const left = Math.max(0, cooldownSeconds - elapsed / 1000);
      setCooldownRemaining(left);

      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, intervalMs);
  };

  const isCoolingDown = cooldownRemaining > 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  // Progress fraction 1 -> 0
  const progress = isCoolingDown ? cooldownRemaining / cooldownSeconds : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <button
        type="button"
        onClick={triggerAudio}
        disabled={isCoolingDown}
        title={isCoolingDown ? `Chờ ${Math.ceil(cooldownRemaining)}s để nghe lại âm thanh` : 'Bấm để nghe phát âm chuẩn'}
        className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 select-none ${
          isCoolingDown
            ? 'bg-slate-100 cursor-not-allowed text-slate-400 border border-slate-200'
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300'
        }`}
      >
        {/* SVG Circular Radial Progress */}
        {isCoolingDown && (
          <svg className="absolute inset-0 w-12 h-12 -rotate-90 pointer-events-none" viewBox="0 0 48 48">
            {/* Background track circle */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              strokeWidth="3.5"
              fill="transparent"
              className="text-slate-200"
            />
            {/* Animated countdown circle */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-emerald-500 circle-progress"
            />
          </svg>
        )}

        {/* Center Content: Speaker Icon or Remaining Seconds */}
        {isCoolingDown ? (
          <span className="font-mono font-bold text-sm text-slate-700">
            {Math.ceil(cooldownRemaining)}s
          </span>
        ) : (
          <Volume2 className="w-5 h-5 transition-transform" />
        )}
      </button>

      {/* Floating tooltip badge */}
      {isCoolingDown && (
        <span className="absolute -bottom-6 text-[10px] whitespace-nowrap font-medium text-slate-500 bg-white/90 px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
          Hồi chiêu {Math.ceil(cooldownRemaining)}s
        </span>
      )}
    </div>
  );
};
