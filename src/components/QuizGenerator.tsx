import React, { useState, useEffect, useRef } from 'react';
import { SubjectType, Question, QuizResult } from '../types';
import { generateCustomQuiz } from '../services/api';
import {
  FileQuestion,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Award,
  Zap,
  ArrowRight,
  HelpCircle,
  Volume2,
  Mic,
  MicOff,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface QuizGeneratorProps {
  onAddXP: (xp: number) => void;
  onRecordQuizResult: (result: QuizResult) => void;
  presetSubject?: SubjectType;
  presetChapter?: string;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  onAddXP,
  onRecordQuizResult,
  presetSubject = 'Mathematics',
  presetChapter = 'Quadratic Equations',
}) => {
  const [subject, setSubject] = useState<SubjectType>(presetSubject);
  const [chapter, setChapter] = useState<string>(presetChapter);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Exam Drill'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [id: string]: string }>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = 'en-US';
        rec.onresult = (e: any) => {
          const spoken = e.results[0][0].transcript.toLowerCase();
          setIsListeningVoice(false);
          handleVoiceAnswer(spoken);
        };
        rec.onerror = () => setIsListeningVoice(false);
        rec.onend = () => setIsListeningVoice(false);
        recognitionRef.current = rec;
      }
    }
  }, [quizQuestions, currentIdx]);

  // Read current question aloud via SpeechSynthesis
  const speakCurrentQuestion = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !quizQuestions) return;
    window.speechSynthesis.cancel();
    const q = quizQuestions[currentIdx];
    const optionsText = (q.options || [])
      .map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`)
      .join('. ');
    const text = `Question ${currentIdx + 1}: ${q.question}. Options are: ${optionsText}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    soundFX.playPop();
  };

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not available in your browser. You can click on the answer options directly.');
      return;
    }
    if (isListeningVoice) {
      recognitionRef.current.stop();
      setIsListeningVoice(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningVoice(true);
        soundFX.playPop();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVoiceAnswer = (spokenText: string) => {
    if (!quizQuestions) return;
    const currentQ = quizQuestions[currentIdx];
    const options = currentQ.options || [];

    // Match "option A", "A", "first", or text match
    let matchedIndex = -1;
    if (spokenText.includes('option a') || spokenText === 'a' || spokenText.includes('first')) matchedIndex = 0;
    else if (spokenText.includes('option b') || spokenText === 'b' || spokenText.includes('second')) matchedIndex = 1;
    else if (spokenText.includes('option c') || spokenText === 'c' || spokenText.includes('third')) matchedIndex = 2;
    else if (spokenText.includes('option d') || spokenText === 'd' || spokenText.includes('fourth')) matchedIndex = 3;
    else {
      // Direct text matching
      matchedIndex = options.findIndex((opt) => opt.toLowerCase().includes(spokenText) || spokenText.includes(opt.toLowerCase()));
    }

    if (matchedIndex >= 0 && options[matchedIndex]) {
      selectAnswer(options[matchedIndex]);
      soundFX.playSuccess();
    }
  };

  const startQuiz = async () => {
    setIsGenerating(true);
    setIsQuizCompleted(false);
    setUserAnswers({});
    setCurrentIdx(0);
    try {
      const data = await generateCustomQuiz(subject, chapter, difficulty, questionCount);
      setQuizQuestions(data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (ans: string) => {
    if (!quizQuestions) return;
    const currentQ = quizQuestions[currentIdx];
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: ans }));
  };

  const handleNext = () => {
    if (!quizQuestions) return;
    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!quizQuestions) return;
    let correct = 0;
    const mistakes: QuizResult['mistakeAnalysis'] = [];
    const weakTopics: string[] = [];

    quizQuestions.forEach((q) => {
      const userAns = userAnswers[q.id] || '(No Answer)';
      if (userAns === q.correctAnswer) {
        correct++;
      } else {
        mistakes.push({
          question: q.question,
          yourAnswer: userAns,
          correctAnswer: q.correctAnswer,
          whyWrong: q.explanation,
          conceptToReview: chapter,
        });
        weakTopics.push(`${subject}: ${chapter}`);
      }
    });

    const percent = Math.round((correct / quizQuestions.length) * 100);
    const xp = correct * 20 + 20;

    const res: QuizResult = {
      quizId: 'quiz-' + Date.now(),
      title: `${subject} - ${chapter}`,
      subject,
      totalQuestions: quizQuestions.length,
      correctCount: correct,
      percentage: percent,
      timeSpentSeconds: 120,
      weakTopicsIdentified: Array.from(new Set(weakTopics)),
      mistakeAnalysis: mistakes,
      xpEarned: xp,
    };

    setQuizResult(res);
    setIsQuizCompleted(true);
    onAddXP(xp);
    onRecordQuizResult(res);

    if (percent >= 70) {
      triggerCelebration();
    } else {
      soundFX.playSuccess();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Quiz Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 text-white border border-indigo-900/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 mb-2">
              <FileQuestion className="w-3.5 h-3.5 text-cyan-300" />
              <span>Adaptive Testing Platform</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">AI Quiz Generator</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Generate custom MCQs, True/False, and conceptual diagnostic questions tailored to your target exam difficulty.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Config Form (if no active quiz) */}
      {!quizQuestions && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs max-w-2xl mx-auto space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Customize Your Practice Quiz</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
                <option value="History">History</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Chapter / Topic
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Quadratic Equations, Newton's 2nd Law..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="Easy">Easy (Fundamentals)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="Hard">Hard (Edge Cases)</option>
                  <option value="Exam Drill">Exam Drill (Timed Challenge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value={3}>3 Questions (Express)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <button
              id="generate-quiz-btn"
              disabled={isGenerating}
              onClick={startQuiz}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Adaptive Quiz...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Start Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Quiz Taking Canvas */}
      {quizQuestions && !isQuizCompleted && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {subject} • {difficulty}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{chapter}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Question {currentIdx + 1} of {quizQuestions.length}
              </span>
              <button
                onClick={() => setQuizQuestions(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Quit
              </button>
            </div>
          </div>

          {/* Current Question */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {quizQuestions[currentIdx].question}
              </p>

              {/* Voice Read Aloud & Voice Answer Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  title="Read question aloud (TTS)"
                  onClick={speakCurrentQuestion}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Speak your answer (Voice)"
                  onClick={toggleVoiceListen}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    isListeningVoice
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-500" />}
                  <span className="hidden sm:inline">{isListeningVoice ? 'Listening...' : 'Voice Answer'}</span>
                </button>
              </div>
            </div>

            {isListeningVoice && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Say "Option A", "B", "C", "D", or read your chosen answer out loud...</span>
              </div>
            )}

            {quizQuestions[currentIdx].hint && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Hint: {quizQuestions[currentIdx].hint}</span>
              </div>
            )}

            {/* Options */}
            <div className="space-y-2.5">
              {(quizQuestions[currentIdx].options || []).map((opt) => {
                const isSelected = userAnswers[quizQuestions[currentIdx].id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => selectAnswer(opt)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((p) => p - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={!userAnswers[quizQuestions[currentIdx].id]}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{currentIdx + 1 < quizQuestions.length ? 'Next Question' : 'Submit & See Analysis'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Post-Quiz Result & Mistake Analysis */}
      {isQuizCompleted && quizResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Quiz Completed! +{quizResult.xpEarned} XP</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              {quizResult.percentage}% Score
            </h2>
            <p className="text-xs text-slate-500">
              You answered {quizResult.correctCount} out of {quizResult.totalQuestions} questions correctly in {quizResult.title}.
            </p>
          </div>

          {/* Mistake Analysis Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Mistake Analysis & Weakness Detection</span>
            </h3>

            {quizResult.mistakeAnalysis.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Flawless run! No cognitive errors or misconceptions detected in this chapter.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {quizResult.mistakeAnalysis.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2"
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {m.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-rose-100/70 dark:bg-rose-950 text-rose-800 dark:text-rose-200">
                        <span className="font-semibold">Your Answer:</span> {m.yourAnswer}
                      </div>
                      <div className="p-2 rounded bg-emerald-100/70 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                        <span className="font-semibold">Correct Answer:</span> {m.correctAnswer}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
                      <strong>AI Explanation:</strong> {m.whyWrong}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setQuizQuestions(null);
                setIsQuizCompleted(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              New Quiz Configuration
            </button>
            <button
              onClick={startQuiz}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
