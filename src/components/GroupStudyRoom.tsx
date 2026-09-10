import React, { useState, useEffect, useRef } from 'react';
import {
  GroupStudyRoomData,
  GroupStudyParticipant,
  GroupStudyChatMessage,
  StudentProfile,
  SubjectType,
} from '../types';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Hand,
  MessageSquare,
  Users,
  X,
  Send,
  Sparkles,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PenTool,
  Eraser,
  Download,
  HelpCircle,
  BarChart2,
  Bot,
  Layers,
  ChevronRight,
  Pin,
  Smile,
  ShieldCheck,
  Radio,
  FileText,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface GroupStudyRoomProps {
  room: GroupStudyRoomData;
  profile: StudentProfile;
  onClose: () => void;
  onAddXP: (xp: number) => void;
  onRecordAttendance?: (roomTitle: string, subject: SubjectType, durationMinutes: number, xp: number) => void;
}

export const GroupStudyRoom: React.FC<GroupStudyRoomProps> = ({
  room,
  profile,
  onClose,
  onAddXP,
  onRecordAttendance,
}) => {
  // Call Controls State
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<'grid' | 'spotlight' | 'whiteboard' | 'slides'>('grid');
  const [spotlightParticipantId, setSpotlightParticipantId] = useState<string>('p-elena');

  // Side Panel State
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'attendees' | 'whiteboard' | 'slides' | 'none'>('chat');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Chat & Messages State
  const [messages, setMessages] = useState<GroupStudyChatMessage[]>(room.messages || []);
  const [chatInput, setChatInput] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'questions' | 'formulas'>('all');
  const [aiIsThinking, setAiIsThinking] = useState(false);

  // Floating Reactions State
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // Attendance & Time Tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [hasClaimedAttendance, setHasClaimedAttendance] = useState(false);

  // Synchronized Pomodoro Timer
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');

  // Live Participants in Room (including local user)
  const [participants, setParticipants] = useState<GroupStudyParticipant[]>(() => {
    const userParticipant: GroupStudyParticipant = {
      id: 'user-local',
      name: `${profile.name} (You)`,
      avatar: profile.avatar || '⚡',
      role: 'attendee',
      isMuted: true,
      isVideoOn: false,
      isScreenSharing: false,
      handRaised: false,
      speaking: false,
      statusActivity: 'Attending Study Session',
      joinedAt: 'Just now',
      studyMinutes: 1,
      isUser: true,
    };
    return [userParticipant, ...room.participants];
  });

  // Real Camera Video Stream
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Whiteboard Canvas Ref & Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [whiteboardTool, setWhiteboardTool] = useState<'pen' | 'eraser' | 'text'>('pen');

  // Slide Deck Index
  const [currentSlide, setCurrentSlide] = useState(0);

  // Start Session Seconds Counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pomodoro Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (pomodoroRunning) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            soundFX.playSuccess();
            triggerCelebration();
            if (pomodoroMode === 'focus') {
              setPomodoroMode('break');
              onAddXP(50);
              return 5 * 60;
            } else {
              setPomodoroMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroMode, onAddXP]);

  // Handle Camera Media Stream Toggle
  useEffect(() => {
    if (isVideoOn) {
      navigator.mediaDevices?.getUserMedia?.({ video: true, audio: false })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setParticipants((prev) =>
            prev.map((p) => (p.isUser ? { ...p, isVideoOn: true } : p))
          );
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable in iframe:', err);
          // Fallback gracefully without crashing
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setParticipants((prev) =>
        prev.map((p) => (p.isUser ? { ...p, isVideoOn: false } : p))
      );
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic simulated speaking activity from peers
  useEffect(() => {
    const speakerInterval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isUser) return p;
          if (p.id === 'p-elena' || p.id === 'p-marcus-2' || p.id === 'p-maya-host') {
            return { ...p, speaking: Math.random() > 0.4 };
          }
          return { ...p, speaking: Math.random() > 0.85 };
        })
      );
    }, 4000);

    return () => clearInterval(speakerInterval);
  }, []);

  // Send Floating Reaction
  const handleTriggerReaction = (emoji: string) => {
    soundFX.playChime();
    const id = `react-${Date.now()}-${Math.random()}`;
    const randomX = Math.floor(Math.random() * 60) + 20; // 20% to 80% width
    setFloatingReactions((prev) => [...prev, { id, emoji, x: randomX }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  // Toggle Hand Raised
  const handleToggleHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    setParticipants((prev) =>
      prev.map((p) => (p.isUser ? { ...p, handRaised: nextState } : p))
    );
    if (nextState) {
      soundFX.playChime();
      handleSendMessage('✋ Raised hand with a question for the study group.', 'system');
    }
  };

  // Toggle Screen Share
  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          setIsScreenSharing(true);
          setSelectedLayout('spotlight');
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
        } else {
          setIsScreenSharing(true);
          setSelectedLayout('slides');
        }
      } catch {
        // Fallback to interactive slide share mode
        setIsScreenSharing(true);
        setSelectedLayout('slides');
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = (customText?: string, type: 'text' | 'question' | 'formula' | 'system' = 'text') => {
    const textToSend = customText !== undefined ? customText : chatInput;
    if (!textToSend.trim()) return;

    const newMsg: GroupStudyChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: `${profile.name} (You)`,
      avatar: profile.avatar || '⚡',
      text: textToSend.trim(),
      time: 'Just now',
      isUser: true,
      messageType: type,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!customText) setChatInput('');
    soundFX.playChime();
    onAddXP(5);

    // If message is a question or asks AI Coach, generate intelligent peer / AI response
    if (textToSend.toLowerCase().includes('@ai') || textToSend.toLowerCase().includes('how') || textToSend.toLowerCase().includes('why') || type === 'question') {
      triggerAiStudyCoachResponse(textToSend);
    }
  };

  // AI Study Coach in-room response
  const triggerAiStudyCoachResponse = (userQuestion: string) => {
    setAiIsThinking(true);
    setTimeout(() => {
      let aiText = '';
      if (room.subject === 'Mathematics') {
        aiText = `💡 **AI Coach Explanation**: For ${room.topic}, remember the fundamental rule: when applying integration by parts $\\int u\\,dv = uv - \\int v\\,du$, pick $u$ according to LIATE (Logarithmic, Inverse Trig, Algebraic, Trig, Exponential). Let $u$ be the component that simplifies when differentiated!`;
      } else if (room.subject === 'Physics') {
        aiText = `💡 **AI Coach Explanation**: On a banked incline, normal force $N$ provides the horizontal centripetal acceleration $N \\sin\\theta = m v^2 / r$ while its vertical component balances gravity $N \\cos\\theta = mg$. Dividing the two yields $v = \\sqrt{r g \\tan\\theta}$!`;
      } else {
        aiText = `💡 **AI Coach Explanation**: Great question on ${room.topic}! Key mechanism: Protons are pumped across the inner membrane by Complexes I, III, & IV, creating a high proton-motive gradient that drives ATP Synthase rotation to generate ATP.`;
      }

      const aiMsg: GroupStudyChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: '🤖 Nexora AI Study Coach',
        avatar: '✨',
        text: aiText,
        time: 'Just now',
        isAiCoach: true,
        messageType: 'formula',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setAiIsThinking(false);
      soundFX.playSuccess();
    }, 1400);
  };

  // Vote on In-Chat Poll
  const handleVotePoll = (pollId: string, optionId: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.pollData && msg.pollData.id === pollId) {
          const currentVote = msg.pollData.userVote;
          if (currentVote === optionId) return msg; // already voted

          const updatedOptions = msg.pollData.options.map((opt) => {
            if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
            if (currentVote !== undefined && opt.id === currentVote) return { ...opt, votes: Math.max(0, opt.votes - 1) };
            return opt;
          });

          return {
            ...msg,
            pollData: {
              ...msg.pollData,
              options: updatedOptions,
              totalVotes: currentVote !== undefined ? msg.pollData.totalVotes : msg.pollData.totalVotes + 1,
              userVote: optionId,
            },
          };
        }
        return msg;
      })
    );
    soundFX.playSuccess();
    onAddXP(10);
  };

  // Claim & Certify Attendance
  const handleClaimAttendance = () => {
    if (hasClaimedAttendance) return;
    setHasClaimedAttendance(true);
    const durationMins = Math.max(1, Math.round(sessionSeconds / 60));
    const xpReward = Math.min(150, 50 + durationMins * 5);

    soundFX.playSuccess();
    triggerCelebration();
    onAddXP(xpReward);

    if (onRecordAttendance) {
      onRecordAttendance(room.title, room.subject, durationMins, xpReward);
    }
  };

  // Whiteboard Canvas Event Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = whiteboardTool === 'eraser' ? 24 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = whiteboardTool === 'eraser' ? '#0f172a' : brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    soundFX.playChime();
  };

  // Formatted Timers
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered Messages
  const filteredMessages = messages.filter((msg) => {
    if (chatFilter === 'questions') return msg.messageType === 'question';
    if (chatFilter === 'formulas') return msg.messageType === 'formula';
    return true;
  });

  // Preset Presentation Slides for Active Subject
  const slideDecks: Record<SubjectType, { title: string; subtitle: string; content: string[] }[]> = {
    Mathematics: [
      {
        title: 'Integration by Parts: The LIATE Framework',
        subtitle: 'Core Formula & Algebraic Transformation',
        content: [
          '$$\\int u \\, dv = u \\cdot v - \\int v \\, du$$',
          '• Choose **u** in order of LIATE: Logarithmic, Inverse Trig, Algebraic, Trig, Exponential.',
          '• Differentiate **u** to find **du**, and integrate **dv** to find **v**.',
          '• For polynomial × exponential (e.g. $x^2 e^{3x}$), use Tabular Integration!',
        ],
      },
      {
        title: 'Worked Example: $\\int x^2 \\cos(x) \\, dx$',
        subtitle: 'Step-by-Step Problem Breakdown',
        content: [
          '1. **u = x²** $\\implies du = 2x \\, dx$',
          '2. **dv = cos(x) dx** $\\implies v = \\sin(x)$',
          '3. 1st Application: $x^2 \\sin(x) - \\int 2x \\sin(x) \\, dx$',
          '4. 2nd Application on $\\int 2x \\sin(x) \\, dx$: $2x(-\\cos(x)) - \\int 2(-\\cos(x)) \\, dx$',
          '5. **Final Result**: $x^2 \\sin(x) + 2x \\cos(x) - 2\\sin(x) + C$',
        ],
      },
    ],
    Physics: [
      {
        title: 'Centripetal Force & Banked Turn Equilibrium',
        subtitle: 'Dynamics of Inclined Circular Motion',
        content: [
          '• Vertical axis: $\\Sigma F_y = N \\cos\\theta - mg = 0 \\implies N = \\frac{mg}{\\cos\\theta}$',
          '• Horizontal axis: $\\Sigma F_x = N \\sin\\theta = m \\frac{v^2}{r}$',
          '• Dividing equations: $\\tan\\theta = \\frac{v^2}{r g}$',
          '• **Design Speed Formula**: $v = \\sqrt{r \\cdot g \\cdot \\tan\\theta}$',
        ],
      },
    ],
    Chemistry: [
      {
        title: 'Balancing Redox Reactions (Ion-Electron Method)',
        subtitle: 'Acidic vs Basic Solution Algorithm',
        content: [
          '1. Divide reaction into Oxidation & Reduction half-reactions.',
          '2. Balance all atoms EXCEPT hydrogen and oxygen.',
          '3. Balance oxygen atoms by adding $H_2O$.',
          '4. Balance hydrogen atoms by adding $H^+$.',
          '5. Balance net electrical charge by adding electrons ($e^-$).',
          '6. Multiply half-reactions so electron counts cancel out!',
        ],
      },
    ],
    Biology: [
      {
        title: 'Chemiosmotic ATP Synthase Mechanism',
        subtitle: 'Proton-Motive Force & Mitochondrial Matrix',
        content: [
          '• Complexes I, III, IV pump $H^+$ into intermembrane space.',
          '• Complex II (Succinate Dehydrogenase) does NOT pump protons.',
          '• Proton electrochemical gradient drives $F_0-F_1$ rotor complex.',
          '• 1 NADH $\\approx$ 2.5 ATP | 1 FADH$_2$ $\\approx$ 1.5 ATP.',
        ],
      },
    ],
    'Computer Science': [
      {
        title: 'Dynamic Programming & Memoization Patterns',
        subtitle: 'Overlapping Subproblems & Optimal Substructure',
        content: [
          '• Identify state variables: `dp[i][j]`',
          '• Establish Base Cases before recursive descent.',
          '• Top-Down with Hash Map memoization vs Bottom-Up Tabulation.',
          '• Space Optimization: Rolling array technique reduces O(N) to O(1) auxiliary memory.',
        ],
      },
    ],
    English: [
      {
        title: 'Rhetorical Analysis: Ethos, Pathos, Logos',
        subtitle: 'Deconstructing Argumentative Architecture',
        content: [
          '• Ethos: Credibility and authoritative foundation.',
          '• Pathos: Emotional resonance and empathetic appeal.',
          '• Logos: Deductive reasoning, statistical evidence, and syllogisms.',
        ],
      },
    ],
    History: [
      {
        title: 'Causal Synthesis in Historiography',
        subtitle: 'Primary Source Corroboration',
        content: [
          '• Sourcing: Author perspective, intended audience, historical context.',
          '• Contextualization: Broader national and global developments.',
          '• Corroboration: Comparing contradictory primary testimonies.',
        ],
      },
    ],
    Science: [
      {
        title: 'Scientific Method & Empirical Verification',
        subtitle: 'Hypothesis Testing & Variable Control',
        content: [
          '• Independent Variable: Manipulated parameter.',
          '• Dependent Variable: Measured response.',
          '• Controlled Constants: Minimizing systematic confounding errors.',
        ],
      },
    ],
  };

  const currentDeck = slideDecks[room.subject] || slideDecks.Mathematics;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden animate-fadeIn">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Room Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xl shrink-0">
            {room.subject === 'Mathematics' ? '📐' : room.subject === 'Physics' ? '⚡' : room.subject === 'Chemistry' ? '🧪' : '🧬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Video Call
              </span>
              <span className="text-xs font-bold text-slate-400 truncate hidden sm:inline">
                Code: {room.roomCode}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white truncate">
              {room.title}
            </h1>
          </div>
        </div>

        {/* Center: Synchronized Pomodoro & Attendance Timer */}
        <div className="hidden md:flex items-center gap-3">
          {/* Synchronized Focus Sprint Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-bold uppercase text-indigo-300">
              {pomodoroMode === 'focus' ? '🎯 Sprint' : '☕ Break'}
            </span>
            <span className="font-mono text-sm font-black text-amber-400">
              {formatTime(pomodoroSeconds)}
            </span>
            <button
              onClick={() => {
                setPomodoroRunning(!pomodoroRunning);
                soundFX.playChime();
              }}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 transition"
              title={pomodoroRunning ? 'Pause Sprint' : 'Start Focus Sprint'}
            >
              {pomodoroRunning ? <Pause className="w-3.5 h-3.5 text-rose-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => {
                setPomodoroSeconds(25 * 60);
                setPomodoroRunning(false);
                soundFX.playChime();
              }}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Attended Call Duration Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Attended: {formatTime(sessionSeconds)}</span>
          </div>
        </div>

        {/* Right: Layout Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Layout buttons */}
          <div className="hidden lg:flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setSelectedLayout('grid')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedLayout === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setSelectedLayout('spotlight')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedLayout === 'spotlight' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Spotlight
            </button>
            <button
              onClick={() => {
                setSelectedLayout('whiteboard');
                setActiveSidePanel('whiteboard');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedLayout === 'whiteboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => {
                setSelectedLayout('slides');
                setActiveSidePanel('slides');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedLayout === 'slides' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Slides
            </button>
          </div>

          {/* Record & Certify Attendance Button */}
          <button
            onClick={handleClaimAttendance}
            disabled={hasClaimedAttendance}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              hasClaimedAttendance
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md active:scale-95'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>{hasClaimedAttendance ? 'Attendance Verified ✓' : 'Mark Attendance (+XP)'}</span>
          </button>

          {/* Close / Leave Call */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white transition"
            title="Leave Group Study Call"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Call Body: Video Stage + Interactive Side Panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Floating Reactions Overlay */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {floatingReactions.map((react) => (
            <div
              key={react.id}
              className="absolute text-4xl animate-bounce transition-all duration-1000"
              style={{
                left: `${react.x}%`,
                bottom: '80px',
                animation: 'floatUp 2.2s ease-out forwards',
              }}
            >
              {react.emoji}
            </div>
          ))}
        </div>

        {/* Video Stage Column */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col justify-between relative bg-[#070b14]">
          {/* LAYOUT 1: EQUAL GRID VIEW */}
          {selectedLayout === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 auto-rows-fr">
              {/* Local User Tile */}
              <div
                className={`relative rounded-2xl overflow-hidden bg-slate-900 border transition-all flex flex-col justify-between p-3 ${
                  !isMicMuted ? 'border-emerald-500 shadow-md shadow-emerald-500/20' : 'border-slate-800'
                }`}
              >
                {/* Live Camera Feed or Animated Avatar */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-4xl shadow-xl border-2 border-white/20">
                        {profile.avatar || '⚡'}
                      </div>
                      <span className="text-xs font-semibold text-slate-400">Camera Off</span>
                    </div>
                  )}
                </div>

                {/* Top Badges */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    You (Attending)
                  </span>
                  {handRaised && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 animate-bounce">
                      ✋ Hand Raised
                    </span>
                  )}
                </div>

                {/* Bottom Status Bar */}
                <div className="relative z-10 flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-white drop-shadow-md">
                    {profile.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1.5 rounded-lg ${isMicMuted ? 'bg-rose-500/80' : 'bg-emerald-500/80'} text-white`}>
                      {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Peer Tiles */}
              {participants.filter((p) => !p.isUser).map((peer) => (
                <div
                  key={peer.id}
                  className={`relative rounded-2xl overflow-hidden bg-slate-900 border transition-all flex flex-col justify-between p-3 min-h-[160px] ${
                    peer.speaking ? 'border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20' : 'border-slate-800'
                  }`}
                >
                  {/* Peer Background & Avatar Feed */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/60 p-4">
                    <div className="relative">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-xl border-2 transition ${
                        peer.speaking ? 'border-emerald-400 scale-105 bg-indigo-600/30' : 'border-white/20 bg-slate-800'
                      }`}>
                        {peer.avatar}
                      </div>
                      {peer.speaking && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                          <Volume2 className="w-3 h-3 text-white animate-pulse" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-300 font-medium mt-2 text-center line-clamp-1 px-2">
                      {peer.statusActivity}
                    </p>
                  </div>

                  {/* Top Badges */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold flex items-center gap-1 border ${
                      peer.role === 'host'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-black/60 text-slate-200 border-white/10'
                    }`}>
                      {peer.role === 'host' ? '👑 Host' : peer.role === 'co-host' ? '⭐ Co-Host' : 'Student'}
                    </span>

                    {peer.handRaised && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 animate-bounce">
                        ✋ Question
                      </span>
                    )}
                  </div>

                  {/* Bottom Bar */}
                  <div className="relative z-10 flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-white drop-shadow-md truncate">
                      {peer.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1.5 rounded-lg ${peer.isMuted ? 'bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white'}`}>
                        {peer.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </div>
                      <button
                        onClick={() => {
                          setSpotlightParticipantId(peer.id);
                          setSelectedLayout('spotlight');
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Spotlight Peer"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LAYOUT 2: SPOTLIGHT PRESENTER VIEW */}
          {selectedLayout === 'spotlight' && (
            <div className="flex-1 flex flex-col gap-3">
              {/* Main Large Stage */}
              <div className="flex-1 min-h-[300px] rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col justify-between p-4">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900">
                  <div className="w-28 h-28 rounded-full bg-indigo-600/30 border-4 border-indigo-400/50 flex items-center justify-center text-6xl shadow-2xl animate-pulse">
                    {participants.find((p) => p.id === spotlightParticipantId)?.avatar || '👩‍🏫'}
                  </div>
                  <h2 className="text-lg font-black text-white mt-4">
                    {participants.find((p) => p.id === spotlightParticipantId)?.name || 'Elena Rostova'}
                  </h2>
                  <p className="text-xs text-indigo-300 font-semibold mt-1">
                    {participants.find((p) => p.id === spotlightParticipantId)?.statusActivity || 'Sharing live problem solving'}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                    <Pin className="w-3.5 h-3.5" />
                    Spotlight Speaker
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/60 text-slate-300 text-xs font-semibold">
                    Topic: {room.topic}
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between bg-black/50 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    Active Speaker Channel
                  </span>
                  <button
                    onClick={() => setSelectedLayout('grid')}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                  >
                    Exit Spotlight
                  </button>
                </div>
              </div>

              {/* Horizontal Participant Filmstrip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSpotlightParticipantId(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition ${
                      spotlightParticipantId === p.id
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LAYOUT 3: COLLABORATIVE WHITEBOARD */}
          {selectedLayout === 'whiteboard' && (
            <div className="flex-1 flex flex-col rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {/* Whiteboard Toolbar */}
              <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-400 flex items-center gap-1">
                    <PenTool className="w-4 h-4" />
                    Group Scratchpad
                  </span>

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  <button
                    onClick={() => setWhiteboardTool('pen')}
                    className={`p-1.5 rounded-lg transition ${
                      whiteboardTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                    title="Pen"
                  >
                    <PenTool className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setWhiteboardTool('eraser')}
                    className={`p-1.5 rounded-lg transition ${
                      whiteboardTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                    title="Eraser"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>

                  {/* Brush Colors */}
                  {['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setBrushColor(color);
                        setWhiteboardTool('pen');
                      }}
                      className={`w-5 h-5 rounded-full transition ${brushColor === color && whiteboardTool === 'pen' ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearWhiteboard}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Clear Board
                  </button>
                  <button
                    onClick={() => setSelectedLayout('grid')}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Close Board
                  </button>
                </div>
              </div>

              {/* Whiteboard Canvas */}
              <div className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={500}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* LAYOUT 4: PRESENTATION SLIDES & FORMULA DECK */}
          {selectedLayout === 'slides' && (
            <div className="flex-1 flex flex-col rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">Live Study Deck ({room.subject})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    Slide {currentSlide + 1} of {currentDeck.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                    disabled={currentSlide === 0}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 text-white font-bold"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => Math.min(currentDeck.length - 1, prev + 1))}
                    disabled={currentSlide === currentDeck.length - 1}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 disabled:opacity-40 text-white font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center space-y-4 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-900 overflow-y-auto">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                  {currentDeck[currentSlide].subtitle}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {currentDeck[currentSlide].title}
                </h2>
                <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-sm leading-relaxed text-slate-200">
                  {currentDeck[currentSlide].content.map((line, idx) => (
                    <p key={idx} className="font-mono text-xs sm:text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Call Controls Dock */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
              {['🔥', '👏', '💡', '⚡', '❓', '🚀'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleTriggerReaction(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-800 text-lg flex items-center justify-center transition active:scale-125"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Primary Center Call Controls */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-xl">
              {/* Mic Toggle */}
              <button
                onClick={() => {
                  const nextMic = !isMicMuted;
                  setIsMicMuted(nextMic);
                  setParticipants((prev) =>
                    prev.map((p) => (p.isUser ? { ...p, isMuted: nextMic } : p))
                  );
                  soundFX.playChime();
                }}
                className={`p-3 rounded-xl transition font-bold text-xs flex items-center gap-1.5 ${
                  isMicMuted ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="hidden sm:inline">{isMicMuted ? 'Unmute' : 'Muted'}</span>
              </button>

              {/* Video Camera Toggle */}
              <button
                onClick={() => {
                  setIsVideoOn(!isVideoOn);
                  soundFX.playChime();
                }}
                className={`p-3 rounded-xl transition font-bold text-xs flex items-center gap-1.5 ${
                  isVideoOn ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isVideoOn ? 'Stop Video' : 'Start Video'}</span>
              </button>

              {/* Screen Share */}
              <button
                onClick={handleToggleScreenShare}
                className={`p-3 rounded-xl transition font-bold text-xs flex items-center gap-1.5 ${
                  isScreenSharing ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Share Screen or Slides"
              >
                <MonitorUp className="w-4 h-4" />
                <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share'}</span>
              </button>

              {/* Raise Hand */}
              <button
                onClick={handleToggleHand}
                className={`p-3 rounded-xl transition font-bold text-xs flex items-center gap-1.5 ${
                  handRaised ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={handRaised ? 'Lower Hand' : 'Raise Hand'}
              >
                <Hand className="w-4 h-4" />
                <span className="hidden sm:inline">{handRaised ? 'Hand Up' : 'Raise Hand'}</span>
              </button>

              {/* Toggle Whiteboard */}
              <button
                onClick={() => {
                  const nextTool = selectedLayout === 'whiteboard' ? 'grid' : 'whiteboard';
                  setSelectedLayout(nextTool);
                  if (nextTool === 'whiteboard') setActiveSidePanel('whiteboard');
                }}
                className={`p-3 rounded-xl transition text-xs font-bold flex items-center gap-1.5 ${
                  selectedLayout === 'whiteboard' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Open Shared Whiteboard"
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden md:inline">Whiteboard</span>
              </button>
            </div>

            {/* Right Toggle Panel Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? 'none' : 'chat')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  activeSidePanel === 'chat'
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveSidePanel(activeSidePanel === 'attendees' ? 'none' : 'attendees')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  activeSidePanel === 'attendees'
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Roster ({participants.length})</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Side Panel: Live Group Chat & Notes & Roster */}
        {activeSidePanel !== 'none' && (
          <aside className="w-full md:w-80 lg:w-96 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 animate-slideLeft">
            {/* Panel Tabs Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveSidePanel('chat')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeSidePanel === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setActiveSidePanel('attendees')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeSidePanel === 'attendees' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Roster</span>
                </button>
              </div>

              <button
                onClick={() => setActiveSidePanel('none')}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: GROUP CHAT & FORMULA SHARING */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Chat Filters & Fast Actions */}
                <div className="p-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChatFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        chatFilter === 'all' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setChatFilter('questions')}
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        chatFilter === 'questions' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
                      }`}
                    >
                      ❓ Questions
                    </button>
                    <button
                      onClick={() => setChatFilter('formulas')}
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        chatFilter === 'formulas' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                      }`}
                    >
                      📐 Formulas
                    </button>
                  </div>

                  {/* Ask AI Coach in Call */}
                  <button
                    onClick={() => {
                      triggerAiStudyCoachResponse('Explain core steps for this problem');
                    }}
                    className="px-2 py-0.5 rounded-md bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 text-[10px] font-bold flex items-center gap-1"
                    title="Ask AI Study Coach to explain to group"
                  >
                    <Bot className="w-3 h-3 text-cyan-300" />
                    <span>@AI Coach</span>
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${
                        msg.isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                        <span>{msg.avatar}</span>
                        <span className="font-bold text-slate-300">{msg.sender}</span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                          msg.isUser
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : msg.isAiCoach
                            ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border border-cyan-500/40 text-cyan-100 rounded-tl-xs shadow-md'
                            : msg.messageType === 'formula'
                            ? 'bg-slate-950 border border-slate-700 text-slate-200 rounded-tl-xs font-mono'
                            : 'bg-slate-800 text-slate-200 rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Interactive Poll in Chat */}
                        {msg.pollData && (
                          <div className="mt-2.5 pt-2 border-t border-slate-700/80 space-y-2">
                            <p className="font-bold text-white text-[11px] flex items-center gap-1">
                              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                              {msg.pollData.question}
                            </p>
                            <div className="space-y-1.5">
                              {msg.pollData.options.map((opt) => {
                                const percent = msg.pollData!.totalVotes > 0
                                  ? Math.round((opt.votes / msg.pollData!.totalVotes) * 100)
                                  : 0;
                                const isSelected = msg.pollData!.userVote === opt.id;

                                return (
                                  <button
                                    key={opt.id}
                                    onClick={() => handleVotePoll(msg.pollData!.id, opt.id)}
                                    className={`w-full text-left p-2 rounded-xl text-xs border relative overflow-hidden transition ${
                                      isSelected
                                        ? 'border-indigo-400 bg-indigo-950/60 font-bold text-white'
                                        : 'border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div
                                      className="absolute inset-0 bg-indigo-500/20 transition-all duration-500"
                                      style={{ width: `${percent}%` }}
                                    />
                                    <div className="relative z-10 flex items-center justify-between text-[11px]">
                                      <span>{opt.text}</span>
                                      <span className="font-mono font-bold text-indigo-300">
                                        {opt.votes} ({percent}%)
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400 text-right">
                              {msg.pollData.totalVotes} votes submitted
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {aiIsThinking && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-cyan-300 animate-pulse">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>AI Study Coach is crafting explanation...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Dock */}
                <div className="p-3 border-t border-slate-800 bg-slate-950">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleSendMessage('Can someone explain this worked example step?', 'question')}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        + Ask Question
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage('Formula: $\\int u \\, dv = uv - \\int v \\, du$', 'formula')}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        + Add Formula
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type notes or ask question in room..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE & ROSTER */}
            {activeSidePanel === 'attendees' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* Attendance Summary Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Attendance Certification
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      Active Call
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Study session attendance is verified every 5 minutes. Stay in the room and contribute to earn Group Study XP bonuses.
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-indigo-900/60 font-bold">
                    <span className="text-slate-400">Time In Call:</span>
                    <span className="text-white font-mono">{formatTime(sessionSeconds)}</span>
                  </div>
                </div>

                {/* Attendees List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Attending Students ({participants.length})
                  </h3>

                  <div className="space-y-1.5">
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{p.avatar}</span>
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {p.name}
                              {p.role === 'host' && (
                                <span className="text-[10px] text-amber-400 font-normal">(Host)</span>
                              )}
                            </p>
                            <p className="text-[10px] text-indigo-300">{p.statusActivity}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {p.handRaised && (
                            <span className="text-sm animate-bounce" title="Question raised">
                              ✋
                            </span>
                          )}
                          <div className={`p-1 rounded-md ${p.isMuted ? 'text-slate-500' : 'text-emerald-400'}`}>
                            {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
