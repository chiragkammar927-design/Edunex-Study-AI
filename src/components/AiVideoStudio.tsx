import React, { useState, useEffect } from 'react';
import {
  AiVideoLesson,
  StudentProfile,
  SubjectType,
  VideoVisualStyle,
  VideoVoiceTone,
} from '../types';
import { initialAiVideoLessons } from '../data/sampleAiVideoData';
import {
  Video,
  Play,
  Plus,
  Sparkles,
  Search,
  BookOpen,
  Filter,
  Flame,
  Clock,
  Award,
  Layers,
  Zap,
  Bookmark,
  TrendingUp,
  BrainCircuit,
  Wand2,
  CheckCircle2,
  X,
  Radio,
  Sliders,
  Share2,
  Lightbulb,
} from 'lucide-react';
import { AiVideoPlayer } from './AiVideoPlayer';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface AiVideoStudioProps {
  profile: StudentProfile;
  onAddXP: (xp: number) => void;
  onSaveToFlashcards?: (flashcards: { front: string; back: string }[]) => void;
  onAddStudyMinutes?: (minutes: number) => void;
}

export const AiVideoStudio: React.FC<AiVideoStudioProps> = ({
  profile,
  onAddXP,
  onSaveToFlashcards,
  onAddStudyMinutes,
}) => {
  // Video library state
  const [videoLessons, setVideoLessons] = useState<AiVideoLesson[]>(() => {
    const saved = localStorage.getItem('nexora_video_lessons');
    return saved ? JSON.parse(saved) : initialAiVideoLessons;
  });

  // Active playing video
  const [activeVideo, setActiveVideo] = useState<AiVideoLesson | null>(null);

  // Filters and navigation
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<'all' | 'custom' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Video Generator Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState<SubjectType>('Mathematics');
  const [genDifficulty, setGenDifficulty] = useState<'Beginner / Middle' | 'High School / AP' | 'College / Advanced' | 'ELI13 Intuition'>('High School / AP');
  const [genVisualStyle, setGenVisualStyle] = useState<VideoVisualStyle>('modern_infographic');
  const [genVoiceTone, setGenVoiceTone] = useState<VideoVoiceTone>('energetic_mentor');
  const [genDuration, setGenDuration] = useState<number>(3);
  const [genNotes, setGenNotes] = useState('');

  // Persist video lessons
  useEffect(() => {
    localStorage.setItem('nexora_video_lessons', JSON.stringify(videoLessons));
  }, [videoLessons]);

  // Filter video lessons
  const filteredVideos = videoLessons.filter((vid) => {
    const matchesSubject = selectedSubject === 'All' || vid.subject === selectedSubject;
    const matchesCategory =
      activeCategory === 'all'
        ? true
        : activeCategory === 'custom'
        ? vid.isCustomGenerated
        : vid.isSaved;
    const matchesSearch =
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesCategory && matchesSearch;
  });

  // Quick prompt chips
  const quickPrompts = [
    { label: '📐 Quadratic Formula Proof', subject: 'Mathematics' as SubjectType, topic: 'Deriving the Quadratic Formula by Completing the Square' },
    { label: '⚡ Lenz’s Law & Eddy Currents', subject: 'Physics' as SubjectType, topic: 'Faraday’s Law of Electromagnetic Induction and Lenz’s Law' },
    { label: '🧬 CRISPR-Cas9 Gene Editing', subject: 'Biology' as SubjectType, topic: 'CRISPR-Cas9 Molecular Scissors, Guide RNA & DNA Repair' },
    { label: '🧪 Collision Theory & Catalysts', subject: 'Chemistry' as SubjectType, topic: 'Reaction Kinetics, Activation Energy Mountain and Catalysis' },
    { label: '🤖 Backpropagation in Neural Nets', subject: 'Computer Science' as SubjectType, topic: 'How Gradient Descent and Chain Rule Backpropagate Errors' },
    { label: '🚀 Rocket Propulsion & Newton’s 3rd', subject: 'Physics' as SubjectType, topic: 'Newton’s Third Law of Motion in Spaceflight and Thrust' },
  ];

  // Handle AI Video Generation
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    setIsGenerating(true);
    soundFX.playChime();

    try {
      const response = await fetch('/api/gemini/generate-video-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic.trim(),
          subject: genSubject,
          difficulty: genDifficulty,
          visualStyle: genVisualStyle,
          voiceTone: genVoiceTone,
          durationMinutes: genDuration,
          sourceNotes: genNotes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video lesson');
      }

      const newVideoLesson: AiVideoLesson = await response.json();
      setVideoLessons((prev) => [newVideoLesson, ...prev]);
      setShowGenerateModal(false);
      setGenTopic('');
      setGenNotes('');
      soundFX.playSuccess();
      triggerCelebration();
      onAddXP(80);
      setActiveVideo(newVideoLesson);
    } catch (err) {
      console.error('Error in video generator:', err);
      // Fallback local video creation if network error
      const fallbackVideo: AiVideoLesson = {
        id: `video-gen-${Date.now()}`,
        title: `Visual Mastery: ${genTopic.trim()}`,
        subject: genSubject,
        topic: genTopic.trim(),
        difficulty: genDifficulty,
        targetAudience: `${genDifficulty} students`,
        durationMinutes: genDuration,
        thumbnailIcon: genSubject === 'Mathematics' ? '📐' : genSubject === 'Physics' ? '⚡' : genSubject === 'Chemistry' ? '🧪' : '🧬',
        category: `${genSubject} Core Curriculum`,
        visualStyle: genVisualStyle,
        voiceTone: genVoiceTone,
        viewsCount: 1,
        likesCount: 1,
        createdDate: 'Just now',
        isSaved: true,
        isCustomGenerated: true,
        examTip: `For ${genTopic.trim()}, always double-check unit conversions, boundary conditions, and sign conventions.`,
        keyTakeaways: [
          `First principle: Break the problem into governing equations and known variables.`,
          `Avoid common pitfalls by explicitly testing boundary values.`,
          `Anchor the concept with visual intuition and step-by-step scaffolding.`,
        ],
        flashcards: [
          {
            front: `What is the core principle of ${genTopic.trim()}?`,
            back: `It governs the relationship where inputs transform according to invariant physical and mathematical laws.`,
          },
        ],
        scenes: [
          {
            id: 'scene-fb-1',
            sceneNumber: 1,
            timestampSec: 0,
            durationSec: 40,
            title: `Introduction to ${genTopic.trim()}`,
            narration: `Welcome to this visual masterclass on ${genTopic.trim()}. In this video, we break down the core intuition, examine worked examples, and prepare you for exam questions.`,
            visualLayout: 'chalkboard',
            visualData: {
              mainHeading: `Intuition Behind ${genTopic.trim()}`,
              subheading: 'Core First Principles',
              bulletPoints: [
                'Identify independent and dependent variables',
                'Establish governing equations and physical constraints',
                'Connect formulas to visual geometry',
              ],
              diagramType: genSubject === 'Mathematics' ? 'math_curve' : genSubject === 'Physics' ? 'physics_motion' : 'chemical_reaction',
              highlightCallout: 'Mastering the first principles guarantees high exam marks!',
              avatarExpression: 'explaining',
            },
          },
          {
            id: 'scene-fb-2',
            sceneNumber: 2,
            timestampSec: 40,
            durationSec: 45,
            title: `Step-by-Step Deep Dive`,
            narration: `Let us now look at the step-by-step resolution. Notice how each stage transitions smoothly without skipping algebraic rigor.`,
            visualLayout: 'step_by_step',
            visualData: {
              mainHeading: 'Step-by-Step Mechanism',
              subheading: 'Worked Problem Resolution',
              bulletPoints: [
                '1. Setup initial conditions and coordinate frame',
                '2. Apply the primary transformation formula',
                '3. Simplify and check dimensional units',
              ],
              diagramType: 'flowchart',
              highlightCallout: 'Watch out for sign errors and factor distributions!',
              avatarExpression: 'excited',
            },
            checkpointQuiz: {
              question: `What is the critical first step when solving a ${genTopic.trim()} problem?`,
              options: [
                'Identify knowns, constraints, and formula before substituting numbers',
                'Pick a random numerical estimate',
                'Ignore all boundary conditions',
                'Skip writing intermediate steps',
              ],
              correctIndex: 0,
              explanation: 'Writing formulas and identifying knowns first prevents 90% of exam mistakes.',
            },
          },
        ],
      };
      setVideoLessons((prev) => [fallbackVideo, ...prev]);
      setShowGenerateModal(false);
      soundFX.playSuccess();
      setActiveVideo(fallbackVideo);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Save Video
  const handleToggleSaveVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoLessons((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isSaved: !v.isSaved } : v))
    );
    soundFX.playSuccess();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Studio Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>AI Video Studio & Animated Explainer Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Video Academy for Students
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Generate custom animated educational video lessons with AI narration, synchronized visual physics & math simulations, blackboard derivations, and interactive quiz checkpoints.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Available Lessons</span>
              <span className="text-lg font-black text-indigo-300 flex items-center justify-center gap-1">
                <Video className="w-4 h-4 text-indigo-400" />
                {videoLessons.length} Videos
              </span>
            </div>

            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate AI Video</span>
            </button>
          </div>
        </div>

        {/* Quick 1-Click Prompt Chips */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate instant visual video on high-yield topics:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setGenTopic(p.topic);
                  setGenSubject(p.subject);
                  setShowGenerateModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5 active:scale-95"
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Navigation Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Video Lessons
            </button>
            <button
              onClick={() => setActiveCategory('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>My AI Generated</span>
            </button>
            <button
              onClick={() => setActiveCategory('saved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === 'saved'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>Saved for Revision</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, formulas, subjects..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
            />
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100 dark:border-slate-800">
          {['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === sub
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-500" />
            <span>Interactive AI Video Lessons</span>
          </h2>
          <span className="text-xs text-slate-500">
            Showing {filteredVideos.length} animated lessons
          </span>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Video className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Videos Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No video lessons match your current filter. Generate a new AI video lesson on any topic in seconds!
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
            >
              Generate AI Video Lesson
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => {
                  setActiveVideo(video);
                  soundFX.playSuccess();
                }}
                className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                {/* Top Video Card Thumbnail Header */}
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-slate-800 p-4 flex flex-col justify-between overflow-hidden group-hover:scale-[1.02] transition-transform duration-300 shadow-md">
                    <div className="flex items-center justify-between z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                        {video.subject}
                      </span>
                      <button
                        onClick={(e) => handleToggleSaveVideo(video.id, e)}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition ${
                          video.isSaved
                            ? 'bg-amber-500 text-white'
                            : 'bg-black/50 text-slate-300 hover:text-white'
                        }`}
                        title="Save for Revision"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Central Play Button and Subject Icon */}
                    <div className="flex items-center justify-center gap-3 z-10 my-auto">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                      <span className="text-3xl">{video.thumbnailIcon}</span>
                    </div>

                    {/* Bottom Metadata Badges inside thumbnail */}
                    <div className="flex items-center justify-between text-[11px] text-slate-300 z-10">
                      <span className="flex items-center gap-1 font-mono font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {video.durationMinutes} min
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/60 font-bold text-[10px] text-amber-300">
                        {video.scenes.length} Scenes + Quiz
                      </span>
                    </div>
                  </div>

                  {/* Title & Topic */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-medium">
                      Focus: {video.topic}
                    </p>
                  </div>

                  {/* Visual Style & Difficulty Badge */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {video.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      🎨 {video.visualStyle.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <span>👁️ {video.viewsCount} views</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveVideo(video);
                      soundFX.playSuccess();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Watch Lesson</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVE FULLSCREEN AI VIDEO PLAYER MODAL */}
      {activeVideo && (
        <AiVideoPlayer
          video={activeVideo}
          profile={profile}
          onClose={() => setActiveVideo(null)}
          onAddXP={onAddXP}
          onSaveToFlashcards={onSaveToFlashcards}
          onAddStudyMinutes={onAddStudyMinutes}
        />
      )}

      {/* MODAL: AI VIDEO GENERATOR */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Generate AI Video Lesson for Students
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transform any study question, theorem, or notes into a multi-scene animated video.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  What concept or problem do you want explained?
                </label>
                <input
                  type="text"
                  required
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Visual derivation of integration by parts, or how ATP synthase works"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                  <select
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value as SubjectType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'English'].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Student Level</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="High School / AP">High School / AP Exam Prep</option>
                    <option value="Beginner / Middle">Middle School / Foundations</option>
                    <option value="College / Advanced">College / Advanced Honors</option>
                    <option value="ELI13 Intuition">ELI13 (Explain Like I'm 13 Metaphors)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Visual Animation Style</label>
                  <select
                    value={genVisualStyle}
                    onChange={(e) => setGenVisualStyle(e.target.value as VideoVisualStyle)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="modern_infographic">Modern Motion Infographics</option>
                    <option value="chalkboard">Animated Blackboard & Proofs</option>
                    <option value="simulation_lab">Interactive Physics/Chem Sim</option>
                    <option value="avatar_professor">2.5D Animated Professor</option>
                    <option value="dark_neon">Dark Neon Cyber-STEM</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Narration Voice Style</label>
                  <select
                    value={genVoiceTone}
                    onChange={(e) => setGenVoiceTone(e.target.value as VideoVoiceTone)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="energetic_mentor">Energetic Peer Mentor</option>
                    <option value="calm_professor">Calm University Professor</option>
                    <option value="eli13_simple">Simplified Metaphor Guide</option>
                    <option value="exam_drill_coach">Rapid Exam Drill Coach</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Duration</label>
                  <select
                    value={genDuration}
                    onChange={(e) => setGenDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value={2}>2 Minutes (Quick Sprint)</option>
                    <option value={3}>3 Minutes (Standard Lesson)</option>
                    <option value={5}>5 Minutes (Deep Dive Masterclass)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Optional: Paste notes, problem statement, or textbook excerpts
                </label>
                <textarea
                  rows={2}
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  placeholder="Paste any specific formulas or questions you want included in the animated video..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !genTopic.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold shadow-md transition active:scale-95 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Generating Video Lesson...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Render AI Video (+80 XP)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
