import React, { useState, useMemo } from 'react';
import { WeaknessItem, SyllabusChapter, Flashcard, SubjectType } from '../types';
import { NavTab } from './Sidebar';
import {
  BrainCircuit,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  Eye,
  RotateCw,
  Award,
  Zap,
  ChevronRight,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';

export interface SmartRecommendationItem {
  id: string;
  type: 'lesson' | 'flashcard_deck';
  title: string;
  subject: SubjectType;
  chapterTitle: string;
  chapterId?: string;
  estimatedMinutes: number;
  targetedWeaknessId: string;
  weaknessLabel: string;
  weaknessSubtopic: string;
  rootCause: string;
  confidence: 'Critical' | 'Medium' | 'Low';
  currentScore: string;
  projectedGain: string;
  pedagogicalReason: string;
  keyPointsOrFormulas: string[];
  deckCardCount?: number;
  sampleCards?: { front: string; back: string }[];
}

interface SmartRecommendationsProps {
  weaknesses: WeaknessItem[];
  chapters: SyllabusChapter[];
  flashcards: Flashcard[];
  onNavigate: (tab: NavTab) => void;
  onOpenLesson?: (subject: SubjectType, chapterTitle: string) => void;
  onOpenFlashcardDeck?: (subject: SubjectType, chapterTitle: string) => void;
  onOpenWeaknessDrill: (weaknessId: string) => void;
  selectedSubject?: SubjectType | 'all';
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  weaknesses,
  chapters,
  flashcards,
  onNavigate,
  onOpenLesson,
  onOpenFlashcardDeck,
  onOpenWeaknessDrill,
  selectedSubject = 'all',
}) => {
  const [filter, setFilter] = useState<'all' | 'lesson' | 'flashcard_deck'>('all');
  const [completedRecs, setCompletedRecs] = useState<Record<string, boolean>>({});
  const [previewItem, setPreviewItem] = useState<SmartRecommendationItem | null>(null);
  const [activePreviewCardIndex, setActivePreviewCardIndex] = useState(0);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);

  // Derive the 3 Smart Recommendations from existing weakness data
  const recommendations = useMemo<SmartRecommendationItem[]>(() => {
    const list: SmartRecommendationItem[] = [];

    // Weakness 1: Math (Quadratic Factoring / Sign errors) -> Suggest Lesson or Flashcards
    const mathWeakness = weaknesses.find((w) => w.subject === 'Mathematics') || weaknesses[0];
    const mathChapter = chapters.find((c) => c.subject === 'Mathematics') || chapters[0];

    if (mathWeakness) {
      list.push({
        id: 'rec-math-lesson',
        type: 'lesson',
        title: `Lesson: ${mathChapter ? mathChapter.title : 'Quadratic Equations & Roots Mastery'}`,
        subject: 'Mathematics',
        chapterTitle: mathChapter ? mathChapter.title : 'Quadratic Equations',
        chapterId: mathChapter?.id || 'math-quad',
        estimatedMinutes: 12,
        targetedWeaknessId: mathWeakness.id,
        weaknessLabel: mathWeakness.weaknessLabel,
        weaknessSubtopic: mathWeakness.subtopic,
        rootCause: mathWeakness.rootCause,
        confidence: mathWeakness.confidence,
        currentScore: `${mathWeakness.score}/${mathWeakness.maxScore}`,
        projectedGain: '+16% Exam Accuracy',
        pedagogicalReason: 'Systematic breakdown of minus-sign distribution across terms with step-by-step worked examples.',
        keyPointsOrFormulas: mathChapter?.importantFormulas?.map((f) => `${f.name}: ${f.formula}`) || [
          'Quadratic Formula: x = (-b ± √(b² - 4ac)) / 2a',
          'Discriminant: Δ = b² - 4ac',
          'Factoring rule: -(ax + b) = -ax - b',
        ],
      });
    }

    // Weakness 2: Physics (Inclined plane normal force / vector decomposition) -> Suggest Flashcard Deck
    const physicsWeakness = weaknesses.find((w) => w.subject === 'Physics') || weaknesses[1] || weaknesses[0];
    const physicsChapter = chapters.find((c) => c.subject === 'Physics');
    const physicsCards = flashcards.filter((f) => f.subject === 'Physics');

    if (physicsWeakness) {
      list.push({
        id: 'rec-physics-deck',
        type: 'flashcard_deck',
        title: `Flashcard Deck: Laws of Motion & Inclined Vectors`,
        subject: 'Physics',
        chapterTitle: physicsChapter ? physicsChapter.title : 'Laws of Motion',
        chapterId: physicsChapter?.id || 'phys-motion',
        estimatedMinutes: 8,
        targetedWeaknessId: physicsWeakness.id,
        weaknessLabel: physicsWeakness.weaknessLabel,
        weaknessSubtopic: physicsWeakness.subtopic,
        rootCause: physicsWeakness.rootCause,
        confidence: physicsWeakness.confidence,
        currentScore: `${physicsWeakness.score}/${physicsWeakness.maxScore}`,
        projectedGain: '+22% Vector Precision',
        pedagogicalReason: 'High-frequency spaced repetition to permanently hardwire normal force (mg cos θ) vs parallel downhill force (mg sin θ).',
        deckCardCount: Math.max(6, physicsCards.length + 4),
        keyPointsOrFormulas: [
          'Parallel force down incline = mg · sin(θ)',
          'Normal contact force = mg · cos(θ)',
          'Maximum static friction = μ_s · N',
        ],
        sampleCards: [
          {
            front: 'On a ramp inclined at angle θ, why is Normal Force N = mg cos(θ) instead of mg sin(θ)?',
            back: 'Because gravity acts straight down. Breaking it into perpendicular and parallel axes to the ramp surface shows the component perpendicular to the surface is mg cos(θ). Since there is no acceleration into the ramp, N balances mg cos(θ).',
          },
          {
            front: 'What happens to the normal force as ramp angle θ approaches 90° (vertical wall)?',
            back: 'As θ approaches 90°, cos(θ) approaches 0, so the normal force N approaches 0. The entire weight acts parallel downwards as free fall.',
          },
          {
            front: 'When does a mass start sliding down an inclined plane with friction coefficient μ_s?',
            back: 'When the parallel gravity pull mg sin(θ) strictly exceeds maximum static friction f_s(max) = μ_s mg cos(θ), which simplifies to tan(θ) > μ_s.',
          },
        ],
      });
    }

    // Weakness 3: Chemistry (Stoichiometry / Limiting Reagents) -> Suggest Lesson or Deck
    const chemWeakness = weaknesses.find((w) => w.subject === 'Chemistry') || weaknesses[2] || weaknesses[0];
    const chemChapter = chapters.find((c) => c.subject === 'Chemistry');
    const chemCards = flashcards.filter((f) => f.subject === 'Chemistry');

    if (chemWeakness) {
      list.push({
        id: 'rec-chem-lesson',
        type: 'lesson',
        title: `Lesson: ${chemChapter ? chemChapter.title : 'Stoichiometry & Mole Concept Protocol'}`,
        subject: 'Chemistry',
        chapterTitle: chemChapter ? chemChapter.title : 'Stoichiometry & Mole Concept',
        chapterId: chemChapter?.id || 'chem-mole',
        estimatedMinutes: 10,
        targetedWeaknessId: chemWeakness.id,
        weaknessLabel: chemWeakness.weaknessLabel,
        weaknessSubtopic: chemWeakness.subtopic,
        rootCause: chemWeakness.rootCause,
        confidence: chemWeakness.confidence,
        currentScore: `${chemWeakness.score}/${chemWeakness.maxScore}`,
        projectedGain: '+14% Stoichiometric Mastery',
        pedagogicalReason: 'Algorithmic 3-step mole quotient protocol preventing mass-based reagent confusion.',
        keyPointsOrFormulas: [
          'Moles = mass (g) / molar mass (g/mol)',
          'Limiting Reagent Test: Divide initial moles by stoichiometric coefficient',
          'Theoretical yield is bounded strictly by the limiting reactant',
        ],
      });
    }

    // Weakness 4: Biology (Cellular Respiration & Chemiosmosis)
    const bioWeakness = weaknesses.find((w) => w.subject === 'Biology');
    const bioChapter = chapters.find((c) => c.subject === 'Biology');
    const bioCards = flashcards.filter((f) => f.subject === 'Biology');

    if (bioWeakness || bioChapter) {
      list.push({
        id: 'rec-bio-deck',
        type: 'flashcard_deck',
        title: 'Flashcard Deck: Mitochondrial ETC & Chemiosmosis',
        subject: 'Biology',
        chapterTitle: bioChapter ? bioChapter.title : 'Cellular Respiration',
        chapterId: bioChapter?.id || 'bio-cell-resp',
        estimatedMinutes: 8,
        targetedWeaknessId: bioWeakness?.id || 'w-4',
        weaknessLabel: bioWeakness?.weaknessLabel || 'Proton gradient orientation in mitochondria',
        weaknessSubtopic: bioWeakness?.subtopic || 'Oxidative Phosphorylation',
        rootCause: bioWeakness?.rootCause || 'Confusing proton accumulation in intermembrane space versus matrix.',
        confidence: bioWeakness?.confidence || 'Low',
        currentScore: bioWeakness ? `${bioWeakness.score}/${bioWeakness.maxScore}` : '7/10',
        projectedGain: '+18% Cellular Energy Pathway Recall',
        pedagogicalReason: 'Spatial mapping of the mitochondrial double membrane and proton motive force.',
        deckCardCount: bioCards.length > 0 ? bioCards.length : 3,
        keyPointsOrFormulas: [
          'Protons pumped from matrix -> intermembrane space',
          'ATP Synthase lets H+ flow back down gradient into matrix',
          'O2 is final electron acceptor, forming H2O',
        ],
        sampleCards: [
          {
            front: 'Where do protons accumulate to create the proton-motive force in mitochondria?',
            back: 'In the intermembrane space (between inner and outer mitochondrial membranes), driving protons back through ATP Synthase into the matrix.',
          },
          {
            front: 'What is the role of Oxygen (O₂) in oxidative phosphorylation?',
            back: 'It is the terminal electron acceptor, accepting electrons from Complex IV and binding with H⁺ to produce metabolic H₂O.',
          },
        ],
      });
    }

    return list;
  }, [weaknesses, chapters, flashcards]);

  const isSubjectMatch = (itemSubject: string, subjectFilter?: string) => {
    if (!subjectFilter || subjectFilter === 'all') return true;
    if (subjectFilter === 'Science') {
      return itemSubject === 'Science' || itemSubject === 'Physics' || itemSubject === 'Chemistry' || itemSubject === 'Biology';
    }
    return itemSubject === subjectFilter;
  };

  const filteredRecs = useMemo(() => {
    let recs = recommendations;
    if (selectedSubject && selectedSubject !== 'all') {
      const subjectRecs = recs.filter((r) => isSubjectMatch(r.subject, selectedSubject));
      if (subjectRecs.length > 0) {
        recs = subjectRecs;
      }
    }
    if (filter === 'all') return recs.slice(0, 3);
    return recs.filter((r) => r.type === filter).slice(0, 3);
  }, [recommendations, filter, selectedSubject]);

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playSuccess();
    const willBeCompleted = !completedRecs[id];
    setCompletedRecs((prev) => ({ ...prev, [id]: willBeCompleted }));
    if (willBeCompleted) {
      triggerCelebration();
    }
  };

  const handleStartRecommendation = (rec: SmartRecommendationItem) => {
    soundFX.playPop();
    if (rec.type === 'lesson') {
      if (onOpenLesson) {
        onOpenLesson(rec.subject, rec.chapterTitle);
      } else {
        onNavigate('learn');
      }
    } else {
      if (onOpenFlashcardDeck) {
        onOpenFlashcardDeck(rec.subject, rec.chapterTitle);
      } else {
        onNavigate('memory');
      }
    }
  };

  const handleOpenPreview = (rec: SmartRecommendationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playPop();
    setPreviewItem(rec);
    setActivePreviewCardIndex(0);
    setIsPreviewFlipped(false);
  };

  return (
    <div id="smart-recommendations-section" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
              Targeted Improvement Engine
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              3 Adaptive Interventions
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Smart Recommendations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-matched with your cognitive error history to eliminate recurring exam traps.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All (3)
          </button>
          <button
            onClick={() => setFilter('lesson')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              filter === 'lesson'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Lessons</span>
          </button>
          <button
            onClick={() => setFilter('flashcard_deck')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              filter === 'flashcard_deck'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Flashcards</span>
          </button>
        </div>
      </div>

      {/* 3 Specific Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredRecs.map((rec) => {
          const isDone = completedRecs[rec.id];
          const isLesson = rec.type === 'lesson';

          return (
            <div
              key={rec.id}
              className={`group relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isDone
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 opacity-90'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:shadow-lg'
              }`}
            >
              {/* Top Type & Time Pill Bar */}
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                      isLesson
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80'
                        : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                    }`}
                  >
                    {isLesson ? (
                      <>
                        <BookOpen className="w-3 h-3 text-indigo-500" />
                        <span>Syllabus Lesson</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3 h-3 text-amber-500" />
                        <span>Flashcard Deck</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec.estimatedMinutes}m
                    </span>
                    <button
                      onClick={(e) => toggleComplete(rec.id, e)}
                      title={isDone ? 'Mark as active' : 'Mark as done'}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : 'border border-slate-300 dark:border-slate-700 text-transparent hover:text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Title & Subject */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {rec.subject}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors mt-0.5">
                    {rec.title}
                  </h3>
                </div>

                {/* Weakness Diagnostic Connection Box */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <AlertTriangle
                        className={`w-3.5 h-3.5 shrink-0 ${
                          rec.confidence === 'Critical' ? 'text-rose-500' : 'text-amber-500'
                        }`}
                      />
                      <span>Fixes Weakness:</span>
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                        rec.confidence === 'Critical'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      Score: {rec.currentScore}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    "{rec.weaknessLabel}"
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    Root cause: {rec.rootCause}
                  </p>
                </div>

                {/* Targeted Improvement Payoff */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{rec.projectedGain}</span>
                  </span>
                  {rec.deckCardCount && (
                    <span className="text-[11px] font-bold text-slate-400">
                      {rec.deckCardCount} active cards
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex items-center gap-2">
                <button
                  onClick={(e) => handleOpenPreview(rec, e)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                  title="Quick preview without leaving dashboard"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleStartRecommendation(rec)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                    isLesson
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  <span>{isLesson ? 'Start Lesson' : 'Practice Deck'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Preview Slide-over Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    previewItem.type === 'lesson'
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {previewItem.type === 'lesson' ? (
                    <BookOpen className="w-5 h-5" />
                  ) : (
                    <Layers className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                    {previewItem.type === 'lesson' ? 'Lesson Synopsis' : 'Flashcard Deck Preview'} · {previewItem.subject}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {previewItem.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Weakness Targeting Alert */}
              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-rose-600 dark:text-rose-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Targeted Error Pattern</span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {previewItem.weaknessLabel}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {previewItem.pedagogicalReason}
                </p>
              </div>

              {/* Flashcard Interactive Preview or Lesson Formula Highlights */}
              {previewItem.type === 'flashcard_deck' && previewItem.sampleCards && previewItem.sampleCards.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                      Card {activePreviewCardIndex + 1} of {previewItem.sampleCards.length}
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">
                      Click card to flip
                    </span>
                  </div>

                  {/* Interactive Flip Card */}
                  <div
                    onClick={() => {
                      soundFX.playPop();
                      setIsPreviewFlipped(!isPreviewFlipped);
                    }}
                    className="cursor-pointer min-h-[160px] p-6 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:from-slate-800 dark:to-slate-850 border-2 border-amber-200/80 dark:border-slate-700 flex flex-col justify-between shadow-xs hover:border-amber-400 transition select-none"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>{isPreviewFlipped ? 'Answer Key / Verification' : 'Front: Question / Prompt'}</span>
                      <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                    </div>

                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white my-3 leading-relaxed">
                      {isPreviewFlipped
                        ? previewItem.sampleCards[activePreviewCardIndex].back
                        : previewItem.sampleCards[activePreviewCardIndex].front}
                    </p>

                    <div className="text-right text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold">
                      {isPreviewFlipped ? 'Tap to see prompt' : 'Tap to see step-by-step logic'}
                    </div>
                  </div>

                  {/* Card Switcher Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      disabled={activePreviewCardIndex === 0}
                      onClick={() => {
                        soundFX.playPop();
                        setActivePreviewCardIndex((p) => p - 1);
                        setIsPreviewFlipped(false);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      ← Previous Card
                    </button>
                    <button
                      disabled={activePreviewCardIndex === previewItem.sampleCards.length - 1}
                      onClick={() => {
                        soundFX.playPop();
                        setActivePreviewCardIndex((p) => p + 1);
                        setIsPreviewFlipped(false);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      Next Card →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                    Key Takeaways & Formulas Covered in this Lesson:
                  </span>
                  <div className="space-y-2">
                    {previewItem.keyPointsOrFormulas.map((point, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 text-xs flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setPreviewItem(null);
                  handleStartRecommendation(previewItem);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  previewItem.type === 'lesson'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                <span>{previewItem.type === 'lesson' ? 'Open Full Lesson' : 'Start Full Flashcard Session'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
