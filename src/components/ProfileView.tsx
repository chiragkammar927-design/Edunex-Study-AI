import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import {
  Award,
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Lock,
  Trophy,
  Users,
  Crown,
  Phone,
  MessageCircle,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface ProfileViewProps {
  profile: StudentProfile;
  onAddXP: (xp: number) => void;
  onOpenUpgrade?: () => void;
  onAddStudyMinutes?: (minutes: number) => void;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onAddXP,
  onOpenUpgrade,
  onAddStudyMinutes,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
}) => {
  // Pomodoro Timer State
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<'none' | 'lofi' | 'rain' | 'whitenoise'>('none');

  useEffect(() => {
    let timer: any;
    if (isTimerRunning) {
      timer = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds((prev) => prev - 1);
        } else if (pomodoroMinutes > 0) {
          setPomodoroMinutes((prev) => prev - 1);
          setPomodoroSeconds(59);
        } else {
          // Pomodoro Completed!
          setIsTimerRunning(false);
          soundFX.playSuccess();
          triggerCelebration();
          onAddXP(50);
          onAddStudyMinutes?.(25);
          setPomodoroMinutes(25);
          setPomodoroSeconds(0);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, pomodoroMinutes, pomodoroSeconds, onAddStudyMinutes, onAddXP]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    soundFX.playChime();
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
  };

  const leaderboardUsers = [
    { rank: 1, name: 'Maya Lin', level: 12, xp: 4850, streak: 21, avatar: '👩‍🎓' },
    { rank: 2, name: `${profile.name} (You)`, level: profile.level, xp: profile.xp, streak: profile.streakDays, avatar: '⚡', isMe: true },
    { rank: 3, name: 'Liam Chen', level: 8, xp: 3200, streak: 12, avatar: '🧑‍💻' },
    { rank: 4, name: 'Sarah Patel', level: 8, xp: 3050, streak: 14, avatar: '🔬' },
    { rank: 5, name: 'Daniel Brooks', level: 7, xp: 2890, streak: 9, avatar: '📐' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border border-purple-900/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 text-white text-2xl font-black flex items-center justify-center shadow-lg">
              {profile.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Level {profile.level} Scholar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-current" /> {profile.streakDays} Day Streak
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                  <Zap className="w-3.5 h-3.5" /> {profile.xp} Total XP
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenUpgrade && (
              <button
                onClick={onOpenUpgrade}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                  profile.subscription?.isUpgraded
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>
                  {profile.subscription?.isUpgraded
                    ? 'Pro Scholar (Active)'
                    : `Free Trial (${profile.subscription?.trialDaysLeft ?? 4}d left) • Upgrade from $99`}
                </span>
              </button>
            )}

            {/* Firebase Google Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[150px]">{currentUser.email || 'Cloud Synced'}</span>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              onSignInWithGoogle && (
                <button
                  onClick={onSignInWithGoogle}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Google Account</span>
                </button>
              )
            )}

            <button
              onClick={() => {
                onAddXP(50);
                triggerCelebration();
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Claim Daily Login +50 XP</span>
            </button>
          </div>
        </div>

        {/* Level Progression Gauge */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span>Level {profile.level} (Scholar)</span>
            <span>{profile.xpToNextLevel - profile.xp} XP to Level {profile.level + 1} (Master)</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2-Col: Pomodoro Study Timer & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6: Pomodoro Focus Timer */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Pomodoro Focus Station</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              +50 XP on completion
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
              {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-2 ${
                  isTimerRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pause Session' : 'Start 25m Focus'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition active:scale-95"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {onAddStudyMinutes && (
                <button
                  type="button"
                  onClick={() => {
                    onAddStudyMinutes(15);
                    onAddXP(30);
                    soundFX.playSuccess();
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title="Quick-log 15 minutes of study"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>+15m Log</span>
                </button>
              )}
            </div>
          </div>

          {/* Ambient Sound Mode */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Ambient Sound:
            </span>
            <div className="flex gap-1.5 text-xs font-semibold">
              {(['none', 'lofi', 'rain', 'whitenoise'] as const).map((snd) => (
                <button
                  key={snd}
                  onClick={() => setActiveSound(snd)}
                  className={`px-2.5 py-1 rounded-lg transition capitalize ${
                    activeSound === snd
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {snd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 6: Friendly Leaderboard */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Friendly Study Leaderboard</span>
            </h3>
            <span className="text-xs text-slate-400">Weekly Reset in 2d</span>
          </div>

          <div className="space-y-2">
            {leaderboardUsers.map((user) => (
              <div
                key={user.name}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  user.isMe
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-500/30'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center text-xs font-black ${
                      user.rank === 1
                        ? 'text-amber-500 text-sm'
                        : user.rank === 2
                        ? 'text-slate-400'
                        : 'text-amber-700'
                    }`}
                  >
                    #{user.rank}
                  </span>
                  <span className="text-lg">{user.avatar}</span>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500">Level {user.level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Flame className="w-3 h-3 fill-current" /> {user.streak}d
                  </span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    {user.xp} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-500" />
          <span>Earned Badges & Milestones</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {profile.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border text-center flex flex-col items-center justify-between transition ${
                badge.unlocked
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="text-3xl mb-1">{badge.icon}</div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{badge.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{badge.description}</p>
              <span
                className={`mt-2 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  badge.unlocked
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
