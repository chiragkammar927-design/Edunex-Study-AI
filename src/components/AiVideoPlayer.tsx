import React, { useState, useEffect, useRef } from 'react';
import {
  AiVideoLesson,
  AiVideoScene,
  VideoStudyNote,
  StudentProfile,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Bookmark,
  Share2,
  Download,
  Flame,
  Music,
  GraduationCap,
  Layers,
  ChevronRight,
  Send,
  Plus,
  ArrowRight,
  BrainCircuit,
  Lightbulb,
  ShieldAlert,
  Clock,
  ThumbsUp,
  X,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface AiVideoPlayerProps {
  video: AiVideoLesson;
  profile: StudentProfile;
  onClose: () => void;
  onAddXP: (xp: number) => void;
  onSaveToFlashcards?: (flashcards: { front: string; back: string }[]) => void;
  onAddStudyMinutes?: (minutes: number) => void;
}

export const AiVideoPlayer: React.FC<AiVideoPlayerProps> = ({
  video,
  profile,
  onClose,
  onAddXP,
  onSaveToFlashcards,
  onAddStudyMinutes,
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 100 within current scene
  const [totalElapsedTimeSec, setTotalElapsedTimeSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoFiActive, setIsLoFiActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active side panel tab
  const [sideTab, setSideTab] = useState<'transcript' | 'notes' | 'flashcards' | 'takeaways'>('transcript');

  // Interactive Quiz checkpoint state
  const [activeQuizScene, setActiveQuizScene] = useState<AiVideoScene | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);

  // Notes state
  const [notes, setNotes] = useState<VideoStudyNote[]>(() => {
    const saved = localStorage.getItem(`nexora_notes_${video.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<'important' | 'question' | 'formula' | 'summary'>('important');

  // Video likes / saved
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 120);

  // Canvas Ref for visual simulation rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const loFiOscillatorsRef = useRef<{ gain: GainNode; stop: () => void } | null>(null);

  const currentScene = video.scenes[currentSceneIndex] || video.scenes[0];
  const totalVideoDurationSec = video.scenes.reduce((acc, s) => acc + s.durationSec, 0);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(`nexora_notes_${video.id}`, JSON.stringify(notes));
  }, [notes, video.id]);

  // Speech Synthesis Controller
  useEffect(() => {
    if (!isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (isMuted || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentScene.narration);
    utterance.rate = playbackSpeed;
    utterance.pitch = video.voiceTone === 'calm_professor' ? 0.95 : video.voiceTone === 'energetic_mentor' ? 1.05 : 1.0;

    // Pick a clear English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang.startsWith('en')) ||
      voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentSceneIndex, isPlaying, isMuted, playbackSpeed, currentScene.narration, video.voiceTone]);

  // Main playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 100;
    const sceneDuration = currentScene.durationSec || 30;
    const progressIncrement = (intervalMs / (sceneDuration * 1000)) * 100 * playbackSpeed;

    const timer = setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + progressIncrement;
        if (next >= 100) {
          // Check if current scene has an uncompleted quiz checkpoint
          if (currentScene.checkpointQuiz && !completedQuizzes.includes(currentScene.id)) {
            setIsPlaying(false);
            setActiveQuizScene(currentScene);
            soundFX.playChime();
            return 100;
          }

          // Advance to next scene
          if (currentSceneIndex < video.scenes.length - 1) {
            setCurrentSceneIndex((idx) => idx + 1);
            setTotalElapsedTimeSec((t) => t + currentScene.durationSec);
            soundFX.playSuccess();
            return 0;
          } else {
            // Video Finished!
            setIsPlaying(false);
            triggerCelebration();
            soundFX.playSuccess();
            onAddXP(60);
            if (onAddStudyMinutes) {
              onAddStudyMinutes(Math.round(totalVideoDurationSec / 60) || 3);
            }
            return 100;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentSceneIndex, currentScene, playbackSpeed, video.scenes.length, completedQuizzes, onAddXP, onAddStudyMinutes, totalVideoDurationSec]);

  // Ambient Lo-Fi Study Audio Synthesizer (Web Audio API)
  useEffect(() => {
    if (!isLoFiActive) {
      if (loFiOscillatorsRef.current) {
        loFiOscillatorsRef.current.stop();
        loFiOscillatorsRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.04, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Warm relaxing chord notes (Cmaj9 frequencies: C3, G3, B3, E4, D4)
      const freqs = [130.81, 196.0, 246.94, 329.63, 293.66];
      const oscs: OscillatorNode[] = [];

      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, ctx.currentTime);

        if (panner) {
          panner.pan.setValueAtTime((Math.random() - 0.5) * 0.8, ctx.currentTime);
          osc.connect(oscGain);
          oscGain.connect(panner);
          panner.connect(masterGain);
        } else {
          osc.connect(oscGain);
          oscGain.connect(masterGain);
        }

        osc.start();
        oscs.push(osc);
      });

      loFiOscillatorsRef.current = {
        gain: masterGain,
        stop: () => {
          oscs.forEach((o) => {
            try {
              o.stop();
            } catch {}
          });
          try {
            ctx.close();
          } catch {}
        },
      };
    } catch (e) {
      console.warn('Lo-Fi Synth could not initialize', e);
    }

    return () => {
      if (loFiOscillatorsRef.current) {
        loFiOscillatorsRef.current.stop();
        loFiOscillatorsRef.current = null;
      }
    };
  }, [isLoFiActive]);

  // 2D Canvas Physics / Math / Chemistry / Biology Visual Simulation Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let timeStep = 0;

    const render = () => {
      timeStep += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      // Dark futuristic canvas background
      ctx.clearRect(0, 0, width, height);

      // Background grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const diagramType = currentScene.visualData.diagramType || 'math_curve';

      // 1. MATHEMATICAL CURVE / CALCULUS PLOT
      if (diagramType === 'math_curve' || diagramType === 'geometry') {
        const cx = width / 2;
        const cy = height * 0.65;

        // Draw Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, cy);
        ctx.lineTo(width - 30, cy);
        ctx.moveTo(cx, 30);
        ctx.lineTo(cx, height - 30);
        ctx.stroke();

        // Parabola f(x) = a(x - h)² + k
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const aCoeff = 0.005;
        const vertexX = cx;
        const vertexY = cy + 40;

        for (let px = 40; px < width - 40; px += 2) {
          const dx = px - vertexX;
          const py = vertexY - aCoeff * (dx * dx);
          if (px === 40) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Animated Tangent line at oscillating x
        const tangentX = cx + Math.sin(timeStep) * 120;
        const dx = tangentX - vertexX;
        const tangentY = vertexY - aCoeff * (dx * dx);
        const slope = -2 * aCoeff * dx;

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tangentX - 70, tangentY - slope * -70);
        ctx.lineTo(tangentX + 70, tangentY - slope * 70);
        ctx.stroke();

        // Point on curve
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(tangentX, tangentY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`Slope m = ${slope.toFixed(3)}`, tangentX + 12, tangentY - 10);
        ctx.fillText('f(x) = ax² + bx + c', 50, 60);
      }
      // 2. PHYSICS MOTION & OSCILLATION / PENDULUM / FORCES
      else if (diagramType === 'physics_motion') {
        const originX = width / 2;
        const originY = 60;
        const rodLength = Math.min(height * 0.55, 140);
        const maxAngle = 0.7; // radians
        const angle = maxAngle * Math.sin(timeStep * 1.5);

        const bobX = originX + rodLength * Math.sin(angle);
        const bobY = originY + rodLength * Math.cos(angle);

        // Ceiling
        ctx.fillStyle = '#64748b';
        ctx.fillRect(originX - 60, originY - 10, 120, 10);

        // Cord
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Velocity vector arrow
        const vel = Math.cos(timeStep * 1.5) * 50;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bobX, bobY);
        ctx.lineTo(bobX + Math.cos(angle) * vel, bobY - Math.sin(angle) * vel);
        ctx.stroke();

        // Bob
        ctx.fillStyle = '#6366f1';
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Energy Bar Chart
        const totalE = 100;
        const potentialE = Math.round(((Math.cos(angle) - Math.cos(maxAngle)) / (1 - Math.cos(maxAngle))) * totalE);
        const kineticE = totalE - potentialE;

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px sans-serif';
        ctx.fillText(`Kinetic Energy (Ek): ${kineticE}%`, 30, height - 40);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(30, height - 32, kineticE * 1.2, 8);

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`Potential Energy (Ep): ${potentialE}%`, 30, height - 16);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(30, height - 8, potentialE * 1.2, 8);
      }
      // 3. CHEMISTRY MOLECULAR REACTION & ACTIVATION ENERGY
      else if (diagramType === 'chemical_reaction') {
        const cx = width * 0.45;
        const cy = height * 0.45;

        // Draw Reactant Molecules colliding
        const molCount = 6;
        for (let i = 0; i < molCount; i++) {
          const angle = (i * Math.PI * 2) / molCount + timeStep * 0.8;
          const radius = 50 + Math.sin(timeStep * 2 + i) * 20;
          const mx = cx + Math.cos(angle) * radius;
          const my = cy + Math.sin(angle) * radius;

          // Molecule circle
          ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(mx, my, 12, 0, Math.PI * 2);
          ctx.fill();

          // Electron bond trail
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }

        // Central Transition Complex
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('Ea Peak', cx - 18, cy + 3);

        // Activation Energy Curve Thumbnail
        const startX = width * 0.72;
        const startY = height * 0.75;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(startX + 20, startY - 80, startX + 50, startY - 80, startX + 80, startY + 20);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px sans-serif';
        ctx.fillText('Ea Mountain', startX + 15, startY - 90);
      }
      // 4. BIOLOGY DNA HELIX / CELLULAR SIMULATION
      else if (diagramType === 'biology_cell') {
        const cx = width / 2;
        const strandLength = width - 80;
        const basePairs = 18;

        for (let i = 0; i < basePairs; i++) {
          const x = 40 + (i * strandLength) / basePairs;
          const phase = timeStep * 1.2 + (i * 0.4);
          const yTop = height * 0.5 + Math.sin(phase) * 45;
          const yBottom = height * 0.5 - Math.sin(phase) * 45;

          // Base pair connecting bar
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, yTop);
          ctx.lineTo(x, yBottom);
          ctx.stroke();

          // Top nucleotide sphere
          ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#f43f5e';
          ctx.beginPath();
          ctx.arc(x, yTop, 6, 0, Math.PI * 2);
          ctx.fill();

          // Bottom nucleotide sphere
          ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, yBottom, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cas9 Scissor indicator
        const cutX = cx + Math.sin(timeStep * 0.5) * 40;
        ctx.fillStyle = '#ec4899';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('✂️ Cas9 Cut Site (PAM)', cutX - 60, height * 0.2);
      }
      // 5. FLOWCHART / NEURAL NETWORK / ALGORITHM FLOW
      else {
        const nodes = [
          { label: 'Input Vector x', x: 60, y: height / 2 },
          { label: 'Weights W · x + b', x: width / 2 - 30, y: height / 2 },
          { label: 'Activation σ(z)', x: width / 2 + 70, y: height / 2 },
          { label: 'Loss L(y, ŷ)', x: width - 70, y: height / 2 },
        ];

        nodes.forEach((n, idx) => {
          // Connecting arrows
          if (idx < nodes.length - 1) {
            const nextNode = nodes[idx + 1];
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(n.x + 35, n.y);
            ctx.lineTo(nextNode.x - 35, nextNode.y);
            ctx.stroke();
          }

          // Node circle
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + 3);
          ctx.textAlign = 'start';
        });

        // Animated gradient backprop pulse
        const pulseProgress = (timeStep * 0.5) % 1;
        const pulseX = width - 70 - pulseProgress * (width - 130);
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pulseX, height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentScene]);

  // Jump to specific scene
  const handleSeekScene = (sceneIndex: number) => {
    if (sceneIndex < 0 || sceneIndex >= video.scenes.length) return;
    let elapsed = 0;
    for (let i = 0; i < sceneIndex; i++) {
      elapsed += video.scenes[i].durationSec;
    }
    setCurrentSceneIndex(sceneIndex);
    setSceneProgress(0);
    setTotalElapsedTimeSec(elapsed);
    soundFX.playSuccess();
  };

  // Add a timestamped note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const currentTotalSec = totalElapsedTimeSec + Math.round((sceneProgress / 100) * currentScene.durationSec);
    const mins = Math.floor(currentTotalSec / 60);
    const secs = currentTotalSec % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const newNote: VideoStudyNote = {
      id: `note-${Date.now()}`,
      timestampSec: currentTotalSec,
      timestampFormatted: formatted,
      text: newNoteText.trim(),
      tag: newNoteTag,
      createdAt: 'Just now',
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewNoteText('');
    soundFX.playSuccess();
    onAddXP(10);
  };

  // Handle In-Video Quiz submission
  const handleQuizSubmit = () => {
    if (selectedQuizOption === null || !activeQuizScene?.checkpointQuiz) return;
    const isRight = selectedQuizOption === activeQuizScene.checkpointQuiz.correctIndex;
    setQuizCorrect(isRight);
    setQuizSubmitted(true);

    if (isRight) {
      soundFX.playSuccess();
      triggerCelebration();
      onAddXP(25);
      setCompletedQuizzes((prev) => [...prev, activeQuizScene.id]);
    } else {
      soundFX.playChime();
    }
  };

  // Continue video after quiz
  const handleContinueAfterQuiz = () => {
    setActiveQuizScene(null);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setIsPlaying(true);
  };

  const formattedCurrentTime = () => {
    const currentSec = totalElapsedTimeSec + Math.round((sceneProgress / 100) * currentScene.durationSec);
    const mins = Math.floor(currentSec / 60);
    const secs = currentSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedTotalTime = () => {
    const mins = Math.floor(totalVideoDurationSec / 60);
    const secs = totalVideoDurationSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div
        ref={playerContainerRef}
        className="w-full max-w-7xl h-full max-h-[94vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white relative"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shadow-xs">
              {video.thumbnailIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  {video.subject}
                </span>
                <span className="text-slate-400 text-xs font-semibold">
                  Scene {currentSceneIndex + 1} of {video.scenes.length}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white line-clamp-1">
                {video.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lo-Fi Ambient Study Sound Button */}
            <button
              onClick={() => setIsLoFiActive(!isLoFiActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isLoFiActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Toggle Lo-Fi Study Ambient Sound Generator"
            >
              <Music className={`w-3.5 h-3.5 ${isLoFiActive ? 'animate-bounce text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Lo-Fi Study Synth</span>
            </button>

            {/* Like Button */}
            <button
              onClick={() => {
                setIsLiked(!isLiked);
                setLikesCount((c) => (isLiked ? c - 1 : c + 1));
                if (!isLiked) soundFX.playSuccess();
              }}
              className={`p-2 rounded-xl transition ${
                isLiked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Video Stage + Interactive Side Toolkit */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT: Video Stage & Interactive Blackboard (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950 p-4 sm:p-6 overflow-y-auto relative border-r border-slate-800">
            {/* Visual Screen Header */}
            <div className="flex items-start justify-between gap-4 mb-3 z-10">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 block">
                  {currentScene.title}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {currentScene.visualData.mainHeading}
                </h3>
                {currentScene.visualData.subheading && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentScene.visualData.subheading}
                  </p>
                )}
              </div>

              {/* Animated AI Professor Avatar Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-lg relative">
                  <span>🧑‍🏫</span>
                  {isPlaying && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 ring-2 ring-slate-900 animate-ping" />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-[10px] text-slate-400 font-bold block">AI Master Tutor</span>
                  <span className="text-xs font-black text-indigo-300">
                    {currentScene.visualData.avatarExpression === 'excited'
                      ? '⚡ Breakthrough!'
                      : currentScene.visualData.avatarExpression === 'pointing'
                      ? '👉 Exam Focus'
                      : '🎙️ Explaining'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Stage Canvas with Visual Simulation */}
            <div className="relative flex-1 min-h-[260px] sm:min-h-[320px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              {/* Canvas Physics / Math Simulation Background */}
              <canvas
                ref={canvasRef}
                width={700}
                height={360}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
              />

              {/* Foreground Visual Overlay with Formatted Bullet Points & LaTeX Equations */}
              <div className="relative z-10 max-w-xl space-y-3 pointer-events-auto">
                {/* Bullet Points with animated highlights */}
                <div className="space-y-1.5">
                  {currentScene.visualData.bulletPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-xs sm:text-sm text-slate-200 font-medium flex items-start gap-2 shadow-sm animate-fadeIn"
                    >
                      <span className="w-5 h-5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                {/* Mathematical Formula Banner */}
                {currentScene.visualData.formulaLatex && currentScene.visualData.formulaLatex.length > 0 && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 backdrop-blur-md shadow-md space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Key Mathematical Relation:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentScene.visualData.formulaLatex.map((form, fidx) => (
                        <div
                          key={fidx}
                          className="px-3 py-1.5 rounded-lg bg-black/40 font-mono text-xs sm:text-sm text-amber-300 font-bold tracking-wide border border-amber-500/20"
                        >
                          {form}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlight Callout Box */}
                {currentScene.visualData.highlightCallout && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{currentScene.visualData.highlightCallout}</span>
                  </div>
                )}
              </div>

              {/* Subtitles / Karaoke Narration Caption Bar */}
              <div className="relative z-10 mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    AI Audio Voiceover ({video.voiceTone.replace('_', ' ')})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {currentScene.narration}
                </p>
              </div>
            </div>

            {/* Bottom Scrubber & Video Controls */}
            <div className="mt-4 space-y-3 z-10">
              {/* Timeline Scrubber Bar with Scene Markers */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
                  <span>{formattedCurrentTime()}</span>
                  <span>{formattedTotalTime()}</span>
                </div>

                {/* Multi-Segment Scene Progress Track */}
                <div className="flex items-center gap-1.5 w-full">
                  {video.scenes.map((scene, sIdx) => {
                    const isPassed = sIdx < currentSceneIndex;
                    const isCurrent = sIdx === currentSceneIndex;
                    const fillPercent = isPassed ? 100 : isCurrent ? sceneProgress : 0;

                    return (
                      <button
                        key={scene.id}
                        onClick={() => handleSeekScene(sIdx)}
                        className="flex-1 h-3 rounded-full bg-slate-800 hover:bg-slate-700 transition overflow-hidden relative group"
                        title={`Scene ${sIdx + 1}: ${scene.title}`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-100"
                          style={{ width: `${fillPercent}%` }}
                        />
                        {scene.checkpointQuiz && (
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px]">
                            ❓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Prev Scene */}
                  <button
                    onClick={() => handleSeekScene(currentSceneIndex - 1)}
                    disabled={currentSceneIndex === 0}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition text-slate-300"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      soundFX.playSuccess();
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  {/* Next Scene */}
                  <button
                    onClick={() => handleSeekScene(currentSceneIndex + 1)}
                    disabled={currentSceneIndex === video.scenes.length - 1}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition text-slate-300"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Replay */}
                  <button
                    onClick={() => {
                      setSceneProgress(0);
                      setIsPlaying(true);
                      soundFX.playSuccess();
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Replay Current Scene"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback Speed */}
                  <div className="flex items-center bg-slate-800 rounded-xl p-1 text-xs font-bold text-slate-300">
                    {[0.75, 1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-1 rounded-lg transition ${
                          playbackSpeed === speed ? 'bg-indigo-600 text-white shadow-xs' : 'hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Audio Mute Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Student Toolkit (Transcript, Notes, Flashcards, Takeaways) (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col bg-slate-900 overflow-hidden">
            {/* Side Tabs Bar */}
            <div className="flex border-b border-slate-800 p-2 gap-1 bg-slate-950/60">
              <button
                onClick={() => setSideTab('transcript')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sideTab === 'transcript' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Transcript</span>
              </button>

              <button
                onClick={() => setSideTab('notes')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sideTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Notes ({notes.length})</span>
              </button>

              <button
                onClick={() => setSideTab('flashcards')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sideTab === 'flashcards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Cards ({video.flashcards.length})</span>
              </button>

              <button
                onClick={() => setSideTab('takeaways')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sideTab === 'takeaways' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Summary</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Interactive Full Transcript with Click-to-Seek */}
            {sideTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-xs text-slate-400 font-semibold mb-2">
                  Click any scene timestamp to jump video playback directly to that section:
                </p>

                {video.scenes.map((scene, sidx) => {
                  const isActive = sidx === currentSceneIndex;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => handleSeekScene(sidx)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
                          Scene {sidx + 1}: {scene.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                          {Math.floor(scene.timestampSec / 60).toString().padStart(2, '0')}:{(scene.timestampSec % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {scene.narration}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT 2: Timestamped Note-Taking */}
            {sideTab === 'notes' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {notes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                      <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs font-bold text-slate-400">No notes yet for this video.</p>
                      <p className="text-[11px]">Type below to jot timestamped insights, formulas, or test traps!</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            ⏱️ {note.timestampFormatted}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            #{note.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5">
                    {(['important', 'formula', 'question', 'summary'] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewNoteTag(tag)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                          newNoteTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder={`Add note at ${formattedCurrentTime()}...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT 3: Flashcards Deck */}
            {sideTab === 'flashcards' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Auto-Generated Active Recall Cards
                  </span>
                  {onSaveToFlashcards && (
                    <button
                      onClick={() => {
                        onSaveToFlashcards(video.flashcards);
                        soundFX.playSuccess();
                        triggerCelebration();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
                    >
                      Save to Deck ✓
                    </button>
                  )}
                </div>

                {video.flashcards.map((card, cidx) => (
                  <div
                    key={cidx}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Prompt:</span>
                    </div>
                    <p className="text-xs font-bold text-white">{card.front}</p>
                    <div className="pt-2 border-t border-slate-700 text-xs text-slate-300 font-medium">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Answer:</span>
                      {card.back}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 4: Key Takeaways & Exam Strategy */}
            {sideTab === 'takeaways' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Exam Tip Callout */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>High-Yield Exam Strategy Tip</span>
                  </div>
                  <p className="text-xs text-amber-200 leading-relaxed font-medium">
                    {video.examTip}
                  </p>
                </div>

                {/* Core Takeaways */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Core Insights to Remember:
                  </span>
                  {video.keyTakeaways.map((takeaway, tidx) => (
                    <div
                      key={tidx}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2.5 text-xs text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL: In-Video Interactive Checkpoint Quiz */}
        {activeQuizScene && activeQuizScene.checkpointQuiz && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Interactive Video Checkpoint</span>
                    <h3 className="text-sm font-black text-white">Check Your Understanding</h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
                  +25 XP Reward
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm font-bold text-white leading-relaxed">
                {activeQuizScene.checkpointQuiz.question}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {activeQuizScene.checkpointQuiz.options.map((option, oidx) => {
                  const isSelected = selectedQuizOption === oidx;
                  const isCorrectAnswer = oidx === activeQuizScene.checkpointQuiz!.correctIndex;

                  let optionStyle = 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200';
                  if (quizSubmitted) {
                    if (isCorrectAnswer) {
                      optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40';
                    } else if (isSelected && !quizCorrect) {
                      optionStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40';
                  }

                  return (
                    <button
                      key={oidx}
                      disabled={quizSubmitted}
                      onClick={() => setSelectedQuizOption(oidx)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${optionStyle}`}
                    >
                      <span>{option}</span>
                      {quizSubmitted && isCorrectAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {quizSubmitted && isSelected && !quizCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback explanation if submitted */}
              {quizSubmitted && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    quizCorrect
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                  }`}
                >
                  <p className="font-bold mb-1">{quizCorrect ? '🎉 Correct!' : '❌ Not quite right'}</p>
                  <p>{activeQuizScene.checkpointQuiz.explanation}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={selectedQuizOption === null}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition active:scale-95"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleContinueAfterQuiz}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Continue Video</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
