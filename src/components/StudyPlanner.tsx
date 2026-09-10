import React, { useState } from 'react';
import { StudyPlanSchedule, SubjectType } from '../types';
import {
  CalendarDays,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  Flame,
  Calendar,
  Layers,
  Bell,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface StudyPlannerProps {
  schedule: StudyPlanSchedule[];
  onToggleScheduleTask: (scheduleId: string, taskId: string) => void;
  onAutoRebalance: () => void;
  onAddXP: (xp: number) => void;
  onScheduleStudyAlert?: (taskTitle: string, subject: SubjectType, durationMinutes: number) => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  schedule,
  onToggleScheduleTask,
  onAutoRebalance,
  onAddXP,
  onScheduleStudyAlert,
}) => {
  const [examName, setExamName] = useState('Physics Midterm & Math Finals');
  const [daysUntilExam, setDaysUntilExam] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(2.5);
  const [weakSubject, setWeakSubject] = useState<SubjectType>('Physics');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isRebalancedNotice, setIsRebalancedNotice] = useState(false);
  const [alertSetNotice, setAlertSetNotice] = useState<string | null>(null);

  const handleSetAlert = (e: React.MouseEvent, title: string, subject: SubjectType, duration: number) => {
    e.stopPropagation();
    if (onScheduleStudyAlert) {
      onScheduleStudyAlert(title, subject, duration);
    }
    setAlertSetNotice(`🔔 Push notification alert set for "${title}"!`);
    soundFX.playPop();
    setTimeout(() => setAlertSetNotice(null), 4000);
  };

  const handleRebalance = () => {
    onAutoRebalance();
    setIsRebalancedNotice(true);
    soundFX.playSuccess();
    triggerCelebration();
    setTimeout(() => setIsRebalancedNotice(false), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white border border-teal-900/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-xs font-bold text-teal-300 mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-teal-300" />
              <span>Adaptive Equilibrium Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Adaptive Study Planner</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              A responsive study schedule tailored to your exam timeline. Missed a day or fell behind? The AI rebalances workloads across future days without guilt or stress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfiguring(!isConfiguring)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition"
            >
              {isConfiguring ? 'Close Settings' : 'Customize Exam Goals'}
            </button>
            <button
              id="rebalance-schedule-btn"
              onClick={handleRebalance}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              <span>Auto-Rebalance Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notice Toast */}
      {alertSetNotice && (
        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn">
          <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 animate-bounce" />
          <span>{alertSetNotice}</span>
        </div>
      )}

      {/* Rebalance Toast */}
      {isRebalancedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>
            ✨ Schedule rebalanced! Missed tasks were redistributed smoothly across the remaining {daysUntilExam} days without increasing your daily study cap.
          </span>
        </div>
      )}

      {/* Goal Configuration Box */}
      {isConfiguring && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>Set Exam Target Parameters</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Target Exam Name</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Days Until Exam</label>
              <input
                type="number"
                value={daysUntilExam}
                onChange={(e) => setDaysUntilExam(Number(e.target.value))}
                min={1}
                max={90}
                className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Max Daily Study Hours</label>
              <input
                type="number"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                min={1}
                max={8}
                className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setIsConfiguring(false);
              handleRebalance();
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            Apply & Recalculate
          </button>
        </div>
      )}

      {/* Active Schedule Days Timeline */}
      <div className="space-y-4">
        {schedule.map((dayPlan) => {
          const completedTasks = dayPlan.tasks.filter((t) => t.completed).length;
          const totalTasks = dayPlan.tasks.length;
          const isToday = dayPlan.dayTitle.toLowerCase().includes('today');

          return (
            <div
              key={dayPlan.id}
              className={`p-5 rounded-2xl border transition-all ${
                isToday
                  ? 'bg-white dark:bg-slate-900 border-teal-500/70 dark:border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                  : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {dayPlan.dayTitle}
                  </h3>
                  <span className="text-xs text-slate-400">({dayPlan.date})</span>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                      CURRENT
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {completedTasks} / {totalTasks} Completed • {dayPlan.targetMinutes} mins scheduled
                </div>
              </div>

              {/* Tasks for the Day */}
              <div className="mt-4 space-y-2.5">
                {dayPlan.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onToggleScheduleTask(dayPlan.id, task.id);
                      soundFX.playSuccess();
                      if (!task.completed) onAddXP(25);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                      task.completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <p
                          className={`text-xs sm:text-sm font-semibold ${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {task.subject} • {task.durationMinutes} min
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!task.completed && (
                        <button
                          type="button"
                          onClick={(e) => handleSetAlert(e, task.title, task.subject, task.durationMinutes)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition cursor-pointer"
                          title="Schedule push alert when this study block begins"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
