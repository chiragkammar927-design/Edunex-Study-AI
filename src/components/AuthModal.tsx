import React, { useState } from 'react';
import {
  LogIn,
  X,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Laptop,
  Flame,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  appName?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  appName = 'EduNex',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await onSignInWithGoogle();
      soundFX.playSuccess();
      triggerCelebration();
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Your browser blocked the Google Sign-In popup. Please allow popups or open this app in a new tab.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('The Google sign-in window was closed before completing.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Sign-in was cancelled.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in with Google. Please try again.');
      }
      soundFX.playPop();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    setIsLoading(true);
    try {
      await onSignOut();
      soundFX.playPop();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sign out failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-blue-900/60 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
      >
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/15 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Signed In State View */
          <div className="space-y-5 text-center pt-2">
            <div className="mx-auto w-16 h-16 rounded-full ring-4 ring-emerald-500/30 overflow-hidden bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shadow-lg">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google Account'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Google Account Connected</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {currentUser.displayName || 'Student Scholar'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentUser.email || currentUser.uid}
              </p>
            </div>

            {/* Cloud Sync Status Cards */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-left space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Cloud className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Real-time Cloud Sync active with Firestore</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Daily XP, study streaks, and badges synced</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Laptop className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Accessible across all your devices</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition cursor-pointer"
              >
                Continue Studying
              </button>
              <button
                onClick={handleSignOutClick}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing Out...' : 'Sign Out of Google Account'}
              </button>
            </div>
          </div>
        ) : (
          /* Not Signed In State View */
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Connect Google Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Sign in with your Google Account to unlock cross-device synchronization and cloud data backups on {appName}.
              </p>
            </div>

            {/* Benefit Checkmarks */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block font-bold">Automatic Cloud Backup</strong>
                  <span className="text-slate-500 dark:text-slate-400">Save flashcards, notes, and drill weaknesses safely in Firebase Firestore.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block font-bold">Multi-Device Access</strong>
                  <span className="text-slate-500 dark:text-slate-400">Continue your study sessions from any phone, laptop, or browser.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block font-bold">Preserve Streaks & XP</strong>
                  <span className="text-slate-500 dark:text-slate-400">Never lose your study streak or level rank when clearing browser cache.</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="space-y-3">
              <button
                id="google-signin-action-btn"
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 font-black text-sm shadow-md transition flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {/* Google Multi-Color G Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1 transition cursor-pointer font-medium"
              >
                Continue using local storage (Guest mode)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
