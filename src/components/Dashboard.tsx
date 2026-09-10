import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudentProfile, DailyMission, WeaknessItem, SyllabusChapter, Flashcard, SubjectType, StudyPlanSchedule } from '../types';
import { initialSchedule } from '../data/sampleData';
import {
  Flame,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Circle,
  Calendar,
  Zap,
  TrendingUp,
  BrainCircuit,
  Users,
  Trophy,
  Crown,
  Mic,
  FlaskConical,
  Swords,
  ShieldAlert,
  Target,
  Filter,
  Layers,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCheck,
  Play,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';
import { WhatToStudyNowModal } from './WhatToStudyNowModal';
import { StudyEmergencyModal } from './StudyEmergencyModal';
import { WhatShouldIStudyCard } from './WhatShouldIStudyCard';
import { SmartRecommendations } from './SmartRecommendations';
import { ExportReportModal, ReportType } from './ExportReportModal';

interface DashboardProps {
  profile: StudentProfile;
  dailyMission: DailyMission;
  weaknesses: WeaknessItem[];
  chapters: SyllabusChapter[];
  flashcards?: Flashcard[];
  schedule?: StudyPlanSchedule[];
  selectedSubject?: SubjectType | 'all';
  onSelectSubject?: (subject: SubjectType | 'all') => void;
  onNavigate: (tab: any) => void;
  onToggleMissionTask: (taskId: string) => void;
  onClaimMissionReward: () => void;
  onOpenWeaknessDrill: (weaknessId: string) => void;
  onOpenUpgrade?: () => void;
  onAddStudyMinutes?: (minutes: number) => void;
  onOpenLesson?: (subject: SubjectType, chapterTitle: string) => void;
  onOpenFlashcardDeck?: (subject: SubjectType, chapterTitle: string) => void;
  onToggleScheduleTask?: (scheduleId: string, taskId: string) => void;
  onAddXP?: (amount: number, reason?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  dailyMission,
  weaknesses,
  chapters,
  flashcards = [],
  schedule = initialSchedule,
  selectedSubject: propSelectedSubject,
  onSelectSubject,
  onNavigate,
  onToggleMissionTask,
  onClaimMissionReward,
  onOpenWeaknessDrill,
  onOpenUpgrade,
  onAddStudyMinutes,
  onOpenLesson,
  onOpenFlashcardDeck,
  onToggleScheduleTask,
  onAddXP,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Subject Deep-Dive filter state (sync with App/Analytics)
  const [internalSubject, setInternalSubject] = useState<SubjectType | 'all'>(
    propSelectedSubject !== undefined ? propSelectedSubject : 'all'
  );

  const selectedSubject = propSelectedSubject !== undefined ? propSelectedSubject : internalSubject;

  const setSelectedSubject = (sub: SubjectType | 'all') => {
    setInternalSubject(sub);
    onSelectSubject?.(sub);
  };
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  // Helper for matching subjects with Science category support
  const isSubjectMatch = (itemSubject: string, filterSubject?: SubjectType | 'all' | string): boolean => {
    if (!filterSubject || filterSubject === 'all') return true;
    if (filterSubject === 'Science') {
      return itemSubject === 'Science' || itemSubject === 'Physics' || itemSubject === 'Chemistry' || itemSubject === 'Biology';
    }
    return itemSubject === filterSubject;
  };

  // Reset flashcard preview index and flip state whenever subject changes
  useEffect(() => {
    setActiveFlashcardIndex(0);
    setIsFlashcardFlipped(false);
  }, [selectedSubject]);

  const completedMissionTasks = dailyMission.tasks.filter((t) => t.completed).length;
  const allMissionTasksDone = completedMissionTasks === dailyMission.tasks.length;
  const missionProgressPercent = Math.round((completedMissionTasks / dailyMission.tasks.length) * 100);

  const goalPercent = Math.min(100, Math.round((profile.todayStudyMinutes / profile.todayGoalMinutes) * 100));
  const isGoalCompleted = profile.todayStudyMinutes >= profile.todayGoalMinutes;

  // Track previous study minutes to automatically trigger celebration when goal threshold is crossed
  const prevMinutesRef = useRef(profile.todayStudyMinutes);
  const [justCelebrated, setJustCelebrated] = useState(false);
  const [isWhatToStudyOpen, setIsWhatToStudyOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [exportReportDefaultTab, setExportReportDefaultTab] = useState<ReportType>('mastery_progress');

  const handleOpenExportReport = (type: ReportType = 'mastery_progress') => {
    soundFX.playPop();
    setExportReportDefaultTab(type);
    setIsExportReportOpen(true);
  };

  useEffect(() => {
    const prevMinutes = prevMinutesRef.current;
    const currentMinutes = profile.todayStudyMinutes;
    const goal = profile.todayGoalMinutes;

    if (prevMinutes < goal && currentMinutes >= goal) {
      triggerCelebration();
      setJustCelebrated(true);
      const timer = setTimeout(() => setJustCelebrated(false), 5000);
      return () => clearTimeout(timer);
    }
    prevMinutesRef.current = currentMinutes;
  }, [profile.todayStudyMinutes, profile.todayGoalMinutes]);

  const upcomingExams = useMemo(
    () => [
      { id: 'e1', title: 'Physics Midterm: Dynamics & Fields', subject: 'Physics' as SubjectType, daysLeft: 4, urgency: 'high' as const },
      { id: 'e2', title: 'Calculus & Polynomial Functions', subject: 'Mathematics' as SubjectType, daysLeft: 9, urgency: 'medium' as const },
      { id: 'e3', title: 'Chemistry Lab: Redox & Stoichiometry', subject: 'Chemistry' as SubjectType, daysLeft: 14, urgency: 'normal' as const },
      { id: 'e4', title: 'Biology Assessment: Cellular Respiration', subject: 'Biology' as SubjectType, daysLeft: 18, urgency: 'medium' as const },
    ],
    []
  );

  // Filtered Flashcards
  const filteredFlashcards = useMemo(() => {
    if (selectedSubject === 'all') return flashcards;
    return flashcards.filter((f) => isSubjectMatch(f.subject, selectedSubject));
  }, [flashcards, selectedSubject]);

  // Filtered Weaknesses
  const filteredWeaknesses = useMemo(() => {
    if (selectedSubject === 'all') return weaknesses;
    return weaknesses.filter((w) => isSubjectMatch(w.subject, selectedSubject));
  }, [weaknesses, selectedSubject]);

  // Active Subject Weakness for Alert Card
  const activeSubjectWeakness = useMemo(() => {
    if (selectedSubject === 'all') return weaknesses[0] || null;
    return filteredWeaknesses[0] || null;
  }, [weaknesses, filteredWeaknesses, selectedSubject]);

  // Filtered Study Planner Tasks from schedule
  const activeSchedule: StudyPlanSchedule[] = schedule && schedule.length > 0 ? schedule : initialSchedule;
  const filteredScheduleTasks = useMemo(() => {
    if (selectedSubject === 'all') {
      return activeSchedule.flatMap((day) =>
        day.tasks.map((t) => ({ ...t, dayTitle: day.dayTitle, scheduleId: day.id }))
      );
    }
    return activeSchedule.flatMap((day) =>
      day.tasks
        .filter((t) => isSubjectMatch(t.subject, selectedSubject))
        .map((t) => ({ ...t, dayTitle: day.dayTitle, scheduleId: day.id }))
    );
  }, [activeSchedule, selectedSubject]);

  // Filtered Daily Mission tasks
  const filteredDailyMissionTasks = useMemo(() => {
    if (selectedSubject === 'all') return dailyMission.tasks;
    return dailyMission.tasks.filter((t) => isSubjectMatch(t.subject, selectedSubject));
  }, [dailyMission.tasks, selectedSubject]);

  // Filtered Upcoming Exams
  const filteredUpcomingExams = useMemo(() => {
    if (selectedSubject === 'all') return upcomingExams;
    return upcomingExams.filter((e) => isSubjectMatch(e.subject, selectedSubject));
  }, [upcomingExams, selectedSubject]);

  // Subject Stats for deep-dive toggle pills
  const subjectMetadata = useMemo(() => {
    const list: {
      subject: SubjectType;
      icon: string;
      percent: number;
      color: string;
      ringColor: string;
      accentBg: string;
      textDark: string;
    }[] = [
      { subject: 'Mathematics', icon: '📐', percent: 74, color: 'bg-indigo-600', ringColor: 'ring-indigo-400', accentBg: 'bg-indigo-50 dark:bg-indigo-950/40', textDark: 'text-indigo-600 dark:text-indigo-400' },
      { subject: 'Science', icon: '🔬', percent: 80, color: 'bg-emerald-600', ringColor: 'ring-emerald-400', accentBg: 'bg-emerald-50 dark:bg-emerald-950/40', textDark: 'text-emerald-600 dark:text-emerald-400' },
      { subject: 'Physics', icon: '⚡', percent: 68, color: 'bg-cyan-600', ringColor: 'ring-cyan-400', accentBg: 'bg-cyan-50 dark:bg-cyan-950/40', textDark: 'text-cyan-600 dark:text-cyan-400' },
      { subject: 'Chemistry', icon: '🧪', percent: 81, color: 'bg-teal-600', ringColor: 'ring-teal-400', accentBg: 'bg-teal-50 dark:bg-teal-950/40', textDark: 'text-teal-600 dark:text-teal-400' },
      { subject: 'Biology', icon: '🧬', percent: 92, color: 'bg-green-600', ringColor: 'ring-green-400', accentBg: 'bg-green-50 dark:bg-green-950/40', textDark: 'text-green-600 dark:text-green-400' },
    ];
    return list.map((s) => ({
      ...s,
      weaknessCount: weaknesses.filter((w) => isSubjectMatch(w.subject, s.subject)).length,
      flashcardCount: flashcards.filter((f) => isSubjectMatch(f.subject, s.subject)).length,
      plannerCount: activeSchedule.flatMap((d) => d.tasks).filter((t) => isSubjectMatch(t.subject, s.subject)).length,
    }));
  }, [weaknesses, flashcards, activeSchedule]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Goal Celebration Toast Banner */}
      {justCelebrated && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn border border-emerald-300/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0 shadow-inner">
              🎉
            </div>
            <div>
              <p className="font-black text-sm text-white flex items-center gap-2">
                Daily Study Goal Crushed!
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase font-bold tracking-wider">
                  Target Met
                </span>
              </p>
              <p className="text-xs text-emerald-100">
                You reached {profile.todayStudyMinutes}m of focused study today. Great job keeping your streak alive!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => triggerCelebration()}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 text-xs font-black shadow-sm hover:bg-emerald-50 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>More Confetti!</span>
          </button>
        </div>
      )}

      {/* Free Trial Banner */}
      {!profile.subscription?.isUpgraded && (
        <div className="p-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-cyan-500/15 border border-amber-300/80 dark:border-amber-500/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Pro Free Trial: {profile.subscription?.trialDaysLeft ?? 4} Days Remaining
                </p>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
                  40% Off Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Unlimited AI tutor questions, camera note OCR, and adaptive exam generation are unlocked.
              </p>
            </div>
          </div>

          {onOpenUpgrade && (
            <button
              onClick={onOpenUpgrade}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Upgrade from $99</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Hero Welcome Banner with Glassmorphism & AI Coach greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#312e81] to-[#0b1329] text-white p-6 sm:p-8 shadow-xl border border-blue-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-56 h-56 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 backdrop-blur-md border border-blue-400/30 text-xs font-semibold text-cyan-200">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>AI Study Coach Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {getGreeting()}, {profile.name}! 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your AI Coach recommends targeting <span className="text-cyan-300 font-semibold underline decoration-cyan-400/50">Quadratic Equations (sign distribution)</span> for 15 minutes today to solidify your algebra foundation before Friday’s test.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <button
              id="dash-what-to-study-btn"
              onClick={() => {
                soundFX.playPop();
                const el = document.getElementById('what-should-i-study-now-card');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-4', 'ring-amber-400');
                  setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 2500);
                } else {
                  setIsWhatToStudyOpen(true);
                }
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl ring-2 ring-amber-300/50 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>⚡ WHAT SHOULD I STUDY NOW?</span>
            </button>

            <button
              id="dash-emergency-btn"
              onClick={() => {
                soundFX.playPop();
                setIsEmergencyOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Study Emergency Mode 🏥</span>
            </button>

            <button
              id="dash-coach-quick-btn"
              onClick={() => onNavigate('coach')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Ask AI Coach</span>
            </button>

            <button
              id="dash-export-pdf-hero-btn"
              onClick={() => handleOpenExportReport('mastery_progress')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 backdrop-blur-md border border-blue-300/40 text-white font-extrabold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
              title="Print or export student learning progress, subject mastery, and syllabus reports as high-contrast PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-200" />
              <span>Print to PDF 🖨️</span>
            </button>
          </div>
        </div>

        {/* Killer Competition Features Quick Bar */}
        <div className="relative z-10 pt-4 mt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('aivideo')}
            className="p-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-left transition flex items-center gap-3 cursor-pointer group shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-base group-hover:scale-110 transition">
              🎬
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-indigo-300 transition flex items-center gap-1">
                <span>AI Video Studio</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500 text-white font-bold">New</span>
              </p>
              <p className="text-[11px] text-slate-300">Animated blackboard & simulations</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('teachme')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left transition flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-base group-hover:scale-110 transition">
              🗣️
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-emerald-300 transition">Teach Me Back</p>
              <p className="text-[11px] text-slate-300">Feynman technique AI checks</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('virtuallab')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left transition flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-base group-hover:scale-110 transition">
              🧪
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-cyan-300 transition">Virtual Science Lab</p>
              <p className="text-[11px] text-slate-300">Interactive Ohm's Law & physics</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('battles')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left transition flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center text-base group-hover:scale-110 transition">
              👾
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-rose-300 transition">Boss Battles</p>
              <p className="text-[11px] text-slate-300">High-stakes chapter boss quiz</p>
            </div>
          </button>
        </div>
      </div>

      {/* Top Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Study Streak</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5">
              <span>{profile.streakDays}</span>
              <span className="text-xs font-semibold text-amber-500">Days Fire!</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Don't break the chain today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Today's Study Goal */}
        <div
          className={`p-4 rounded-2xl transition-all duration-500 shadow-xs flex flex-col justify-between ${
            isGoalCompleted
              ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border-2 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Today's Study Goal</p>
              {isGoalCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                  Completed!
                </span>
              )}
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isGoalCompleted
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-500'
              }`}
            >
              {isGoalCompleted ? <Trophy className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline">
                {profile.todayStudyMinutes}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                  / {profile.todayGoalMinutes}m
                </span>
              </span>
              <span
                className={`text-xs font-black ${
                  isGoalCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {goalPercent}%
              </span>
            </div>

            {/* Celebratory Animated Progress Bar */}
            <div
              className={`w-full rounded-full h-3 overflow-hidden transition-all duration-500 p-0.5 ${
                isGoalCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-1 ring-emerald-400/50'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                  isGoalCompleted
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-md shadow-emerald-500/40'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-500'
                }`}
                style={{ width: `${goalPercent}%` }}
              >
                {/* Shimmer light sweep animation across completed bar */}
                {isGoalCompleted && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer pointer-events-none" />
                )}
              </div>
            </div>

            {/* Quick Actions & Celebration Controls */}
            <div className="mt-2.5 flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              {isGoalCompleted ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      triggerCelebration();
                      setJustCelebrated(true);
                      setTimeout(() => setJustCelebrated(false), 3000);
                    }}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Celebrate 🎉</span>
                  </button>

                  {onAddStudyMinutes && (
                    <button
                      type="button"
                      onClick={() => onAddStudyMinutes(15)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer"
                    >
                      +15m extra
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {profile.todayGoalMinutes - profile.todayStudyMinutes}m remaining
                  </span>
                  {onAddStudyMinutes && (
                    <button
                      type="button"
                      onClick={() => onAddStudyMinutes(15)}
                      className="text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+15m Focus</span>
                      <Zap className="w-3 h-3 fill-current" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('pomodoro-timer-widget');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-4', 'ring-indigo-400');
                        setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-400'), 2500);
                      }
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer"
                    title="Jump to Pomodoro Timer"
                  >
                    Timer ⏱️
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overall Mastery */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Mastery</p>
            <button
              type="button"
              onClick={() => handleOpenExportReport('mastery_progress')}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              title="Print student mastery report"
            >
              <Printer className="w-3 h-3" />
              <span>Print PDF</span>
            </button>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {profile.overallMastery}%
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+4% this week</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${profile.overallMastery}%` }}
              />
            </div>
          </div>
        </div>

        {/* Level & XP */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Gamer Rank</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">Level {profile.level}</p>
            <p className="text-[11px] text-slate-500 mt-1">{profile.xpToNextLevel - profile.xp} XP to Level {profile.level + 1}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Subject Deep-Dive Toggle & Scope Controller */}
      <div id="subject-deep-dive-bar" className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all duration-300">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Header Info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 transition-colors shadow-sm ${
                selectedSubject === 'all'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : selectedSubject === 'Mathematics'
                  ? 'bg-indigo-600 text-white shadow-indigo-500/25'
                  : selectedSubject === 'Science'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                  : selectedSubject === 'Physics'
                  ? 'bg-cyan-600 text-white shadow-cyan-500/25'
                  : selectedSubject === 'Chemistry'
                  ? 'bg-teal-600 text-white shadow-teal-500/25'
                  : 'bg-green-600 text-white shadow-green-500/25'
              }`}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Subject Deep-Dive</span>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full transition-colors ${
                      selectedSubject === 'all'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300/50'
                    }`}
                  >
                    {selectedSubject === 'all'
                      ? 'All Subjects View'
                      : selectedSubject === 'Science'
                      ? 'Science (All Sciences) Focus'
                      : `${selectedSubject} Focus`}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Filter your <strong>Study Planner</strong>, <strong>Flashcards</strong>, and <strong>Weak Points</strong> for targeted single-subject mastery.
              </p>
            </div>
          </div>

          {/* Filter Dropdown & Quick Selection Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="dashboard-subject-filter-dropdown"
                className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shrink-0"
              >
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                <span>Filter:</span>
              </label>
              <div className="relative">
                <select
                  id="dashboard-subject-filter-dropdown"
                  name="dashboard-subject-filter-dropdown"
                  aria-label="Filter by subject"
                  value={selectedSubject}
                  onChange={(e) => {
                    soundFX.playPop();
                    setSelectedSubject(e.target.value as SubjectType | 'all');
                  }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer transition min-w-[170px]"
                >
                  <option value="all">🌐 All Subjects</option>
                  <option value="Mathematics">📐 Mathematics</option>
                  <option value="Science">🔬 Science (All Sciences)</option>
                  <option value="Physics">⚡ Physics</option>
                  <option value="Chemistry">🧪 Chemistry</option>
                  <option value="Biology">🧬 Biology</option>
                  <option value="Computer Science">💻 Computer Science</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 dark:text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Subject Filter Quick-Pills */}
            <div className="flex items-center flex-wrap gap-1.5">
              {/* All Subjects Reset */}
              <button
                type="button"
                id="deep-dive-pill-all"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedSubject('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSubject === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>All</span>
              </button>

              {/* Subject-specific Pills */}
              {subjectMetadata.map((sub) => {
                const isActive = selectedSubject === sub.subject;
                return (
                  <button
                    key={sub.subject}
                    type="button"
                    id={`deep-dive-pill-${sub.subject.toLowerCase()}`}
                    onClick={() => {
                      soundFX.playPop();
                      setSelectedSubject(isActive ? 'all' : sub.subject);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? `${sub.color} text-white shadow-xs ring-2 ${sub.ringColor}`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={`Filter by ${sub.subject}`}
                  >
                    <span>
                      {sub.icon} {sub.subject}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sub.percent}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Deep-Dive Scope Summary Banner */}
        {selectedSubject !== 'all' && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Filtered Scope:
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Schedule: {filteredScheduleTasks.length} {filteredScheduleTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Flashcards: {filteredFlashcards.length} {filteredFlashcards.length === 1 ? 'card' : 'cards'}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Weaknesses: {filteredWeaknesses.length} {filteredWeaknesses.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                type="button"
                id="export-filtered-scope-pdf-btn"
                onClick={() => handleOpenExportReport('mastery_progress')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title={`Export printable ${selectedSubject} progress & mastery report for offline review`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print {selectedSubject} PDF</span>
              </button>

              <button
                type="button"
                id="reset-subject-filter-btn"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedSubject('all');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
              >
                Reset to All Subjects
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 'What Should I Study Now?' Cognitive Triage Module */}
      <WhatShouldIStudyCard
        weaknesses={weaknesses}
        chapters={chapters}
        onNavigate={onNavigate}
        onOpenWeaknessDrill={onOpenWeaknessDrill}
        onAddStudyMinutes={onAddStudyMinutes}
        selectedSubject={selectedSubject}
      />

      {/* Smart Recommendations Section */}
      <SmartRecommendations
        weaknesses={weaknesses}
        chapters={chapters}
        flashcards={flashcards}
        onNavigate={onNavigate}
        onOpenLesson={onOpenLesson}
        onOpenFlashcardDeck={onOpenFlashcardDeck}
        onOpenWeaknessDrill={onOpenWeaknessDrill}
        selectedSubject={selectedSubject}
      />

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSubject !== 'all' ? (
            /* ================= SUBJECT DEEP-DIVE DEDICATED VIEW ================= */
            <>
              {/* 1. Filtered Study Planner & Scheduled Blocks */}
              <div id="deep-dive-planner-section" className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedSubject} Study Planner</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {filteredScheduleTasks.length} Blocks
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Scheduled study sessions & active revision tasks</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                      type="button"
                      id="export-planner-schedule-pdf-btn"
                      onClick={() => handleOpenExportReport('schedule')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Export Study Schedule as Printable PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Schedule PDF</span>
                    </button>

                    <button
                      onClick={() => onNavigate('planner')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Adaptive Planner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filtered Daily Mission Tasks for this subject */}
                {filteredDailyMissionTasks.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2">
                      Today's Daily Quest • {selectedSubject} Tasks
                    </p>
                    <div className="space-y-2">
                      {filteredDailyMissionTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => {
                            onToggleMissionTask(task.id);
                            soundFX.playSuccess();
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-800/40 cursor-pointer transition hover:border-indigo-400"
                        >
                          <div className="flex items-center gap-2.5">
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <span className={`text-xs font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {task.durationMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Tasks for this Subject */}
                {filteredScheduleTasks.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredScheduleTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                          task.completed
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (onToggleScheduleTask) {
                                onToggleScheduleTask(task.scheduleId, task.id);
                                soundFX.playSuccess();
                              }
                            }}
                            className="cursor-pointer text-slate-400 hover:text-emerald-600 transition"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                          <div>
                            <p className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{task.dayTitle}</span>
                              <span>•</span>
                              <span>{task.durationMinutes} minutes</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              task.priority === 'high'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                    No scheduled planner blocks for {selectedSubject} this week.
                  </div>
                )}
              </div>

              {/* 2. Filtered Flashcards & Active Recall Deck */}
              <div id="deep-dive-flashcards-section" className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedSubject} Flashcards Deck</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {filteredFlashcards.length} Cards
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Active Recall & Spaced Repetition memory cues</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenFlashcardDeck) {
                        onOpenFlashcardDeck(selectedSubject, '');
                      } else {
                        onNavigate('memory');
                      }
                    }}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>Open Memory Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Interactive Flashcard Preview */}
                {filteredFlashcards.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const currentCard = filteredFlashcards[activeFlashcardIndex] || filteredFlashcards[0];
                      return (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-slate-50 to-orange-50/40 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/60 border border-amber-200/60 dark:border-slate-700/60 transition-all">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                            <span className="font-extrabold text-amber-700 dark:text-amber-400">
                              {currentCard.chapter} • Card {activeFlashcardIndex + 1} of {filteredFlashcards.length}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Ease {currentCard.easeFactor} • Interval {currentCard.intervalDays}d
                            </span>
                          </div>

                          <div
                            onClick={() => {
                              soundFX.playPop();
                              setIsFlashcardFlipped(!isFlashcardFlipped);
                            }}
                            className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[140px] flex flex-col justify-center cursor-pointer shadow-xs hover:border-amber-300 transition"
                          >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                              <RotateCw className="w-3 h-3" />
                              {isFlashcardFlipped ? 'Answer & Core Takeaway' : 'Recall Prompt (Click to Flip)'}
                            </span>

                            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                              {isFlashcardFlipped ? currentCard.back : currentCard.front}
                            </p>
                          </div>

                          {/* Card Navigation */}
                          <div className="flex items-center justify-between mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playPop();
                                setIsFlashcardFlipped(false);
                                setActiveFlashcardIndex((prev) => (prev > 0 ? prev - 1 : filteredFlashcards.length - 1));
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Prev</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playPop();
                                setIsFlashcardFlipped(!isFlashcardFlipped);
                              }}
                              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>{isFlashcardFlipped ? 'Show Front' : 'Flip Card'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playPop();
                                setIsFlashcardFlipped(false);
                                setActiveFlashcardIndex((prev) => (prev + 1 < filteredFlashcards.length ? prev + 1 : 0));
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                    No flashcards created yet for {selectedSubject}. Snap a diagram or create flashcards in Memory Lab!
                  </div>
                )}
              </div>

              {/* 3. Filtered Weak Points Diagnostics */}
              <div id="deep-dive-weakness-section" className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedSubject} Weak Points Diagnostics</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {filteredWeaknesses.length} Root Causes
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">AI-detected conceptual misconceptions and targeted remediation</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                      type="button"
                      id="export-weakness-section-pdf-btn"
                      onClick={() => handleOpenExportReport('weaknesses')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Export Weaknesses Audit as Printable PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Weaknesses PDF</span>
                    </button>

                    <button
                      onClick={() => onNavigate('weakness')}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Weaknesses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {filteredWeaknesses.length > 0 ? (
                  <div className="space-y-3">
                    {filteredWeaknesses.map((w) => (
                      <div
                        key={w.id}
                        className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {w.chapter} • {w.subtopic}
                            </span>
                            <span className="block text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                              {w.weaknessLabel}
                            </span>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                            Score: {w.score}/{w.maxScore}
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 text-xs text-slate-600 dark:text-slate-300">
                          <p>
                            <strong>Root Cause:</strong> {w.rootCause}
                          </p>
                          {w.exampleMistake && (
                            <p className="mt-1 text-slate-500 text-[11px]">
                              <em>Example trap:</em> "{w.exampleMistake}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">
                            Mistake frequency: {w.mistakeFrequency}x in quizzes
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenWeaknessDrill(w.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                          >
                            <span>Targeted Practice ({w.recommendedPracticeMinutes || 10}m)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-center space-y-1">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      🎉 Zero Weak Points in {selectedSubject}!
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      All tested topics are above 85% mastery. Keep up periodic spaced repetition to maintain retention!
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ================= OVERVIEW DEFAULT VIEW (ALL SUBJECTS) ================= */
            <>
              {/* AI-Generated Daily Mission */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Daily AI Quest
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                        +{dailyMission.xpReward} XP Reward
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {dailyMission.title}
                    </h2>
                  </div>

                  {dailyMission.completed ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Mission Complete!
                    </span>
                  ) : allMissionTasksDone ? (
                    <button
                      id="claim-mission-xp-btn"
                      onClick={() => {
                        onClaimMissionReward();
                        triggerCelebration();
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 animate-bounce active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Claim +{dailyMission.xpReward} XP!
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {completedMissionTasks} of {dailyMission.tasks.length} tasks finished
                    </span>
                  )}
                </div>

                {/* Mission Task List */}
                <div className="mt-4 space-y-3">
                  {dailyMission.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        onToggleMissionTask(task.id);
                        soundFX.playSuccess();
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        task.completed
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-indigo-600 focus:outline-none"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                        <div>
                          <p
                            className={`text-sm font-semibold transition ${
                              task.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {task.subject} • {task.durationMinutes} minutes
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          task.type === 'practice'
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : task.type === 'flashcards'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300'
                        }`}
                      >
                        {task.type.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject-Wise Progress with Deep-Dive Shortcuts */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subject Mastery</h2>
                    <p className="text-xs text-slate-500">Click any subject to launch Subject Deep-Dive</p>
                  </div>
                  <button
                    onClick={() => onNavigate('map')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Learning Map →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {subjectMetadata.map((sub) => (
                    <div
                      key={sub.subject}
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedSubject(sub.subject);
                        const el = document.getElementById('subject-deep-dive-bar');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{sub.icon}</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition">
                            {sub.subject}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{sub.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
                        <div className={`${sub.color} h-full rounded-full`} style={{ width: `${sub.percent}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                          🎯 Deep-Dive Focus →
                        </span>
                        {sub.weaknessCount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">{sub.weaknessCount} weak spot</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">On Track</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right 1 Column: Weakness Alerts & Upcoming Exams */}
        <div className="space-y-6">
          {/* AI Weakness Alert Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>{selectedSubject !== 'all' ? `${selectedSubject} Weakness Alert` : 'AI Weakness Alert'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="print-weakness-alert-pdf-btn"
                  onClick={() => handleOpenExportReport('weaknesses')}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Export Weaknesses as PDF Report"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print PDF</span>
                </button>
                {selectedSubject !== 'all' && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Filtered
                  </span>
                )}
              </div>
            </div>

            {activeSubjectWeakness ? (
              <>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {activeSubjectWeakness.chapter} • {activeSubjectWeakness.subtopic}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Weakness: <span className="font-semibold text-rose-600 dark:text-rose-400">{activeSubjectWeakness.weaknessLabel}</span>. Score in last quiz was {activeSubjectWeakness.score}/{activeSubjectWeakness.maxScore}.
                </p>

                <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-rose-100 dark:border-rose-900/30 text-[11px] text-slate-600 dark:text-slate-300">
                  💡 <strong>Root Cause:</strong> {activeSubjectWeakness.rootCause}
                </div>

                <button
                  id="fix-weakness-hero-btn"
                  onClick={() => onOpenWeaknessDrill(activeSubjectWeakness.id)}
                  className="mt-3 w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Practice Targeted Questions ({activeSubjectWeakness.recommendedPracticeMinutes || 10}m)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="py-3 text-center space-y-1">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ✨ No Active Weaknesses in {selectedSubject}!
                </p>
                <p className="text-xs text-slate-500">
                  Performance is strong across all tested topics in this subject.
                </p>
              </div>
            )}
          </div>

          {/* Upcoming Exams Countdown (Filtered for selectedSubject) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{selectedSubject !== 'all' ? `${selectedSubject} Exams` : 'Upcoming Exams'}</span>
              </h3>
              <button
                onClick={() => onNavigate('planner')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Plan Study →
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredUpcomingExams.length > 0 ? (
                filteredUpcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{exam.title}</p>
                      <p className="text-[11px] text-slate-500">{exam.subject}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 ${
                        exam.urgency === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/40'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {exam.daysLeft}d left
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">
                  No upcoming exams scheduled for {selectedSubject}.
                </p>
              )}
            </div>
          </div>

          {/* Smart Recommendations Quick Jump */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">3 Smart Interventions</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Targeted Lessons & Flashcards</p>
              </div>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('smart-recommendations-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  el.classList.add('ring-4', 'ring-indigo-400');
                  setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-400'), 2500);
                }
              }}
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Study Circles & Community Sprints */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-cyan-50/70 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Trending Study Circles</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                2.5k Live
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Join peer co-working rooms, chat with subject study groups, and compete in public learning challenges for leaderboard points.
            </p>
            <button
              onClick={() => onNavigate('circles')}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Explore Circles & Challenges</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* What To Study Now AI Reasoning Modal */}
      <WhatToStudyNowModal
        isOpen={isWhatToStudyOpen}
        onClose={() => setIsWhatToStudyOpen(false)}
        profile={profile}
        weaknesses={weaknesses}
        dueCardsCount={3}
        onNavigate={(tab) => {
          setIsWhatToStudyOpen(false);
          onNavigate(tab);
        }}
        onStartWeaknessDrill={(id) => {
          setIsWhatToStudyOpen(false);
          onOpenWeaknessDrill(id);
        }}
      />

      {/* Study Emergency Mode Modal */}
      <StudyEmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onNavigateToTab={(tab) => {
          setIsEmergencyOpen(false);
          onNavigate(tab);
        }}
      />

      {/* Export Printable PDF Report Modal */}
      <ExportReportModal
        isOpen={isExportReportOpen}
        onClose={() => setIsExportReportOpen(false)}
        profile={profile}
        schedule={activeSchedule}
        weaknesses={weaknesses}
        chapters={chapters}
        dailyMission={dailyMission}
        defaultTab={exportReportDefaultTab}
        initialSubject={selectedSubject}
      />
    </div>
  );
};
