import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Volume2,
  Bot,
  Shield,
  RotateCcw,
  Sparkles,
  Type,
  Check,
  Crown,
  CreditCard,
  Phone,
  MessageCircle,
  Bell,
  BellRing,
  CalendarDays,
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
  Zap,
  Cloud,
  LogIn,
  LogOut,
  RefreshCw,
  Smartphone,
  Tablet,
  Laptop,
  Download,
  ExternalLink,
  Copy,
  Share2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { soundFX } from '../utils/soundOrConfetti';
import { UserSubscription, NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  dailyGoal: number;
  onChangeDailyGoal: (mins: number) => void;
  onResetData: () => void;
  appName?: string;
  onChangeAppName?: (name: string) => void;
  subscription?: UserSubscription;
  onOpenUpgrade?: () => void;
  onTriggerTestNotification?: (type: 'study' | 'flashcard') => void;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
  onSyncCloud?: () => void;
  isSyncing?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleDarkMode,
  dailyGoal,
  onChangeDailyGoal,
  onResetData,
  appName = 'Edunex Study AI',
  onChangeAppName,
  subscription,
  onOpenUpgrade,
  onTriggerTestNotification,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  onSyncCloud,
  isSyncing = false,
}) => {
  const [customName, setCustomName] = useState(appName);
  const [nameSaved, setNameSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() =>
    notificationService.getSettings()
  );
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationService.getPermissionStatus()
  );
  const [testSentToast, setTestSentToast] = useState<string | null>(null);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const hostingUrl = 'https://edunexstudyai.web.app';

  const handleCopyHostingUrl = () => {
    navigator.clipboard.writeText(hostingUrl);
    setCopiedUrl(true);
    soundFX.playSuccess();
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleRequestPush = async () => {
    const perm = await notificationService.requestPermission();
    setPermission(perm);
    setNotifSettings(notificationService.getSettings());
  };

  const handleUpdateNotifSetting = (key: keyof NotificationSettings, value: any) => {
    const updated = notificationService.updateSettings({ [key]: value });
    setNotifSettings(updated);
    soundFX.playPop();
  };

  const handleTestNotification = (type: 'study' | 'flashcard') => {
    if (onTriggerTestNotification) {
      onTriggerTestNotification(type);
    } else {
      if (type === 'study') {
        notificationService.notifyStudyBlockStarting('Calculus Problem Set', 'Mathematics', 45, () => {});
      } else {
        notificationService.notifyFlashcardDeckDue(5, 'Physics', undefined, () => {});
      }
    }
    setTestSentToast(type === 'study' ? 'Study Block Alert dispatched!' : 'Deck Due Alert dispatched!');
    setTimeout(() => setTestSentToast(null), 4000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim() && onChangeAppName) {
      onChangeAppName(customName.trim());
      setNameSaved(true);
      soundFX.playSuccess();
      setTimeout(() => setNameSaved(false), 2000);
    }
  };
  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-cyan-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">App Settings</h1>
            <p className="text-xs text-slate-300">Customize learning preferences, coach behavior, and theme</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {/* Firebase Cloud Sync & Google Auth */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Firebase Cloud & Hosting</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-cyan-300">
                    Firestore Active
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Hosting Ready (dist/)
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Project: <strong className="font-mono text-blue-700 dark:text-cyan-300">edunexstudyai</strong> (asia-south1) • SPA Hosting configured
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full ring-2 ring-emerald-500/50 object-cover"
                  />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.displayName || 'Student Account'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email || currentUser.uid}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Sign in with your Google account to enable multi-device sync and cloud backup.
              </div>
            )}

            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  {onSyncCloud && (
                    <button
                      onClick={onSyncCloud}
                      disabled={isSyncing}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  )}
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </>
              ) : (
                onSignInWithGoogle && (
                  <button
                    onClick={onSignInWithGoogle}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-600/25 cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Multi-Device Access & Firebase Hosting Hub */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-slate-900/80 border border-blue-200/80 dark:border-blue-900/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Multi-Device & PWA Access</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    All Devices Supported
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Access EduNex seamlessly across Phones, Tablets, Laptops, and Desktops.
                </p>
              </div>
            </div>

            {/* Live Hosting URL & Copy Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyHostingUrl}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Web App URL</span>
                  </>
                )}
              </button>
              <a
                href={hostingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-600/25 active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open App</span>
              </a>
            </div>
          </div>

          {/* Device Selection Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveDeviceTab('android')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeDeviceTab === 'android'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Phones</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDeviceTab('ios')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeDeviceTab === 'ios'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>iPhone & iPad (iOS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDeviceTab('desktop')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeDeviceTab === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Windows, Mac & Linux</span>
            </button>
          </div>

          {/* Device Guide Instructions */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
            {activeDeviceTab === 'android' && (
              <div className="space-y-1.5 animate-fadeIn text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Install as Native App on Android:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                  <li>Open <strong>{hostingUrl}</strong> in Google Chrome on your Android phone.</li>
                  <li>Tap the <strong>⋮ (Menu)</strong> icon in the top-right corner.</li>
                  <li>Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>.</li>
                  <li>EduNex will launch full-screen with offline caching enabled!</li>
                </ol>
              </div>
            )}

            {activeDeviceTab === 'ios' && (
              <div className="space-y-1.5 animate-fadeIn text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Install on iPhone or iPad:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                  <li>Open <strong>{hostingUrl}</strong> in Apple Safari on your iPhone or iPad.</li>
                  <li>Tap the <strong>Share</strong> button (box with an arrow pointing up at the bottom).</li>
                  <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                  <li>EduNex runs standalone with smooth gesture navigation and safe area notch support!</li>
                </ol>
              </div>
            )}

            {activeDeviceTab === 'desktop' && (
              <div className="space-y-1.5 animate-fadeIn text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Desktop App on Chrome, Edge & Brave:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                  <li>Open <strong>{hostingUrl}</strong> in Chrome or Edge on your PC/Mac.</li>
                  <li>Click the <strong>Install icon</strong> in the browser address bar (top right).</li>
                  <li>Click <strong>Install</strong> to add EduNex to your Windows Taskbar or macOS Dock.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* App Name & Branding Customization */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">App Name & Branding</h3>
            </div>
            {nameSaved && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rename the application header and dashboard title to your preferred brand name.
          </p>

          <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter app name..."
                maxLength={40}
                className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Name</span>
            </button>
          </form>

          {/* Quick Preset Names */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Edunex Study AI',
                'EduNex',
                'NovaStudy AI',
                'Synapse AI',
                'CogniFlow AI',
                'NeuroLearn',
                'ApexStudy',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setCustomName(preset);
                    if (onChangeAppName) {
                      onChangeAppName(preset);
                      setNameSaved(true);
                      soundFX.playSuccess();
                      setTimeout(() => setNameSaved(false), 2000);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    appName === preset
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription & Plan Status */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/40 to-amber-50/40 dark:from-indigo-950/40 dark:via-slate-800/40 dark:to-amber-950/20 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {subscription?.isUpgraded ? 'Pro Scholar Membership' : 'Pro Free Trial'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    subscription?.isUpgraded
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {subscription?.isUpgraded ? 'Active VIP' : `${subscription?.trialDaysLeft ?? 4} Days Left`}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {subscription?.isUpgraded
                  ? 'Unlimited AI Coach, SnapStudy OCR, and adaptive test generation active.'
                  : 'You have full access to all AI features. Upgrade to EduNex Pro to secure your student rate.'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {onOpenUpgrade && (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  subscription?.isUpgraded
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>{subscription?.isUpgraded ? 'Manage Subscription' : 'Upgrade from $99'}</span>
              </button>
            )}
          </div>
        </div>

        {/* App Name Branding */}
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <span>App Name & Branding</span>
            </h3>
            {nameSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Change the display name of your study companion anytime
          </p>
          <form onSubmit={handleSaveName} className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. NovaStudy AI, ExamMaster, My Study Coach"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
            >
              Update Name
            </button>
          </form>
        </div>

        {/* Theme Settings */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Interface Appearance</span>
            </h3>
            <p className="text-xs text-slate-500">Switch between sleek dark mode or clean high-contrast light mode</p>
          </div>
          <button
            onClick={() => {
              onToggleDarkMode();
              soundFX.playChime();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {isDarkMode ? '🌙 Dark Mode (Active)' : '☀️ Light Mode (Active)'}
          </button>
        </div>

        {/* AI Personality Setting */}
        <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span>AI Coach Personality</span>
          </h3>
          <p className="text-xs text-slate-500">Choose how the AI tutor phrases its explanations and feedback</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {[
              { id: 'encouraging', name: 'Encouraging & Patient', desc: 'Warm guidance, positive praise & gentle corrections' },
              { id: 'socratic', name: 'Socratic Method', desc: 'Prompts you with thoughtful questions to discover answers' },
              { id: 'exam', name: 'Exam Precision Grader', desc: 'Strict marking, high-yield rubrics & point-saving strategies' },
              { id: 'mentor', name: 'High-Energy Coach', desc: 'Energetic, motivational & gamified challenges' },
            ].map((persona, idx) => (
              <div
                key={persona.id}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                  idx === 0
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/80 text-indigo-950 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="font-bold">{persona.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{persona.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Push Notifications & Spaced Due Alarms */}
        <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-indigo-500" />
              <span>Browser Push Notifications & Study Alarms</span>
            </h3>
            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Browser Push Active</span>
              </span>
            ) : permission === 'denied' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Browser Push Blocked</span>
              </span>
            ) : (
              <button
                onClick={handleRequestPush}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition"
              >
                Enable Push
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time browser notifications alert you when your scheduled study blocks begin or when spaced repetition flashcards are due.
          </p>

          {/* Test push trigger notice toast */}
          {testSentToast && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{testSentToast} Check your browser top-bar or notification center.</span>
            </div>
          )}

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => handleUpdateNotifSetting('studyBlockAlerts', !notifSettings.studyBlockAlerts)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                notifSettings.studyBlockAlerts
                  ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-500/60 text-teal-950 dark:text-teal-200'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="font-bold">Study Block Begins</p>
                  <p className="text-[10px] text-slate-500">Notify when schedule starts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.studyBlockAlerts}
                onChange={() => {}}
                className="accent-teal-500 w-4 h-4"
              />
            </div>

            <div
              onClick={() => handleUpdateNotifSetting('flashcardDueAlerts', !notifSettings.flashcardDueAlerts)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                notifSettings.flashcardDueAlerts
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500/60 text-amber-950 dark:text-amber-200'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-bold">Flashcard Deck Due</p>
                  <p className="text-[10px] text-slate-500">Counter forgetting curve</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.flashcardDueAlerts}
                onChange={() => {}}
                className="accent-amber-500 w-4 h-4"
              />
            </div>
          </div>

          {/* Test Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-semibold">Test Browser Notifications:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestNotification('study')}
                className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1 transition"
              >
                <CalendarDays className="w-3.5 h-3.5 text-teal-500" />
                <span>Test Study Block Alert</span>
              </button>
              <button
                onClick={() => handleTestNotification('flashcard')}
                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1 transition"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Deck Due Alert</span>
              </button>
            </div>
          </div>
        </div>

        {/* Daily Study Target */}
        <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Study Goal (Minutes)</h3>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{dailyGoal} mins</span>
          </div>
          <input
            type="range"
            min={15}
            max={180}
            step={15}
            value={dailyGoal}
            onChange={(e) => onChangeDailyGoal(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>15 min (Sprint)</span>
            <span>60 min (Recommended)</span>
            <span>180 min (Deep Prep)</span>
          </div>
        </div>

        {/* Sound FX */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>Gamification Audio FX & Chimes</span>
            </h3>
            <p className="text-xs text-slate-500">Synthesizer chimes for streak milestones and quiz success</p>
          </div>
          <button
            onClick={() => soundFX.playSuccess()}
            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100"
          >
            Test Chime 🔔
          </button>
        </div>

        {/* Reset State */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400">Reset Sample Data</h3>
            <p className="text-[11px] text-slate-400">Restore default demo profile, chapters, and weaknesses</p>
          </div>
          <button
            onClick={onResetData}
            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};
