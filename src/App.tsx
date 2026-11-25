import React, { useState, useEffect } from 'react';
import { CEFRLevel, CustomDeck, MatchHistoryItem, UserProfile, VocabWord } from './types/vocab';
import { storageService } from './services/storage';
import { audioService } from './services/audio';
import { Header } from './components/common/Header';
import { ArenaGame } from './components/arena/ArenaGame';
import { SelfStudyView } from './components/selfStudy/SelfStudyView';
import { VocabDexView } from './components/dictionary/VocabDexView';
import { MatchHistoryView } from './components/history/MatchHistoryView';
import { PlacementTestModal } from './components/placement/PlacementTestModal';
import { PhoneticsGuideModal } from './components/common/PhoneticsGuideModal';
import { SettingsModal } from './components/common/SettingsModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'arena' | 'selfStudy' | 'vocabDex' | 'history'>('arena');
  const [vocabularies, setVocabularies] = useState<VocabWord[]>([]);
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modals
  const [isPlacementOpen, setIsPlacementOpen] = useState<boolean>(false);
  const [isPhoneticsOpen, setIsPhoneticsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Cross-screen passing states
  const [arenaWords, setArenaWords] = useState<VocabWord[] | undefined>(undefined);
  const [arenaTitle, setArenaTitle] = useState<string | undefined>(undefined);

  // Load offline data on initial render
  useEffect(() => {
    const initData = async () => {
      const [vocabs, decks, history, profile] = await Promise.all([
        storageService.getVocabularies(),
        storageService.getCustomDecks(),
        storageService.getMatchHistory(),
        storageService.getUserProfile(),
      ]);

      setVocabularies(vocabs);
      setCustomDecks(decks);
      setMatchHistory(history);
      setUserProfile(profile);

      // Prompt Placement Test if first time
      if (!profile.hasTakenPlacement) {
        setIsPlacementOpen(true);
      }
    };

    initData();
  }, []);

  // Handler: Unlock Word into Vocab-Dex
  const handleUnlockWord = async (wordId: string) => {
    const updated = await storageService.unlockWord(wordId);
    setVocabularies(updated);
  };

  // Handler: Save Custom Deck
  const handleSaveCustomDeck = async (deck: CustomDeck) => {
    const updated = await storageService.addCustomDeck(deck);
    setCustomDecks(updated);
  };

  // Handler: Delete Custom Deck
  const handleDeleteCustomDeck = async (id: string) => {
    const updated = await storageService.deleteCustomDeck(id);
    setCustomDecks(updated);
  };

  // Handler: Finished a 1v1 match
  const handleFinishMatch = async (item: MatchHistoryItem) => {
    // 1. Add to match history
    const updatedHistory = await storageService.addMatchHistoryItem(item);
    setMatchHistory(updatedHistory);

    // 2. Unlock all match words in Vocab-Dex and update SRS
    let currentWords = vocabularies;
    for (const stat of item.words) {
      currentWords = await storageService.updateWordSRS(
        stat.wordId,
        !stat.wasIncorrect,
        stat.reactionTimeMs
      );
    }
    setVocabularies(currentWords);

    // 3. Update User Profile stats
    if (userProfile) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        totalMatches: userProfile.totalMatches + 1,
        totalVictories: userProfile.totalVictories + (item.isVictory ? 1 : 0),
        lastActiveDate: new Date().toISOString()
      };
      await storageService.saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
    }
  };

  // Handler: Launch 1v1 Arena with specific deck (from SelfStudy)
  const handleStart1v1Match = (words: VocabWord[], deckName?: string) => {
    setArenaWords(words);
    setArenaTitle(deckName);
    setCurrentTab('arena');
  };

  // Handler: Solo Replay (from Match History or Result)
  const handleSoloReplay = (words: VocabWord[]) => {
    // Switch to Self-Study tab with these exact words!
    setArenaWords(undefined);
    setArenaTitle(undefined);
    setCurrentTab('selfStudy');
  };

  // Handler: Complete Placement Test
  const handleCompletePlacement = async (
    level: CEFRLevel,
    roadmap: UserProfile['recommendedRoadmap']
  ) => {
    if (!userProfile) return;
    const updatedProfile: UserProfile = {
      ...userProfile,
      currentLevel: level,
      hasTakenPlacement: true,
      recommendedRoadmap: roadmap
    };
    await storageService.saveUserProfile(updatedProfile);
    setUserProfile(updatedProfile);
  };

  // Handler: Update Profile preferences (sound, accent)
  const handleUpdateProfile = async (partial: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...partial };
    await storageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium text-sm">
        Đang tải cơ sở dữ liệu VocabClash Offline...
      </div>
    );
  }

  const collectedCount = vocabularies.filter((w) => w.isCollected).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Universal Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setArenaWords(undefined);
          setArenaTitle(undefined);
          setCurrentTab(tab);
        }}
        userProfile={userProfile}
        collectedCount={collectedCount}
        totalVocabCount={vocabularies.length}
        onOpenPlacementTest={() => setIsPlacementOpen(true)}
        onOpenPhoneticsGuide={() => setIsPhoneticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {currentTab === 'arena' && (
          <ArenaGame
            key={arenaWords ? arenaWords.map(w => w.id).join('-') : 'default-arena'}
            vocabularies={vocabularies}
            customDecks={customDecks}
            userCurrentLevel={userProfile.currentLevel}
            onFinishMatch={handleFinishMatch}
            onSoloReplay={handleSoloReplay}
            onViewHistory={() => setCurrentTab('history')}
            accentPreference={userProfile.accentPreference}
            initialMatchWords={arenaWords}
            initialDeckTitle={arenaTitle}
            recentWordIds={matchHistory[0]?.words.map((w) => w.wordId) || []}
          />
        )}

        {currentTab === 'selfStudy' && (
          <SelfStudyView
            vocabularies={vocabularies}
            customDecks={customDecks}
            onSaveCustomDeck={handleSaveCustomDeck}
            onDeleteCustomDeck={handleDeleteCustomDeck}
            onUnlockWord={handleUnlockWord}
            onStart1v1Match={handleStart1v1Match}
            accentPreference={userProfile.accentPreference}
          />
        )}

        {currentTab === 'vocabDex' && (
          <VocabDexView
            vocabularies={vocabularies}
            onUnlockWord={handleUnlockWord}
            onOpenPhoneticsGuide={() => setIsPhoneticsOpen(true)}
            accentPreference={userProfile.accentPreference}
          />
        )}

        {currentTab === 'history' && (
          <MatchHistoryView
            history={matchHistory}
            vocabularies={vocabularies}
            onSoloReplay={handleSoloReplay}
          />
        )}
      </main>

      {/* Placement Test Diagnostic Modal */}
      <PlacementTestModal
        isOpen={isPlacementOpen}
        onClose={() => setIsPlacementOpen(false)}
        onComplete={handleCompletePlacement}
        vocabularies={vocabularies}
      />

      {/* Phonetics & Stress Rules Quick Reference Modal */}
      <PhoneticsGuideModal
        isOpen={isPhoneticsOpen}
        onClose={() => setIsPhoneticsOpen(false)}
      />

      {/* Settings Modal (Theme, Font, Size, Voice, SFX) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChanged={(newSettings) => {
          if (userProfile) {
            handleUpdateProfile({
              soundEnabled: newSettings.soundEnabled,
              accentPreference: newSettings.accentPreference as 'en-US' | 'en-GB'
            });
          }
        }}
      />

      {/* Subtle Offline & Footer Indicator */}
      <footer className="py-4 border-t border-slate-200/80 bg-white/60 text-center text-[11px] text-slate-400">
        VocabClash • Web Game đối kháng 1v1 tốc độ thuần túy & Vocab-Dex SRS • Hoạt động 100% Offline PWA
      </footer>
    </div>
  );
};

export default App;
