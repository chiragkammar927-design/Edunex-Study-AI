import React, { useState } from 'react';
import { SyllabusChapter, SubjectType } from '../types';
import {
  Map,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Circle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Code,
  Zap,
  X,
  Compass,
  LayoutGrid,
} from 'lucide-react';
import { LearningPathways } from './LearningPathways';

interface LearningMapProps {
  chapters: SyllabusChapter[];
  onOpenCoachWithTopic: (subject: SubjectType, topic: string) => void;
  onOpenQuizWithTopic: (subject: SubjectType, topic: string) => void;
  onAddXP?: (amount: number, reason?: string) => void;
}

export const LearningMap: React.FC<LearningMapProps> = ({
  chapters,
  onOpenCoachWithTopic,
  onOpenQuizWithTopic,
  onAddXP,
}) => {
  const [viewMode, setViewMode] = useState<'pathways' | 'grid'>('pathways');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeModalChapter, setActiveModalChapter] = useState<SyllabusChapter | null>(null);

  const filtered = chapters.filter((c) => {
    if (selectedSubject !== 'all' && c.subject !== selectedSubject) return false;
    if (filterStatus !== 'all' && c.mastery !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: SyllabusChapter['mastery']) => {
    switch (status) {
      case 'mastered':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
          border: 'border-emerald-500/40 hover:border-emerald-500',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
          label: 'Mastered',
        };
      case 'revision_needed':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-950/30',
          border: 'border-amber-500/40 hover:border-amber-500',
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
          label: 'Needs Revision',
        };
      case 'weak':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-950/30',
          border: 'border-rose-500/50 hover:border-rose-500',
          dot: 'bg-rose-500',
          badge: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
          label: 'Weak Spot',
        };
      case 'not_started':
      default:
        return {
          bg: 'bg-slate-500/10 dark:bg-slate-800/30',
          border: 'border-slate-300 dark:border-slate-700 hover:border-slate-500',
          dot: 'bg-slate-400',
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          label: 'Not Started',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top View Mode Switcher */}
      <div className="flex items-center justify-between gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('pathways')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'pathways'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-300" />
            <span>D3 Force-Directed Pathways</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold ml-1">
              Prerequisites & Mastery
            </span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Syllabus Chapter Cards</span>
          </button>
        </div>
      </div>

      {viewMode === 'pathways' ? (
        <LearningPathways
          onOpenCoachWithTopic={onOpenCoachWithTopic}
          onOpenQuizWithTopic={onOpenQuizWithTopic}
          onAddXP={onAddXP}
        />
      ) : (
        <>
          {/* Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white border border-indigo-900/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 mb-2">
              <Map className="w-3.5 h-3.5 text-cyan-300" />
              <span>Syllabus Topology & Mastery Graph</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Learning Map</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Visual roadmap of your entire academic syllabus. Green nodes indicate mastered concepts, yellow highlights decay risk, and red identifies weak spots.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Mastered
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Needs Revision
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Weak Spot
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/20 text-slate-300 border border-slate-500/30">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Not Started
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Subject:</span>
          {['all', 'Mathematics', 'Physics', 'Chemistry', 'Biology'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {sub === 'all' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All States</option>
            <option value="mastered">Mastered</option>
            <option value="revision_needed">Needs Revision</option>
            <option value="weak">Weak Spot</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Node Grid Map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((ch) => {
          const style = getStatusColor(ch.mastery);
          return (
            <div
              key={ch.id}
              onClick={() => setActiveModalChapter(ch)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between shadow-xs hover:shadow-md ${style.bg} ${style.border}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {ch.subject}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                    {style.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {ch.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {ch.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {ch.masteryPercentage}% Mastery
                  </span>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                  Explore →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chapter Detail Inspector Modal */}
      {activeModalChapter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {activeModalChapter.subject}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeModalChapter.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalChapter(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <h4 className="font-bold text-slate-400 uppercase text-[11px]">Explanation</h4>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {activeModalChapter.simpleExplanation}
                </p>
              </div>

              {activeModalChapter.importantFormulas.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-[11px] mb-1">Key Formulas</h4>
                  <div className="space-y-1.5">
                    {activeModalChapter.importantFormulas.map((f, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{f.name}:</span> {f.formula}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-400 uppercase text-[11px] mb-1">Key Takeaways</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                  {activeModalChapter.keyTakeaways.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onOpenCoachWithTopic(activeModalChapter.subject, activeModalChapter.title);
                  setActiveModalChapter(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100"
              >
                Ask Coach
              </button>
              <button
                onClick={() => {
                  onOpenQuizWithTopic(activeModalChapter.subject, activeModalChapter.title);
                  setActiveModalChapter(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
              >
                Take Quiz
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
