import React, { useState, useEffect, useRef } from 'react';
import { SubjectType, SyllabusChapter, StudyPlanSchedule } from '../types';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Coffee,
  Brain,
  CheckCircle2,
  Sparkles,
  Volume2,
  Volume1,
  VolumeX,
  Plus,
  Flame,
  ArrowRight,
  BookOpen,
  Bell,
  BellRing,
  BellOff,
  Sliders,
  Check,
  Music,
  Zap,
  Clock,
  X,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Gauge,
  Wind,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  HeartPulse,
  Award,
  Calendar,
  CalendarDays,
  CheckSquare,
  History,
  ListTodo,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { soundFX, triggerCelebration, AlertSoundType } from '../utils/soundOrConfetti';
import { notificationService, NotificationStatus } from '../utils/notificationService';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';
export type FlowSensitivity = 'high' | 'balanced' | 'relaxed';

export interface FocusSessionRecord {
  id: string;
  timestamp: string;
  date: string;
  durationMinutes: number;
  subject: SubjectType | 'General Study';
  taskTitle?: string;
  bonusXpAwarded: number;
  completedAtFormatted: string;
}

export interface FocusCompletionCelebration {
  isOpen: boolean;
  minutesCompleted: number;
  baseXP: number;
  taskBonusXP: number;
  streakBonusXP: number;
  totalXP: number;
  taskTitle?: string;
  subject: string;
}

export interface DeepWorkInterruptionAlert {
  id: string;
  reason: string;
  prompt: string;
  subject: SubjectType | 'General Study';
  riskPercent: number;
  pausedAtFormatted: string;
  triggerType: 'tab_switch' | 'pause_stagnation' | 'inactivity' | 'test';
  momentumBefore: number;
}

interface PomodoroTimerProps {
  onAddStudyMinutes?: (minutes: number) => void;
  onAddXP?: (xp: number) => void;
  subjects?: SubjectType[];
  chapters?: SyllabusChapter[];
  schedule?: StudyPlanSchedule[];
  onToggleScheduleTask?: (scheduleId: string, taskId: string) => void;
  activeTaskId?: string;
  activeScheduleId?: string;
  onClearActiveTask?: () => void;
  className?: string;
  defaultSubject?: SubjectType;
  onNavigateToPlanner?: () => void;
}

const PRESET_DURATIONS: Record<PomodoroMode, number[]> = {
  focus: [15, 25, 50, 60],
  shortBreak: [3, 5, 10],
  longBreak: [15, 20, 30],
};

interface QuickStartOption {
  minutes: number;
  title: string;
  label: string;
  desc: string;
  badge?: string;
}

const QUICK_START_OPTIONS: QuickStartOption[] = [
  {
    minutes: 15,
    title: '15m',
    label: 'Sprint',
    desc: 'Quick recap & flashcards',
  },
  {
    minutes: 25,
    title: '25m',
    label: 'Classic',
    desc: 'Standard Pomodoro block',
    badge: 'Popular',
  },
  {
    minutes: 50,
    title: '50m',
    label: 'Deep Focus',
    desc: 'Complex problem solving',
  },
];

const ALERT_SOUND_OPTIONS: { id: AlertSoundType; name: string; subtitle: string; icon: string }[] = [
  { id: 'zen-bell', name: 'Zen Bell', subtitle: '528 Hz tranquil singing bowl & harmonic overtones', icon: '🔔' },
  { id: 'marimba', name: 'Warm Marimba', subtitle: 'Gentle wooden mallet acoustic chord', icon: '🪵' },
  { id: 'harp', name: 'Harp Ripple', subtitle: 'Delicate celestial ascending harp pluck', icon: '✨' },
  { id: 'tibetan-bowl', name: 'Tibetan Bowl', subtitle: 'Deep harmonic grounding resonance', icon: '🧘' },
  { id: 'friendly-chime', name: 'Friendly Chime', subtitle: 'Bright, modern two-note ascending bell', icon: '🎵' },
];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onAddStudyMinutes,
  onAddXP,
  subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General Study'],
  chapters = [],
  schedule = [],
  onToggleScheduleTask,
  activeTaskId,
  activeScheduleId,
  onClearActiveTask,
  className = '',
  defaultSubject = 'Mathematics',
  onNavigateToPlanner,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [shortBreakDurationMinutes, setShortBreakDurationMinutes] = useState(5);
  const [longBreakDurationMinutes, setLongBreakDurationMinutes] = useState(15);

  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro_sessions_today');
      return saved ? parseInt(saved, 10) : 2;
    } catch {
      return 2;
    }
  });
  const [totalFocusLoggedMinutes, setTotalFocusLoggedMinutes] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro_total_minutes_today');
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });

  // Study Planner Integration States
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(activeScheduleId || null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(activeTaskId || null);
  const [autoCompleteTaskOnFinish, setAutoCompleteTaskOnFinish] = useState(true);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);

  // Session History Records (Session tracking & XP logs)
  const [sessionHistory, setSessionHistory] = useState<FocusSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_session_history_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Celebration Modal for completed focus sessions & bonus XP
  const [completionCelebration, setCompletionCelebration] = useState<FocusCompletionCelebration | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubjectType | 'General Study'>(defaultSubject);
  const [selectedTopic, setSelectedTopic] = useState('');

  // Sync selectedSubject when parent passes updated defaultSubject and timer is not actively ticking
  useEffect(() => {
    if (defaultSubject && !isRunning && !selectedTaskId) {
      setSelectedSubject(defaultSubject);
    }
  }, [defaultSubject, isRunning, selectedTaskId]);

  // Sync incoming active task from Study Planner
  useEffect(() => {
    if (activeTaskId && activeScheduleId) {
      setSelectedTaskId(activeTaskId);
      setSelectedScheduleId(activeScheduleId);

      // Find the matched task in schedule
      const dayPlan = schedule.find((d) => d.id === activeScheduleId);
      const targetTask = dayPlan?.tasks.find((t) => t.id === activeTaskId);
      if (targetTask) {
        setSelectedSubject(targetTask.subject);
        setSelectedTopic(targetTask.title);

        // Pre-fill focus duration if idle
        if (!isRunning) {
          const matchDuration = [15, 25, 50, 60].includes(targetTask.durationMinutes)
            ? targetTask.durationMinutes
            : targetTask.durationMinutes <= 20
            ? 15
            : targetTask.durationMinutes <= 35
            ? 25
            : 50;
          setFocusDurationMinutes(matchDuration);
          setTotalDuration(matchDuration * 60);
          setTimeLeft(matchDuration * 60);
        }
      }
    }
  }, [activeTaskId, activeScheduleId, schedule, isRunning]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Audible Alert System Sound & Volume Preferences
  const [alertSound, setAlertSound] = useState<AlertSoundType>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_alert_sound');
      if (saved && ['zen-bell', 'marimba', 'harp', 'tibetan-bowl', 'friendly-chime'].includes(saved)) {
        return saved as AlertSoundType;
      }
    } catch {}
    return 'zen-bell';
  });

  const [alertVolume, setAlertVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_alert_volume');
      return saved ? parseFloat(saved) : 0.6;
    } catch {
      return 0.6;
    }
  });

  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [isAudibleRinging, setIsAudibleRinging] = useState(false);
  const [testingSoundId, setTestingSoundId] = useState<string | null>(null);
  const [logNotification, setLogNotification] = useState<string | null>(null);

  // Smart Reminder System States
  const [smartRemindersEnabled, setSmartRemindersEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro_smart_reminders_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [reminderIdleMinutes, setReminderIdleMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_reminder_idle_minutes');
      return saved ? parseInt(saved, 10) : 2;
    } catch {
      return 2;
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationStatus>(() => {
    return notificationService.getPermissionStatus();
  });

  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [activeReminderAlert, setActiveReminderAlert] = useState<{
    message: string;
    timeLeftFormatted: string;
  } | null>(null);
  const [idleSecondsPaused, setIdleSecondsPaused] = useState<number>(0);
  const hasTriggeredReminderForCurrentPauseRef = useRef<boolean>(false);

  // Predictive Deep Work Flow Guard States
  const [deepWorkFlowGuardEnabled, setDeepWorkFlowGuardEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_deep_work_guard_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [flowSensitivity, setFlowSensitivity] = useState<FlowSensitivity>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_flow_sensitivity');
      if (saved && ['high', 'balanced', 'relaxed'].includes(saved)) {
        return saved as FlowSensitivity;
      }
    } catch {}
    return 'balanced';
  });

  const [detectTabSwitch, setDetectTabSwitch] = useState(true);
  const [detectPauseStagnation, setDetectPauseStagnation] = useState(true);
  const [showDeepWorkDrawer, setShowDeepWorkDrawer] = useState(false);

  const [activeDeepWorkInterruption, setActiveDeepWorkInterruption] = useState<DeepWorkInterruptionAlert | null>(null);
  const [continuousFocusSeconds, setContinuousFocusSeconds] = useState<number>(0);
  const [flowRecoveriesToday, setFlowRecoveriesToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pomodoro_flow_recoveries_today');
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  // 10s Micro-Reset Ritual Modal State
  const [isMicroResetModalOpen, setIsMicroResetModalOpen] = useState(false);
  const [microResetSecondsLeft, setMicroResetSecondsLeft] = useState(10);
  const [microResetPhase, setMicroResetPhase] = useState<'inhale' | 'hold' | 'exhale' | 'ready'>('inhale');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const skipAutoPauseRef = useRef(false);

  // Flow Momentum % Calculation (35% -> 99%)
  const flowMomentum = Math.min(
    99,
    continuousFocusSeconds <= 0
      ? 35
      : continuousFocusSeconds < 180
      ? 35 + Math.round((continuousFocusSeconds / 180) * 30)
      : continuousFocusSeconds < 600
      ? 65 + Math.round(((continuousFocusSeconds - 180) / 420) * 23)
      : 88 + Math.round(((continuousFocusSeconds - 600) / 900) * 11)
  );

  // Continuous focus time accumulator
  useEffect(() => {
    if (isRunning && mode === 'focus') {
      const intv = setInterval(() => {
        setContinuousFocusSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(intv);
    }
  }, [isRunning, mode]);

  // AI Contextual Guidance Prompt Generator
  const getSubjectAIPrompt = (subj: string, trigger: string) => {
    switch (subj) {
      case 'Mathematics':
        return 'Calculus & deductive structures clear rapidly during context switching. Take a calm breath, re-read your last equation line, and execute one step.';
      case 'Physics':
        return 'Deep derivation synthesis was active. Physics conceptual models decay under task switching—re-anchor on the core force variables now.';
      case 'Chemistry':
        return 'Reaction pathway memory consolidation stalled. Re-engage immediately to maintain molecular mechanism retention.';
      case 'Biology':
        return 'Active recall rhythm interrupted. Glance at the previous diagram or physiological step to resume your neural retrieval streak.';
      default:
        return 'Your deep cognitive flow state was disrupted. Re-anchor right now with a single micro-task to preserve focus momentum and study streak.';
    }
  };

  // Trigger Predictive Deep Work Interruption
  const triggerDeepWorkInterruption = (
    triggerType: 'tab_switch' | 'pause_stagnation' | 'inactivity' | 'test',
    customReason?: string,
    isTest = false
  ) => {
    if (!deepWorkFlowGuardEnabled && !isTest) return;

    const formattedRemaining = formatTime(timeLeft);
    const reasonText =
      customReason ||
      (triggerType === 'tab_switch'
        ? `Tab or app switch detected away from ${selectedSubject}`
        : triggerType === 'pause_stagnation'
        ? `Unplanned study pause (${formattedRemaining} remaining in ${selectedSubject})`
        : triggerType === 'inactivity'
        ? `Study input dormancy detected in ${selectedSubject}`
        : `Simulated Flow Interruption Test in ${selectedSubject}`);

    const alertData: DeepWorkInterruptionAlert = {
      id: `deep-work-alert-${Date.now()}`,
      reason: reasonText,
      prompt: getSubjectAIPrompt(selectedSubject, triggerType),
      subject: selectedSubject,
      riskPercent: flowMomentum,
      pausedAtFormatted: formattedRemaining,
      triggerType,
      momentumBefore: flowMomentum,
    };

    setActiveDeepWorkInterruption(alertData);

    // Play 432 Hz soothing focus harmonic chime
    if (soundEnabled) {
      soundFX.playFocusRefocusPulse(alertVolume);
    }

    // Dispatch Native Push Notification
    notificationService.sendDeepWorkInterruptionAlert({
      title: isTest ? '⚡ AI Deep Work Flow Alert (Test)' : '⚡ AI Flow Alert: Re-Engage Deep Work',
      body: `Flow interrupted in ${selectedSubject}! ${formattedRemaining} left in this block. Tap to regain cognitive momentum.`,
      tag: 'deep-work-flow-alert',
      onClick: () => {
        handleRegainDeepWorkFocus();
      },
    });

    setLogNotification(
      isTest
        ? '⚡ AI Deep Work flow alert preview triggered!'
        : '⚠️ Flow disruption detected. Predictive recovery active.'
    );
    setTimeout(() => setLogNotification(null), 4000);
  };

  // 1-Click Regain Focus
  const handleRegainDeepWorkFocus = () => {
    setActiveDeepWorkInterruption(null);
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
    setIsRunning(true);

    if (soundEnabled) {
      soundFX.playFocusRefocusPulse(alertVolume);
      setTimeout(() => soundFX.playSuccess(), 400);
    }

    const updatedRecoveries = flowRecoveriesToday + 1;
    setFlowRecoveriesToday(updatedRecoveries);
    try {
      localStorage.setItem('pomodoro_flow_recoveries_today', updatedRecoveries.toString());
    } catch {}

    setLogNotification('⚡ Deep Work Flow Regained! 432 Hz focus pulse aligned. Keep going!');
    setTimeout(() => setLogNotification(null), 3500);
  };

  // Start 10-Second Micro-Reset Guided Ritual
  const handleStart10sMicroReset = () => {
    setActiveDeepWorkInterruption(null);
    setIsMicroResetModalOpen(true);
    setMicroResetSecondsLeft(10);
    setMicroResetPhase('inhale');
  };

  // Micro-Reset Modal countdown timer
  useEffect(() => {
    if (!isMicroResetModalOpen) return;

    if (microResetSecondsLeft <= 0) {
      setIsMicroResetModalOpen(false);
      setIsRunning(true);
      if (soundEnabled) {
        soundFX.playFocusRefocusPulse(alertVolume);
      }
      setLogNotification('🧘 Mind centered. Deep Work block resumed!');
      setTimeout(() => setLogNotification(null), 3000);
      return;
    }

    if (microResetSecondsLeft >= 7) {
      setMicroResetPhase('inhale');
    } else if (microResetSecondsLeft >= 5) {
      setMicroResetPhase('hold');
    } else if (microResetSecondsLeft >= 1) {
      setMicroResetPhase('exhale');
    } else {
      setMicroResetPhase('ready');
    }

    const timer = setTimeout(() => {
      setMicroResetSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isMicroResetModalOpen, microResetSecondsLeft, soundEnabled, alertVolume]);

  // Convert to 5-Minute Micro-Sprint
  const handleMicroSprintConvert = () => {
    setActiveDeepWorkInterruption(null);
    setFocusDurationMinutes(5);
    setTotalDuration(5 * 60);
    setTimeLeft(5 * 60);
    setIsRunning(true);
    if (soundEnabled) {
      soundFX.playFriendlyChime(alertVolume);
    }
    setLogNotification('🎯 Converted to 5m High-Intensity Micro-Sprint! Ready, set, go!');
    setTimeout(() => setLogNotification(null), 3500);
  };

  // Predictive Tab Switching / App Blur Detection Hook
  useEffect(() => {
    if (!deepWorkFlowGuardEnabled || !detectTabSwitch) return;

    let backgroundStartTime: number | null = null;
    let thresholdTimer: NodeJS.Timeout | null = null;

    const thresholdMs =
      flowSensitivity === 'high' ? 25000 : flowSensitivity === 'balanced' ? 50000 : 100000;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isRunning && mode === 'focus') {
          backgroundStartTime = Date.now();
          thresholdTimer = setTimeout(() => {
            triggerDeepWorkInterruption('tab_switch');
          }, thresholdMs);
        }
      } else {
        if (thresholdTimer) {
          clearTimeout(thresholdTimer);
          thresholdTimer = null;
        }
        if (backgroundStartTime) {
          const awaySec = Math.round((Date.now() - backgroundStartTime) / 1000);
          if (
            awaySec >= (flowSensitivity === 'high' ? 20 : flowSensitivity === 'balanced' ? 40 : 80) &&
            isRunning &&
            mode === 'focus'
          ) {
            triggerDeepWorkInterruption(
              'tab_switch',
              `Context switch detected: away for ${awaySec}s from ${selectedSubject}`
            );
          }
          backgroundStartTime = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (thresholdTimer) clearTimeout(thresholdTimer);
    };
  }, [deepWorkFlowGuardEnabled, detectTabSwitch, isRunning, mode, flowSensitivity, selectedSubject, timeLeft, flowMomentum]);

  // Predictive Unscheduled Pause Stagnation Hook
  useEffect(() => {
    if (!deepWorkFlowGuardEnabled || !detectPauseStagnation) return;

    const isPausedMidInterval =
      !isRunning && mode === 'focus' && timeLeft < totalDuration && timeLeft > 0;

    if (!isPausedMidInterval || activeDeepWorkInterruption) return;

    const pauseThresholdSec =
      flowSensitivity === 'high' ? 30 : flowSensitivity === 'balanced' ? 60 : 120;

    const interval = setInterval(() => {
      setIdleSecondsPaused((prev) => {
        const next = prev + 1;
        if (next >= pauseThresholdSec && !activeDeepWorkInterruption) {
          triggerDeepWorkInterruption(
            'pause_stagnation',
            `Study pause stagnant for ${next}s in ${selectedSubject}`
          );
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, timeLeft, totalDuration, deepWorkFlowGuardEnabled, detectPauseStagnation, flowSensitivity, selectedSubject, activeDeepWorkInterruption]);

  // Format MM:SS (declared early for use in reminder handlers)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleSmartReminders = () => {
    const next = !smartRemindersEnabled;
    setSmartRemindersEnabled(next);
    try {
      localStorage.setItem('pomodoro_smart_reminders_enabled', next.toString());
    } catch {}
    if (!next) {
      setActiveReminderAlert(null);
      setIdleSecondsPaused(0);
    }
  };

  const handleChangeReminderIdleMinutes = (mins: number) => {
    setReminderIdleMinutes(mins);
    try {
      localStorage.setItem('pomodoro_reminder_idle_minutes', mins.toString());
    } catch {}
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
  };

  const handleRequestNotificationPermission = async () => {
    const status = await notificationService.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      setLogNotification('🔔 Push notifications enabled! Test notification sent.');
      setTimeout(() => setLogNotification(null), 3500);
      triggerSmartReminderNotification(true);
    }
  };

  const triggerSmartReminderNotification = (isTest = false) => {
    const formattedRemaining = formatTime(timeLeft);
    const title = isTest ? '🔔 Smart Study Reminder (Test)' : '⏰ Resume Your Study Session!';
    const body = isTest
      ? `Push notifications are connected! You'll be notified if you pause during your ${focusDurationMinutes}m study session.`
      : `You paused your study interval with ${formattedRemaining} remaining in ${selectedSubject}. Resume now to keep your study streak!`;

    const pushSent = notificationService.sendStudyReminder({
      title,
      body,
      tag: isTest ? 'test-reminder' : `study-reminder-${Date.now()}`,
      onClick: () => {
        handleResumeFromReminder();
      },
    });

    if (soundEnabled) {
      soundFX.playFriendlyChime(alertVolume);
    }

    setActiveReminderAlert({
      message: isTest
        ? 'Test push notification fired! Resume whenever you are ready.'
        : `Your study interval is paused with ${formattedRemaining} remaining. Resume to maintain your daily study goal!`,
      timeLeftFormatted: formattedRemaining,
    });

    if (isTest) {
      setLogNotification(
        pushSent
          ? '🔔 Browser push notification dispatched!'
          : '🔔 Test reminder triggered (In-app preview active)'
      );
      setTimeout(() => setLogNotification(null), 3500);
    }
  };

  const handleResumeFromReminder = () => {
    setActiveReminderAlert(null);
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
    setIsRunning(true);
    if (soundEnabled) {
      soundFX.playSuccess();
    }
    setLogNotification('⚡ Study session resumed! Stay focused.');
    setTimeout(() => setLogNotification(null), 3000);
  };

  // Smart Reminder: Track idle pause duration during a focus session
  useEffect(() => {
    const isPausedMidInterval =
      !isRunning && mode === 'focus' && timeLeft < totalDuration && timeLeft > 0;

    if (!isPausedMidInterval || !smartRemindersEnabled) {
      setIdleSecondsPaused(0);
      return;
    }

    const interval = setInterval(() => {
      setIdleSecondsPaused((prev) => {
        const next = prev + 1;
        const triggerThreshold = reminderIdleMinutes * 60;

        if (next >= triggerThreshold && !hasTriggeredReminderForCurrentPauseRef.current) {
          hasTriggeredReminderForCurrentPauseRef.current = true;
          triggerSmartReminderNotification(false);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, timeLeft, totalDuration, smartRemindersEnabled, reminderIdleMinutes]);

  // Sync duration when mode or duration setting changes
  useEffect(() => {
    let targetMins = focusDurationMinutes;
    if (mode === 'shortBreak') targetMins = shortBreakDurationMinutes;
    if (mode === 'longBreak') targetMins = longBreakDurationMinutes;

    const seconds = targetMins * 60;
    setTotalDuration(seconds);
    setTimeLeft(seconds);
    if (skipAutoPauseRef.current) {
      skipAutoPauseRef.current = false;
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [mode, focusDurationMinutes, shortBreakDurationMinutes, longBreakDurationMinutes]);

  // Quick-Start study duration handler (immediate launch for common study sessions)
  const handleQuickStart = (mins: number, label: string) => {
    const seconds = mins * 60;
    const willStateChange = mode !== 'focus' || focusDurationMinutes !== mins;

    if (willStateChange) {
      skipAutoPauseRef.current = true;
    }
    setMode('focus');
    setFocusDurationMinutes(mins);
    setTotalDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(true);

    if (soundEnabled) {
      soundFX.playSuccess();
    }
    setLogNotification(`⚡ Quick-started ${mins}m ${label} focus session!`);
    setTimeout(() => setLogNotification(null), 3500);
  };

  // Main countdown timer interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, totalDuration, completedSessions]);

  const handleSelectSound = (sound: AlertSoundType) => {
    setAlertSound(sound);
    try {
      localStorage.setItem('pomodoro_alert_sound', sound);
    } catch {}
    // Play preview
    setTestingSoundId(sound);
    soundFX.playAlertSound(sound, alertVolume);
    setTimeout(() => setTestingSoundId(null), 1800);
  };

  const handleChangeVolume = (vol: number) => {
    setAlertVolume(vol);
    try {
      localStorage.setItem('pomodoro_alert_volume', vol.toString());
    } catch {}
  };

  // Handle Session Completion (auto-log study minutes to profile, mark task completed, award bonus XP)
  const handleSessionComplete = () => {
    setIsRunning(false);

    if (mode === 'focus') {
      const minutesCompleted = Math.max(1, Math.round(totalDuration / 60));

      // Auto-log to profile
      if (onAddStudyMinutes) {
        onAddStudyMinutes(minutesCompleted);
      }

      // Update local storage and stats
      const nextSessions = completedSessions + 1;
      const nextTotalMins = totalFocusLoggedMinutes + minutesCompleted;
      setCompletedSessions(nextSessions);
      setTotalFocusLoggedMinutes(nextTotalMins);
      try {
        localStorage.setItem('pomodoro_sessions_today', nextSessions.toString());
        localStorage.setItem('pomodoro_total_minutes_today', nextTotalMins.toString());
      } catch {
        // Safe fallback
      }

      // --- Calculate Bonus XP ---
      // Base XP: +2 XP per focused minute + 25 full session bonus
      const baseFocusXP = Math.max(25, minutesCompleted * 2) + 25;
      let taskBonusXP = 0;
      let completedTaskTitle = '';

      // Check if a Study Planner task is linked and should be auto-completed
      if (selectedScheduleId && selectedTaskId && autoCompleteTaskOnFinish && onToggleScheduleTask) {
        const dayPlan = schedule.find((d) => d.id === selectedScheduleId);
        const targetTask = dayPlan?.tasks.find((t) => t.id === selectedTaskId);
        if (targetTask) {
          completedTaskTitle = targetTask.title;
          if (!targetTask.completed) {
            onToggleScheduleTask(selectedScheduleId, selectedTaskId);
          }
          taskBonusXP = 50; // +50 Bonus XP for clearing a Study Planner objective!
        }
      }

      // Daily streak bonus
      const streakBonusXP = nextSessions >= 4 ? 30 : nextSessions >= 2 ? 15 : 0;
      const totalBonusXP = baseFocusXP + taskBonusXP + streakBonusXP;

      // Award XP to student profile
      if (onAddXP) {
        onAddXP(totalBonusXP);
      }

      // Save to Session History log
      const newRecord: FocusSessionRecord = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        durationMinutes: minutesCompleted,
        subject: selectedSubject,
        taskTitle: completedTaskTitle || undefined,
        bonusXpAwarded: totalBonusXP,
        completedAtFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessionHistory((prev) => {
        const updated = [newRecord, ...prev].slice(0, 30);
        try {
          localStorage.setItem('pomodoro_session_history_records', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      const activeSoundName = ALERT_SOUND_OPTIONS.find((s) => s.id === alertSound)?.name || 'Zen Bell';

      // Trigger gentle audible alert & victory chime
      if (soundEnabled) {
        setIsAudibleRinging(true);
        soundFX.playAlertSound(alertSound, alertVolume);
        setTimeout(() => {
          setIsAudibleRinging(false);
          soundFX.playMissionComplete();
        }, 1200);
      }
      triggerCelebration();

      // Show rich celebratory completion modal with XP breakdown
      setCompletionCelebration({
        isOpen: true,
        minutesCompleted,
        baseXP: baseFocusXP,
        taskBonusXP,
        streakBonusXP,
        totalXP: totalBonusXP,
        taskTitle: completedTaskTitle || undefined,
        subject: selectedSubject,
      });

      setLogNotification(
        `🎉 Focus session complete! +${totalBonusXP} Bonus XP awarded!${
          completedTaskTitle ? ` Task "${completedTaskTitle}" marked done in Study Planner!` : ''
        }`
      );
      setTimeout(() => setLogNotification(null), 6000);

      // Auto-transition to break
      if (nextSessions % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // Trigger gentle audible alert for break session end
      if (soundEnabled) {
        setIsAudibleRinging(true);
        soundFX.playBreakEndChime(alertVolume);
        setTimeout(() => setIsAudibleRinging(false), 3000);
      }
      setLogNotification('☕ Break finished! Gentle chime sounded. Ready to dive back in?');
      setTimeout(() => setLogNotification(null), 4000);
      setMode('focus');
    }
  };

  // Log partial session early with proportional XP & task completion
  const handleLogEarly = () => {
    if (mode !== 'focus') return;
    const elapsedSeconds = totalDuration - timeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 1) {
      setLogNotification('⚠️ Study for at least 1 minute to log time.');
      setTimeout(() => setLogNotification(null), 3000);
      return;
    }

    if (onAddStudyMinutes) {
      onAddStudyMinutes(elapsedMinutes);
    }

    const nextTotalMins = totalFocusLoggedMinutes + elapsedMinutes;
    setTotalFocusLoggedMinutes(nextTotalMins);
    try {
      localStorage.setItem('pomodoro_total_minutes_today', nextTotalMins.toString());
    } catch {}

    // Early partial XP: +2 XP per minute (minimum 10 XP)
    const partialXP = Math.max(10, elapsedMinutes * 2);
    let taskBonusXP = 0;
    let completedTaskTitle = '';

    // If task was linked, mark it completed if user focused for >= 10 mins or >= 50% of time
    if (
      selectedScheduleId &&
      selectedTaskId &&
      autoCompleteTaskOnFinish &&
      onToggleScheduleTask &&
      (elapsedMinutes >= 10 || elapsedSeconds >= totalDuration * 0.5)
    ) {
      const dayPlan = schedule.find((d) => d.id === selectedScheduleId);
      const targetTask = dayPlan?.tasks.find((t) => t.id === selectedTaskId);
      if (targetTask && !targetTask.completed) {
        onToggleScheduleTask(selectedScheduleId, selectedTaskId);
        completedTaskTitle = targetTask.title;
        taskBonusXP = 40; // Bonus for early completion with solid effort
      }
    }

    const totalAwarded = partialXP + taskBonusXP;
    if (onAddXP) {
      onAddXP(totalAwarded);
    }

    // Save to session history
    const newRecord: FocusSessionRecord = {
      id: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      durationMinutes: elapsedMinutes,
      subject: selectedSubject,
      taskTitle: completedTaskTitle || undefined,
      bonusXpAwarded: totalAwarded,
      completedAtFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessionHistory((prev) => {
      const updated = [newRecord, ...prev].slice(0, 30);
      try {
        localStorage.setItem('pomodoro_session_history_records', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (soundEnabled) soundFX.playSuccess();
    triggerCelebration();

    setLogNotification(
      `Logged +${elapsedMinutes}m partial focus time (+${totalAwarded} XP)${
        completedTaskTitle ? ` · Planner task "${completedTaskTitle}" marked done!` : ''
      }`
    );
    setTimeout(() => setLogNotification(null), 5000);

    handleReset();
  };

  const handleTogglePlay = () => {
    if (soundEnabled) soundFX.playPop();
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
    if (nextRunning) {
      setActiveReminderAlert(null);
    }
  };

  const handleReset = () => {
    if (soundEnabled) soundFX.playPop();
    setIsRunning(false);
    setTimeLeft(totalDuration);
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
    setActiveReminderAlert(null);
  };

  const handleSkip = () => {
    if (soundEnabled) soundFX.playPop();
    setIsRunning(false);
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
    setActiveReminderAlert(null);
    if (mode === 'focus') {
      setMode('shortBreak');
    } else {
      setMode('focus');
    }
  };

  const handleAddMinutes = (mins: number) => {
    if (soundEnabled) soundFX.playPop();
    setTimeLeft((prev) => prev + mins * 60);
    setTotalDuration((prev) => prev + mins * 60);
    setIdleSecondsPaused(0);
    hasTriggeredReminderForCurrentPauseRef.current = false;
    setActiveReminderAlert(null);
  };

  // Find linked task from schedule if any
  const linkedTask =
    selectedScheduleId && selectedTaskId
      ? schedule
          .flatMap((d) => d.tasks.map((t) => ({ ...t, scheduleId: d.id, dayTitle: d.dayTitle, dayDate: d.date })))
          .find((t) => t.id === selectedTaskId)
      : null;

  // Flatten pending tasks across all days in schedule
  const allPendingTasks = schedule.flatMap((day) =>
    day.tasks
      .filter((t) => !t.completed)
      .map((t) => ({
        ...t,
        scheduleId: day.id,
        dayTitle: day.dayTitle,
        dayDate: day.date,
      }))
  );

  // SVG circular calculations
  // Direct visual representation of remaining time in current session
  const remainingFraction = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;
  const remainingPercent = Math.round(remainingFraction * 100);

  // Circular progress ring around the Pomodoro timer button
  const btnRadius = 38;
  const btnCircumference = 2 * Math.PI * btnRadius;
  const btnStrokeDashoffset = btnCircumference * (1 - remainingFraction);

  // Main dial calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - remainingFraction);

  return (
    <div
      id="pomodoro-timer-widget"
      className={`rounded-2xl border transition-all duration-300 p-5 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden ${className}`}
    >
      {/* Background Accent Glow */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isAudibleRinging
            ? 'bg-amber-400 opacity-60 scale-125 animate-pulse'
            : mode === 'focus'
            ? 'bg-indigo-500 opacity-20'
            : mode === 'shortBreak'
            ? 'bg-emerald-500 opacity-20'
            : 'bg-cyan-500 opacity-20'
        }`}
      />

      {/* Header: Title & Audible Alert Controls */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              mode === 'focus'
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {mode === 'focus' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Pomodoro Focus Timer</span>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Auto-logs focus minutes directly to profile
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* Predictive AI Flow Guard Button */}
          <button
            type="button"
            onClick={() => {
              setShowDeepWorkDrawer(!showDeepWorkDrawer);
              if (showReminderSettings) setShowReminderSettings(false);
              if (showSoundSettings) setShowSoundSettings(false);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              showDeepWorkDrawer
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-transparent shadow-xs'
                : activeDeepWorkInterruption
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                : deepWorkFlowGuardEnabled
                ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-cyan-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border-indigo-200/80 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/50'
            }`}
            title="Predictive Deep Work Flow Guard: Detects interruptions and prompts focus recovery"
          >
            <Zap
              className={`w-3.5 h-3.5 ${
                showDeepWorkDrawer
                  ? 'text-yellow-300 fill-yellow-300'
                  : deepWorkFlowGuardEnabled
                  ? 'text-indigo-600 dark:text-cyan-400 fill-current'
                  : 'text-slate-400'
              }`}
            />
            <span className="text-[11px] font-extrabold hidden sm:inline">
              {deepWorkFlowGuardEnabled ? `Flow Guard (${flowMomentum}%)` : 'Flow Guard Off'}
            </span>
          </button>

          {/* Smart Reminder Drawer Button */}
          <button
            type="button"
            onClick={() => {
              setShowReminderSettings(!showReminderSettings);
              if (showSoundSettings) setShowSoundSettings(false);
              if (showDeepWorkDrawer) setShowDeepWorkDrawer(false);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
              showReminderSettings
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs'
                : smartRemindersEnabled
                ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700'
                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/50'
            }`}
            title="Smart Push Reminder: Alerts when session paused or idle"
          >
            <BellRing className={`w-3.5 h-3.5 ${smartRemindersEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-[11px] hidden sm:inline">
              {smartRemindersEnabled ? `${reminderIdleMinutes}m Push` : 'Push Off'}
            </span>
          </button>

          {/* Sound Profile Button / Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowSoundSettings(!showSoundSettings);
              if (showReminderSettings) setShowReminderSettings(false);
              if (showDeepWorkDrawer) setShowDeepWorkDrawer(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              showSoundSettings
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700'
            }`}
            title="Configure gentle notification alerts"
          >
            <Bell className={`w-3.5 h-3.5 ${soundEnabled ? 'text-indigo-500' : 'text-slate-400'}`} />
            <span className="text-[11px] hidden sm:inline">
              {soundEnabled ? ALERT_SOUND_OPTIONS.find((s) => s.id === alertSound)?.name : 'Muted'}
            </span>
          </button>

          {/* Quick Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              try {
                localStorage.setItem('pomodoro_sound_enabled', next.toString());
              } catch {}
              if (next) {
                soundFX.playAlertSound(alertSound, alertVolume);
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={soundEnabled ? 'Mute audible chimes' : 'Enable audible chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Predictive Deep Work Flow Guard Configuration Drawer */}
      {showDeepWorkDrawer && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-cyan-50/70 dark:from-slate-800/95 dark:via-slate-900 dark:to-indigo-950/50 border border-indigo-200 dark:border-indigo-800 shadow-sm animate-fadeIn text-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-indigo-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                  AI Deep Work Flow Interruption Engine
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Predictive cognitive focus preservation & flow recovery
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeepWorkDrawer(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
            >
              Done ✕
            </button>
          </div>

          {/* Master Flow Guard Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Predictive Flow Interruption Guard
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Pings you when study flow is broken before attention evaporates
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !deepWorkFlowGuardEnabled;
                setDeepWorkFlowGuardEnabled(next);
                try {
                  localStorage.setItem('pomodoro_deep_work_guard_enabled', next.toString());
                } catch {}
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                deepWorkFlowGuardEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  deepWorkFlowGuardEnabled ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Live Cognitive Flow Momentum Bar */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                <span>Live Flow Momentum Index</span>
              </span>
              <span className="font-black text-indigo-600 dark:text-cyan-400 text-xs">
                {flowMomentum}% Momentum
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${flowMomentum}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>{Math.floor(continuousFocusSeconds / 60)}m uninterrupted focus</span>
              <span>{flowRecoveriesToday} flow recoveries preserved today</span>
            </div>
          </div>

          {/* Sensitivity Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Interruption Detection Sensitivity:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'high', label: 'Ultra (30s)', sub: 'Fastest recovery' },
                { id: 'balanced', label: 'Balanced (60s)', sub: 'Recommended' },
                { id: 'relaxed', label: 'Relaxed (2m)', sub: 'Less sensitive' },
              ].map((s) => {
                const isSelected = flowSensitivity === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFlowSensitivity(s.id as FlowSensitivity);
                      try {
                        localStorage.setItem('pomodoro_flow_sensitivity', s.id);
                      } catch {}
                    }}
                    className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[11px] flex items-center justify-between">
                      <span>{s.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-cyan-400" />}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distraction Triggers Checkboxes */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Interruption Triggers
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={detectTabSwitch}
                  onChange={(e) => setDetectTabSwitch(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Tab & App Switching
                </span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={detectPauseStagnation}
                  onChange={(e) => setDetectPauseStagnation(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Unscheduled Pauses
                </span>
              </label>
            </div>
          </div>

          {/* Test AI Deep Work Alert Button */}
          <div className="pt-2 border-t border-indigo-100 dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Test the predictive flow recovery experience:
            </span>
            <button
              type="button"
              onClick={() => triggerDeepWorkInterruption('test', undefined, true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
              <span>Simulate Interruption Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Smart Push Reminder Configuration Drawer */}
      {showReminderSettings && (
        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn text-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
              <BellRing className="w-4 h-4 text-amber-500" />
              <span>Smart Study Reminder System</span>
            </div>
            <button
              type="button"
              onClick={() => setShowReminderSettings(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Done ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            Sends a browser push notification if you pause or step away without logging activity in the current Pomodoro interval, helping you resume your study flow.
          </p>

          {/* Push Permission Status Card */}
          <div className="mb-3">
            {notificationPermission === 'granted' ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-[11px]">
                      Browser Push Notifications Active
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      System will dispatch alerts even if this tab is minimized
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerSmartReminderNotification(true)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs hover:bg-emerald-50 cursor-pointer shrink-0"
                >
                  🔔 Test Push
                </button>
              </div>
            ) : notificationPermission === 'default' ? (
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-[11px]">
                      Enable Browser Notifications
                    </span>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-400">
                      Allow alerts to receive study resume reminders when you step away
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-3 py-1 rounded-lg text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs cursor-pointer shrink-0"
                >
                  Allow Push
                </button>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 dark:text-amber-200">
                  <span className="font-bold block">Notifications Blocked in Browser</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    To receive system push alerts, unblock notifications in your browser address bar. In-app audio & visual alerts are active as fallback.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                In-app audio & visual smart reminders are active.
              </div>
            )}
          </div>

          {/* Reminder Toggle & Inactivity Threshold Controls */}
          <div className="space-y-3 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block text-xs">
                  Inactivity Resume Reminders
                </span>
                <span className="text-[10px] text-slate-400">
                  Alert when a focus session is paused or idle
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSmartReminders}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  smartRemindersEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    smartRemindersEnabled ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {smartRemindersEnabled && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Remind after inactive pause of:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 5].map((mins) => {
                    const isSelected = reminderIdleMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleChangeReminderIdleMinutes(mins)}
                        className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs'
                            : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {mins} min{mins === 2 ? ' ★' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Action Trigger */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Preview notification:</span>
              <button
                type="button"
                onClick={() => triggerSmartReminderNotification(true)}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer flex items-center gap-1"
              >
                <BellRing className="w-3 h-3 text-amber-500" />
                <span>Trigger Test Push</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audible Alert System Configuration Drawer */}
      {showSoundSettings && (
        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn text-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span>Audible Alert System</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSoundSettings(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Done ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            Gentle acoustic tones crafted with soft harmonic overtones, ensuring you are pleasantly notified when work or break ends without being startled.
          </p>

          {/* Sound Options List */}
          <div className="space-y-1.5 mb-3">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Notification Tone for Work Session End
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALERT_SOUND_OPTIONS.map((snd) => {
                const isSelected = alertSound === snd.id;
                const isTesting = testingSoundId === snd.id;
                return (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => handleSelectSound(snd.id)}
                    className={`p-2 rounded-lg text-left transition flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-2xs text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base shrink-0">{snd.icon}</span>
                      <div className="truncate">
                        <div className="font-bold flex items-center gap-1 text-xs">
                          <span>{snd.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{snd.subtitle}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestingSoundId(snd.id);
                        soundFX.playAlertSound(snd.id, alertVolume);
                        setTimeout(() => setTestingSoundId(null), 1800);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 shrink-0 transition"
                      title="Preview sound"
                    >
                      {isTesting ? 'Playing…' : '▶ Test'}
                    </button>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Control Slider */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
            <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Volume1 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Notification Volume</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {Math.round(alertVolume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={alertVolume}
                onChange={(e) => handleChangeVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex items-center gap-1 shrink-0">
                {[0.3, 0.6, 0.9].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleChangeVolume(v)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                      Math.abs(alertVolume - v) < 0.05
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {Math.round(v * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dual Audio Preview Test Buttons */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">Trigger test:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAudibleRinging(true);
                  soundFX.playAlertSound(alertSound, alertVolume);
                  setTimeout(() => setIsAudibleRinging(false), 2200);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition cursor-pointer flex items-center gap-1"
              >
                <span>🔔 Work End Alert</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAudibleRinging(true);
                  soundFX.playBreakEndChime(alertVolume);
                  setTimeout(() => setIsAudibleRinging(false), 2000);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition cursor-pointer flex items-center gap-1"
              >
                <span>☕ Break End Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Predictive Deep Work Interruption Alert Banner */}
      {activeDeepWorkInterruption && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border-2 border-indigo-400/80 shadow-lg animate-fadeIn">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-yellow-300 shrink-0 mt-0.5 animate-bounce">
                <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-black uppercase tracking-wider">
                    ⚡ AI Flow Interruption Detected
                  </span>
                  <span className="text-[11px] text-indigo-200 font-medium">
                    {activeDeepWorkInterruption.subject} · {activeDeepWorkInterruption.pausedAtFormatted} remaining
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mt-1">
                  {activeDeepWorkInterruption.reason}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveDeepWorkInterruption(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Dismiss flow alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Cognitive Recovery Prompt */}
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-indigo-100 mb-3.5 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[12px]">{activeDeepWorkInterruption.prompt}</p>
          </div>

          {/* Recovery Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-200 font-semibold">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prior Momentum: {activeDeepWorkInterruption.momentumBefore}%</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* 10-Second Micro-Reset Ritual */}
              <button
                type="button"
                onClick={handleStart10sMicroReset}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 border border-white/20"
                title="10-second guided breathing reset"
              >
                <Wind className="w-3.5 h-3.5 text-cyan-300" />
                <span>10s Micro-Reset</span>
              </button>

              {/* 5-Minute Sprint Chunk */}
              <button
                type="button"
                onClick={handleMicroSprintConvert}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/60 hover:bg-cyan-500/80 text-cyan-100 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 border border-cyan-400/40"
                title="Convert remaining time into 5-minute micro-sprint"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>5m Sprint</span>
              </button>

              {/* Instant Regain Flow */}
              <button
                type="button"
                onClick={handleRegainDeepWorkFocus}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Regain Focus Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Smart Reminder Alert Banner */}
      {activeReminderAlert && !activeDeepWorkInterruption && (
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-700/80 shadow-sm animate-fadeIn flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                ⏰ Smart Reminder: Resume Your Study Session
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {activeReminderAlert.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleResumeFromReminder}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Resume Now</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReminderAlert(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Dismiss reminder"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Subtle Inactivity countdown hint when paused during focus mode */}
      {!isRunning &&
        mode === 'focus' &&
        timeLeft < totalDuration &&
        timeLeft > 0 &&
        smartRemindersEnabled &&
        !activeReminderAlert && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BellRing className="w-3 h-3 text-amber-500" />
              <span>Smart Reminder armed: Paused in {selectedSubject}</span>
            </span>
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold">
              Pings in {Math.max(0, reminderIdleMinutes * 60 - idleSecondsPaused)}s
            </span>
          </div>
        )}

      {/* Notification Toast */}
      {logNotification && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="flex-1">{logNotification}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMode('focus')}
          className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
            mode === 'focus'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('shortBreak')}
          className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
            mode === 'shortBreak'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Short Break</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('longBreak')}
          className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
            mode === 'longBreak'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🌴 Long Break</span>
        </button>
      </div>

      {/* Preset Duration Chips for current mode */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {PRESET_DURATIONS[mode].map((mins) => {
          const currentModeMins =
            mode === 'focus'
              ? focusDurationMinutes
              : mode === 'shortBreak'
              ? shortBreakDurationMinutes
              : longBreakDurationMinutes;
          const isSelected = currentModeMins === mins;

          return (
            <button
              key={mins}
              type="button"
              onClick={() => {
                if (mode === 'focus') setFocusDurationMinutes(mins);
                else if (mode === 'shortBreak') setShortBreakDurationMinutes(mins);
                else setLongBreakDurationMinutes(mins);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {mins}m
            </button>
          );
        })}
      </div>

      {/* Quick-Start Study Durations for Rapid Workflow */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span>Quick Start Durations</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">1-click instant launch</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {QUICK_START_OPTIONS.map((opt) => {
            const isCurrentlyActive =
              isRunning && mode === 'focus' && focusDurationMinutes === opt.minutes;

            return (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => handleQuickStart(opt.minutes, opt.label)}
                className={`relative p-2.5 rounded-xl text-left transition-all border group cursor-pointer active:scale-95 ${
                  isCurrentlyActive
                    ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/70 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
                }`}
                title={`Quick-start ${opt.minutes}m ${opt.label} study session`}
              >
                {opt.badge && (
                  <span className="absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-600 text-white shadow-2xs">
                    {opt.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <Zap
                      className={`w-3.5 h-3.5 ${
                        isCurrentlyActive
                          ? 'text-indigo-600 dark:text-indigo-400 fill-current'
                          : 'text-amber-500 group-hover:scale-110 transition-transform'
                      }`}
                    />
                    <span>{opt.title}</span>
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md transition-colors ${
                      isCurrentlyActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900'
                    }`}
                  >
                    {isCurrentlyActive ? 'Running' : 'Start ▶'}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {opt.label}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Linked Study Planner Task Section */}
      <div className="mb-4">
        {linkedTask ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/95 via-purple-50/60 to-indigo-50/90 dark:from-indigo-950/80 dark:via-purple-950/50 dark:to-indigo-950/70 border border-indigo-200/90 dark:border-indigo-800/80 shadow-xs relative">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <Target className="w-3 h-3" />
                  <span>Linked Planner Task</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-[10px] font-black flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>+50 Bonus XP</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowTaskPicker(!showTaskPicker)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline px-1.5 py-0.5 cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(null);
                    setSelectedScheduleId(null);
                    if (onClearActiveTask) onClearActiveTask();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Unlink task"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight mb-1">
              {linkedTask.title}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                📚 {linkedTask.subject}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                ⏳ {linkedTask.durationMinutes}m scheduled
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md border capitalize ${
                  linkedTask.priority === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {linkedTask.priority} priority
              </span>
              {linkedTask.durationMinutes !== focusDurationMinutes && mode === 'focus' && !isRunning && (
                <button
                  type="button"
                  onClick={() => {
                    setFocusDurationMinutes(linkedTask.durationMinutes);
                    setTotalDuration(linkedTask.durationMinutes * 60);
                    setTimeLeft(linkedTask.durationMinutes * 60);
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Sync timer ({linkedTask.durationMinutes}m)</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-indigo-100 dark:border-indigo-900/60">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={autoCompleteTaskOnFinish}
                  onChange={(e) => setAutoCompleteTaskOnFinish(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>Auto-mark completed in Study Planner on session finish</span>
              </label>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" />
                <span>Active</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Study Planner Integration</span>
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 rounded-full">
                      +50 XP Bonus
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {allPendingTasks.length > 0
                      ? `${allPendingTasks.length} scheduled tasks available to link`
                      : 'Link scheduled tasks to auto-complete after this session'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="link-study-planner-task-btn"
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>{showTaskPicker ? 'Close ✕' : 'Link Task ▾'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Task Picker Modal / Dropdown */}
        {showTaskPicker && (
          <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                <span>Select a Scheduled Task to Complete</span>
              </div>
              {onNavigateToPlanner && (
                <button
                  type="button"
                  onClick={onNavigateToPlanner}
                  className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Open Planner</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {allPendingTasks.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                <p className="font-semibold">🎉 All scheduled tasks completed!</p>
                <p className="text-[11px] mt-0.5 text-slate-400">You can still study and earn focus XP.</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {allPendingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setSelectedScheduleId(t.scheduleId);
                      setSelectedSubject(t.subject);
                      setSelectedTopic(t.title);
                      if (!isRunning) {
                        const targetMins = [15, 25, 50, 60].includes(t.durationMinutes)
                          ? t.durationMinutes
                          : t.durationMinutes <= 20
                          ? 15
                          : t.durationMinutes <= 35
                          ? 25
                          : 50;
                        setFocusDurationMinutes(targetMins);
                        setTotalDuration(targetMins * 60);
                        setTimeLeft(targetMins * 60);
                      }
                      setShowTaskPicker(false);
                      setLogNotification(`📌 Linked task "${t.title}". Complete session to earn bonus XP!`);
                      setTimeout(() => setLogNotification(null), 4000);
                    }}
                    className="p-2 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-cyan-300 truncate">
                        {t.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span>{t.subject}</span>
                        <span>•</span>
                        <span>{t.dayTitle}</span>
                        <span>•</span>
                        <span>{t.durationMinutes}m</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/60 text-indigo-600 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                      Link +50 XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Central Dial & Time Display */}
      <div className="flex flex-col items-center justify-center my-3 relative">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={`transition-all duration-300 ease-linear ${
                mode === 'focus'
                  ? 'stroke-indigo-600 dark:stroke-indigo-400'
                  : mode === 'shortBreak'
                  ? 'stroke-emerald-500'
                  : 'stroke-cyan-500'
              }`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time & Mode text inside circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none text-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              {formatTime(timeLeft)}
            </span>
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider mt-0.5 ${
                mode === 'focus'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {mode === 'focus' ? 'Deep Work' : 'Rest Window'}
            </span>
            {selectedSubject && mode === 'focus' && (
              <span className="text-[10px] text-slate-400 max-w-[120px] truncate mt-0.5 font-medium">
                {selectedSubject}
              </span>
            )}
          </div>
        </div>

        {/* Quick +1m / +5m Buttons */}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleAddMinutes(1)}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-0.5"
            title="Add 1 minute"
          >
            <Plus className="w-3 h-3" />
            <span>1m</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddMinutes(5)}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-0.5"
            title="Add 5 minutes"
          >
            <Plus className="w-3 h-3" />
            <span>5m</span>
          </button>
        </div>
      </div>

      {/* Main Action Controls with Circular SVG Progress Ring around Timer Button */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer active:scale-95 shadow-2xs"
            title="Reset timer to beginning of session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Pomodoro Timer Button Framed by Circular SVG Progress Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center select-none group">
            {/* Circular SVG Progress Ring representing remaining time */}
            <svg
              className="w-full h-full transform -rotate-90 pointer-events-none drop-shadow-xs"
              viewBox="0 0 96 96"
            >
              {/* Background Track Ring */}
              <circle
                cx="48"
                cy="48"
                r={btnRadius}
                className="stroke-slate-200/90 dark:stroke-slate-800"
                strokeWidth="4"
                fill="none"
              />
              {/* Dynamic Remaining Time SVG Ring */}
              <circle
                cx="48"
                cy="48"
                r={btnRadius}
                className={`transition-all duration-300 ease-linear ${
                  mode === 'focus'
                    ? isRunning
                      ? 'stroke-rose-500 dark:stroke-rose-400'
                      : 'stroke-indigo-600 dark:stroke-indigo-400'
                    : 'stroke-emerald-500 dark:stroke-emerald-400'
                }`}
                strokeWidth="4.5"
                strokeDasharray={btnCircumference}
                strokeDashoffset={btnStrokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Circular Pomodoro Timer Button */}
            <button
              type="button"
              id="pomodoro-timer-button"
              onClick={handleTogglePlay}
              className={`absolute w-16 h-16 rounded-full font-black text-xs flex flex-col items-center justify-center transition-all duration-200 active:scale-90 shadow-lg cursor-pointer ${
                isRunning
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-300/40'
                  : mode === 'focus'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 ring-2 ring-indigo-300/40'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-300/40'
              }`}
              title={
                isRunning
                  ? `Pause Timer (${remainingPercent}% remaining · ${formatTime(timeLeft)})`
                  : `Start Session (${remainingPercent}% remaining · ${formatTime(timeLeft)})`
              }
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span className="text-[9px] uppercase tracking-wider font-extrabold mt-0.5">
                    Pause
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span className="text-[9px] uppercase tracking-wider font-extrabold mt-0.5">
                    Start
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer active:scale-95 shadow-2xs"
            title="Skip to next session"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Remaining Time Status Badge */}
        <div className="mt-2.5 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>{remainingPercent}% time left</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              ({formatTime(timeLeft)} remaining)
            </span>
          </span>
        </div>
      </div>

      {/* Log Early Button (visible when paused or running with elapsed time in focus mode) */}
      {mode === 'focus' && totalDuration - timeLeft >= 60 && (
        <div className="text-center mb-3">
          <button
            type="button"
            onClick={handleLogEarly}
            className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1 rounded-lg"
          >
            <span>Log Elapsed Time ({Math.floor((totalDuration - timeLeft) / 60)}m) & End Early</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Focus Target Subject Selector */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Target Subject</span>
          </span>
          <span className="text-slate-400">Links study time to subject</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Session Counter & Accumulated Today */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-bold">
            <span>🍅</span>
            <span>{completedSessions} sessions</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSessionHistory(!showSessionHistory)}
            className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50/70 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md"
            title="View focused study session records & bonus XP earned"
          >
            <History className="w-3 h-3" />
            <span>XP History ({sessionHistory.length})</span>
          </button>
        </div>
        <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
          <Flame className="w-3.5 h-3.5" />
          <span>{totalFocusLoggedMinutes}m logged today</span>
        </div>
      </div>

      {/* Session History & Bonus XP Records Drawer */}
      {showSessionHistory && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Focused Study Sessions & Bonus XP Log
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSessionHistory(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
            >
              Done ✕
            </button>
          </div>

          {sessionHistory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              No sessions completed yet today. Start your first session above to track focused study, complete planner tasks, and earn bonus XP!
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {sessionHistory.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span>{s.subject}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        • {s.durationMinutes} mins • {s.completedAtFormatted}
                      </span>
                    </div>
                    {s.taskTitle && (
                      <div className="text-[11px] font-medium text-indigo-600 dark:text-cyan-300 mt-0.5 truncate flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">Task: {s.taskTitle}</span>
                      </div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-black text-xs border border-amber-300/80 dark:border-amber-700/60 shrink-0 flex items-center gap-0.5">
                    <Award className="w-3 h-3 text-amber-500" />
                    <span>+{s.bonusXpAwarded} XP</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rich Focus Completion & Bonus XP Celebration Modal */}
      {completionCelebration?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 p-6 text-center text-white shadow-2xl relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/30 rounded-full blur-3xl" />

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
              <Award className="w-8 h-8 fill-current" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              Focus Session Complete! 🎉
            </h3>
            <p className="text-xs text-indigo-200 mb-4">
              {completionCelebration.minutesCompleted} minutes of dedicated {completionCelebration.subject} study logged.
            </p>

            {/* Total XP Awarded Pill */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-400/40 mb-4">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Bonus Reward Earned
              </div>
              <div className="text-3xl font-black text-white font-mono mt-0.5 flex items-center justify-center gap-1.5">
                <Sparkles className="w-6 h-6 text-amber-400" />
                <span>+{completionCelebration.totalXP} XP</span>
              </div>
            </div>

            {/* Reward Breakdown */}
            <div className="space-y-1.5 text-xs text-left mb-4 bg-black/30 p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-slate-300">
                <span>⏱️ Focus Duration ({completionCelebration.minutesCompleted}m)</span>
                <span className="font-bold text-white">+{completionCelebration.baseXP} XP</span>
              </div>
              {completionCelebration.taskBonusXP > 0 && (
                <div className="flex items-center justify-between text-amber-300 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Study Planner Task Cleared</span>
                  </span>
                  <span className="font-bold">+{completionCelebration.taskBonusXP} XP</span>
                </div>
              )}
              {completionCelebration.streakBonusXP > 0 && (
                <div className="flex items-center justify-between text-cyan-300 font-medium">
                  <span>🔥 Daily Streak Multiplier</span>
                  <span className="font-bold">+{completionCelebration.streakBonusXP} XP</span>
                </div>
              )}
            </div>

            {/* Linked Task Cleared Notice */}
            {completionCelebration.taskTitle && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-left mb-4 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wide text-emerald-300 block">
                  ✅ Study Planner Updated
                </span>
                <p className="font-bold text-white truncate mt-0.5">
                  "{completionCelebration.taskTitle}"
                </p>
                <p className="text-[10px] text-emerald-300/80">
                  Marked as completed in your adaptive schedule.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCompletionCelebration(null);
                  setMode('shortBreak');
                  setIsRunning(true);
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Start 5m Break ☕
              </button>
              <button
                type="button"
                onClick={() => setCompletionCelebration(null)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
              >
                Keep Studying
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10-Second Micro-Reset Guided Ritual Modal Overlay */}
      {isMicroResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 border border-indigo-500/40 p-6 text-center text-white shadow-2xl relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>Cognitive Flow Micro-Reset</span>
              </span>
              <button
                type="button"
                onClick={() => setIsMicroResetModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breathing Animation Circle */}
            <div className="my-6 relative flex items-center justify-center">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-1000 ${
                  microResetPhase === 'inhale'
                    ? 'scale-110 border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                    : microResetPhase === 'hold'
                    ? 'scale-110 border-indigo-400 bg-indigo-500/30 shadow-lg shadow-indigo-500/30'
                    : microResetPhase === 'exhale'
                    ? 'scale-90 border-teal-400 bg-teal-500/20'
                    : 'scale-100 border-emerald-400 bg-emerald-500/30'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-black font-mono tracking-tight">
                    {microResetSecondsLeft}s
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 mt-0.5">
                    {microResetPhase === 'inhale' && '🌬️ Inhale'}
                    {microResetPhase === 'hold' && '✨ Hold'}
                    {microResetPhase === 'exhale' && '🍃 Exhale'}
                    {microResetPhase === 'ready' && '🚀 Ready'}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <h3 className="text-base font-black text-white mb-1.5">
              {microResetPhase === 'inhale' && 'Inhale deeply and expand your focus'}
              {microResetPhase === 'hold' && 'Hold presence & visualize your target'}
              {microResetPhase === 'exhale' && 'Exhale all distractions and reset'}
              {microResetPhase === 'ready' && 'Resuming deep work session now...'}
            </h3>
            <p className="text-xs text-indigo-200/80 mb-5">
              Target: <span className="font-bold text-white">{selectedSubject}</span> · 432 Hz harmonic pulse active
            </p>

            {/* Manual Skip / Resume Button */}
            <button
              type="button"
              onClick={() => {
                setIsMicroResetModalOpen(false);
                setIsRunning(true);
                if (soundEnabled) soundFX.playFocusRefocusPulse(alertVolume);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Focus Right Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
