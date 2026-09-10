import React, { useState } from 'react';
import { SubjectType, EmergencyRevisionPlan } from '../types';
import {
  AlertOctagon,
  Clock,
  Zap,
  CheckCircle2,
  X,
  Flame,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';

interface StudyEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const StudyEmergencyModal: React.FC<StudyEmergencyModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [subject, setSubject] = useState<SubjectType>('Physics');
  const [hours, setHours] = useState<number>(4);
  const [targetGoal, setTargetGoal] = useState<'Pass (65%+)' | 'Score A (85%+)'>('Score A (85%+)');
  const [isGenerated, setIsGenerated] = useState(true);

  if (!isOpen) return null;

  const emergencyPlans: Record<string, EmergencyRevisionPlan> = {
    Physics: {
      subject: 'Physics',
      hoursRemaining: hours,
      targetGrade: targetGoal,
      coreFormulas: [
        { name: "Newton's 2nd Law", formula: 'F_net = m · a', whyEssential: 'Guaranteed 15 marks across inclined planes and elevator questions.' },
        { name: "Ohm's Law & Power", formula: 'V = I · R  and  P = V · I = I²R', whyEssential: 'Appears in every series/parallel circuit question.' },
        { name: 'Kinematic Distance', formula: 'v² = u² + 2as', whyEssential: 'Fastest formula to use when flight time is unknown.' },
      ],
      guaranteedQuestions: [
        'Free-body diagram of a block on a 30° friction incline (resolve mg sinθ and mg cosθ).',
        'Compare parallel vs series resistors and calculate total equivalent resistance.',
        'Action-Reaction identification: Why normal force is NOT the reaction to gravity.',
      ],
      skipTopics: [
        'Derivation of planetary orbit Keplerian equations (low return on investment).',
        'Complex non-uniform circular motion proofs.',
        'Historical biographies of scientists.',
      ],
      scheduleBlocks: [
        { time: 'Block 1 (45m)', activity: 'Memorize 3 Core Formulas & do 2 worked examples each', focus: 'High-ROI Formulas' },
        { time: 'Block 2 (45m)', activity: 'Practice the 3 Guaranteed Exam Question patterns', focus: 'Exam Traps' },
        { time: 'Break (15m)', activity: 'Hydrate, no screen time, deep breathing', focus: 'Mental Reset' },
        { time: 'Block 3 (60m)', activity: 'Simulate 1 timed 10-question rapid quiz drill', focus: 'Speed & Execution' },
      ],
    },
    Mathematics: {
      subject: 'Mathematics',
      hoursRemaining: hours,
      targetGrade: targetGoal,
      coreFormulas: [
        { name: 'Quadratic Formula', formula: 'x = (-b ± √(b² - 4ac)) / (2a)', whyEssential: 'Solves any quadratic equation when factoring fails.' },
        { name: 'Vertex Coordinates', formula: 'x = -b / (2a),  y = f(-b/2a)', whyEssential: 'Instant min/max coordinates for word problems.' },
        { name: 'Pythagorean & Trig', formula: 'sin²θ + cos²θ = 1', whyEssential: 'Simplifies trigonometric identities quickly.' },
      ],
      guaranteedQuestions: [
        'Find roots of quadratic with negative coefficients (watch sign distribution!).',
        'Word problem optimizing area or projectile height (find the vertex).',
        'Discriminant analysis (b² - 4ac > 0, = 0, < 0).',
      ],
      skipTopics: [
        'Formal epsilon-delta proofs.',
        'Complex geometric construction steps requiring a compass.',
      ],
      scheduleBlocks: [
        { time: 'Block 1 (45m)', activity: 'Solve 5 quadratic factoring problems with negative signs', focus: 'Error Elimination' },
        { time: 'Block 2 (45m)', activity: 'Master vertex formula on 3 optimization word problems', focus: 'Word Problems' },
        { time: 'Break (15m)', activity: 'Walk around & hydrate', focus: 'Recovery' },
        { time: 'Block 3 (60m)', activity: 'Take timed Math drill in Quiz Generator', focus: 'Pacing' },
      ],
    },
  };

  const currentPlan = emergencyPlans[subject] || emergencyPlans['Physics'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-rose-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with emergency amber/red glow */}
        <div className="p-6 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                🏥
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200">
                  Last-Minute Crash Triage Protocol
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  Study Emergency Mode
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
          <p className="mt-2 text-xs sm:text-sm text-rose-100 leading-relaxed">
            "I have an exam tomorrow!" Don't panic. NEXORA isolates the highest-ROI formulas, guaranteed exam patterns, and low-priority fluff to skip.
          </p>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Exam Subject:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as any)}
              className="font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Hours Left:</span>
            <div className="flex gap-1">
              {[2, 4, 8].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`px-2.5 py-1 rounded-md font-black text-xs ${
                    hours === h
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Protocol Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Section 1: Must-Know Formulas */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-current" />
              <span>Priority 1: Must-Know Exam Formulas (Instant Points)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {currentPlan.coreFormulas.map((f, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{f.name}</span>
                  <p className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 p-1.5 rounded-lg">
                    {f.formula}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">{f.whyEssential}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 3 Guaranteed Question Patterns */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Priority 2: The 3 Most Likely Exam Questions</span>
            </h3>
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2">
              {currentPlan.guaranteedQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Safe to Skip (Stop Wasting Time) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>DO NOT STUDY: Low-ROI Topics to Safely Skip Tonight</span>
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {currentPlan.skipTopics.map((s, i) => (
                <div key={i} className="flex items-center gap-2 line-through opacity-75">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Crash Timeline */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Your {hours}-Hour Emergency Schedule</span>
            </h3>
            <div className="space-y-2">
              {currentPlan.scheduleBlocks.map((block, i) => (
                <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{block.time}: </span>
                    <span className="text-slate-600 dark:text-slate-300">{block.activity}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {block.focus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close Emergency Protocol
          </button>
          <button
            onClick={() => {
              soundFX.playSuccess();
              onClose();
              onNavigateToTab('quiz');
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Start Practice Drill Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
