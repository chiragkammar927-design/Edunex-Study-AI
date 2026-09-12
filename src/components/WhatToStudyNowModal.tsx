import React, { useState } from 'react';
import { StudentProfile, WeaknessItem } from '../types';
import { NavTab } from './Sidebar';
import {
  Zap,
  Sparkles,
  Clock,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Target,
  X,
  CheckCircle2,
  Calendar,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { soundFX } from '../utils/soundOrConfetti';

interface WhatToStudyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  weaknesses: WeaknessItem[];
  dueCardsCount: number;
  onNavigate: (tab: NavTab) => void;
  onStartWeaknessDrill: (weaknessId: string) => void;
}

export const WhatToStudyNowModal: React.FC<WhatToStudyNowModalProps> = ({
  isOpen,
  onClose,
  profile,
  weaknesses,
  dueCardsCount,
  onNavigate,
  onStartWeaknessDrill,
}) => {
  const [selectedTime, setSelectedTime] = useState<15 | 30 | 45 | 60>(15);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  // Primary critical weakness
  const topWeakness = weaknesses[0] || {
    id: 'w-1',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    subtopic: 'Factoring Negative Coefficients',
    score: 4,
    maxScore: 10,
    impactScore: 'High Risk (-15% on upcoming test)',
  };

  // Compute recommendation based on time available
  const getRecommendation = () => {
    switch (selectedTime) {
      case 15:
        return {
          title: `15m High-Yield Fix: ${topWeakness.subtopic || 'Quadratic Factoring'}`,
          badge: 'Immediate ROI (+15% score)',
          targetTab: 'weakness' as NavTab,
          actionLabel: 'Launch 15m Drill Now',
          subject: topWeakness.subject,
          reason: `Your Physics midterm is in 4 days and Quadratic sign errors are currently costing you 6 out of 10 points. 15 minutes of guided error-reflection will patch this foundation.`,
          steps: [
            { min: '3m', action: 'Quick review of the (-) sign distribution rule' },
            { min: '8m', action: 'Solve 3 adaptive practice questions with instant step hints' },
            { min: '4m', action: 'Reflection check + verify you avoid the common trap' },
          ],
        };
      case 30:
        return {
          title: `30m Mastery Loop: "Teach Me Back" & Active Quiz`,
          badge: 'Deep Understanding',
          targetTab: 'teachme' as NavTab,
          actionLabel: 'Start "Teach Me Back" Session',
          subject: 'Physics',
          reason: `Explain Newton's Laws or Circuit Resistance in your own words to the AI. Active verbalization yields 85% retention compared to passive reading.`,
          steps: [
            { min: '5m', action: 'Clear 3 due flashcards in Spaced Repetition' },
            { min: '15m', action: 'Explain concept to AI Coach (checks understanding vs misconceptions)' },
            { min: '10m', action: '5-question adaptive exam drill with AI Mistake Analyzer' },
          ],
        };
      case 45:
        return {
          title: `45m Boss Battle & Virtual Lab Sprint`,
          badge: 'Combat & Simulation',
          targetTab: 'battles' as NavTab,
          actionLabel: 'Enter Boss Arena',
          subject: 'Physics',
          reason: `Engage the Vector Void Titan boss quiz battle to pressure-test your exam speed, followed by the Virtual Lab circuit simulator to visualize Ohm's Law.`,
          steps: [
            { min: '15m', action: 'Simulate Ohm\'s Law circuit and electron flow in Virtual Lab' },
            { min: '20m', action: 'Fight Chapter Boss (defeat boss HP with correct answers)' },
            { min: '10m', action: 'Review mistake log & claim +250 XP bonus' },
          ],
        };
      case 60:
      default:
        return {
          title: `60m Comprehensive Exam Prep Protocol`,
          badge: 'Full Syllabus Sprint',
          targetTab: 'planner' as NavTab,
          actionLabel: 'Launch 60m Adaptive Block',
          subject: 'All Subjects',
          reason: `A structured multi-mode session covering retention decay, error correction, and new syllabus conquest.`,
          steps: [
            { min: '10m', action: 'Memory revision: Clear all pending flashcards' },
            { min: '20m', action: 'Deep drill on lowest-scoring subtopic' },
            { min: '20m', action: 'Teach Me Back explanation challenge' },
            { min: '10m', action: 'Timed mock checkpoint test' },
          ],
        };
    }
  };

  const rec = getRecommendation();

  const handleLaunch = () => {
    soundFX.playSuccess();
    onClose();
    if (rec.targetTab === 'weakness' && topWeakness) {
      onStartWeaknessDrill(topWeakness.id);
    } else {
      onNavigate(rec.targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with gradient glow */}
        <div className="relative p-6 bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                ⚡
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-200">
                  AI Real-Time Diagnostic Engine
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  WHAT SHOULD I STUDY NOW?
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 max-w-lg leading-relaxed">
            Edunex Study AI analyzed your upcoming exams, weak topics, mistake history, and memory curve to formulate one laser-focused recommendation.
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step 1: Available Time Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Step 1: How much time do you have right now?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { min: 15, label: '15 Mins', tag: 'Sprint' },
                { min: 30, label: '30 Mins', tag: 'Core' },
                { min: 45, label: '45 Mins', tag: 'Deep' },
                { min: 60, label: '60 Mins', tag: 'Mastery' },
              ].map((item) => (
                <button
                  key={item.min}
                  onClick={() => {
                    setSelectedTime(item.min as any);
                    soundFX.playPop();
                  }}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selectedTime === item.min
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-base font-black">{item.label}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                      selectedTime === item.min
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic Signals Being Weighed */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Real-Time Signals Analyzed</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">Physics Midterm in 4d</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">Sign Errors: 4/10 score</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">{dueCardsCount} due flashcards</span>
              </div>
            </div>
          </div>

          {/* Step 2: The Clear AI Recommendation */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-purple-50/70 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/40 border-2 border-indigo-500/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                {rec.badge}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Subject: <strong className="text-indigo-600 dark:text-indigo-400">{rec.subject}</strong>
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {rec.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {rec.reason}
            </p>

            {/* Micro-Agenda steps */}
            <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-2">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Session Action Plan:
              </p>
              {rec.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] shrink-0 mt-0.5">
                    {step.min}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 leading-tight">
                    {step.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            I'll pick myself
          </button>

          <button
            onClick={handleLaunch}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>{rec.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
