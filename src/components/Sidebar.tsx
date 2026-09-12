import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  AlertTriangle,
  Camera,
  BookOpen,
  FileQuestion,
  BrainCircuit,
  CalendarDays,
  Map,
  BarChart3,
  User,
  Settings,
  X,
  Sparkles,
  Flame,
  Users,
  ArrowRight,
  Mic,
  FlaskConical,
  Swords,
  GraduationCap,
  Zap,
  Compass,
  Video,
  CheckCircle2,
  Trophy,
  Plus,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { Logo } from './Logo';

export type NavTab =
  | 'dashboard'
  | 'coach'
  | 'aivideo'
  | 'weakness'
  | 'teachme'
  | 'battles'
  | 'virtuallab'
  | 'snapstudy'
  | 'learn'
  | 'quiz'
  | 'memory'
  | 'planner'
  | 'circles'
  | 'map'
  | 'pathways'
  | 'analytics'
  | 'profile'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  weaknessCount: number;
  dueCardsCount: number;
  appName?: string;
  profile?: StudentProfile;
  onAddStudyMinutes?: (minutes: number) => void;
  onUpdateGoalMinutes?: (minutes: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  weaknessCount,
  dueCardsCount,
  appName = 'Edunex Study AI',
  profile,
  onAddStudyMinutes,
  onUpdateGoalMinutes,
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const streakDays = profile?.streakDays ?? 14;
  const todayMinutes = profile?.todayStudyMinutes ?? 45;
  const goalMinutes = profile?.todayGoalMinutes ?? 60;
  const isGoalMet = todayMinutes >= goalMinutes;
  const progressPercent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  const minutesRemaining = Math.max(0, goalMinutes - todayMinutes);

  // 7-day week representation for streak calendar visual
  const daysOfWeek = [
    { label: 'M', completed: true },
    { label: 'T', completed: true },
    { label: 'W', completed: true },
    { label: 'T', completed: true },
    { label: 'F', completed: true },
    { label: 'S', completed: true },
    { label: 'S', completed: isGoalMet, isToday: true },
  ];

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'coach' as NavTab, label: 'AI Study Coach', icon: Bot, highlight: true },
    { id: 'aivideo' as NavTab, label: 'AI Video Academy 🎬', icon: Video, highlight: true, badge: 'AI Video', badgeColor: 'bg-indigo-600' },
    { id: 'weakness' as NavTab, label: 'Weakness Detector', icon: AlertTriangle, badge: weaknessCount > 0 ? `${weaknessCount} alerts` : undefined, badgeColor: 'bg-rose-500' },
    { id: 'teachme' as NavTab, label: 'Teach Me Back 🗣️', icon: Mic, badge: 'Feynman', badgeColor: 'bg-emerald-600' },
    { id: 'battles' as NavTab, label: 'Boss Battles 👾', icon: Swords, badge: 'PvE', badgeColor: 'bg-rose-600' },
    { id: 'virtuallab' as NavTab, label: 'Virtual Lab 🧪', icon: FlaskConical, badge: 'Sim', badgeColor: 'bg-cyan-600' },
    { id: 'snapstudy' as NavTab, label: 'SnapStudy (Camera/Notes)', icon: Camera, newFeature: true },
    { id: 'learn' as NavTab, label: 'AI Learn (Syllabus)', icon: BookOpen },
    { id: 'quiz' as NavTab, label: 'AI Quiz & Voice Quiz', icon: FileQuestion },
    { id: 'memory' as NavTab, label: 'Memory & Revision', icon: BrainCircuit, badge: dueCardsCount > 0 ? `${dueCardsCount} due` : undefined, badgeColor: 'bg-amber-500' },
    { id: 'planner' as NavTab, label: 'Adaptive Planner', icon: CalendarDays },
    { id: 'circles' as NavTab, label: 'Study Circles', icon: Users, badge: 'Live', badgeColor: 'bg-indigo-600' },
    { id: 'map' as NavTab, label: 'Learning Map', icon: Map },
    { id: 'pathways' as NavTab, label: 'Learning Pathways 🧭', icon: Compass, badge: 'D3 Graph', badgeColor: 'bg-cyan-600' },
    { id: 'analytics' as NavTab, label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'profile' as NavTab, label: 'Profile & Badges', icon: User },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleQuickAdd = (minutes: number) => {
    if (onAddStudyMinutes) {
      onAddStudyMinutes(minutes);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-50 md:z-20 h-screen md:h-[calc(100vh-4rem)] w-72 shrink-0 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md border-r border-blue-100/80 dark:border-blue-950/70 flex flex-col justify-between py-4 px-3 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile header inside drawer */}
        <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-blue-100 dark:border-blue-950">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="font-black text-slate-900 dark:text-white tracking-tight text-base whitespace-nowrap">
              {appName}
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 select-none">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-blue-600 dark:text-cyan-300'
                        : 'text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.newFeature && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300/40">
                      NEW
                    </span>
                  )}
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Visual Study Streak Counter Widget */}
        <div
          id="sidebar-study-streak-counter"
          className={`mt-3 pt-3 border-t border-blue-100 dark:border-blue-950/80 select-none`}
        >
          <div
            className={`relative p-3 rounded-2xl transition-all duration-300 overflow-hidden ${
              isGoalMet
                ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/15 to-rose-500/10 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-rose-950/30 border border-amber-300/80 dark:border-amber-600/50 shadow-md shadow-amber-500/10'
                : 'bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-[#11192e] dark:to-[#0f172a] border border-blue-100 dark:border-blue-900/50'
            }`}
          >
            {/* Top row: Fire icon, streak count, status badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                    isGoalMet
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30 scale-105'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50'
                  }`}
                >
                  <Flame
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isGoalMet
                        ? 'fill-amber-100 text-white animate-pulse drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                        : 'fill-amber-500 text-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span
                      id="sidebar-streak-days"
                      className={`text-lg font-black tracking-tight ${
                        isGoalMet
                          ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 dark:from-amber-300 dark:via-orange-300 dark:to-rose-300 bg-clip-text text-transparent'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {streakDays}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Day Streak
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                    {isGoalMet ? 'Daily Goal Met! 🔥' : `${minutesRemaining}m to extend streak`}
                  </p>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="shrink-0">
                {isGoalMet ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Extended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    In Progress
                  </span>
                )}
              </div>
            </div>

            {/* Daily Study Goal Progress Meter */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Today's Goal
                  </span>
                  {onUpdateGoalMinutes && (
                    <button
                      onClick={() => setIsEditingGoal(!isEditingGoal)}
                      className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      title="Adjust daily study target"
                    >
                      (Edit)
                    </button>
                  )}
                </div>
                <span className="font-mono text-[11px]">
                  {todayMinutes} / {goalMinutes} min{' '}
                  <span className="text-slate-400">({progressPercent}%)</span>
                </span>
              </div>

              {/* Goal Editor Preset Selector */}
              {isEditingGoal && onUpdateGoalMinutes && (
                <div className="p-2 bg-white dark:bg-[#0f172a] rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm space-y-1 my-1.5 animate-fadeIn">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Set Daily Goal:</span>
                    <button
                      onClick={() => setIsEditingGoal(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          onUpdateGoalMinutes(mins);
                          setIsEditingGoal(false);
                        }}
                        className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          goalMinutes === mins
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Track */}
              <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGoalMet
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-sm shadow-orange-500/50'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Weekly 7-Day Mini Streak dots */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200/60 dark:border-slate-800/80">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                    {day.label}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-transform ${
                      day.completed
                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    } ${day.isToday && isGoalMet ? 'ring-2 ring-amber-400 dark:ring-amber-300 scale-110' : ''}`}
                    title={
                      day.isToday
                        ? isGoalMet
                          ? 'Today: Goal Met & Streak Extended'
                          : 'Today: In Progress'
                        : `${day.label}: Completed`
                    }
                  >
                    {day.completed ? (
                      <Flame className="w-3 h-3 fill-white text-white" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Study Session / Streak Booster Action Buttons */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1.5">
              {!isGoalMet ? (
                <>
                  <button
                    id="sidebar-quick-add-15m"
                    onClick={() => handleQuickAdd(15)}
                    className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    title="Log +15 minutes of study to help meet your daily goal"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+15m Study</span>
                  </button>
                  <button
                    id="sidebar-quick-meet-goal"
                    onClick={() => handleQuickAdd(minutesRemaining)}
                    className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
                    title={`Complete remaining ${minutesRemaining} minutes now`}
                  >
                    Complete Goal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleTabClick('planner')}
                  className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span>Streak Maintained! View Planner</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

