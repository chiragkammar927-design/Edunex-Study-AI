import React, { useEffect } from 'react';
import {
  BellRing,
  CalendarDays,
  BrainCircuit,
  X,
  ArrowRight,
  Zap,
  Volume2,
} from 'lucide-react';
import { AppNotification } from '../types';

interface ActiveNotificationToastProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onAction: (notification: AppNotification) => void;
}

export const ActiveNotificationToast: React.FC<ActiveNotificationToastProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 9000); // auto-dismiss after 9 seconds

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isStudy = notification.type === 'study_block';

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-bounce-short shadow-2xl transition-all">
      <div
        className={`p-4 rounded-2xl border backdrop-blur-md transition-all ${
          isStudy
            ? 'bg-slate-900/95 border-teal-500/70 text-white shadow-teal-500/20 shadow-lg ring-1 ring-teal-400/30'
            : 'bg-slate-900/95 border-amber-500/70 text-white shadow-amber-500/20 shadow-lg ring-1 ring-amber-400/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isStudy
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                  : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              }`}
            >
              {isStudy ? <CalendarDays className="w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                    isStudy
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {isStudy ? 'Study Block Active' : 'Spaced Deck Due'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span>Push Alert</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                {notification.title}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-2 line-clamp-2">
          {notification.message}
        </p>

        {/* Action Button Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={onDismiss}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-medium px-2 py-1 rounded"
          >
            Snooze
          </button>

          <button
            onClick={() => onAction(notification)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 ${
              isStudy
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isStudy ? (
              <>
                <span>Begin Study Block</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>15s Micro-Recall</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
