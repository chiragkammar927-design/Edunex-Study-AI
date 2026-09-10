import React, { useState, useEffect, useRef } from 'react';
import { SubjectType, SnapStudyDraft } from '../types';
import {
  X,
  PenSquare,
  Sparkles,
  Zap,
  BookmarkPlus,
  BookOpen,
  Check,
  List,
  Flame,
  HelpCircle,
  Clock,
  ArrowRight,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: (draft: SnapStudyDraft, openInSnapStudy?: boolean) => void;
  onAddXP?: (amount: number) => void;
  initialSubject?: SubjectType;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  onSaveDraft,
  onAddXP,
  initialSubject = 'Physics',
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectType>(initialSubject);
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'normal'>('medium');
  const [selectedTag, setSelectedTag] = useState<string>('Fast Note');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSavedSuccess(false);
      // Auto-focus title input when modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (Ctrl+Enter to save, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, subject, content, priority, selectedTag]);

  if (!isOpen) return null;

  const insertSnippet = (prefix: string, suffix: string = '') => {
    soundFX.playPop();
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  const applyTemplate = (tplTitle: string, tplSubject: SubjectType, tplContent: string) => {
    soundFX.playChime();
    setTitle(tplTitle);
    setSubject(tplSubject);
    setContent(tplContent);
    contentTextareaRef.current?.focus();
  };

  const handleSave = (openInSnapStudy: boolean = false) => {
    if (!content.trim() && !title.trim()) return;

    const finalTitle = title.trim() || `Quick Note - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    
    const newDraft: SnapStudyDraft = {
      id: `draft-${Date.now()}`,
      title: finalTitle,
      subject,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      tags: [selectedTag, priority === 'high' ? 'High Priority' : 'Draft'],
      priority,
    };

    onSaveDraft(newDraft, openInSnapStudy);
    soundFX.playSuccess();
    if (onAddXP) onAddXP(15);
    triggerCelebration();

    setIsSavedSuccess(true);

    if (!openInSnapStudy) {
      setTimeout(() => {
        // Reset form
        setTitle('');
        setContent('');
        onClose();
      }, 700);
    } else {
      // Reset form and close
      setTitle('');
      setContent('');
      onClose();
    }
  };

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        id="quick-note-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-50/70 via-blue-50/40 to-indigo-50/30 dark:from-cyan-950/30 dark:via-blue-950/20 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <PenSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Jot Quick Study Note
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300/40">
                  SnapStudy Draft
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instantly capture study notes, equations, or excerpts to synthesize with AI later.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Quick Preset Starters */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Quick Note Starters
              </span>
              <span>1-click templates</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Maxwell’s Equations & EM Waves',
                    'Physics',
                    '• Gauss’s Law: ∇ · E = ρ / ε₀ (Electric charges create electric fields)\n• Gauss’s Magnetism: ∇ · B = 0 (No magnetic monopoles exist)\n• Faraday’s Law: ∇ × E = -∂B/∂t (Changing magnetic flux induces EMF)\n• Ampere-Maxwell: ∇ × B = μ₀(J + ε₀ ∂E/∂t) (Currents and changing E-fields create B-fields)\n\nKey insight: Speed of light c = 1 / √(μ₀ε₀) = 3 × 10⁸ m/s'
                  )
                }
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer text-xs group"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 block truncate">
                  ⚡ Physics Laws
                </span>
                <span className="text-[10px] text-slate-500">EM Equations</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Integration by Parts (LIATE Rule)',
                    'Mathematics',
                    'Formula: ∫ u dv = u v - ∫ v du\n\nLIATE Priority for choosing u:\n1. L = Logarithmic (ln x)\n2. I = Inverse Trig (arctan x)\n3. A = Algebraic (x², 3x)\n4. T = Trigonometric (sin x, cos x)\n5. E = Exponential (eˣ)\n\nExample: ∫ x · eˣ dx -> u = x, dv = eˣ dx -> du = dx, v = eˣ -> x·eˣ - eˣ + C'
                  )
                }
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer text-xs group"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 block truncate">
                  📐 Math Method
                </span>
                <span className="text-[10px] text-slate-500">LIATE Rule</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Cellular Respiration & ATP Yield',
                    'Biology',
                    'Overall Equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~30-32 ATP\n\nStages:\n1. Glycolysis (Cytoplasm): 1 Glucose → 2 Pyruvate + 2 NADH + 2 net ATP (Substrate-level phosphorylation)\n2. Pyruvate Oxidation (Mitochondrial matrix): 2 Pyruvate → 2 Acetyl-CoA + 2 NADH + 2 CO₂\n3. Krebs/TCA Cycle (Matrix): Yields 6 NADH, 2 FADH₂, 2 ATP, 4 CO₂\n4. Oxidative Phosphorylation (Inner membrane): Electron Transport Chain drives proton gradient across cristae → ATP Synthase produces ~26-28 ATP.'
                  )
                }
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer text-xs group"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 block truncate">
                  🧬 Bio Mechanism
                </span>
                <span className="text-[10px] text-slate-500">ATP Respiration</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Le Chatelier’s Principle & Equilibrium',
                    'Chemistry',
                    'Principle: When a dynamic chemical equilibrium is subjected to stress (concentration, temperature, pressure), the position of equilibrium shifts to counteract the stress.\n\nKey Rules:\n• Increase Reactant concentration → shifts RIGHT towards products\n• Increase Pressure → shifts to side with FEWER gas moles\n• Exothermic reaction (ΔH < 0): Adding heat shifts LEFT (favors reactants)\n• Endothermic reaction (ΔH > 0): Adding heat shifts RIGHT (favors products)\n• Catalysts do NOT change equilibrium position (only speed up attainment rate).'
                  )
                }
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-800 text-left transition cursor-pointer text-xs group"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 block truncate">
                  🧪 Chem Equilibrium
                </span>
                <span className="text-[10px] text-slate-500">Le Chatelier</span>
              </button>
            </div>
          </div>

          {/* Title & Subject Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label
                htmlFor="quick-note-title"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>Note Title / Topic</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                id="quick-note-title"
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kepler’s Laws, Photosynthesis, Quadratic roots..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="quick-note-subject"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3 text-cyan-500" />
                <span>Subject</span>
              </label>
              <select
                id="quick-note-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition"
              >
                <option value="Physics">⚡ Physics</option>
                <option value="Mathematics">📐 Mathematics</option>
                <option value="Chemistry">🧪 Chemistry</option>
                <option value="Biology">🧬 Biology</option>
                <option value="Science">🔬 General Science</option>
                <option value="Computer Science">💻 Computer Science</option>
                <option value="History">🏛️ History</option>
                <option value="English">📚 English</option>
              </select>
            </div>
          </div>

          {/* Quick Tags / Priority Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Tag:</span>
              {['Fast Note', 'Exam Prep', 'Key Formula', 'Misconception', 'Question'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setSelectedTag(tag);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Priority:</span>
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  priority === 'high'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>High</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Quick Formatting Snippets Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="quick-note-content"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                <span>Note Content & Excerpts</span>
              </label>

              {/* Snippet Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertSnippet('• ')}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  title="Insert Bullet Point"
                >
                  • Bullet
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$$ ', ' $$')}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  title="Insert Math Formula Block"
                >
                  $$ Formula
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('**', '**')}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  title="Bold Highlight"
                >
                  **Bold**
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('\nProblem: ', '\nSolution: ')}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  title="Sample Problem Block"
                >
                  Example
                </button>
              </div>
            </div>

            {/* Content Textarea */}
            <div className="relative">
              <textarea
                id="quick-note-content"
                ref={contentTextareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste raw notes, theorems, formulas, or questions here. SnapStudy can automatically turn this into quizzes, flashcards, and ELI13 summaries..."
                rows={7}
                className="w-full p-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans leading-relaxed transition"
              />
              <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-medium pointer-events-none">
                {wordCount} words • {charCount} chars
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Ctrl+Enter</kbd> to save instantly (+15 XP)</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Cancel
            </button>

            {/* Save to SnapStudy Drafts */}
            <button
              type="button"
              id="save-quick-note-draft-btn"
              disabled={!content.trim() && !title.trim()}
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-cyan-300 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-extrabold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Saved to Drafts!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            {/* Save & Open in SnapStudy */}
            <button
              type="button"
              id="save-and-open-snapstudy-btn"
              disabled={!content.trim() && !title.trim()}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Save & Open SnapStudy ⚡</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
