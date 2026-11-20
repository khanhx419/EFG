import React, { useState } from 'react';
import { CEFRLevel, CustomDeck, GamePhase, MatchHistoryItem, MatchWordStat, VocabWord, WordLengthMode } from '../../types/vocab';
import { BotDifficulty } from '../../services/botAi';
import { MatchLobby } from './MatchLobby';
import { MatchCountdown } from './MatchCountdown';
import { MatchPhase1Memo } from './MatchPhase1Memo';
import { MatchPhase2Match } from './MatchPhase2Match';
import { MatchPhase3Spell } from './MatchPhase3Spell';
import { MatchPhase4MCQ } from './MatchPhase4MCQ';
import { MatchResultModal } from './MatchResultModal';

interface ArenaGameProps {
  vocabularies: VocabWord[];
  customDecks: CustomDeck[];
  userCurrentLevel: CEFRLevel;
  onFinishMatch: (historyItem: MatchHistoryItem) => void;
  onSoloReplay: (words: VocabWord[]) => void;
  onViewHistory: () => void;
  accentPreference: 'en-US' | 'en-GB';
  initialMatchWords?: VocabWord[];
  initialDeckTitle?: string;
  recentWordIds?: string[];
}

export const ArenaGame: React.FC<ArenaGameProps> = ({
  vocabularies,
  customDecks,
  userCurrentLevel,
  onFinishMatch,
  onSoloReplay,
  onViewHistory,
  accentPreference,
  initialMatchWords,
  initialDeckTitle,
  recentWordIds = []
}) => {
  const [phase, setPhase] = useState<GamePhase>(initialMatchWords ? 'countdown' : 'lobby');
  const [candidatePool, setCandidatePool] = useState<VocabWord[]>(initialMatchWords || []);
  const [matchWords, setMatchWords] = useState<VocabWord[]>([]);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [matchMode, setMatchMode] = useState<'pvp_bot' | 'custom_deck'>('pvp_bot');
  const [levelTitle, setLevelTitle] = useState<CEFRLevel | 'Custom'>(
    (initialDeckTitle as CEFRLevel) || userCurrentLevel
  );
  const [wordCount, setWordCount] = useState<WordLengthMode>(() => {
    if (!initialMatchWords) return 5;
    if (initialMatchWords.length <= 10) {
      return Math.max(3, initialMatchWords.length) as WordLengthMode;
    }
    return 5;
  });

  // Match score accumulator
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [botScore, setBotScore] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);

  // Word stats recorded from spelling/phases
  const [matchWordStats, setMatchWordStats] = useState<MatchWordStat[]>([]);

  // Final match result
  const [finalResult, setFinalResult] = useState<MatchHistoryItem | null>(null);

  // Start match from Lobby -> enter 5s Countdown & Vocab-Dex shuffle phase
  const handleStartMatch = (
    pool: VocabWord[],
    diff: BotDifficulty,
    mode: 'pvp_bot' | 'custom_deck',
    title: CEFRLevel | 'Custom',
    count: WordLengthMode
  ) => {
    setCandidatePool(pool);
    setMatchWords([]);
    setDifficulty(diff);
    setMatchMode(mode);
    setLevelTitle(title);
    setWordCount(count);

    setPlayerScore(0);
    setBotScore(0);
    setCurrentCombo(0);
    setMaxCombo(0);
    setMatchWordStats([]);
    setFinalResult(null);

    setPhase('countdown');
  };

  // Countdown -> Phase 1
  const handleCountdownReady = (preparedWords: VocabWord[]) => {
    setMatchWords(preparedWords);
    setPhase('phase1_memo');
  };

  // Phase 1 -> Phase 2
  const handlePhase1Complete = () => {
    setPhase('phase2_matching');
  };

  // Phase 2 -> Phase 3
  const handlePhase2Complete = (pScore: number, bScore: number, comboVal: number) => {
    setPlayerScore(pScore);
    setBotScore(bScore);
    setCurrentCombo(comboVal);
    setMaxCombo(Math.max(maxCombo, comboVal));
    setPhase('phase3_spelling');
  };

  // Phase 3 -> Phase 4
  const handlePhase3Complete = (
    pScore: number,
    bScore: number,
    comboVal: number,
    wordStats: MatchWordStat[]
  ) => {
    setPlayerScore(pScore);
    setBotScore(bScore);
    setCurrentCombo(comboVal);
    setMaxCombo(Math.max(maxCombo, comboVal));
    setMatchWordStats(wordStats);
    setPhase('phase4_context');
  };

  // Phase 4 -> Result
  const handlePhase4Complete = (finalPScore: number, finalBScore: number, finalMaxCombo: number) => {
    setPlayerScore(finalPScore);
    setBotScore(finalBScore);
    const overallMaxCombo = Math.max(maxCombo, finalMaxCombo);

    // Calculate accuracy based on incorrect attempts in matchWordStats
    const incorrectCount = matchWordStats.filter((s) => s.wasIncorrect).length;
    const accuracy = Math.round(
      Math.max(20, ((matchWords.length - incorrectCount) / Math.max(1, matchWords.length)) * 100)
    );

    const historyItem: MatchHistoryItem = {
      id: `match_${Date.now()}`,
      date: new Date().toISOString(),
      mode: matchMode,
      level: levelTitle,
      wordCount,
      playerScore: finalPScore,
      botScore: finalBScore,
      isVictory: finalPScore >= finalBScore,
      maxCombo: overallMaxCombo,
      accuracy,
      words: matchWordStats.length > 0 ? matchWordStats : matchWords.map((w) => ({
        wordId: w.id,
        word: w.word,
        meaning_vi: w.meaning_vi,
        wasIncorrect: false,
        reactionTimeMs: 1800,
        isSlow: false
      }))
    };

    setFinalResult(historyItem);
    onFinishMatch(historyItem);
    setPhase('result');
  };

  const handlePlayAgain = () => {
    setPhase('lobby');
    setFinalResult(null);
  };

  return (
    <div className="w-full">
      {phase === 'lobby' && (
        <MatchLobby
          vocabularies={vocabularies}
          customDecks={customDecks}
          userCurrentLevel={userCurrentLevel}
          onStartMatch={handleStartMatch}
          preselectedWords={initialMatchWords}
          preselectedDeckTitle={initialDeckTitle}
        />
      )}

      {phase === 'countdown' && (
        <MatchCountdown
          pool={candidatePool}
          allVocabularies={vocabularies}
          wordCount={wordCount}
          recentWordIds={recentWordIds}
          levelTitle={levelTitle === 'Custom' ? 'Bộ từ tự tạo' : `CEFR Cấp ${levelTitle}`}
          onReady={handleCountdownReady}
        />
      )}

      {phase === 'phase1_memo' && (
        <MatchPhase1Memo
          words={matchWords}
          onComplete={handlePhase1Complete}
          accentPreference={accentPreference}
        />
      )}

      {phase === 'phase2_matching' && (
        <MatchPhase2Match
          words={matchWords}
          difficulty={difficulty}
          onPhaseComplete={handlePhase2Complete}
          initialPlayerScore={playerScore}
          initialBotScore={botScore}
        />
      )}

      {phase === 'phase3_spelling' && (
        <MatchPhase3Spell
          words={matchWords}
          difficulty={difficulty}
          onPhaseComplete={handlePhase3Complete}
          initialPlayerScore={playerScore}
          initialBotScore={botScore}
          initialCombo={currentCombo}
          accentPreference={accentPreference}
        />
      )}

      {phase === 'phase4_context' && (
        <MatchPhase4MCQ
          words={matchWords}
          difficulty={difficulty}
          onPhaseComplete={handlePhase4Complete}
          initialPlayerScore={playerScore}
          initialBotScore={botScore}
          initialCombo={currentCombo}
        />
      )}

      {phase === 'result' && finalResult && (
        <MatchResultModal
          result={finalResult}
          words={matchWords}
          onPlayAgain={handlePlayAgain}
          onSoloReplay={onSoloReplay}
          onViewHistory={onViewHistory}
        />
      )}
    </div>
  );
};
