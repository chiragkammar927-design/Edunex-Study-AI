import React, { useState, useEffect } from 'react';
import {
  StudyCircle,
  LearningChallenge,
  SubjectType,
  StudentProfile,
  GroupStudyRoomData,
  AttendanceRecord,
} from '../types';
import {
  Users,
  Trophy,
  Flame,
  Radio,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Heart,
  Share2,
  Video,
  Mic,
  ShieldCheck,
  VideoOff,
  PenTool,
  MonitorUp,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';
import { GroupStudyRoom } from './GroupStudyRoom';
import { initialGroupStudyRooms, initialAttendanceHistory } from '../data/sampleGroupStudyData';

interface StudyCirclesProps {
  profile: StudentProfile;
  circles: StudyCircle[];
  challenges: LearningChallenge[];
  onToggleJoinCircle: (circleId: string) => void;
  onJoinChallenge: (challengeId: string) => void;
  onLogChallengeProgress: (challengeId: string) => void;
  onCreateCircle: (newCircle: Omit<StudyCircle, 'id' | 'membersCount' | 'activeNowCount' | 'streakDays' | 'joined'>) => void;
  onAddXP: (xp: number) => void;
  onRecordAttendance?: (roomTitle: string, subject: SubjectType, durationMinutes: number, xp: number) => void;
}

export const StudyCircles: React.FC<StudyCirclesProps> = ({
  profile,
  circles,
  challenges,
  onToggleJoinCircle,
  onJoinChallenge,
  onLogChallengeProgress,
  onCreateCircle,
  onAddXP,
  onRecordAttendance,
}) => {
  // Navigation subtabs
  const [activeSubtab, setActiveSubtab] = useState<'videorooms' | 'circles' | 'challenges' | 'studyhall' | 'attendance' | 'my-circles'>('videorooms');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Group Study Video Rooms State
  const [videoRooms, setVideoRooms] = useState<GroupStudyRoomData[]>(() => {
    const saved = localStorage.getItem('nexora_video_study_rooms');
    return saved ? JSON.parse(saved) : initialGroupStudyRooms;
  });

  // Active Video Room Modal
  const [activeVideoRoom, setActiveVideoRoom] = useState<GroupStudyRoomData | null>(null);

  // Attendance History State
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('nexora_attendance_history');
    return saved ? JSON.parse(saved) : initialAttendanceHistory;
  });

  // Challenge Leaderboard expanded state
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>('ch-calc-sprint');

  // Create Circle Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleSubject, setNewCircleSubject] = useState<SubjectType>('Mathematics');
  const [newCircleDesc, setNewCircleDesc] = useState('');
  const [newCircleHours, setNewCircleHours] = useState(10);
  const [newCircleTags, setNewCircleTags] = useState('');

  // Create Video Room Modal
  const [showCreateVideoRoomModal, setShowCreateVideoRoomModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState<SubjectType>('Mathematics');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomDuration, setNewRoomDuration] = useState(45);

  // Virtual Study Hall State
  const [hallTimerRunning, setHallTimerRunning] = useState(false);
  const [hallSeconds, setHallSeconds] = useState(25 * 60);
  const [cheeredMembers, setCheeredMembers] = useState<string[]>([]);

  // Persist video rooms & attendance history
  useEffect(() => {
    localStorage.setItem('nexora_video_study_rooms', JSON.stringify(videoRooms));
  }, [videoRooms]);

  useEffect(() => {
    localStorage.setItem('nexora_attendance_history', JSON.stringify(attendanceHistory));
  }, [attendanceHistory]);

  // Co-working peers in virtual study hall
  const studyHallPeers = [
    { id: 'p-1', name: 'Elena Rostova', avatar: '👩‍🏫', task: 'Integrating Trig Substitutions', timeElapsed: '18 min', circle: 'Calculus Slayers' },
    { id: 'p-2', name: 'Marcus Vance', avatar: '⚡', task: 'Newtonian Incline Forces', timeElapsed: '34 min', circle: 'Mechanics Syndicate' },
    { id: 'p-3', name: 'Lucas Kim', avatar: '🧑‍🎓', task: 'Cellular Respiration Flashcards', timeElapsed: '12 min', circle: 'Genetics Lab' },
    { id: 'p-4', name: 'Chloe Taylor', avatar: '🎯', task: 'Redox Oxidation Numbers', timeElapsed: '26 min', circle: 'Redox Titans' },
    { id: 'p-5', name: 'Aria Thorne', avatar: '🌸', task: 'Reviewing Mistake Bank', timeElapsed: '41 min', circle: '24/7 Silent Focus' },
  ];

  // Filter video rooms
  const filteredVideoRooms = videoRooms.filter((r) => {
    const matchesSubject = selectedSubject === 'All' || r.subject === selectedSubject;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Filter circles
  const filteredCircles = circles.filter((c) => {
    const matchesSubject = selectedSubject === 'All' || c.subject === selectedSubject;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeSubtab === 'my-circles' ? c.joined : true;
    return matchesSubject && matchesSearch && matchesTab;
  });

  // Filter challenges
  const filteredChallenges = challenges.filter((ch) => {
    const matchesSubject = selectedSubject === 'All' || ch.subject === selectedSubject;
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const handleSendCheer = (peerId: string) => {
    if (!cheeredMembers.includes(peerId)) {
      setCheeredMembers((prev) => [...prev, peerId]);
      soundFX.playSuccess();
      onAddXP(15);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    const parsedTags = newCircleTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onCreateCircle({
      name: newCircleName.trim(),
      subject: newCircleSubject,
      description: newCircleDesc.trim() || 'Collaborative study circle for focused mastery.',
      weeklyTargetHours: Number(newCircleHours) || 10,
      tags: parsedTags.length > 0 ? parsedTags : ['StudyGroup', newCircleSubject],
      avatarIcon: newCircleSubject === 'Mathematics' ? '📐' : newCircleSubject === 'Physics' ? '⚡' : newCircleSubject === 'Chemistry' ? '🧪' : '🧬',
      hostName: `${profile.name} (Founder)`,
      activeLiveRoom: true,
      recentMessages: [
        {
          id: `init-${Date.now()}`,
          sender: `${profile.name} (Founder)`,
          avatar: '⚡',
          text: `Welcome to ${newCircleName.trim()}! Let's hit our weekly study goal together.`,
          time: 'Just now',
        },
      ],
    });

    setShowCreateModal(false);
    setNewCircleName('');
    setNewCircleDesc('');
    setNewCircleTags('');
    soundFX.playSuccess();
    triggerCelebration();
    onAddXP(75);
  };

  const handleCreateVideoRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    const randomCode = `${newRoomSubject.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRoom: GroupStudyRoomData = {
      id: `room-custom-${Date.now()}`,
      title: newRoomTitle.trim(),
      subject: newRoomSubject,
      topic: newRoomTopic.trim() || 'Collaborative problem solving and sprint drill',
      hostName: `${profile.name} (You)`,
      roomCode: randomCode,
      activeLiveCount: 1,
      targetGoalMinutes: Number(newRoomDuration) || 45,
      participants: [
        {
          id: 'p-user-host',
          name: `${profile.name} (Host)`,
          avatar: profile.avatar || '⚡',
          role: 'host',
          isMuted: false,
          isVideoOn: true,
          isScreenSharing: false,
          handRaised: false,
          speaking: true,
          statusActivity: 'Hosting live study session',
          joinedAt: 'Just now',
          studyMinutes: 1,
          isUser: true,
        },
        {
          id: 'p-peer-auto1',
          name: 'Elena Rostova',
          avatar: '👩‍🏫',
          role: 'co-host',
          isMuted: true,
          isVideoOn: true,
          isScreenSharing: false,
          handRaised: false,
          speaking: false,
          statusActivity: 'Joined room',
          joinedAt: '1m ago',
          studyMinutes: 1,
        },
      ],
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: `${profile.name} (Host)`,
          avatar: profile.avatar || '⚡',
          text: `Welcome to ${newRoomTitle.trim()}! Focus topic: ${newRoomTopic.trim() || 'General Practice'}.`,
          time: 'Just now',
          messageType: 'text',
        },
      ],
      sharedNotes: `## 📚 ${newRoomTitle.trim()}\n\n• Topic: ${newRoomTopic.trim() || 'General Group Study'}\n• Host: ${profile.name}\n• Target duration: ${newRoomDuration} minutes`,
    };

    setVideoRooms((prev) => [newRoom, ...prev]);
    setShowCreateVideoRoomModal(false);
    setNewRoomTitle('');
    setNewRoomTopic('');
    soundFX.playSuccess();
    triggerCelebration();
    onAddXP(60);
    setActiveVideoRoom(newRoom);
  };

  const handleRecordAttendance = (roomTitle: string, subject: SubjectType, durationMinutes: number, xp: number) => {
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      roomTitle,
      subject,
      date: 'Just now',
      durationMinutes,
      xpEarned: xp,
      verified: true,
    };
    setAttendanceHistory((prev) => [newRecord, ...prev]);
    if (onRecordAttendance) {
      onRecordAttendance(roomTitle, subject, durationMinutes, xp);
    }
  };

  // Launch video call for a specific circle
  const handleLaunchCircleVideoCall = (circle: StudyCircle) => {
    const existing = videoRooms.find((r) => r.circleId === circle.id);
    if (existing) {
      setActiveVideoRoom(existing);
    } else {
      const generatedRoom: GroupStudyRoomData = {
        id: `room-${circle.id}`,
        circleId: circle.id,
        title: `${circle.name} – Live Study Call`,
        subject: circle.subject,
        topic: circle.description,
        hostName: circle.hostName,
        roomCode: `${circle.subject.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        activeLiveCount: circle.activeNowCount || 3,
        targetGoalMinutes: 45,
        participants: [
          {
            id: `host-${circle.id}`,
            name: circle.hostName,
            avatar: circle.avatarIcon || '👩‍🏫',
            role: 'host',
            isMuted: false,
            isVideoOn: true,
            isScreenSharing: false,
            handRaised: false,
            speaking: true,
            statusActivity: `Hosting ${circle.name}`,
            joinedAt: '15m ago',
            studyMinutes: 25,
          },
          {
            id: `peer-${circle.id}-1`,
            name: 'Marcus Vance',
            avatar: '⚡',
            role: 'attendee',
            isMuted: true,
            isVideoOn: true,
            isScreenSharing: false,
            handRaised: false,
            speaking: false,
            statusActivity: 'Solving practice set',
            joinedAt: '10m ago',
            studyMinutes: 18,
          },
        ],
        messages: circle.recentMessages?.map((m) => ({
          id: m.id,
          sender: m.sender,
          avatar: m.avatar,
          text: m.text,
          time: m.time,
          messageType: 'text',
        })) || [],
        sharedNotes: `## 📚 ${circle.name} Group Notes\n\n• Weekly target: ${circle.weeklyTargetHours}h\n• Tags: ${circle.tags.join(', ')}`,
      };
      setActiveVideoRoom(generatedRoom);
    }
    soundFX.playSuccess();
  };

  const joinedCirclesCount = circles.filter((c) => c.joined).length;
  const totalAttendedMinutes = attendanceHistory.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
              <Video className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Group Study, Video Calls & Verified Attendance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Group Study, Video Rooms & Circles
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Attend live video calls with real cameras, collaborative whiteboards, synchronized group Pomodoro sprints, and real-time chat.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Live Calls Attending</span>
              <span className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {videoRooms.length} Active Calls
              </span>
            </div>

            <button
              onClick={() => setShowCreateVideoRoomModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <Video className="w-4 h-4" />
              <span>Start Video Room</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create Circle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Primary Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveSubtab('videorooms')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeSubtab === 'videorooms'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-300" />
            <span>Live Video Calls</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black animate-pulse">
              ● LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveSubtab('circles')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeSubtab === 'circles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Study Circles</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
              {circles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubtab('challenges')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeSubtab === 'challenges'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Public Challenges</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
              {challenges.length} Active
            </span>
          </button>

          <button
            onClick={() => setActiveSubtab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeSubtab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Attendance Log</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 font-bold">
              {attendanceHistory.length} Sessions
            </span>
          </button>

          <button
            onClick={() => setActiveSubtab('studyhall')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeSubtab === 'studyhall'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Silent Study Hall</span>
          </button>

          <button
            onClick={() => setActiveSubtab('my-circles')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeSubtab === 'my-circles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>My Circles ({joinedCirclesCount})</span>
          </button>
        </div>

        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, topics, hosts..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
            />
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
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
      </div>

      {/* VIEW 1: LIVE GROUP STUDY VIDEO ROOMS */}
      {activeSubtab === 'videorooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>Active Group Study Calls & Video Rooms</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join live audio/video calls with peer learners. Share screens, write formulas on the shared whiteboard, and verify study attendance.
              </p>
            </div>
            <button
              onClick={() => setShowCreateVideoRoomModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Host Study Call</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideoRooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar: Live indicator, Subject & Code */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      LIVE CALL
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {room.roomCode}
                    </span>
                  </div>

                  {/* Room Title & Host */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Host: <span className="font-semibold text-slate-700 dark:text-slate-300">{room.hostName}</span>
                    </p>
                  </div>

                  {/* Topic Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-indigo-500 block mb-0.5 text-[10px] uppercase">
                      Topic Focus:
                    </span>
                    <p className="line-clamp-2 leading-relaxed">
                      {room.topic}
                    </p>
                  </div>

                  {/* Attending Participants Filmstrip */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2 overflow-hidden">
                        {room.participants.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-sm shadow-xs"
                            title={`${p.name} (${p.statusActivity})`}
                          >
                            {p.avatar}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1.5">
                        {room.participants.length} Attending
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {room.targetGoalMinutes}m goal
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveVideoRoom(room);
                      soundFX.playSuccess();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Attend Video Call & Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: STUDY CIRCLES LIST */}
      {activeSubtab === 'circles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Trending Study Circles</span>
            </h2>
            <span className="text-xs text-slate-500">
              Showing {filteredCircles.length} communities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCircles.map((circle) => (
              <div
                key={circle.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/50 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-2xl flex items-center justify-center border border-indigo-500/20">
                        {circle.avatarIcon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                          {circle.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Host: {circle.hostName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {circle.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {circle.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleLaunchCircleVideoCall(circle)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Attend Call</span>
                  </button>

                  <button
                    onClick={() => onToggleJoinCircle(circle.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                      circle.joined ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'border border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {circle.joined ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: ATTENDANCE LOG & VERIFIED HOURS */}
      {activeSubtab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Verified Group Study Attendance Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every video study call you attend earns attendance certification, XP bonuses, and tracks towards your weekly study streak.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">Total Attended</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{totalAttendedMinutes} Minutes</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {attendanceHistory.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Attendance Records Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Join a live video study call and click "Mark Attendance" to verify your collaborative study session.
                </p>
                <button
                  onClick={() => setActiveSubtab('videorooms')}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Join Live Video Study Call
                </button>
              </div>
            ) : (
              attendanceHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {rec.roomTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {rec.subject} • {rec.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      ⏱️ {rec.durationMinutes} min session
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
                      +{rec.xpEarned} XP Verified ✓
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: PUBLIC CHALLENGES */}
      {activeSubtab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Public Learning Challenges</span>
            </h2>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              Weekly Tournament
            </span>
          </div>

          <div className="space-y-4">
            {filteredChallenges.map((challenge) => {
              const percent = Math.min(100, Math.round((challenge.currentCount / challenge.targetCount) * 100));

              return (
                <div
                  key={challenge.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition hover:border-indigo-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {challenge.subject}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {challenge.daysRemaining} days left
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {challenge.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3">
                      <div className="text-3xl">{challenge.badgeIcon}</div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Prize Reward</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{challenge.badgeReward}</p>
                        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">+{challenge.rewardXP} XP</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Progress: {challenge.currentCount} / {challenge.targetCount} {challenge.unit} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {!challenge.joined ? (
                      <button
                        onClick={() => {
                          onJoinChallenge(challenge.id);
                          soundFX.playSuccess();
                          onAddXP(50);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                      >
                        Join Challenge (+50 XP)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onLogChallengeProgress(challenge.id);
                          soundFX.playSuccess();
                          onAddXP(40);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Log Today's Target (+40 Pts)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 5: VIRTUAL SILENT STUDY HALL */}
      {activeSubtab === 'studyhall' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/40 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>Global Synchronized Study Hall</span>
                </div>
                <h2 className="text-2xl font-black text-white">Silent Co-Working Session</h2>
              </div>

              <button
                onClick={() => {
                  setHallTimerRunning(!hallTimerRunning);
                  soundFX.playChime();
                }}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                  hallTimerRunning ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {hallTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{hallTimerRunning ? 'Pause Sprint' : 'Join Co-Working Sprint'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {studyHallPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                      {peer.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{peer.name}</p>
                      <p className="text-[11px] text-indigo-300">{peer.task}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendCheer(peer.id)}
                    className="p-2 rounded-xl bg-white/10 border border-white/20 text-slate-300 hover:text-white"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: MY CIRCLES */}
      {activeSubtab === 'my-circles' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Circles You Have Joined ({joinedCirclesCount})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circles.filter((c) => c.joined).map((circle) => (
              <div
                key={circle.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{circle.avatarIcon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{circle.name}</h3>
                      <p className="text-xs text-slate-500">{circle.subject}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{circle.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleLaunchCircleVideoCall(circle)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Attend Video Room</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ACTIVE FULLSCREEN GROUP STUDY VIDEO CALL & CHAT */}
      {activeVideoRoom && (
        <GroupStudyRoom
          room={activeVideoRoom}
          profile={profile}
          onClose={() => setActiveVideoRoom(null)}
          onAddXP={onAddXP}
          onRecordAttendance={handleRecordAttendance}
        />
      )}

      {/* MODAL: CREATE LIVE VIDEO STUDY ROOM */}
      {showCreateVideoRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-500" />
                <span>Host a Live Group Study Video Call</span>
              </h3>
              <button
                onClick={() => setShowCreateVideoRoomModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVideoRoomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Room Title</label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="e.g. Calculus BC: Tabular Integration & Past Paper Drill"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                  <select
                    value={newRoomSubject}
                    onChange={(e) => setNewRoomSubject(e.target.value as SubjectType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 font-semibold"
                  >
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'English'].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sprint Duration (Mins)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={newRoomDuration}
                    onChange={(e) => setNewRoomDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Specific Problem / Topic Focus</label>
                <textarea
                  rows={3}
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  placeholder="e.g. Solving 10 integration by parts questions, sharing screen & notes together..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateVideoRoomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Room Now (+60 XP)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE STUDY CIRCLE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <span>Create a New Study Circle</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Circle Name</label>
                <input
                  type="text"
                  required
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g. AP Physics C: Electricity & Magnetism Sprint"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary Subject</label>
                  <select
                    value={newCircleSubject}
                    onChange={(e) => setNewCircleSubject(e.target.value as SubjectType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
                  >
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'English'].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Weekly Target (Hours)</label>
                  <input
                    type="number"
                    min={2}
                    max={40}
                    value={newCircleHours}
                    onChange={(e) => setNewCircleHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description & Goals</label>
                <textarea
                  rows={3}
                  value={newCircleDesc}
                  onChange={(e) => setNewCircleDesc(e.target.value)}
                  placeholder="Explain what topics your circle will conquer..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Circle (+75 XP)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
