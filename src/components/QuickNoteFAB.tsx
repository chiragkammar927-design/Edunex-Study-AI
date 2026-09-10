import React, { useEffect } from 'react';
import { PenSquare, Sparkles, FileEdit } from 'lucide-react';
import { soundFX } from '../utils/soundOrConfetti';

interface QuickNoteFABProps {
  onClick: () => void;
  draftsCount?: number;
}

export const QuickNoteFAB: React.FC<QuickNoteFABProps> = ({ onClick, draftsCount = 0 }) => {
  // Global hotkey support (Alt+N or Option+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt+N (or Option+N on Mac)
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        soundFX.playPop();
        onClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClick]);

  const handleClick = () => {
    soundFX.playPop();
    onClick();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 flex flex-col items-end gap-2 group select-none">
      {/* Tooltip & Shortcut indicator */}
      <div className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs font-semibold shadow-lg backdrop-blur-md border border-slate-700/60 animate-fadeIn mb-1">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Jot Fast Note & Snap Draft</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-[10px] text-cyan-300 font-mono border border-slate-600">
          Alt+N
        </kbd>
      </div>

      {/* Main Floating Action Button */}
      <button
        id="quick-note-fab-btn"
        type="button"
        onClick={handleClick}
        aria-label="Quick Note & SnapStudy Draft"
        className="relative flex items-center justify-center p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group-hover:ring-4 group-hover:ring-cyan-400/30"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <PenSquare className="w-5 h-5 sm:w-5 sm:h-5 text-white transition-transform group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
          </div>
          
          <span className="hidden sm:inline-block font-extrabold text-xs tracking-tight">
            Quick Note
          </span>
        </div>

        {/* Drafts count badge if any exist */}
        {draftsCount > 0 && (
          <span
            id="fab-drafts-badge"
            className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-md border border-white dark:border-slate-900 animate-bounce"
            title={`${draftsCount} saved SnapStudy drafts`}
          >
            {draftsCount}
          </span>
        )}
      </button>
    </div>
  );
};
