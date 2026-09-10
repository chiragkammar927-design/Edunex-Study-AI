import React, { useState, useEffect } from 'react';
import { SyllabusChapter, SubjectType } from '../types';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Code,
  Flame,
} from 'lucide-react';

interface AiLearnProps {
  chapters: SyllabusChapter[];
  onOpenCoachWithTopic: (subject: SubjectType, chapterTitle: string) => void;
  onOpenQuizWithTopic: (subject: SubjectType, chapterTitle: string) => void;
  initialSubject?: SubjectType;
  initialChapterTitle?: string;
}

export const AiLearn: React.FC<AiLearnProps> = ({
  chapters,
  onOpenCoachWithTopic,
  onOpenQuizWithTopic,
  initialSubject,
  initialChapterTitle,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(initialSubject || 'Mathematics');
  const filteredChapters = chapters.filter((c) => c.subject === selectedSubject);
  const [activeChapter, setActiveChapter] = useState<SyllabusChapter>(() => {
    if (initialChapterTitle) {
      const match = chapters.find(
        (c) =>
          c.title.toLowerCase().includes(initialChapterTitle.toLowerCase()) ||
          initialChapterTitle.toLowerCase().includes(c.title.toLowerCase())
      );
      if (match) return match;
    }
    return filteredChapters[0] || chapters[0];
  });
  const [learningMode, setLearningMode] = useState<'standard' | 'eli13' | 'quick_revision' | 'formulas' | 'examples'>('standard');

  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);

  useEffect(() => {
    if (initialChapterTitle) {
      const match = chapters.find(
        (c) =>
          c.title.toLowerCase().includes(initialChapterTitle.toLowerCase()) ||
          initialChapterTitle.toLowerCase().includes(c.title.toLowerCase())
      );
      if (match) {
        setActiveChapter(match);
        if (match.subject) {
          setSelectedSubject(match.subject);
        }
      }
    }
  }, [initialChapterTitle, chapters]);

  const handleSubjectChange = (sub: SubjectType) => {
    setSelectedSubject(sub);
    const subChapters = chapters.filter((c) => c.subject === sub);
    if (subChapters.length > 0) {
      setActiveChapter(subChapters[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 text-white border border-indigo-900/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
              <span>Interactive Syllabus Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">AI Learn</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Deep dive into any syllabus topic with multi-perspective explanations, 60-second speed revision, and ELI13 mental models.
            </p>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(['Mathematics', 'Physics', 'Chemistry', 'Biology'] as SubjectType[]).map((sub) => (
              <button
                key={sub}
                onClick={() => handleSubjectChange(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chapter Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Chapter List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {selectedSubject} Chapters
          </h2>
          <div className="space-y-2">
            {filteredChapters.map((ch) => {
              const isSelected = activeChapter.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ch.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ch.mastery === 'mastered'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : ch.mastery === 'weak'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {ch.mastery}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{ch.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Mastery: {ch.masteryPercentage}%</span>
                    <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${ch.masteryPercentage}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Chapter Learning Canvas */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
            {/* Chapter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {activeChapter.subject}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {activeChapter.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCoachWithTopic(activeChapter.subject, activeChapter.title)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Coach Chat</span>
                </button>
                <button
                  onClick={() => onOpenQuizWithTopic(activeChapter.subject, activeChapter.title)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Take Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Learning Modes Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'standard', label: 'Simple Explanation', icon: BookOpen },
                { id: 'eli13', label: '“Explain Like I’m 13”', icon: HelpCircle },
                { id: 'quick_revision', label: '60s Quick Revision', icon: Zap },
                { id: 'formulas', label: 'Key Formulas', icon: Code },
                { id: 'examples', label: 'Worked Examples', icon: CheckCircle2 },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setLearningMode(m.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                      learningMode === m.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode Content Render */}
            {learningMode === 'standard' && (
              <div className="space-y-4 text-sm leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {activeChapter.simpleExplanation}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Important Concepts</h3>
                  <div className="space-y-2">
                    {activeChapter.keyTakeaways.map((k, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {learningMode === 'eli13' && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 via-white to-indigo-50/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-indigo-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" />
                  <span>Explain Like I’m 13 Mode</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeChapter.eli13Explanation}
                </p>
              </div>
            )}

            {learningMode === 'quick_revision' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>60-Second Speed Review Points</span>
                </div>
                <div className="space-y-2.5">
                  {activeChapter.quickRevisionPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                        {idx + 1}
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {learningMode === 'formulas' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Governing Formulas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeChapter.importantFormulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1"
                    >
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {f.name}
                      </span>
                      <div className="font-mono text-sm font-bold text-slate-900 dark:text-white py-1">
                        {f.formula}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {learningMode === 'examples' && (
              <div className="space-y-4">
                {activeChapter.workedExamples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Problem: {ex.problem}
                    </div>
                    <div className="space-y-1.5 pl-2 border-l-2 border-indigo-500">
                      {ex.steps.map((step, sIdx) => (
                        <p key={sIdx} className="text-xs text-slate-600 dark:text-slate-300">
                          {step}
                        </p>
                      ))}
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Final Answer: {ex.solution}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
