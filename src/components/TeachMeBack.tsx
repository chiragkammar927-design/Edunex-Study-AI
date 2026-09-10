import React, { useState, useRef, useEffect } from 'react';
import { SubjectType, TeachMeBackEvaluation } from '../types';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BookOpen,
  Award,
  ArrowRight,
  HelpCircle,
  Flame,
  Volume2,
  Lightbulb,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface TeachMeBackProps {
  onAddXP: (xp: number) => void;
  presetTopic?: string;
  presetSubject?: SubjectType;
}

const PRESET_TOPICS: { topic: string; subject: SubjectType; prompt: string; keyCheckpoints: string[] }[] = [
  {
    topic: "Newton's Third Law of Motion",
    subject: 'Physics',
    prompt: 'Explain why when you jump off a small boat, the boat moves backwards. Why don\'t action and reaction forces cancel each other out?',
    keyCheckpoints: ['Forces occur in equal and opposite pairs', 'Forces act on DIFFERENT objects', 'Net acceleration depends on individual masses (F=ma)'],
  },
  {
    topic: "Ohm's Law & Circuit Resistance",
    subject: 'Physics',
    prompt: 'Explain how voltage, current, and resistance interact in a simple circuit. What physically restricts the flow of electrons?',
    keyCheckpoints: ['Current is directly proportional to voltage (I = V/R)', 'Resistance is collisions between flowing electrons and ionic lattice', 'Power dissipation as heat'],
  },
  {
    topic: 'Photosynthesis: Light vs Dark Reactions',
    subject: 'Biology',
    prompt: 'Explain how a plant converts sunlight and water into glucose. What is the difference between light-dependent and Calvin cycle stages?',
    keyCheckpoints: ['Chlorophyll absorbs photons in thylakoid membrane', 'Photolysis splits H2O producing O2 and ATP/NADPH', 'Calvin cycle uses CO2 to synthesize sugars'],
  },
  {
    topic: 'Quadratic Equations & Factoring Negatives',
    subject: 'Mathematics',
    prompt: 'Explain how to factor a quadratic expression like x² - 5x - 24, especially how you choose the signs of the two factors.',
    keyCheckpoints: ['Find two numbers whose product is c (-24) and sum is b (-5)', 'Sign rule: negative product means one (+) and one (-)', 'The larger absolute value gets the sign of b'],
  },
  {
    topic: 'Redox Reactions & Electron Transfer',
    subject: 'Chemistry',
    prompt: 'Explain what happens during oxidation and reduction. Use OIL RIG (Oxidation Is Loss, Reduction Is Gain) in your explanation.',
    keyCheckpoints: ['Oxidation is loss of electrons', 'Reduction is gain of electrons', 'Reducing agent gets oxidized, oxidizing agent gets reduced'],
  },
];

export const TeachMeBack: React.FC<TeachMeBackProps> = ({
  onAddXP,
  presetTopic,
  presetSubject = 'Physics',
}) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(() => {
    if (presetTopic) {
      const idx = PRESET_TOPICS.findIndex((p) => p.topic.toLowerCase().includes(presetTopic.toLowerCase()));
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const activeTopic = PRESET_TOPICS[selectedPresetIdx];
  const [studentExplanation, setStudentExplanation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<TeachMeBackEvaluation | null>(null);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setStudentExplanation((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your explanation.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      soundFX.playPop();
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        soundFX.playSuccess();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Simulate AI evaluation of the explanation
  const handleEvaluateExplanation = () => {
    if (!studentExplanation.trim() || studentExplanation.length < 20) {
      alert('Please provide a more complete explanation (at least a couple sentences) so the AI can properly test your conceptual depth.');
      return;
    }

    setIsAnalyzing(true);
    soundFX.playPop();

    setTimeout(() => {
      const text = studentExplanation.toLowerCase();
      let score = 70;
      const understood: string[] = [];
      const missing: string[] = [];
      const misconceptions: string[] = [];

      if (activeTopic.topic.includes('Newton')) {
        if (text.includes('equal') && text.includes('opposite')) {
          understood.push('Correctly articulated that forces exist in pairs of equal magnitude and opposite direction.');
          score += 10;
        } else {
          missing.push('Did not clearly specify that the forces are equal in magnitude and opposite in direction.');
        }

        if (text.includes('different') || text.includes('two') || text.includes('separate') || text.includes('other')) {
          understood.push('Recognized the critical condition: action and reaction act on two DIFFERENT bodies, which is why they do not cancel out into a zero net force.');
          score += 15;
        } else {
          misconceptions.push('Common Trap Detected: You did not explicitly clarify that the action and reaction act on separate bodies. If they acted on the same body, nothing could ever accelerate!');
          score -= 10;
        }

        if (text.includes('mass') || text.includes('accelerat') || text.includes('f=ma') || text.includes('boat')) {
          understood.push('Accurately connected acceleration differences to mass (F = ma), explaining why the boat moves noticeably while the person moves forward.');
          score += 5;
        } else {
          missing.push('Could mention how differing masses explain why one object accelerates much more than the other.');
        }
      } else if (activeTopic.topic.includes("Ohm's")) {
        if (text.includes('voltage') && text.includes('current')) {
          understood.push('Grasped the direct proportional relationship between potential difference (voltage) and current.');
          score += 15;
        }
        if (text.includes('electron') || text.includes('collis') || text.includes('resist') || text.includes('friction')) {
          understood.push('Described the physical microscopic origin of resistance as electrons colliding with metal ions.');
          score += 15;
        } else {
          missing.push('Did not describe what physically causes electrical resistance on an atomic level (lattice collisions).');
        }
      } else {
        understood.push('Clear foundational description of the core mechanism and primary terms.');
        understood.push('Good logical sequence explaining cause and effect.');
        missing.push('Could expand on the exact energy transformation or mathematical formula constraints.');
        score = Math.min(95, 75 + Math.floor(studentExplanation.length / 40));
      }

      const finalScore = Math.max(50, Math.min(98, score));

      const evalResult: TeachMeBackEvaluation = {
        topic: activeTopic.topic,
        subject: activeTopic.subject,
        understandingScore: finalScore,
        understoodPoints: understood.length > 0 ? understood : ['You identified the primary concept and stated the main relationship.'],
        missingDetails: missing.length > 0 ? missing : ['Include specific edge-case conditions or unit dimensions to reach 100%.'],
        misunderstandings: misconceptions,
        coachSummary:
          finalScore >= 85
            ? 'Outstanding articulation! You taught this with clarity and demonstrated intuitive mastery, not just rote memorization.'
            : 'Good effort! You grasp the basic premise, but need to be precise about how and where the interaction occurs.',
        analogyOrFix:
          activeTopic.topic.includes('Newton')
            ? 'Think of it this way: Earth pulls down on you (Action: Earth on You), and you pull up on Earth (Reaction: You on Earth). They NEVER act on the same free-body diagram!'
            : 'Think of current like water flow: Voltage is the water pressure, Resistance is a narrow pipe constriction, and Current is the volume of water passing per second.',
        xpEarned: 75,
      };

      setEvaluation(evalResult);
      setIsAnalyzing(false);
      onAddXP(evalResult.xpEarned);
      triggerCelebration();
    }, 1200);
  };

  const handleReset = () => {
    setEvaluation(null);
    setStudentExplanation('');
    soundFX.playPop();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>The Feynman Technique in Action</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Teach Me Back 🗣️
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              If you can't explain it simply, you don't understand it well enough. Explain a concept in your own words to the AI. We'll verify what you understand, pinpoint missed details, and flag misconceptions.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
              🎯
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-200 uppercase">Evaluation Standard</p>
              <p className="text-xs font-bold text-white">🟢 Understood • 🟡 Missing • 🔴 Traps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Selector Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          Select a Concept to Teach:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={preset.topic}
              onClick={() => {
                setSelectedPresetIdx(idx);
                setEvaluation(null);
                setStudentExplanation('');
                soundFX.playPop();
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                selectedPresetIdx === idx
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/30'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {preset.subject}
                </span>
                {selectedPresetIdx === idx && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                {preset.topic}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Teaching Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7: Explanation Input Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Your Teaching Challenge:
                </span>
                <span className="text-[11px] text-slate-400">
                  {studentExplanation.length} characters
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {activeTopic.topic}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                💡 <strong className="text-slate-900 dark:text-white">Prompt:</strong> {activeTopic.prompt}
              </p>
            </div>

            {/* Explanation textarea */}
            <div className="relative">
              <textarea
                value={studentExplanation}
                onChange={(e) => setStudentExplanation(e.target.value)}
                placeholder="Teach it to the AI in plain English... e.g. 'Newton's third law says whenever object A pushes object B, object B pushes back on object A with the exact same strength but in the opposite direction. They don't cancel out because...'"
                rows={7}
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition resize-none leading-relaxed"
              />

              {isRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Listening...</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-xs ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-500" />}
                <span>{isRecording ? 'Stop Voice Recording' : 'Speak Explanation (Voice)'}</span>
              </button>

              <div className="flex items-center gap-2">
                {studentExplanation && (
                  <button
                    type="button"
                    onClick={() => setStudentExplanation('')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleEvaluateExplanation}
                  disabled={isAnalyzing || !studentExplanation.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>AI Analyzing Concept...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Evaluate My Understanding</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Key Checkpoints Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>What great explanations cover:</span>
            </p>
            <div className="space-y-1.5">
              {activeTopic.keyCheckpoints.map((pt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5: AI Evaluation Results Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {evaluation ? (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/50 shadow-xl space-y-5 animate-fadeIn">
              {/* Score Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Understanding Score
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {evaluation.understandingScore}%
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {evaluation.understandingScore >= 80 ? 'Mastery Level' : 'Developing'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-black">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>+{evaluation.xpEarned} XP</span>
                </div>
              </div>

              {/* 🟢 Concept Understood */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>🟢 Concept Understood</span>
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                  {evaluation.understoodPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 🟡 Missing Detail */}
              {evaluation.missingDetails.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>🟡 Missing Detail (Room to elevate)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                    {evaluation.missingDetails.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🔴 Misunderstanding Detected */}
              {evaluation.misunderstandings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-rose-300">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>🔴 Misunderstanding Detected</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                    {evaluation.misunderstandings.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Intuitive Analogy / Fix */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  🧠 AI Coach Mental Model:
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{evaluation.analogyOrFix}"
                </p>
              </div>

              {/* Retry / Refine Button */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refine & Try Again for 100%</span>
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                🎓
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Waiting for Your Teaching Explanation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Type your thoughts or press the microphone button to explain this concept in plain words. The AI will provide an immediate 3-tier diagnostic breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
