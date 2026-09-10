import React, { useState } from 'react';
import { WeaknessItem, Question } from '../types';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Zap,
  Target,
} from 'lucide-react';
import { generateWeaknessQuestions } from '../services/api';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface WeaknessDetectorProps {
  weaknesses: WeaknessItem[];
  onResolveWeakness: (id: string) => void;
  onAddXP: (xp: number) => void;
  activeDrillId?: string | null;
}

export const WeaknessDetector: React.FC<WeaknessDetectorProps> = ({
  weaknesses,
  onResolveWeakness,
  onAddXP,
  activeDrillId,
}) => {
  const [selectedWeakness, setSelectedWeakness] = useState<WeaknessItem | null>(
    weaknesses.find((w) => w.id === activeDrillId) || weaknesses[0] || null
  );

  const [activeDrillQuestions, setActiveDrillQuestions] = useState<Question[] | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [drillScore, setDrillScore] = useState(0);
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false);
  const [isDrillFinished, setIsDrillFinished] = useState(false);

  const startDrill = async (weakness: WeaknessItem) => {
    setSelectedWeakness(weakness);
    setIsGeneratingDrill(true);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setDrillScore(0);
    setIsDrillFinished(false);

    try {
      if (weakness.practiceQuestions && weakness.practiceQuestions.length > 0) {
        setActiveDrillQuestions(weakness.practiceQuestions);
      } else {
        const questions = await generateWeaknessQuestions(
          weakness.subject,
          weakness.chapter,
          weakness.weaknessLabel,
          weakness.rootCause
        );
        setActiveDrillQuestions(questions);
      }
    } catch {
      setActiveDrillQuestions(weakness.practiceQuestions || []);
    } finally {
      setIsGeneratingDrill(false);
    }
  };

  const submitAnswer = () => {
    if (!selectedOption || !activeDrillQuestions) return;
    setIsAnswerSubmitted(true);
    const currQ = activeDrillQuestions[currentQIndex];
    if (selectedOption === currQ.correctAnswer) {
      soundFX.playSuccess();
      setDrillScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (!activeDrillQuestions) return;
    if (currentQIndex + 1 < activeDrillQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsDrillFinished(true);
      triggerCelebration();
      onAddXP(100);
      if (selectedWeakness) {
        onResolveWeakness(selectedWeakness.id);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white border border-rose-900/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-xs font-bold text-rose-300 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Cognitive Diagnosis Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">AI Weakness Detector</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              NEXORA monitors quiz errors to detect the root cognitive misconceptions holding you back, then synthesizes targeted drills to eliminate them.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Active Weak Spots</p>
              <p className="text-2xl font-black text-rose-400">{weaknesses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Drill Area (If triggered) */}
      {activeDrillQuestions && !isDrillFinished && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/80 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Targeted Remedial Drill
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Fixing: {selectedWeakness?.weaknessLabel}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Question {currentQIndex + 1} of {activeDrillQuestions.length}
              </span>
              <button
                onClick={() => setActiveDrillQuestions(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Close Drill
              </button>
            </div>
          </div>

          {/* Current Question */}
          {activeDrillQuestions[currentQIndex] && (
            <div className="space-y-4">
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                {activeDrillQuestions[currentQIndex].question}
              </p>

              {activeDrillQuestions[currentQIndex].hint && !isAnswerSubmitted && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span><strong>Hint:</strong> {activeDrillQuestions[currentQIndex].hint}</span>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2.5">
                {(activeDrillQuestions[currentQIndex].options || []).map((opt) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === activeDrillQuestions[currentQIndex].correctAnswer;

                  let optStyle = 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50 dark:bg-slate-800';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    } else {
                      optStyle = 'border-slate-200 dark:border-slate-800 opacity-60';
                    }
                  } else if (isSelected) {
                    optStyle = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20';
                  }

                  return (
                    <button
                      key={opt}
                      disabled={isAnswerSubmitted}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Step by step explanation upon answering */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Cognitive Resolution Breakdown:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeDrillQuestions[currentQIndex].explanation}
                  </p>
                </div>
              )}

              {/* Footer action button */}
              <div className="flex justify-end pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    disabled={!selectedOption}
                    onClick={submitAnswer}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition active:scale-95"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-1.5"
                  >
                    <span>{currentQIndex + 1 < activeDrillQuestions.length ? 'Next Diagnostic Question' : 'Complete Drill & Eliminate Weakness'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drill Finished Celebration */}
      {isDrillFinished && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-800/50 text-white text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black">WEAKNESS ELIMINATED! 🎯</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You scored {drillScore} on this targeted drill. The cognitive misunderstanding has been resolved in your profile and added to spaced repetition.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>+100 XP Earned</span>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveDrillQuestions(null)}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition"
            >
              Back to Weakness Overview
            </button>
          </div>
        </div>
      )}

      {/* Weakness Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {weaknesses.map((weakness) => {
          const isCritical = weakness.confidence === 'Critical';
          return (
            <div
              key={weakness.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs ${
                isCritical
                  ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {weakness.subject}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCritical
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/40'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {weakness.confidence} Confidence
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {weakness.chapter}
                </h3>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                  Subtopic: {weakness.subtopic}
                </p>

                {/* Score & Mistake frequency */}
                <div className="mt-3 flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span>Last Quiz Score:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                    {weakness.score} / {weakness.maxScore}
                  </span>
                </div>

                {/* Root cause */}
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diagnosed Root Cause</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {weakness.rootCause}
                  </p>
                </div>

                {/* Sample error */}
                {weakness.sampleMistake && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-[11px] text-rose-800 dark:text-rose-300">
                    <span className="font-bold">Detected Mistake:</span> {weakness.sampleMistake}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  id={`practice-weakness-btn-${weakness.id}`}
                  onClick={() => startDrill(weakness)}
                  disabled={isGeneratingDrill}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Start Targeted Drill ({weakness.recommendedPracticeMinutes}m)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
