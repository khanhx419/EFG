import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight, Award, Compass, Zap, RotateCcw } from 'lucide-react';
import { PLACEMENT_QUESTIONS } from '../../data/placementData';
import { CEFRLevel, UserProfile } from '../../types/vocab';
import { audioService } from '../../services/audio';

interface PlacementTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (level: CEFRLevel, roadmap: UserProfile['recommendedRoadmap']) => void;
}

export const PlacementTestModal: React.FC<PlacementTestModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [calculatedLevel, setCalculatedLevel] = useState<CEFRLevel | null>(null);
  const [roadmapResult, setRoadmapResult] = useState<UserProfile['recommendedRoadmap'] | null>(null);

  if (!isOpen) return null;

  const currentQ = PLACEMENT_QUESTIONS[currentIndex];
  const totalQuestions = PLACEMENT_QUESTIONS.length;
  const isLast = currentIndex === totalQuestions - 1;

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIndex]: optIndex
    });
  };

  const handleNext = () => {
    if (isLast) {
      finishTest();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const finishTest = () => {
    // Grade questions by CEFR level
    const levelScores: Record<CEFRLevel, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
      C2: { correct: 0, total: 0 },
    };

    PLACEMENT_QUESTIONS.forEach((q, idx) => {
      levelScores[q.level].total += 1;
      if (selectedAnswers[idx] === q.correctIndex) {
        levelScores[q.level].correct += 1;
      }
    });

    // Determine highest level where candidate scores at least 50-100%
    let detectedLevel: CEFRLevel = 'A1';
    if (levelScores.C2.correct >= 1 && levelScores.C1.correct >= 1) {
      detectedLevel = 'C2';
    } else if (levelScores.C1.correct >= 1 && levelScores.B2.correct >= 1) {
      detectedLevel = 'C1';
    } else if (levelScores.B2.correct >= 1 && levelScores.B1.correct >= 1) {
      detectedLevel = 'B2';
    } else if (levelScores.B1.correct >= 1 && levelScores.A2.correct >= 1) {
      detectedLevel = 'B1';
    } else if (levelScores.A2.correct >= 1) {
      detectedLevel = 'A2';
    } else {
      detectedLevel = 'A1';
    }

    const roadmaps: Record<CEFRLevel, UserProfile['recommendedRoadmap']> = {
      A1: {
        currentLevel: 'A1',
        strengths: 'Khả năng nhận diện từ đơn lẻ cơ bản trong đời sống hàng ngày.',
        focusAreas: 'Xây dựng vốn từ vựng nền tảng (đồ vật, gia đình, thời gian) và phản xạ gõ đúng chính tả.',
        recommendedDailyWords: 5
      },
      A2: {
        currentLevel: 'A2',
        strengths: 'Hiểu các câu giao tiếp cơ bản và nhận biết tính từ mô tả thường gặp.',
        focusAreas: 'Mở rộng động từ chỉ hành động và bắt đầu luyện quy tắc trọng âm 2 âm tiết.',
        recommendedDailyWords: 5
      },
      B1: {
        currentLevel: 'B1',
        strengths: 'Có vốn từ vững chắc cho giao tiếp công việc và học tập cơ bản.',
        focusAreas: 'Rèn luyện các từ 3-4 âm tiết, phân biệt các hậu tố kéo trọng âm (-tion, -ic, -ity).',
        recommendedDailyWords: 7
      },
      B2: {
        currentLevel: 'B2',
        strengths: 'Khả năng suy luận ngữ cảnh và hiểu các từ vựng học thuật, chuyên ngành khá tốt.',
        focusAreas: 'Tăng tốc độ phản xạ gõ từ khó và làm quen với chế độ Dictation (Nghe & Viết không nhìn nghĩa).',
        recommendedDailyWords: 8
      },
      C1: {
        currentLevel: 'C1',
        strengths: 'Vốn từ vựng cao cấp, hiểu các sắc thái biểu cảm phức tạp và văn cảnh học thuật sâu sắc.',
        focusAreas: 'Đạt đỉnh cao tốc độ phản xạ trong 1v1 và hoàn thiện chính xác từng ending sounds của từ hiếm.',
        recommendedDailyWords: 10
      },
      C2: {
        currentLevel: 'C2',
        strengths: 'Trình độ tinh hoa tương đương người bản xứ học thuật. Khả năng phân tích câu và nhận diện từ hiếm xuất sắc.',
        focusAreas: 'Duy trì phản xạ tốc độ thuần túy, thử thách bản thân với các từ vựng triết học và văn học hiếm.',
        recommendedDailyWords: 10
      }
    };

    const roadmap = roadmaps[detectedLevel];
    setCalculatedLevel(detectedLevel);
    setRoadmapResult(roadmap);
    setIsSubmitted(true);
    audioService.playSound('victory');
  };

  const handleApply = () => {
    if (calculatedLevel && roadmapResult) {
      onComplete(calculatedLevel, roadmapResult);
      onClose();
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setCalculatedLevel(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isSubmitted ? 'Kết Quả & Lộ Trình Cá Nhân Hóa' : 'Bài Kiểm Tra Đầu Vào CEFR (Placement Test)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isSubmitted
                  ? 'Định vị chính xác trình độ hiện tại của bạn'
                  : `Câu hỏi ${currentIndex + 1}/${totalQuestions} • Phân tầng từ A1 đến C2`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isSubmitted ? (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Question details */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Cấp {currentQ.level}
                  </span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {currentQ.type === 'cloze' ? 'Điền khuyết ngữ pháp/từ' : currentQ.type === 'collocation' ? 'Cụm từ liên kết' : 'Từ vựng'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6 animate-fadeIn">
              {/* Level Announcement Badge */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 text-center shadow-lg shadow-emerald-200">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
                  Trình độ định vị chính thức
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight mt-1">
                  CEFR Cấp {calculatedLevel}
                </h2>
                <p className="text-sm text-emerald-50 mt-1">
                  Hệ thống đã hiệu chỉnh mức độ bài tập & đối thủ Bot AI tối ưu cho bạn
                </p>
              </div>

              {/* Roadmap Details */}
              {roadmapResult && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Lời Khuyên Lộ Trình Học Cá Nhân Hóa
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-emerald-700 block mb-0.5">🌟 Điểm mạnh của bạn:</span>
                      <p className="text-slate-600 leading-relaxed">{roadmapResult.strengths}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-amber-700 block mb-0.5">🎯 Vùng trọng tâm rèn luyện:</span>
                      <p className="text-slate-600 leading-relaxed">{roadmapResult.focusAreas}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">Mục tiêu từ vựng mỗi ngày:</span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                        {roadmapResult.recommendedDailyWords} từ vựng mới / ngày
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-40"
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={selectedAnswers[currentIndex] === undefined}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <span>{isLast ? 'Xem Kết Quả' : 'Câu Tiếp Theo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm lại bài test
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition"
              >
                <span>Áp Dụng Cấp {calculatedLevel} & Bắt Đầu Học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
