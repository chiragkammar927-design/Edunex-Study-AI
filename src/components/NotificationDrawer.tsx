import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  X,
  Sparkles,
  BrainCircuit,
  CalendarDays,
  Clock,
  Play,
  Square,
  Volume2,
  VolumeX,
  Headphones,
  Flame,
  ArrowRight,
  Zap,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { AppNotification, NotificationSettings, StudyPlanSchedule, Flashcard, SubjectType } from '../types';
import { notificationService } from '../services/notificationService';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab: (tab: 'planner' | 'memory' | 'settings', meta?: any) => void;
  schedule: StudyPlanSchedule[];
  flashcards: Flashcard[];
  onAddXP: (xp: number) => void;
  onReviewCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onTriggerTestNotification: (type: 'study' | 'flashcard') => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  onNavigateTab,
  schedule,
  flashcards,
  onAddXP,
  onReviewCard,
  onTriggerTestNotification,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    notificationService.getPermissionStatus()
  );
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [activeTab, setActiveTab] = useState<'alerts' | 'micro_recall' | 'neuro_focus'>('alerts');

  // Micro-Recall state
  const [microCard, setMicroCard] = useState<Flashcard | null>(null);
  const [isMicroFlipped, setIsMicroFlipped] = useState(false);
  const [microCompleted, setMicroCompleted] = useState(false);

  // Binaural audio state
  const [binauralType, setBinauralType] = useState<'alpha432' | 'gamma40' | 'ambientRain'>('alpha432');
  const [isPlayingAudio, setIsPlayingAudio] = useState(soundFX.isBinauralActive());
  const [audioVolume, setAudioVolume] = useState(0.4);

  // Update permission status on mount
  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
  }, [isOpen]);

  // Load first due flashcard for micro-recall
  useEffect(() => {
    const due = flashcards.filter(
      (c) => c.nextReviewDate <= 'Today' || c.nextReviewDate === 'Immediate'
    );
    if (due.length > 0) {
      setMicroCard(due[0]);
    } else if (flashcards.length > 0) {
      setMicroCard(flashcards[0]);
    }
  }, [flashcards]);

  const handleRequestPermission = async () => {
    const result = await notificationService.requestPermission();
    setPermissionStatus(result);
    setSettings(notificationService.getSettings());
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const updated = notificationService.updateSettings({
      [key]: !settings[key],
    });
    setSettings(updated);
    soundFX.playPop();
  };

  const handleToggleBinaural = (type?: 'alpha432' | 'gamma40' | 'ambientRain') => {
    const targetType = type || binauralType;
    if (isPlayingAudio && soundFX.getActiveBinauralType() === targetType) {
      soundFX.stopBinauralFocusTone();
      setIsPlayingAudio(false);
    } else {
      setBinauralType(targetType);
      soundFX.startBinauralFocusTone(targetType, audioVolume);
      setIsPlayingAudio(true);
    }
  };

  const handleRateMicroCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!microCard) return;
    onReviewCard(microCard.id, rating);
    onAddXP(15);
    setMicroCompleted(true);
    soundFX.playSuccess();
    triggerCelebration();

    setTimeout(() => {
      // Find next due card
      const remainingDue = flashcards.filter(
        (c) => (c.nextReviewDate <= 'Today' || c.nextReviewDate === 'Immediate') && c.id !== microCard.id
      );
      if (remainingDue.length > 0) {
        setMicroCard(remainingDue[0]);
        setIsMicroFlipped(false);
        setMicroCompleted(false);
      } else {
        setMicroCompleted(true);
      }
    }, 1200);
  };

  // Find due cards count
  const dueCards = flashcards.filter(
    (c) => c.nextReviewDate <= 'Today' || c.nextReviewDate === 'Immediate'
  );

  // Find today's tasks
  const todayPlan = schedule.find((s) => s.dayTitle.toLowerCase().includes('today')) || schedule[0];
  const pendingTasks = todayPlan ? todayPlan.tasks.filter((t) => !t.completed) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="notification-center-drawer"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] mt-2 sm:mt-12 transition-all"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>SynapsePulse™ Hub</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  AI Alert Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Push Notifications • Spaced Due Dates • Focus Audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {permissionStatus === 'granted' ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Browser Push Granted</span>
              </span>
            ) : permissionStatus === 'denied' ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Browser Blocked (In-App & Audio Active)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Browser Notifications</span>
              </span>
            )}
          </div>

          {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
            <button
              onClick={handleRequestPermission}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-xs transition"
            >
              Allow Push
            </button>
          )}
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alarms & Feed</span>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('micro_recall')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'micro_recall'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
            <span>15s Micro-Recall</span>
            {dueCards.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
                {dueCards.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('neuro_focus')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'neuro_focus'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-500" />
            <span>Focus Waves</span>
            {isPlayingAudio && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'alerts' && (
            <>
              {/* Quick Action Test Alerts Bar */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border border-indigo-200/80 dark:border-indigo-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Instant Push & Chime Simulator</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Browser & Audio</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onTriggerTestNotification('study')}
                    className="py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition"
                  >
                    <CalendarDays className="w-3 h-3" />
                    <span>Study Block Alert</span>
                  </button>
                  <button
                    onClick={() => onTriggerTestNotification('flashcard')}
                    className="py-1.5 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition"
                  >
                    <BrainCircuit className="w-3 h-3" />
                    <span>Deck Due Alert</span>
                  </button>
                </div>
              </div>

              {/* Live Upcoming Study Blocks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-teal-500" />
                    <span>Upcoming Study Blocks Today</span>
                  </span>
                  <button
                    onClick={() => {
                      onNavigateTab('planner');
                      onClose();
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>View Planner</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {pendingTasks.length > 0 ? (
                  <div className="space-y-1.5">
                    {pendingTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {task.subject} • {task.durationMinutes} mins scheduled
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            onNavigateTab('planner');
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-bold text-[10px] border border-teal-200 dark:border-teal-800/60"
                        >
                          Start Block
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                    All scheduled study blocks for today are completed! ✨
                  </div>
                )}
              </div>

              {/* Due Flashcards Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
                    <span>Flashcards Due for Spaced Review</span>
                  </span>
                  <button
                    onClick={() => {
                      onNavigateTab('memory');
                      onClose();
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Open Memory</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      {dueCards.length}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {dueCards.length} Card{dueCards.length === 1 ? '' : 's'} Due Today
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Peak recall interval: counter the forgetting curve
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('micro_recall')}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-xs transition"
                  >
                    15s Recall
                  </button>
                </div>
              </div>

              {/* Notification History Feed */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Recent Alerts Log</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="text-[10px] text-slate-400 hover:text-rose-500 transition font-normal"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No recent alerts. Notifications will appear here when study blocks start or cards become due.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkAsRead(n.id)}
                        className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                          n.read
                            ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 opacity-75'
                            : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/70 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            {n.type === 'study_block' ? (
                              <CalendarDays className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            ) : (
                              <BrainCircuit className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="line-clamp-1">{n.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400">
                            {n.meta?.subject || 'NovaStudy'}
                          </span>
                          {n.actionType === 'open_planner' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateTab('planner');
                                onClose();
                              }}
                              className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                            >
                              Open Planner →
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('micro_recall');
                              }}
                              className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                            >
                              Quick Recall Drill →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Unique Micro-Recall Interactive Stage */}
          {activeTab === 'micro_recall' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>15-Second In-Notification Micro-Drill (+15 XP)</span>
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Review this card now without leaving your current screen.
                </p>
              </div>

              {microCard && !microCompleted ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>{microCard.subject} • {microCard.chapter}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">Tap card to flip</span>
                  </div>

                  {/* Flip Card Stage */}
                  <div
                    onClick={() => {
                      setIsMicroFlipped(!isMicroFlipped);
                      soundFX.playPop();
                    }}
                    className={`min-h-[160px] p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between select-none ${
                      isMicroFlipped
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border-indigo-300 dark:border-indigo-700 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-2">
                        {isMicroFlipped ? 'Answer & Concept' : 'Question / Prompt'}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {isMicroFlipped ? microCard.back : microCard.front}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>{isMicroFlipped ? 'How easily did you recall this?' : 'Click anywhere to reveal answer'}</span>
                      <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Rating Buttons */}
                  {isMicroFlipped && (
                    <div className="grid grid-cols-4 gap-1.5 animate-fadeIn">
                      <button
                        onClick={() => handleRateMicroCard('again')}
                        className="py-2 px-1 text-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold hover:bg-rose-100 transition"
                      >
                        Again (1d)
                      </button>
                      <button
                        onClick={() => handleRateMicroCard('hard')}
                        className="py-2 px-1 text-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold hover:bg-amber-100 transition"
                      >
                        Hard (3d)
                      </button>
                      <button
                        onClick={() => handleRateMicroCard('good')}
                        className="py-2 px-1 text-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold hover:bg-blue-100 transition"
                      >
                        Good (7d)
                      </button>
                      <button
                        onClick={() => handleRateMicroCard('easy')}
                        className="py-2 px-1 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-100 transition"
                      >
                        Easy (14d)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Micro-Drill Completed! (+15 XP Awarded)
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Your retention index has been consolidated in your spaced repetition memory queue.
                  </p>
                  <button
                    onClick={() => {
                      onNavigateTab('memory');
                      onClose();
                    }}
                    className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>Open Full Memory Deck</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Unique Binaural Focus Audio & Ambient Generator */}
          {activeTab === 'neuro_focus' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs">
                <p className="font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Synthesized Neuro-Focus Frequencies</span>
                </p>
                <p className="text-[11px] text-cyan-700 dark:text-cyan-300 mt-0.5">
                  Generated in real-time via Web Audio API. Enhances cognitive endurance during scheduled study blocks.
                </p>
              </div>

              {/* Sound Frequency Selector */}
              <div className="space-y-2">
                {[
                  {
                    id: 'alpha432' as const,
                    title: '432Hz Harmonic Alpha Wave',
                    subtitle: '10Hz binaural delta for calm focus & long-term retention',
                    tag: 'Calm Learning',
                  },
                  {
                    id: 'gamma40' as const,
                    title: '40Hz Gamma Focus Pulse',
                    subtitle: 'High-frequency cognitive resonance for hard math/physics drills',
                    tag: 'Peak Problem Solving',
                  },
                  {
                    id: 'ambientRain' as const,
                    title: 'Gentle Pink Noise Rain',
                    subtitle: 'Synthesized organic rain filtering background distractions',
                    tag: 'Anti-Distraction',
                  },
                ].map((sound) => {
                  const isThisActive = isPlayingAudio && binauralType === sound.id;
                  return (
                    <div
                      key={sound.id}
                      onClick={() => handleToggleBinaural(sound.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isThisActive
                          ? 'bg-cyan-50/70 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-600 shadow-md ring-2 ring-cyan-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                            isThisActive
                              ? 'bg-cyan-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isThisActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{sound.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                              {sound.tag}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {sound.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Focus Volume</span>
                  </span>
                  <span>{Math.round(audioVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setAudioVolume(newVol);
                    if (isPlayingAudio) {
                      soundFX.startBinauralFocusTone(binauralType, newVol);
                    }
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onNavigateTab('settings');
              onClose();
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Notification Settings</span>
          </button>
          <span className="text-[10px] text-slate-400">
            Powered by Browser Notifications API
          </span>
        </div>
      </div>
    </div>
  );
};
