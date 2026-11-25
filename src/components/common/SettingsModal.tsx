import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  Volume2, 
  VolumeX, 
  Type, 
  Sparkles, 
  RotateCcw, 
  X, 
  Check, 
  Sliders, 
  Play,
  Flame,
  Globe
} from 'lucide-react';
import { 
  AppSettings, 
  AppTheme, 
  AppFontFamily, 
  AppFontSize, 
  AccentPreference 
} from '../../types/vocab';
import { settingsService } from '../../services/settings';
import { audioService } from '../../services/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => settingsService.getSettings());
  const [activeTab, setActiveTab] = useState<'theme' | 'audio' | 'general'>('theme');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSettings(settingsService.getSettings());
      setAvailableVoices(audioService.getVoices());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = settingsService.save({ [key]: value });
    setSettings(updated);
    if (onSettingsChanged) onSettingsChanged(updated);
  };

  const handleReset = () => {
    const resetSettings = settingsService.reset();
    setSettings(resetSettings);
    if (onSettingsChanged) onSettingsChanged(resetSettings);
  };

  const testVoice = (text: string = 'Welcome to VocabClash! Pure speed vocabulary arena.') => {
    audioService.speak(text, settings.accentPreference, settings.voiceRate);
  };

  const testSound = () => {
    audioService.playSound('correct');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Cài Đặt Hệ Thống</h2>
              <p className="text-[11px] text-slate-500">Tùy biến giao diện, font chữ, giọng đọc & âm thanh</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white flex items-center justify-center transition border border-slate-200 hover:border-rose-600 shadow-xs"
            title="Đóng (X)"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200/80 bg-white px-5 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'theme'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Giao Diện & Font</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'audio'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Âm Thanh & Giọng Đọc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Trải Nghiệm</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: GIAO DIỆN & FONT CHỮ */}
          {activeTab === 'theme' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 1. Theme (Sáng / Tối / Hệ thống) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  1. Giao Diện (Sáng / Tối)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light' as AppTheme, label: 'Sáng', desc: 'Tone trắng thanh lịch', icon: Sun },
                    { id: 'dark' as AppTheme, label: 'Tối', desc: 'Dịu mắt ban đêm', icon: Moon },
                    { id: 'system' as AppTheme, label: 'Hệ thống', desc: 'Theo thiết bị của bạn', icon: Monitor },
                  ].map((item) => {
                    const isSelected = settings.theme === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateSetting('theme', item.id)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold block">{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Kiểu Font Chữ */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-600" />
                  2. Kiểu Phông Chữ (Font Family)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'system' as AppFontFamily, name: 'Phổ thông (Sans-serif)', note: 'Giao diện tiêu chuẩn mượt mà' },
                    { id: 'lexend' as AppFontFamily, name: 'Lexend (Trợ đọc)', note: 'Tối ưu độ tập trung học từ' },
                    { id: 'mono' as AppFontFamily, name: 'Monospace (Gõ phím)', note: 'Khoảng cách đều chuẩn gõ code' },
                    { id: 'serif' as AppFontFamily, name: 'Cổ điển (Serif)', note: 'Phong cách sách từ điển truyền thống' },
                  ].map((font) => {
                    const isSelected = settings.fontFamily === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateSetting('fontFamily', font.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">{font.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{font.note}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cỡ Chữ (Font Size) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  3. Cỡ Chữ Toàn Hệ Thống
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'sm' as AppFontSize, label: 'Nhỏ', px: '14px' },
                    { id: 'base' as AppFontSize, label: 'Vừa', px: '16px' },
                    { id: 'lg' as AppFontSize, label: 'Lớn', px: '18px' },
                    { id: 'xl' as AppFontSize, label: 'Cực lớn', px: '20px' },
                  ].map((sz) => {
                    const isSelected = settings.fontSize === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => updateSetting('fontSize', sz.id)}
                        className={`p-2 rounded-xl border text-center transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{sz.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sz.px}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Xem trước văn bản hiển thị:
                </span>
                <p className="font-extrabold text-slate-900 leading-snug">
                  VocabClash • Đấu tốc độ 1v1 & Luyện phản xạ từ vựng
                </p>
                <p className="text-xs text-slate-500 italic">
                  "Practice makes perfect: Learning English becomes enjoyable and rapid."
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ÂM THANH & GIỌNG ĐỌC */}
          {activeTab === 'audio' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 1. Hiệu ứng âm thanh & Âm lượng */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Hiệu Ứng Âm Thanh (SFX)</span>
                      <span className="text-[10px] text-slate-400">Tiếng Ting đúng, Sai, Combo và Chiến thắng</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                      settings.soundEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.soundEnabled ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Volume Slider */}
                {settings.soundEnabled && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                      Âm lượng ({Math.round(settings.soundVolume * 100)}%):
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.soundVolume}
                      onChange={(e) => updateSetting('soundVolume', parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={testSound}
                      className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[10px] font-bold text-slate-700 transition shrink-0"
                    >
                      Nghe thử tiếng
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Giọng đọc phát âm (Accent) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Giọng Đọc Tiếng Anh (Accent)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en-US' as AccentPreference, label: '🇺🇸 Anh - Mỹ', sub: 'Chuẩn phổ thông quốc tế' },
                    { id: 'en-GB' as AccentPreference, label: '🇬🇧 Anh - Anh', sub: 'Chuẩn học thuật Oxford' },
                    { id: 'en-AU' as AccentPreference, label: '🇦🇺 Anh - Úc', sub: 'Ngữ điệu tự nhiên' },
                  ].map((acc) => {
                    const isSelected = settings.accentPreference === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => updateSetting('accentPreference', acc.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold block">{acc.label}</span>
                        <span className="text-[10px] text-slate-400 block">{acc.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tốc độ đọc phát âm (Speech Rate) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  Tốc Độ Đọc (Voice Speed)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { rate: 0.75, label: 'Chậm', sub: '0.75x' },
                    { rate: 0.88, label: 'Rõ ràng', sub: '0.88x (Mặc định)' },
                    { rate: 1.0, label: 'Bình thường', sub: '1.0x' },
                    { rate: 1.15, label: 'Nhanh', sub: '1.15x' },
                  ].map((r) => {
                    const isSelected = settings.voiceRate === r.rate;
                    return (
                      <button
                        key={r.rate}
                        type="button"
                        onClick={() => updateSetting('voiceRate', r.rate)}
                        className={`p-2 rounded-xl border text-center transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold block">{r.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{r.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Bộ tổng hợp giọng trên thiết bị (Voice Synthesis Picker) */}
              {availableVoices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Chọn Giọng Đọc Cụ Thể Trên Thiết Bị:</span>
                    <button
                      type="button"
                      onClick={() => testVoice()}
                      className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      Nghe thử giọng
                    </button>
                  </label>
                  <select
                    value={settings.selectedVoiceName || ''}
                    onChange={(e) => updateSetting('selectedVoiceName', e.target.value || undefined)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Tự động chọn giọng Neural / Tự nhiên tốt nhất --</option>
                    {availableVoices
                      .filter((v) => v.lang.startsWith('en'))
                      .map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRẢI NGHIỆM HỌC TẬP & KHÁC */}
          {activeTab === 'general' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Tự động phát âm Flashcard */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Tự Động Phát Âm Khi Đổi Từ
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Tự động đọc to từ tiếng Anh khi lật thẻ trong chế độ Tự học Offline
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('autoPlayFlashcardAudio', !settings.autoPlayFlashcardAudio)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                    settings.autoPlayFlashcardAudio
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.autoPlayFlashcardAudio ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              {/* Dòng chữ chạy trên đầu web */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Dòng Chữ Chạy Tinh Thần Học
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Hiển thị dải chữ chạy ngọn lửa Fair-play trên cùng đầu trang web
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !settings.showTicker;
                    updateSetting('showTicker', nextVal);
                    localStorage.setItem('vocabclash_ticker_enabled', nextVal ? 'true' : 'false');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                    settings.showTicker
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.showTicker ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
