import React, { useState, useRef, useEffect } from 'react';
import { SnapStudyResult, SubjectType, Flashcard, SnapStudyDraft } from '../types';
import { sampleSnapNotesPresets } from '../data/sampleData';
import { processSnapStudy } from '../services/api';
import {
  Camera,
  Upload,
  Sparkles,
  FileText,
  BrainCircuit,
  FileQuestion,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Video,
  VideoOff,
  BookmarkPlus,
  Trash2,
  PenSquare,
  Plus,
  Clock,
  Flame,
  FileEdit,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface SnapStudyProps {
  onAddFlashcards: (cards: { front: string; back: string; subject: SubjectType; chapter: string }[]) => void;
  onAddXP: (xp: number) => void;
  drafts?: SnapStudyDraft[];
  onDeleteDraft?: (id: string) => void;
  onOpenQuickNoteModal?: () => void;
  activeDraftToLoad?: SnapStudyDraft | null;
}

export const SnapStudy: React.FC<SnapStudyProps> = ({
  onAddFlashcards,
  onAddXP,
  drafts = [],
  onDeleteDraft,
  onOpenQuickNoteModal,
  activeDraftToLoad,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'camera' | 'preset' | 'text' | 'drafts'>('upload');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('Physics');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [notesText, setNotesText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<SnapStudyResult | null>(null);

  // Active result tab
  const [resultTab, setResultTab] = useState<'summary' | 'flashcards' | 'quiz' | 'formulas' | 'eli13' | 'exam_q'>('summary');
  const [isCopied, setIsCopied] = useState(false);
  const [cardsSaved, setCardsSaved] = useState(false);

  // Quiz state inside snapstudy
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // If a draft is passed to load from Quick Note FAB
  useEffect(() => {
    if (activeDraftToLoad) {
      setNotesText(activeDraftToLoad.content);
      setSelectedSubject(activeDraftToLoad.subject);
      setImagePreview(null);
      setActiveInputTab('text');
      soundFX.playSuccess();
    }
  }, [activeDraftToLoad]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access failed:', err);
      setCameraError('Camera access denied or unavailable. You can upload an image or choose a preset note below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
      soundFX.playSuccess();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: (typeof sampleSnapNotesPresets)[0]) => {
    setImagePreview(preset.imageUrl);
    setNotesText(preset.previewText);
    setSelectedSubject(preset.subject as SubjectType);
    soundFX.playChime();
  };

  const handleLoadDraft = (draft: SnapStudyDraft, autoSynthesize: boolean = false) => {
    setNotesText(draft.content);
    setSelectedSubject(draft.subject);
    setImagePreview(null);
    setActiveInputTab('text');
    soundFX.playPop();

    if (autoSynthesize) {
      setTimeout(() => {
        handleProcessCustom(draft.content, draft.subject);
      }, 100);
    }
  };

  const handleProcessCustom = async (textToProcess: string, subjectToProcess: SubjectType) => {
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    setCardsSaved(false);
    setQuizSubmitted(false);
    setQuizAnswers({});

    try {
      const snapResult = await processSnapStudy({
        notesText: textToProcess,
        subjectHint: subjectToProcess,
      });
      setResult(snapResult);
      triggerCelebration();
      onAddXP(50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!imagePreview && !notesText.trim()) return;
    setIsProcessing(true);
    setCardsSaved(false);
    setQuizSubmitted(false);
    setQuizAnswers({});

    try {
      const snapResult = await processSnapStudy({
        imageBase64: imagePreview || undefined,
        mimeType,
        notesText: notesText || undefined,
        subjectHint: selectedSubject,
      });
      setResult(snapResult);
      triggerCelebration();
      onAddXP(50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveFlashcards = () => {
    if (!result || !result.flashcards.length) return;
    onAddFlashcards(
      result.flashcards.map((fc) => ({
        front: fc.front,
        back: fc.back,
        subject: selectedSubject,
        chapter: result.title,
      }))
    );
    setCardsSaved(true);
    soundFX.playSuccess();
  };

  const copyNotesToClipboard = () => {
    if (!result) return;
    const text = `# ${result.title}\n\n## Summary\n${result.summary}\n\n## Key Points\n${result.keyPoints.join('\n')}\n\n## ELI13 Analogy\n${result.eli13Explanation}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 text-white border border-cyan-900/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-300 mb-2">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multimodal Vision, OCR & Fast Drafts</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">SnapStudy</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Snap a photo of your textbook, upload lecture notes, or jot fast drafts with the floating note button. NEXORA automatically generates summaries, flashcards, quizzes, and intuitive explanations in seconds!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenQuickNoteModal && (
              <button
                type="button"
                onClick={onOpenQuickNoteModal}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-bold text-cyan-200 border border-cyan-400/40 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PenSquare className="w-3.5 h-3.5 text-cyan-300" />
                <span>+ Quick Note</span>
              </button>
            )}

            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-cyan-300 border border-white/15">
              +50 XP per Scan
            </span>
          </div>
        </div>
      </div>

      {/* Input Selection & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Input Modalities */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>1. Provide Notes, Photo or Draft</span>
              </h2>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectType)}
                className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Science">General Science</option>
                <option value="Computer Science">Computer Science</option>
                <option value="History">History</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* Input Modality Tabs */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
              <button
                id="snap-tab-upload"
                onClick={() => {
                  setActiveInputTab('upload');
                  stopCamera();
                }}
                className={`py-1.5 rounded-lg transition ${
                  activeInputTab === 'upload' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                Upload
              </button>
              <button
                id="snap-tab-camera"
                onClick={() => {
                  setActiveInputTab('camera');
                  startCamera();
                }}
                className={`py-1.5 rounded-lg transition ${
                  activeInputTab === 'camera' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                Camera
              </button>
              <button
                id="snap-tab-preset"
                onClick={() => {
                  setActiveInputTab('preset');
                  stopCamera();
                }}
                className={`py-1.5 rounded-lg transition ${
                  activeInputTab === 'preset' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                Presets
              </button>
              <button
                id="snap-tab-text"
                onClick={() => {
                  setActiveInputTab('text');
                  stopCamera();
                }}
                className={`py-1.5 rounded-lg transition ${
                  activeInputTab === 'text' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                Type/Paste
              </button>
              <button
                id="snap-tab-drafts"
                onClick={() => {
                  setActiveInputTab('drafts');
                  stopCamera();
                }}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                  activeInputTab === 'drafts' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                <span>Drafts</span>
                {drafts.length > 0 && (
                  <span className="px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">
                    {drafts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Upload Area */}
            {activeInputTab === 'upload' && (
              <label
                htmlFor="snap-file-input"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 rounded-xl p-6 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition group"
              >
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 transition mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Click to browse or drag & drop note photo
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG, WEBP</p>
                <input
                  id="snap-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Live Camera Viewfinder */}
            {activeInputTab === 'camera' && (
              <div className="space-y-3">
                {cameraError ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                    <p className="font-semibold mb-2">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-700">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-4 border border-cyan-400/50 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                      <span className="text-[10px] bg-black/60 text-cyan-300 px-1.5 py-0.5 rounded self-start">
                        Align Notes / Page in Frame
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-cyan-500" />
                    Restart
                  </button>
                  <button
                    id="snap-capture-btn"
                    onClick={capturePhoto}
                    disabled={!isCameraActive}
                    className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Presets */}
            {activeInputTab === 'preset' && (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500">Pick a pre-scanned handwritten note to test instantly:</p>
                {sampleSnapNotesPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500 bg-slate-50 dark:bg-slate-800/40 transition flex items-center gap-3 group cursor-pointer"
                  >
                    <img
                      src={preset.imageUrl}
                      alt={preset.title}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                        {preset.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{preset.subject}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Direct Typed Notes */}
            {activeInputTab === 'text' && (
              <div className="space-y-2">
                {drafts.length > 0 && (
                  <div className="p-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-900/40 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-cyan-800 dark:text-cyan-200 font-medium">
                      💡 {drafts.length} quick notes saved in drafts.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveInputTab('drafts')}
                      className="text-[10px] font-bold text-cyan-600 dark:text-cyan-300 hover:underline cursor-pointer"
                    >
                      View Drafts →
                    </button>
                  </div>
                )}

                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Type or paste textbook excerpts, formulas, or raw notes here..."
                  rows={6}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
              </div>
            )}

            {/* Saved SnapStudy Drafts Tab */}
            {activeInputTab === 'drafts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Saved Fast Notes & Drafts ({drafts.length})
                  </span>
                  {onOpenQuickNoteModal && (
                    <button
                      type="button"
                      onClick={onOpenQuickNoteModal}
                      className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Jot New Note</span>
                    </button>
                  )}
                </div>

                {drafts.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <PenSquare className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No Draft Notes Saved Yet
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Use the <strong>Floating Quick Note Button</strong> (or press Alt+N) anywhere in the app to jot down fast notes that appear here!
                    </p>
                    {onOpenQuickNoteModal && (
                      <button
                        type="button"
                        onClick={onOpenQuickNoteModal}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shadow-xs hover:bg-cyan-400 transition cursor-pointer"
                      >
                        Jot Note Now
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500 transition space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                {draft.subject}
                              </span>
                              {draft.priority === 'high' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> High
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(draft.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                              {draft.title}
                            </h4>
                          </div>

                          {onDeleteDraft && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDraft(draft.id);
                                soundFX.playPop();
                              }}
                              className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 font-mono bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {draft.content}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleLoadDraft(draft, false)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>Load into Editor</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLoadDraft(draft, true)}
                            className="px-3 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-cyan-200" />
                            <span>Synthesize AI ⚡</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Image Preview thumbnail if selected */}
            {imagePreview && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={imagePreview}
                    alt="Scan preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Image Loaded Ready</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready for Vision Synthesis</p>
                  </div>
                </div>
                <button
                  onClick={() => setImagePreview(null)}
                  className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Action Trigger Button */}
            <button
              id="snap-process-btn"
              disabled={(!imagePreview && !notesText.trim()) || isProcessing}
              onClick={handleProcess}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-cyan-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Synthesizing with Gemini OCR...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200" />
                  <span>Generate Summary, Quiz & Flashcards</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 7 Cols: Synthesized Result Canvas */}
        <div className="lg:col-span-7">
          {!result ? (
            <div className="h-full min-h-[420px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white/40 dark:bg-slate-900/40">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Awaiting Note Upload, Capture or Draft
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Upload textbook photos, scan handwritten notes, or load your saved drafts. The AI will extract formulas, generate flashcards, create quizzes, and explain tricky concepts.
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5 animate-fadeIn">
              {/* Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded">
                    Extracted Topic
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {result.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyNotesToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setResult(null);
                      setImagePreview(null);
                      setNotesText('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Output Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setResultTab('summary')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    resultTab === 'summary' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Summary & Key Points
                </button>
                <button
                  onClick={() => setResultTab('flashcards')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    resultTab === 'flashcards' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Flashcards ({result.flashcards.length})
                </button>
                <button
                  onClick={() => setResultTab('quiz')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    resultTab === 'quiz' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Quick Check ({result.quizQuestions.length})
                </button>
                <button
                  onClick={() => setResultTab('formulas')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    resultTab === 'formulas' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Formulas ({result.formulas.length})
                </button>
                <button
                  onClick={() => setResultTab('eli13')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    resultTab === 'eli13' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  ELI13 Analogy
                </button>
                <button
                  onClick={() => setResultTab('exam_q')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    resultTab === 'exam_q' ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Exam Traps
                </button>
              </div>

              {/* Tab 1: Summary */}
              {resultTab === 'summary' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Summary</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Essential Takeaways</h4>
                    <ul className="space-y-1.5">
                      {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Flashcards */}
              {resultTab === 'flashcards' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Auto-extracted Q&A cards from your notes:</p>
                    <button
                      onClick={handleSaveFlashcards}
                      disabled={cardsSaved}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {cardsSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved to Revision Deck</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Save All to Flashcard Deck</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.flashcards.map((fc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Card #{idx + 1}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Front & Back</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Q: {fc.front}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          A: {fc.back}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Quiz */}
              {resultTab === 'quiz' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Test how well you understand these notes right now:</p>
                  <div className="space-y-3">
                    {result.quizQuestions.map((q, idx) => {
                      const selected = quizAnswers[q.id];
                      const isCorrect = selected === q.correctAnswer;
                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5"
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {idx + 1}. {q.question}
                          </p>
                          <div className="space-y-1.5">
                            {q.options?.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                className={`w-full text-left p-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                  selected === opt
                                    ? quizSubmitted
                                      ? isCorrect
                                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                                        : 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-800 dark:text-rose-200'
                                      : 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {quizSubmitted && (
                            <div className="text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-slate-800 dark:text-slate-200">Explanation: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      onClick={() => {
                        setQuizSubmitted(true);
                        soundFX.playSuccess();
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
                    >
                      Retry Quiz
                    </button>
                  )}
                </div>
              )}

              {/* Tab 4: Formulas */}
              {resultTab === 'formulas' && (
                <div className="space-y-3">
                  {result.formulas.length === 0 ? (
                    <p className="text-xs text-slate-500">No specific mathematical formulas detected in these notes.</p>
                  ) : (
                    result.formulas.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">{f.name}</span>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 font-mono text-xs font-bold text-indigo-600 dark:text-cyan-300 border border-slate-200 dark:border-slate-700">
                          {f.formula}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.explanation}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: ELI13 */}
              {resultTab === 'eli13' && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border border-cyan-200 dark:border-cyan-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                      Explain Like I'm 13 Analogy
                    </h4>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {result.eli13Explanation}
                  </p>
                </div>
              )}

              {/* Tab 6: Exam Traps */}
              {resultTab === 'exam_q' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Common exam mistakes students make on this topic:</p>
                  {result.commonExamMistakes.map((mistake, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-200 space-y-1"
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Trap #{idx + 1}
                      </span>
                      <p className="pl-3.5">{mistake}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
