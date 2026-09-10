import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { Flame, Sparkles, Moon, Sun, Menu, Edit2, Check, X, Crown, Bell, GraduationCap, Zap } from 'lucide-react';

interface NavbarProps {
  profile: StudentProfile;
  isDarkMode?: boolean;
  darkMode?: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileNav?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenCoach?: () => void;
  onOpenProfile?: () => void;
  onOpenUpgrade?: () => void;
  unreadNotificationCount?: number;
  onToggleNotifications?: () => void;
  appName?: string;
  onRenameApp?: (name: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  isDarkMode,
  darkMode,
  onToggleDarkMode,
  onToggleMobileNav,
  onToggleMobileMenu,
  onOpenCoach,
  onOpenProfile,
  onOpenUpgrade,
  unreadNotificationCount = 0,
  onToggleNotifications,
  appName = 'EduNex',
  onRenameApp,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(appName);

  const isDark = isDarkMode ?? darkMode ?? true;
  const toggleMenu = onToggleMobileNav || onToggleMobileMenu || (() => {});
  const xpPercent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  const handleSaveName = () => {
    if (tempName.trim() && onRenameApp) {
      onRenameApp(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-blue-100/80 dark:border-blue-950/70 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-menu-btn"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* EduNex Custom Emblem Logo */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 p-[1.5px] shadow-md shadow-blue-600/25 relative group select-none shrink-0 transition-transform duration-300 hover:scale-105">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/90 via-indigo-600/80 to-purple-500/90" />
                <div className="relative z-10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white drop-shadow-xs" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-900 flex items-center justify-center shadow-xs">
                  <Zap className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                </div>
              </div>
            </div>

            <div className="relative">
              {isEditingName ? (
                <div className="relative z-50">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[#0f172a] p-1 rounded-xl shadow-lg border border-blue-400">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      autoFocus
                      placeholder="Enter app name..."
                      className="px-2 py-1 text-sm font-bold rounded-lg bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-white outline-none ring-1 ring-blue-500 w-36 sm:w-48"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                      title="Save name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setTempName(appName);
                        setIsEditingName(false);
                      }}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Preset Selector Popover */}
                  <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/60 space-y-2 animate-fadeIn">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Choose Preset Name:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['EduNex', 'EduNex AI', 'NovaStudy AI', 'Synapse AI', 'CogniFlow', 'ApexStudy'].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              if (onRenameApp) onRenameApp(preset);
                              setTempName(preset);
                              setIsEditingName(false);
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 transition cursor-pointer"
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <div
                    onClick={() => {
                      setTempName(appName);
                      setIsEditingName(true);
                    }}
                    className="cursor-pointer hover:opacity-90 transition flex items-center gap-1.5"
                    title="Click to rename app"
                  >
                    <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
                      {appName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 hidden sm:inline-block">
                      AI
                    </span>
                  </div>
                  {onRenameApp && (
                    <button
                      onClick={() => {
                        setTempName(appName);
                        setIsEditingName(true);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                      title="Rename App"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                Your Personal Learning Companion
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right stats bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak indicator */}
          <div
            id="streak-indicator"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold shadow-xs"
            title={`${profile.streakDays} Day Study Streak`}
          >
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{profile.streakDays}</span>
            <span className="hidden sm:inline text-xs font-medium text-amber-600 dark:text-amber-400">days</span>
          </div>

          {/* Level and XP Meter */}
          <div
            id="xp-progress-bar"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/70 dark:bg-[#11192e] border border-blue-100 dark:border-blue-900/60"
            title={`Level ${profile.level} - ${profile.xp} XP`}
          >
            <span className="text-xs font-bold text-blue-600 dark:text-cyan-300">Lv.{profile.level}</span>
            <div className="w-16 md:w-24 bg-blue-200/60 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {profile.xp} / {profile.xpToNextLevel} XP
            </span>
          </div>

          {/* Free Trial / Upgrade from $99 Badge Button */}
          {onOpenUpgrade && (
            <button
              id="navbar-upgrade-btn"
              onClick={onOpenUpgrade}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                profile.subscription?.isUpgraded
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'bg-gradient-to-r from-amber-500/15 via-blue-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-blue-500/25 border border-amber-300/80 dark:border-amber-500/40 text-slate-800 dark:text-slate-100 group'
              }`}
            >
              <Crown
                className={`w-3.5 h-3.5 shrink-0 ${
                  profile.subscription?.isUpgraded
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-amber-500 fill-amber-500 group-hover:scale-110 transition'
                }`}
              />
              {profile.subscription?.isUpgraded ? (
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300">Pro Scholar</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="hidden md:inline text-amber-700 dark:text-amber-400 font-extrabold text-[11px]">
                    Trial ({profile.subscription?.trialDaysLeft ?? 4}d)
                  </span>
                  <span className="text-blue-600 dark:text-cyan-300 font-black">
                    Upgrade from $99
                  </span>
                </div>
              )}
            </button>
          )}

          {/* AI Coach Quick Trigger */}
          {onOpenCoach && (
            <button
              id="quick-coach-btn"
              onClick={onOpenCoach}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-medium shadow-sm shadow-blue-600/25 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Tutor</span>
            </button>
          )}

          {/* Notification Center Trigger */}
          {onToggleNotifications && (
            <button
              id="navbar-notification-btn"
              onClick={onToggleNotifications}
              aria-label="Open notifications and study alerts"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-blue-900/40 transition group"
              title="Study Alarms & Due Flashcard Hub"
            >
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-[#090d16] animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            id="dark-mode-toggle"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark/light theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-blue-900/40 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Student mini avatar */}
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-blue-100 dark:border-blue-950/80 cursor-pointer group"
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-8 h-8 rounded-full ring-2 ring-blue-500/30 group-hover:ring-blue-500 object-cover transition"
            />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{profile.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{profile.grade}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
