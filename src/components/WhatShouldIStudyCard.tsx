import React, { useState, useMemo } from 'react';
import { SubjectType, WeaknessItem, SyllabusChapter } from '../types';
import { NavTab } from './Sidebar';
import {
  Zap,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Target,
  ChevronRight,
  ShieldAlert,
  Flame,
  HelpCircle,
  Award,
} from 'lucide-react';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';

export interface UpcomingExam {
  id: string;
  subject: SubjectType;
  title: string;
  daysRemaining: number;
  dateStr: string;
  weight: number; // percentage of grade
  highYieldTopics: string[];
}

interface WhatShouldIStudyCardProps {
  weaknesses: WeaknessItem[];
  chapters: SyllabusChapter[];
  onNavigate: (tab: NavTab) => void;
  onOpenWeaknessDrill: (weaknessId: string) => void;
  onAddStudyMinutes?: (minutes: number) => void;
  selectedSubject?: SubjectType | 'all';
}

export const WhatShouldIStudyCard: React.FC<WhatShouldIStudyCardProps> = ({
  weaknesses,
  chapters,
  onNavigate,
  onOpenWeaknessDrill,
  onAddStudyMinutes,
  selectedSubject = 'all',
}) => {
  // Available time state (default 15 minutes - the optimal focus micro-drill)
  const [availableMinutes, setAvailableMinutes] = useState<10 | 15 | 25 | 45 | 60>(15);

  // Active exam filter: null means "Auto (Closest/Highest Urgency Exam)"
  const [selectedExamId, setSelectedExamId] = useState<string | 'auto'>('auto');

  // Alternative recommendation index if the user wants the "Next Best Option"
  const [recommendationOffset, setRecommendationOffset] = useState<number>(0);

  // Default upcoming exams schedule
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([
    {
      id: 'exam-phys',
      subject: 'Physics',
      title: 'Physics Midterm Exam',
      daysRemaining: 4,
      dateStr: 'In 4 days (Sept 11)',
      weight: 40,
      highYieldTopics: ["Newton's Laws", 'Friction Inclines', 'Kinematics'],
    },
    {
      id: 'exam-math',
      subject: 'Mathematics',
      title: 'Math Semester Finals',
      daysRemaining: 8,
      dateStr: 'In 8 days (Sept 15)',
      weight: 50,
      highYieldTopics: ['Quadratic Factoring', 'Vertex Form', 'Discriminants'],
    },
    {
      id: 'exam-chem',
      subject: 'Chemistry',
      title: 'Chemistry Unit Test',
      daysRemaining: 14,
      dateStr: 'In 14 days (Sept 21)',
      weight: 25,
      highYieldTopics: ['Stoichiometry', 'Limiting Reactants', 'Redox'],
    },
    {
      id: 'exam-bio',
      subject: 'Biology',
      title: 'Biology Chapter Assessment',
      daysRemaining: 18,
      dateStr: 'In 18 days (Sept 25)',
      weight: 35,
      highYieldTopics: ['Cellular Respiration', 'ETC Chemiosmosis', 'ATP Synthase'],
    },
  ]);

  // Helper for matching subjects with Science category support
  const isSubjectMatch = (itemSubject: string, filter?: string) => {
    if (!filter || filter === 'all') return true;
    if (filter === 'Science') {
      return itemSubject === 'Science' || itemSubject === 'Physics' || itemSubject === 'Chemistry' || itemSubject === 'Biology';
    }
    return itemSubject === filter;
  };

  // If selectedSubject is set, filter upcoming exams
  const relevantExams = useMemo(() => {
    if (selectedSubject && selectedSubject !== 'all') {
      const filtered = upcomingExams.filter((e) => isSubjectMatch(e.subject, selectedSubject));
      return filtered.length > 0 ? filtered : upcomingExams;
    }
    return upcomingExams;
  }, [selectedSubject, upcomingExams]);

  // Identify targeted exam (either selected or closest)
  const activeExam = useMemo(() => {
    if (selectedExamId !== 'auto') {
      const found = relevantExams.find((e) => e.id === selectedExamId);
      if (found) return found;
    }
    // Sort by days remaining ascending
    return [...relevantExams].sort((a, b) => a.daysRemaining - b.daysRemaining)[0] || upcomingExams[0];
  }, [selectedExamId, relevantExams, upcomingExams]);

  // Analyze Weakness History & Cross-reference with Target Exam & Time
  const recommendation = useMemo(() => {
    const candidateWeaknesses =
      selectedSubject && selectedSubject !== 'all'
        ? weaknesses.filter((w) => isSubjectMatch(w.subject, selectedSubject))
        : weaknesses;

    const pool = candidateWeaknesses.length > 0 ? candidateWeaknesses : weaknesses;

    // Score each weakness by priority
    // Priority Score = (Exam Urgency Score) + (Confidence Severity) + (Mistake Frequency * 10) - (Score)
    const scoredWeaknesses = pool.map((w) => {
      const isExamSubject = w.subject === activeExam.subject;
      const urgencyBonus = isExamSubject ? 100 - activeExam.daysRemaining * 8 : 20;
      const confidenceBonus = w.confidence === 'Critical' ? 50 : w.confidence === 'Medium' ? 25 : 10;
      const mistakeBonus = (w.mistakeFrequency || 2) * 12;
      const scoreDeficit = (w.maxScore - w.score) * 5;

      const totalPriority = urgencyBonus + confidenceBonus + mistakeBonus + scoreDeficit;
      return {
        ...w,
        priorityScore: totalPriority,
        isExamSubject,
      };
    });

    // Sort by computed priority score descending
    scoredWeaknesses.sort((a, b) => b.priorityScore - a.priorityScore);

    // Pick based on offset (allowing user to see next best activity)
    const chosenIndex = recommendationOffset % (scoredWeaknesses.length || 1);
    const chosenWeakness = scoredWeaknesses[chosenIndex] || scoredWeaknesses[0] || {
      id: 'w-1',
      subject: 'Mathematics',
      chapter: 'Quadratic Equations',
      subtopic: 'Factoring Negative Coefficients',
      score: 4,
      maxScore: 10,
      weaknessLabel: 'Sign inversion when expanding -(ax + b)',
      rootCause: 'Consistently forgetting to distribute the minus sign to the second term inside parentheses.',
      confidence: 'Critical',
      recommendedPracticeMinutes: 15,
      mistakeFrequency: 4,
    };

    // Formulate the tailored single high-impact study activity based on availableMinutes
    let activityTitle = '';
    let activityType: 'weakness_drill' | 'feynman' | 'quiz' | 'boss_battle' | 'virtual_lab' = 'weakness_drill';
    let targetTab: NavTab = 'weakness';
    let activityBadge = '';
    let estimatedImpact = '';
    let timeBreakdown: { minutes: string; label: string }[] = [];
    let actionLabel = '';

    if (availableMinutes === 10) {
      activityTitle = `Targeted Rapid Drill: ${chosenWeakness.subtopic}`;
      activityType = 'weakness_drill';
      targetTab = 'weakness';
      activityBadge = '⚡ 10m Rapid Elimination';
      estimatedImpact = '+6% Exam Accuracy · Eliminates 1 Recurring Trap';
      timeBreakdown = [
        { minutes: '2m', label: 'Rule review & error diagnostic' },
        { minutes: '6m', label: '3 precision adaptive practice questions' },
        { minutes: '2m', label: 'Trap verification & key takeaways' },
      ];
      actionLabel = 'Start 10m Rapid Drill Now';
    } else if (availableMinutes === 15) {
      activityTitle = `Cognitive Patch: ${chosenWeakness.chapter} (${chosenWeakness.subtopic})`;
      activityType = 'weakness_drill';
      targetTab = 'weakness';
      activityBadge = '🎯 High-Yield Weakness Drill';
      estimatedImpact = '+12% Exam Readiness · Resolves Critical Deficit';
      timeBreakdown = [
        { minutes: '3m', label: 'Root cause breakdown & worked example' },
        { minutes: '9m', label: 'Guided step-by-step trap avoidance problems' },
        { minutes: '3m', label: 'Active recall check & confidence lock' },
      ];
      actionLabel = 'Start 15m High-Impact Drill Now';
    } else if (availableMinutes === 25) {
      activityTitle = `Feynman Verbalization & Drill: ${chosenWeakness.subtopic}`;
      activityType = 'feynman';
      targetTab = 'teachme';
      activityBadge = '🗣️ Deep Concept Mastery (Feynman)';
      estimatedImpact = '85% Long-Term Retention · Overcomes Passive Forgetting';
      timeBreakdown = [
        { minutes: '5m', label: 'Explain the concept aloud to the AI' },
        { minutes: '5m', label: 'AI reveals conceptual blind spots & analogy' },
        { minutes: '12m', label: 'Apply verified concept on exam problems' },
        { minutes: '3m', label: 'Summary flashcard creation' },
      ];
      actionLabel = 'Start 25m Feynman Masterclass';
    } else if (availableMinutes === 45) {
      activityTitle = `Exam Simulation & Boss Fight: ${chosenWeakness.subject} High-Yield Patterns`;
      activityType = 'boss_battle';
      targetTab = 'battles';
      activityBadge = '👾 Chapter Boss Encounter';
      estimatedImpact = '+18-22 Marks · Real-Time Exam Pressure Readiness';
      timeBreakdown = [
        { minutes: '10m', label: 'Review formula sheet & top 3 exam traps' },
        { minutes: '25m', label: 'High-stakes 10-round boss combat quiz' },
        { minutes: '10m', label: 'Post-battle autopsy of missed steps' },
      ];
      actionLabel = 'Defeat Chapter Boss (45m)';
    } else {
      // 60 minutes
      activityTitle = `Comprehensive High-Impact Mastery Loop: ${activeExam.subject}`;
      activityType = 'quiz';
      targetTab = 'quiz';
      activityBadge = '🏆 Full 60m Exam Prep Cycle';
      estimatedImpact = '+25% Exam Readiness · Comprehensive Knowledge Shield';
      timeBreakdown = [
        { minutes: '15m', label: 'Patch top 2 critical weaknesses' },
        { minutes: '30m', label: 'Timed mock exam simulation (12 questions)' },
        { minutes: '15m', label: 'AI step-by-step review & memory consolidation' },
      ];
      actionLabel = 'Launch 60m Exam Prep Cycle';
    }

    // Reason bullets analyzing the 3 core dimensions: Exam Date, Weakness History, Available Time
    const examUrgencyText = chosenWeakness.isExamSubject
      ? `${activeExam.title} is in ${activeExam.daysRemaining} days (${activeExam.weight}% of your final grade).`
      : `Preparation for upcoming ${chosenWeakness.subject} assessments while ${activeExam.title} is ${activeExam.daysRemaining} days away.`;

    const weaknessHistoryText = `${chosenWeakness.mistakeFrequency || 3} recorded errors in recent quizzes: "${chosenWeakness.weaknessLabel}" (${chosenWeakness.confidence} confidence rating).`;

    const timeFitText = `Optimized for your ${availableMinutes}-minute study window to ensure 100% completion without cognitive fatigue.`;

    return {
      chosenWeakness,
      activityTitle,
      activityType,
      targetTab,
      activityBadge,
      estimatedImpact,
      timeBreakdown,
      actionLabel,
      examUrgencyText,
      weaknessHistoryText,
      timeFitText,
      urgencyScore: Math.min(98, 70 + (14 - Math.min(14, activeExam.daysRemaining)) * 2),
      confidenceRating: chosenWeakness.confidence,
    };
  }, [weaknesses, activeExam, availableMinutes, recommendationOffset]);

  const handleLaunchActivity = () => {
    soundFX.playSuccess();
    triggerCelebration();

    if (onAddStudyMinutes) {
      // Award study minutes toward daily progress
      onAddStudyMinutes(Math.min(15, availableMinutes));
    }

    if (recommendation.activityType === 'weakness_drill' && recommendation.chosenWeakness?.id) {
      onOpenWeaknessDrill(recommendation.chosenWeakness.id);
    } else {
      onNavigate(recommendation.targetTab);
    }
  };

  return (
    <div
      id="what-should-i-study-now-card"
      className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-xl transition-all"
    >
      {/* Top Ambient Glow Gradient */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-indigo-500 to-cyan-400" />
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Title & Live Triage Status */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md shrink-0">
            <Zap className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                Cognitive Triage Engine
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Analysis Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              What Should I Study Now?
            </h2>
          </div>
        </div>

        {/* Next Best Recommendation Shuffler */}
        <button
          onClick={() => {
            soundFX.playPop();
            setRecommendationOffset((prev) => prev + 1);
          }}
          className="self-start md:self-auto text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer active:scale-95"
          title="See alternative recommended topic"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Next Priority Topic</span>
        </button>
      </div>

      {/* Control Bars: 3 Analytical Inputs (Exams, Weakness, Available Time) */}
      <div className="p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dimension 1: Target Upcoming Exam */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>1. Analyzed Exam Date:</span>
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-black">
                {activeExam.daysRemaining} Days Left
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {upcomingExams.map((exam) => {
                const isSelected = activeExam.id === exam.id;
                return (
                  <button
                    key={exam.id}
                    onClick={() => {
                      soundFX.playPop();
                      setSelectedExamId(exam.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{exam.subject}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                      }`}
                    >
                      {exam.daysRemaining}d
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension 2: Available Time Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Available Study Time:</span>
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-black">
                {availableMinutes} Minutes Window
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {([10, 15, 25, 45, 60] as const).map((m) => {
                const isActive = availableMinutes === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      soundFX.playPop();
                      setAvailableMinutes(m);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 dark:bg-amber-400 text-slate-950 font-black shadow-xs ring-2 ring-amber-400/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {m}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dimension 3 summary bar: Weakness History Match */}
        <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>
              <strong className="font-black">Weakness History Matched:</strong>{' '}
              <span className="underline decoration-rose-400/50">
                {recommendation.chosenWeakness.subtopic}
              </span>{' '}
              ({recommendation.chosenWeakness.mistakeFrequency || 4} past mistakes recorded · {recommendation.confidenceRating} risk)
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 font-extrabold text-[10px] uppercase self-start sm:self-auto shrink-0">
            Urgency Score: {recommendation.urgencyScore}/100
          </span>
        </div>
      </div>

      {/* Main Single High-Impact Recommendation Output */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Recommendation Header Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-cyan-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-cyan-950/20 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                {recommendation.activityBadge}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Subject: {recommendation.chosenWeakness.subject}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full self-start sm:self-auto">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{recommendation.estimatedImpact}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {recommendation.activityTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Target Chapter: <strong className="text-slate-900 dark:text-white">{recommendation.chosenWeakness.chapter}</strong>. Resolves the error: <span className="italic">"{recommendation.chosenWeakness.rootCause}"</span>
            </p>
          </div>

          {/* Why This Activity? 3-Pillar Proof Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-cyan-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Exam Proximity
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                {recommendation.examUrgencyText}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Weakness Pattern
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                {recommendation.weaknessHistoryText}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time Budget Fit
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                {recommendation.timeFitText}
              </p>
            </div>
          </div>

          {/* Micro-Schedule Step Sequence */}
          <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              Step-by-Step {availableMinutes}-Minute Execution Plan:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recommendation.timeBreakdown.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-[11px] shrink-0">
                    {step.minutes}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] leading-tight">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer with the Single High-Impact Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Award className="w-4 h-4 text-amber-500" />
            <span>
              Completing this session awards <strong className="text-slate-900 dark:text-white">+80 XP</strong> & updates your cognitive mastery index.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="start-high-impact-study-btn"
              onClick={handleLaunchActivity}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl ring-2 ring-amber-300/60 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{recommendation.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
