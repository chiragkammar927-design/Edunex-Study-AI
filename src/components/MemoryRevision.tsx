import React, { useState, useEffect } from 'react';
import { Flashcard, SubjectType } from '../types';
import {
  BrainCircuit,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  ArrowRight,
  TrendingDown,
  BookOpen,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface MemoryRevisionProps {
  cards: Flashcard[];
  onReviewCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onAddCustomCard: (card: Omit<Flashcard, 'id' | 'intervalDays' | 'easeFactor' | 'repetitions'>) => void;
  onAddXP: (xp: number) => void;
  initialSubject?: string;
}

export const MemoryRevision: React.FC<MemoryRevisionProps> = ({
  cards,
  onReviewCard,
  onAddCustomCard,
  onAddXP,
  initialSubject,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || 'all');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
      setActiveCardIndex(0);
      setIsFlipped(false);
    }
  }, [initialSubject]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectType>('Physics');
  const [newChapter, setNewChapter] = useState('');

  // Filter cards due today
  const dueCards = cards.filter((c) => {
    if (selectedSubject !== 'all' && c.subject !== selectedSubject) return false;
    return c.nextReviewDate <= 'Today' || c.nextReviewDate === 'Immediate';
  });

  const allFilteredCards = selectedSubject === 'all'
    ? cards
    : cards.filter((c) => c.subject === selectedSubject);

  const currentDeck = dueCards.length > 0 ? dueCards : allFilteredCards;
  const currentCard = currentDeck[activeCardIndex] || currentDeck[0];

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    onReviewCard(currentCard.id, rating);
    soundFX.playSuccess();
    onAddXP(10);
    setIsFlipped(false);

    if (activeCardIndex + 1 < currentDeck.length) {
      setActiveCardIndex((p) => p + 1);
    } else {
      setActiveCardIndex(0);
      triggerCelebration();
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    onAddCustomCard({
      front: newFront,
      back: newBack,
      subject: newSubject,
      chapter: newChapter || 'Custom Notes',
      nextReviewDate: 'Today',
      status: 'learning',
    });
    setNewFront('');
    setNewBack('');
    setNewChapter('');
    setIsAddingCard(false);
    soundFX.playSuccess();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white border border-amber-900/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 mb-2">
              <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
              <span>Spaced Repetition & Decay Mitigation</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Memory & Revision</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Counter the Ebbinghaus forgetting curve. Review flashcards on Days 1, 3, 7, 14, and 30 to transition knowledge into permanent long-term memory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingCard(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add Flashcard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgetting Curve Insight & Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 font-medium">Cards Due for Revision Today</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {dueCards.length}
            </p>
            <p className="text-[11px] text-slate-400">Peak memory consolidation window</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 font-medium">Mastered in Long-Term Storage</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {cards.filter((c) => c.status === 'mastered').length}
            </p>
            <p className="text-[11px] text-slate-400">Over 30-day retention index</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Decay Shield</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              92%
            </p>
            <p className="text-[11px] text-slate-400">Estimated exam recall stability</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Flashcard Interactive Stage */}
      {currentCard ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>
              Card {activeCardIndex + 1} of {currentDeck.length} ({currentCard.subject})
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {currentCard.chapter}
            </span>
          </div>

          {/* 3D Flip Card */}
          <div
            id="interactive-flashcard"
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer select-none perspective-1000 min-h-[300px] flex items-center justify-center"
          >
            <div
              className={`w-full p-8 sm:p-12 rounded-3xl border text-center transition-all duration-300 shadow-lg flex flex-col justify-between ${
                isFlipped
                  ? 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-cyan-950/40 border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-bold">
                  {isFlipped ? '💡 ANSWER / BACK' : '❓ QUESTION / FRONT'}
                </span>
                <span className="text-[11px] flex items-center gap-1 text-slate-400">
                  <RotateCw className="w-3 h-3" /> Click card to flip
                </span>
              </div>

              <div className="my-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </h3>
              </div>

              <div className="text-[11px] text-slate-400">
                Current interval: {currentCard.intervalDays} days • Next due: {currentCard.nextReviewDate}
              </div>
            </div>
          </div>

          {/* Spaced Repetition Grading Buttons */}
          <div className="space-y-2">
            <p className="text-center text-xs font-semibold text-slate-500">
              {isFlipped ? 'Rate your recall accuracy:' : 'Flip the card to rate your recall'}
            </p>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <button
                id="recall-again-btn"
                disabled={!isFlipped}
                onClick={() => handleRating('again')}
                className="py-3 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold disabled:opacity-40 transition active:scale-95 flex flex-col items-center"
              >
                <span>Again</span>
                <span className="text-[10px] font-normal opacity-80">&lt; 10 min</span>
              </button>

              <button
                id="recall-hard-btn"
                disabled={!isFlipped}
                onClick={() => handleRating('hard')}
                className="py-3 px-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-bold disabled:opacity-40 transition active:scale-95 flex flex-col items-center"
              >
                <span>Hard</span>
                <span className="text-[10px] font-normal opacity-80">1 day</span>
              </button>

              <button
                id="recall-good-btn"
                disabled={!isFlipped}
                onClick={() => handleRating('good')}
                className="py-3 px-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-xs font-bold disabled:opacity-40 transition active:scale-95 flex flex-col items-center"
              >
                <span>Good</span>
                <span className="text-[10px] font-normal opacity-80">3 days</span>
              </button>

              <button
                id="recall-easy-btn"
                disabled={!isFlipped}
                onClick={() => handleRating('easy')}
                className="py-3 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs font-bold disabled:opacity-40 transition active:scale-95 flex flex-col items-center"
              >
                <span>Easy</span>
                <span className="text-[10px] font-normal opacity-80">7+ days</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            All Caught Up for Today!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You've completed all scheduled spaced repetition revisions. Scan new notes with SnapStudy or create custom cards to expand your memory deck.
          </p>
        </div>
      )}

      {/* Add Custom Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Flashcard</h3>
            <form onSubmit={handleCreateCard} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as SubjectType)}
                    className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Chapter</label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="e.g. Thermodynamics"
                    className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Front (Question/Term)</label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. What is Lenz's law?"
                  rows={2}
                  className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Back (Explanation/Answer)</label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g. Induced electromotive force opposes change in magnetic flux..."
                  rows={3}
                  className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
