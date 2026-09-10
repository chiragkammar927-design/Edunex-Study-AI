import React, { useState } from 'react';
import { StudentProfile, WeaknessItem, SyllabusChapter, SubjectType, Flashcard, StudyPlanSchedule } from '../types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Zap,
  Calendar,
  Flame,
  Filter,
  ArrowRight,
  BookOpen,
  Layers,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { soundFX } from '../utils/soundOrConfetti';

export interface AnalyticsProps {
  profile: StudentProfile;
  weaknesses: WeaknessItem[];
  chapters: SyllabusChapter[];
  selectedSubject?: SubjectType | 'all';
  onSelectSubject?: (subject: SubjectType | 'all') => void;
  flashcards?: Flashcard[];
  schedule?: StudyPlanSchedule[];
  onNavigate?: (tab: any) => void;
}

interface SubjectSummary {
  subject: SubjectType;
  displayName: string;
  icon: string;
  totalHours: number;
  targetHours: number;
  averageMastery: number;
  averageAccuracy: number;
  masteredCount: number;
  proficientCount: number;
  developingCount: number;
  weakCount: number;
  totalChapters: number;
  weaknessCount: number;
  cardCount: number;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  profile,
  weaknesses,
  chapters,
  selectedSubject: propSelectedSubject = 'all',
  onSelectSubject,
  flashcards = [],
  schedule = [],
  onNavigate,
}) => {
  // Sync subject filter state
  const [internalSubject, setInternalSubject] = useState<SubjectType | 'all'>(propSelectedSubject);
  const activeSubject = propSelectedSubject !== undefined ? propSelectedSubject : internalSubject;

  const handleSubjectChange = (newSub: SubjectType | 'all') => {
    soundFX.playPop();
    setInternalSubject(newSub);
    onSelectSubject?.(newSub);
  };

  // Helper to match subject filter (with Science umbrella)
  const isSubjectMatch = (itemSubject: string, filterSub?: SubjectType | 'all' | string): boolean => {
    if (!filterSub || filterSub === 'all') return true;
    if (filterSub === 'Science') {
      return itemSubject === 'Science' || itemSubject === 'Physics' || itemSubject === 'Chemistry' || itemSubject === 'Biology';
    }
    return itemSubject === filterSub;
  };

  // Filtered dataset slices
  const filteredChapters = chapters.filter((c) => isSubjectMatch(c.subject, activeSubject));
  const filteredWeaknesses = weaknesses.filter((w) => isSubjectMatch(w.subject, activeSubject));
  const filteredCards = flashcards.filter((f) => isSubjectMatch(f.subject, activeSubject));

  // Subject options for filter controls
  const subjectFilterOptions: { value: SubjectType | 'all'; label: string; badgeColor: string }[] = [
    { value: 'all', label: 'All Subjects', badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
    { value: 'Mathematics', label: 'Mathematics', badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' },
    { value: 'Science', label: 'Science (All)', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
    { value: 'Physics', label: 'Physics', badgeColor: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300' },
    { value: 'Chemistry', label: 'Chemistry', badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
    { value: 'Biology', label: 'Biology', badgeColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
    { value: 'Computer Science', label: 'Computer Science', badgeColor: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300' },
  ];

  // Base Subject Statistics definitions (enriched with chapters and live data)
  const coreSubjects: SubjectType[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

  const subjectSummaries: SubjectSummary[] = coreSubjects.map((sub) => {
    const subChapters = chapters.filter((c) => c.subject === sub);
    const subWeaknesses = weaknesses.filter((w) => w.subject === sub);
    const subCards = flashcards.filter((f) => f.subject === sub);

    const totalHours = subChapters.reduce((acc, c) => acc + (c.studyHours || (c.masteryPercentage > 80 ? 5.5 : 4.0)), 0);
    const targetHours = subChapters.reduce((acc, c) => acc + (c.targetStudyHours || 7.0), 0);

    const avgMastery = subChapters.length > 0
      ? Math.round(subChapters.reduce((acc, c) => acc + c.masteryPercentage, 0) / subChapters.length)
      : sub === 'Mathematics' ? 74 : sub === 'Physics' ? 68 : sub === 'Chemistry' ? 82 : sub === 'Biology' ? 91 : 88;

    const avgAccuracy = subChapters.length > 0
      ? Math.round(subChapters.reduce((acc, c) => acc + (c.quizAccuracy || c.masteryPercentage), 0) / subChapters.length)
      : avgMastery;

    const mastered = subChapters.filter((c) => c.masteryPercentage >= 85).length;
    const proficient = subChapters.filter((c) => c.masteryPercentage >= 70 && c.masteryPercentage < 85).length;
    const developing = subChapters.filter((c) => c.masteryPercentage >= 50 && c.masteryPercentage < 70).length;
    const weak = subChapters.filter((c) => c.masteryPercentage < 50).length;

    let icon = '📐';
    if (sub === 'Physics') icon = '⚡';
    if (sub === 'Chemistry') icon = '🧪';
    if (sub === 'Biology') icon = '🧬';
    if (sub === 'Computer Science') icon = '💻';

    return {
      subject: sub,
      displayName: sub,
      icon,
      totalHours: Number(totalHours.toFixed(1)),
      targetHours: Number(targetHours.toFixed(1)),
      averageMastery: avgMastery,
      averageAccuracy: avgAccuracy,
      masteredCount: mastered,
      proficientCount: proficient,
      developingCount: developing,
      weakCount: weak,
      totalChapters: subChapters.length,
      weaknessCount: subWeaknesses.length,
      cardCount: subCards.length,
    };
  });

  // Aggregated data for active selection
  const totalSubjectStudyHours = Number(
    filteredChapters.reduce((acc, c) => acc + (c.studyHours || (c.masteryPercentage > 80 ? 5.5 : 4.0)), 0).toFixed(1)
  );

  const totalSubjectTargetHours = Number(
    filteredChapters.reduce((acc, c) => acc + (c.targetStudyHours || 7.0), 0).toFixed(1)
  );

  const activeAverageMastery = filteredChapters.length > 0
    ? Math.round(filteredChapters.reduce((acc, c) => acc + c.masteryPercentage, 0) / filteredChapters.length)
    : 78;

  const activeMasteredCount = filteredChapters.filter((c) => c.masteryPercentage >= 85).length;
  const activeProficientCount = filteredChapters.filter((c) => c.masteryPercentage >= 70 && c.masteryPercentage < 85).length;
  const activeDevelopingCount = filteredChapters.filter((c) => c.masteryPercentage >= 50 && c.masteryPercentage < 70).length;
  const activeWeakCount = filteredChapters.filter((c) => c.masteryPercentage < 50).length;

  // Study hours breakdown by activity modality for selected subject
  const modalityBreakdown = [
    {
      modality: 'Problem Solving & Quizzes',
      hours: Number((totalSubjectStudyHours * 0.42).toFixed(1)),
      percentage: 42,
      color: 'from-indigo-500 to-cyan-500',
    },
    {
      modality: 'Active Recall Flashcards',
      hours: Number((totalSubjectStudyHours * 0.26).toFixed(1)),
      percentage: 26,
      color: 'from-amber-500 to-orange-500',
    },
    {
      modality: 'AI Coach & Concept Deep-Dives',
      hours: Number((totalSubjectStudyHours * 0.18).toFixed(1)),
      percentage: 18,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      modality: 'Theory & Worked Examples',
      hours: Number((totalSubjectStudyHours * 0.14).toFixed(1)),
      percentage: 14,
      color: 'from-violet-500 to-purple-500',
    },
  ];

  // Past 7 days data dynamically adjusted for selected subject
  const dailyGoalMinutes = profile.todayGoalMinutes || 60;
  const subjectWeight = activeSubject === 'all' ? 1.0 : activeSubject === 'Science' ? 0.65 : 0.35;

  const past7DaysData = [
    {
      day: 'Wed',
      date: 'Sep 2',
      totalMinutes: 55,
      subjectMinutes: Math.round(55 * subjectWeight),
      masteryPercentage: Math.min(100, Math.round(activeAverageMastery * 0.94)),
      quizCount: 3,
      goal: dailyGoalMinutes,
    },
    {
      day: 'Thu',
      date: 'Sep 3',
      totalMinutes: 70,
      subjectMinutes: Math.round(70 * subjectWeight),
      masteryPercentage: Math.min(100, Math.round(activeAverageMastery * 0.97)),
      quizCount: 4,
      goal: dailyGoalMinutes,
    },
    {
      day: 'Fri',
      date: 'Sep 4',
      totalMinutes: 65,
      subjectMinutes: Math.round(65 * subjectWeight),
      masteryPercentage: Math.min(100, Math.round(activeAverageMastery * 0.96)),
      quizCount: 3,
      goal: dailyGoalMinutes,
    },
    {
      day: 'Sat',
      date: 'Sep 5',
      totalMinutes: 90,
      subjectMinutes: Math.round(90 * subjectWeight),
      masteryPercentage: Math.min(100, Math.round(activeAverageMastery * 1.02)),
      quizCount: 5,
      goal: dailyGoalMinutes,
    },
    {
      day: 'Sun',
      date: 'Sep 6',
      totalMinutes: 60,
      subjectMinutes: Math.round(60 * subjectWeight),
      masteryPercentage: Math.min(100, Math.round(activeAverageMastery * 0.99)),
      quizCount: 3,
      goal: dailyGoalMinutes,
    },
    {
      day: 'Mon',
      date: 'Sep 7',
      totalMinutes: 50,
      subjectMinutes: Math.round(50 * subjectWeight),
      masteryPercentage: Math.min(100, Math.round(activeAverageMastery * 0.98)),
      quizCount: 2,
      goal: dailyGoalMinutes,
    },
    {
      day: 'Today',
      date: 'Sep 8',
      totalMinutes: Math.max(profile.todayStudyMinutes, 45),
      subjectMinutes: Math.round(Math.max(profile.todayStudyMinutes, 45) * subjectWeight),
      masteryPercentage: activeAverageMastery,
      quizCount: 4,
      goal: dailyGoalMinutes,
    },
  ];

  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [chartTimeScale, setChartTimeScale] = useState<'minutes' | 'hours'>('minutes');

  // Grouped Comparison Chart data:
  // When 'all': plot each subject's mastery % and study minutes / hours.
  // When specific subject: plot each chapter's mastery % and study minutes / hours.
  const comparisonChartData = activeSubject === 'all'
    ? subjectSummaries.map((s) => {
        const studyMinutes = Math.round(s.totalHours * 60);
        const targetMinutes = Math.round(s.targetHours * 60);
        return {
          name: s.displayName,
          fullName: `${s.displayName} Core Curriculum`,
          subject: s.subject,
          mastery: s.averageMastery,
          studyHours: s.totalHours,
          studyMinutes,
          studyDisplayValue: chartTimeScale === 'minutes' ? studyMinutes : s.totalHours,
          targetHours: s.targetHours,
          targetMinutes,
          accuracy: s.averageAccuracy,
          chaptersCount: s.totalChapters,
          type: 'subject' as const,
        };
      })
    : activeSubject === 'Science'
    ? subjectSummaries
        .filter((s) => s.subject === 'Physics' || s.subject === 'Chemistry' || s.subject === 'Biology')
        .map((s) => {
          const studyMinutes = Math.round(s.totalHours * 60);
          const targetMinutes = Math.round(s.targetHours * 60);
          return {
            name: s.displayName,
            fullName: `${s.displayName} (Science Module)`,
            subject: s.subject,
            mastery: s.averageMastery,
            studyHours: s.totalHours,
            studyMinutes,
            studyDisplayValue: chartTimeScale === 'minutes' ? studyMinutes : s.totalHours,
            targetHours: s.targetHours,
            targetMinutes,
            accuracy: s.averageAccuracy,
            chaptersCount: s.totalChapters,
            type: 'subject' as const,
          };
        })
    : filteredChapters.map((c) => {
        const hours = c.studyHours || (c.masteryPercentage > 80 ? 5.5 : 4.0);
        const studyMinutes = Math.round(hours * 60);
        const targetHours = c.targetStudyHours || 7.0;
        const targetMinutes = Math.round(targetHours * 60);
        return {
          name: c.title.length > 20 ? c.title.slice(0, 18) + '…' : c.title,
          fullName: c.title,
          subject: c.subject,
          mastery: c.masteryPercentage,
          studyHours: Number(hours.toFixed(1)),
          studyMinutes,
          studyDisplayValue: chartTimeScale === 'minutes' ? studyMinutes : Number(hours.toFixed(1)),
          targetHours: Number(targetHours.toFixed(1)),
          targetMinutes,
          accuracy: c.quizAccuracy || c.masteryPercentage,
          description: c.description,
          type: 'chapter' as const,
        };
      });

  // Helper for Mastery Badge styling
  const getMasteryBadge = (percentage: number) => {
    if (percentage >= 85) {
      return {
        label: 'Mastered',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/60',
        dotClass: 'bg-emerald-500',
      };
    }
    if (percentage >= 70) {
      return {
        label: 'Proficient',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/60',
        dotClass: 'bg-indigo-500',
      };
    }
    if (percentage >= 50) {
      return {
        label: 'Developing',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/60',
        dotClass: 'bg-amber-500',
      };
    }
    return {
      label: 'Needs Focus',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300/60',
      dotClass: 'bg-rose-500',
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-cyan-300 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Subject Performance & Mastery Analytics</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Analytics & Learning Velocity</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Track mastery level distribution, study hour allocations, and exam readiness grouped by your selected subject.
            </p>
          </div>

          {/* Quick Snapshot Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-300">Selected Subject</p>
              <p className="text-base font-black text-cyan-300 mt-0.5 truncate max-w-[140px]">
                {activeSubject === 'all' ? 'All Subjects' : activeSubject}
              </p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-300">Average Mastery</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">{activeAverageMastery}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Subject Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Grouped Subject Filter
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                  Synced with Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switching subjects here will group all mastery and study hour metrics accordingly.
              </p>
            </div>
          </div>

          {/* Quick Dropdown on Mobile / Compact */}
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-subject-select" className="sr-only">Select Subject</label>
            <select
              id="analytics-subject-select"
              value={activeSubject}
              onChange={(e) => handleSubjectChange(e.target.value as SubjectType | 'all')}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjectFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {activeSubject !== 'all' && (
              <button
                type="button"
                id="analytics-clear-filter-btn"
                onClick={() => handleSubjectChange('all')}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Reset to All Subjects"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills for Fast Clicking */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {subjectFilterOptions.map((opt) => {
            const isSelected = activeSubject === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                id={`analytics-subject-pill-${opt.value.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleSubjectChange(opt.value)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-102'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Subject Breakdown Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Hours in Subject */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Study Hours ({activeSubject === 'all' ? 'All' : activeSubject})</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSubjectStudyHours} hrs
            </p>
            <span className="text-xs text-slate-400">
              / {totalSubjectTargetHours} hrs target
            </span>
          </div>
          {/* Target pacing bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((totalSubjectStudyHours / Math.max(1, totalSubjectTargetHours)) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-semibold flex items-center justify-between">
            <span>{Math.min(100, Math.round((totalSubjectStudyHours / Math.max(1, totalSubjectTargetHours)) * 100))}% syllabus pace</span>
            <span className="text-slate-400 font-normal">
              {activeSubject === 'all' ? '100% total' : `${Math.round((totalSubjectStudyHours / Math.max(1, profile.totalStudyHours || 45)) * 100)}% of all time`}
            </span>
          </p>
        </div>

        {/* Average Mastery Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Average Mastery Level</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeAverageMastery}%
            </p>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getMasteryBadge(activeAverageMastery).badgeClass}`}>
              {getMasteryBadge(activeAverageMastery).label}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
              style={{ width: `${activeAverageMastery}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Computed across {filteredChapters.length} syllabus chapter modules
          </p>
        </div>

        {/* Mastered vs Developing Modules Count */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Mastery Tiers Count</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeMasteredCount}
              <span className="text-xs font-normal text-slate-400"> of {filteredChapters.length}</span>
            </p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              Mastered (85%+)
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
              {activeProficientCount} Proficient
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
              {activeDevelopingCount} Developing
            </span>
            {activeWeakCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                {activeWeakCount} Weak
              </span>
            )}
          </div>
        </div>

        {/* Diagnostic Weaknesses & Priority Actions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Diagnostic Weak Areas</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {filteredWeaknesses.length}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredWeaknesses.length === 1 ? 'Root Cause identified' : 'Root Causes identified'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">
            {filteredWeaknesses[0]
              ? `Top priority: ${filteredWeaknesses[0].weaknessLabel}`
              : 'No critical weak points in current scope!'}
          </p>
          {onNavigate && filteredWeaknesses.length > 0 && (
            <button
              type="button"
              id="analytics-triage-weakness-btn"
              onClick={() => onNavigate('weakness')}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
            >
              <span>Triage in Weakness Detector</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Dual Column: Grouped Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Grouped Breakdown - Mastery Level (%) & Study Hours / Minutes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>
                  {activeSubject === 'all'
                    ? 'Mastery Level vs. Study Time by Subject'
                    : `Mastery Level vs. Study Time (${activeSubject})`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hover any bar to inspect exact study minutes, mastery percentages, and targets
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Scale Selector */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  id="analytics-unit-toggle-mins"
                  onClick={() => {
                    soundFX.playPop();
                    setChartTimeScale('minutes');
                  }}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    chartTimeScale === 'minutes'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Minutes
                </button>
                <button
                  type="button"
                  id="analytics-unit-toggle-hours"
                  onClick={() => {
                    soundFX.playPop();
                    setChartTimeScale('hours');
                  }}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    chartTimeScale === 'hours'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Hours
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span>Mastery %</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>{chartTimeScale === 'minutes' ? 'Study Mins' : 'Study Hours'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Dual Metric Bar Chart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  domain={[0, 100]}
                  unit="%"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  domain={[0, 'auto']}
                  unit={chartTimeScale === 'minutes' ? 'm' : 'h'}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const badge = getMasteryBadge(data.mastery);
                      const isSubjectGroup = data.type === 'subject';
                      const pacePercentage = Math.min(
                        100,
                        Math.round((data.studyMinutes / Math.max(1, data.targetMinutes)) * 100)
                      );

                      return (
                        <div className="p-3.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/80 text-xs space-y-2.5 min-w-[270px] max-w-[315px] pointer-events-none z-50 animate-fadeIn">
                          {/* Header */}
                          <div className="border-b border-slate-800/90 pb-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {data.subject} {isSubjectGroup ? '• Curriculum' : '• Chapter'}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black border ${badge.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                                {badge.label}
                              </span>
                            </div>
                            <p className="font-bold text-sm text-cyan-300 line-clamp-1">
                              {data.fullName || data.name}
                            </p>
                          </div>

                          {/* Core Metrics: Exact Study Minutes & Exact Mastery Percentage */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Exact Study Minutes */}
                            <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40">
                              <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold mb-0.5">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                <span>Exact Study Time</span>
                              </div>
                              <p className="text-base font-black text-white">
                                {data.studyMinutes} <span className="text-xs font-medium text-emerald-300">mins</span>
                              </p>
                              <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                                ({data.studyHours} hrs logged)
                              </p>
                            </div>

                            {/* Exact Mastery Percentage */}
                            <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-500/40">
                              <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold mb-0.5">
                                <Target className="w-3 h-3 text-indigo-400" />
                                <span>Mastery Level</span>
                              </div>
                              <p className="text-base font-black text-white">
                                {data.mastery}<span className="text-xs font-bold text-indigo-300">%</span>
                              </p>
                              <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                                Quiz Acc: {data.accuracy}%
                              </p>
                            </div>
                          </div>

                          {/* Syllabus Pacing Detail */}
                          <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Target Study Time:</span>
                              <span className="font-semibold text-slate-200">
                                {data.targetMinutes} mins ({data.targetHours} hrs)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Syllabus Completion:</span>
                              <span className="font-bold text-emerald-400">{pacePercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full"
                                style={{ width: `${pacePercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="mastery"
                  name="Mastery %"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  yAxisId="right"
                  dataKey="studyDisplayValue"
                  name={chartTimeScale === 'minutes' ? 'Study Minutes' : 'Study Hours'}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Grouped by: {activeSubject === 'all' ? 'All Core Subjects' : activeSubject}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {comparisonChartData.length} modules plotted • Hover for minutes & mastery %
            </span>
          </div>
        </div>

        {/* Chart 2: Daily Study Minutes (Past 7 Days) for Selected Subject */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>
                  {activeSubject === 'all'
                    ? 'Daily Study Time (Past 7 Days)'
                    : `${activeSubject} Daily Study Time`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hover any day to inspect exact study minutes, session mastery %, and goal pacing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{profile.streakDays || 5} Day Streak</span>
              </span>
            </div>
          </div>

          {/* Quick Summary Row */}
          <div className="grid grid-cols-3 gap-2 py-1 px-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total In Scope</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {past7DaysData.reduce((acc, d) => acc + d.subjectMinutes, 0)} mins
              </p>
            </div>
            <div className="border-x border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Daily Avg</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {Math.round(past7DaysData.reduce((acc, d) => acc + d.subjectMinutes, 0) / 7)} min/day
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Share of Time</span>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {Math.round((past7DaysData.reduce((acc, d) => acc + d.subjectMinutes, 0) / Math.max(1, past7DaysData.reduce((acc, d) => acc + d.totalMinutes, 0))) * 100)}%
              </p>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={past7DaysData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onMouseMove={(state: any) => {
                  if (state.activeTooltipIndex !== undefined) {
                    setActiveBarIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setActiveBarIndex(null)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  unit="m"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  domain={[0, (dataMax: number) => Math.max(dataMax + 15, dailyGoalMinutes + 15)]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isGoalMet = data.totalMinutes >= data.goal;
                      const goalDiff = data.totalMinutes - data.goal;
                      const badge = getMasteryBadge(data.masteryPercentage);

                      return (
                        <div className="p-3.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/80 text-xs space-y-2.5 min-w-[270px] max-w-[305px] pointer-events-none z-50 animate-fadeIn">
                          {/* Header */}
                          <div className="border-b border-slate-800/90 pb-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-sm text-cyan-300">
                                {data.day} • {data.date}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                  isGoalMet
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {isGoalMet ? 'Goal Met ✓' : 'Under Target'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Daily Goal Target: {data.goal} mins
                            </p>
                          </div>

                          {/* Primary Metrics: Exact Study Minutes & Mastery % */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Exact Study Minutes */}
                            <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40">
                              <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold mb-0.5">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                <span>Exact Study Time</span>
                              </div>
                              <p className="text-base font-black text-white">
                                {data.subjectMinutes} <span className="text-xs font-medium text-emerald-300">mins</span>
                              </p>
                              <p className="text-[10px] text-slate-300 font-medium mt-0.5 truncate">
                                {activeSubject === 'all' ? 'All Subjects' : activeSubject}
                              </p>
                            </div>

                            {/* Mastery Percentage for this specific day */}
                            <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-500/40">
                              <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold mb-0.5">
                                <Target className="w-3 h-3 text-indigo-400" />
                                <span>Session Mastery</span>
                              </div>
                              <p className="text-base font-black text-white">
                                {data.masteryPercentage}<span className="text-xs font-bold text-indigo-300">%</span>
                              </p>
                              <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                                {badge.label} Tier
                              </p>
                            </div>
                          </div>

                          {/* Daily Context Details */}
                          <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px]">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Total Across All Subjects:</span>
                              <span className="font-bold text-white">{data.totalMinutes} mins</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Goal Delta:</span>
                              <span className={`font-semibold ${goalDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {goalDiff >= 0 ? `+${goalDiff} mins ahead` : `${Math.abs(goalDiff)} mins remaining`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400">Completed Sessions:</span>
                              <span className="font-semibold text-cyan-300">{data.quizCount || 3} learning drills</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={dailyGoalMinutes}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Goal ${dailyGoalMinutes}m`,
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="subjectMinutes" radius={[6, 6, 0, 0]} maxBarSize={38}>
                  {past7DaysData.map((entry, index) => {
                    const isGoalMet = entry.totalMinutes >= entry.goal;
                    const isToday = entry.day === 'Today';
                    let barColor = isGoalMet ? '#10b981' : '#6366f1';
                    if (isToday) {
                      barColor = isGoalMet ? '#059669' : '#4f46e5';
                    }
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={barColor}
                        opacity={activeBarIndex === null || activeBarIndex === index ? 1 : 0.65}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Goal Met ({dailyGoalMinutes}m+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              <span>In Progress</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Hover bars for exact minutes & session mastery %
            </span>
          </div>
        </div>
      </div>

      {/* Grouped Section: Detailed Chapter Breakdown for Selected Subject */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>
                {activeSubject === 'all'
                  ? 'All Syllabus Chapters & Mastery Levels'
                  : `${activeSubject}: Chapter Mastery & Study Hours Breakdown`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Individual chapter progress, quiz accuracies, and study time allocated to each module
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {filteredChapters.length} {filteredChapters.length === 1 ? 'Chapter' : 'Chapters'} in View
            </span>
          </div>
        </div>

        {/* Chapters Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChapters.map((chapter) => {
            const badge = getMasteryBadge(chapter.masteryPercentage);
            const hours = chapter.studyHours || (chapter.masteryPercentage > 80 ? 5.5 : 4.0);
            const target = chapter.targetStudyHours || 7.0;
            const progress = Math.min(100, Math.round((hours / target) * 100));

            return (
              <div
                key={chapter.id}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-all hover:shadow-xs space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {chapter.subject}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${badge.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                      {badge.label}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {chapter.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {chapter.description}
                  </p>
                </div>

                {/* Progress Meters */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-xs">
                  {/* Mastery % */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Mastery Level</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {chapter.masteryPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${chapter.masteryPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Study Hours */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>Study Hours</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {hours}h <span className="text-slate-400 font-normal">/ {target}h</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quiz Accuracy Metric */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-cyan-500" />
                      <span>Quiz Accuracy</span>
                    </span>
                    <span className="font-black text-cyan-600 dark:text-cyan-400">
                      {chapter.quizAccuracy || chapter.masteryPercentage}%
                    </span>
                  </div>
                </div>

                {/* Chapter Quick Actions */}
                {onNavigate && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      id={`analytics-study-chapter-${chapter.id}`}
                      onClick={() => {
                        soundFX.playPop();
                        onNavigate('learn');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Study Concept</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Study Hours Grouped by Learning Modality & Subject Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modality Breakdown for Active Scope */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>
                  {activeSubject === 'all'
                    ? 'Study Hours by Learning Activity'
                    : `${activeSubject}: Hours by Activity Modality`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of time across practice, recall, coaching, and theory
              </p>
            </div>
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {totalSubjectStudyHours} Total Hours
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {modalityBreakdown.map((item) => (
              <div key={item.modality} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.modality}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {item.hours} hrs
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${item.color} h-full rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Cognitive Pacing Insight:</strong> You spend 68% of study time in active retrieval (Problem Solving & Flashcards), which drives long-term neural retention.
            </p>
          </div>
        </div>

        {/* Grouped Comparative Breakdown Across All Core Subjects */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                <span>Subject Comparison Summary</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Click any subject below to switch the Dashboard and Analytics filter
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {subjectSummaries.map((sub) => {
              const isSelected = activeSubject === sub.subject;
              return (
                <div
                  key={sub.subject}
                  onClick={() => handleSubjectChange(sub.subject)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{sub.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {sub.displayName}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {sub.totalChapters} chapters · {sub.weaknessCount} weak points
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {sub.averageMastery}%
                      </span>
                      <p className="text-[10px] text-slate-400">Mastery</p>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {sub.totalHours}h
                      </span>
                      <p className="text-[10px] text-slate-400">Study Time</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
