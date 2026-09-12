import React, { useState } from 'react';
import {
  LogIn,
  X,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Laptop,
  Flame,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  resendVerificationEmail,
  reloadUser,
  validateStrongPassword,
} from '../services/firebase';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  appName?: string;
  onUserUpdated?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  appName = 'Edunex Study AI',
  onUserUpdated,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  const passwordValidation = validateStrongPassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleGoogleSignIn = async () => {
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
        setErrorMessage('Your browser blocked the Google Sign-In popup. Please allow popups or try email sign-in.');
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithEmail(email, password);
      soundFX.playSuccess();
      if (onUserUpdated) onUserUpdated(user);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        setErrorMessage('Invalid email or password.');
      } else {
        setErrorMessage(err?.message || 'Sign in failed.');
      }
      soundFX.playPop();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValidation.isStrong) {
      setErrorMessage('Please satisfy all strong password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user, verificationSent } = await signUpWithEmail(email, password);
      soundFX.playSuccess();
      triggerCelebration();
      setSuccessMessage(
        verificationSent
          ? `Account created! We've sent a Google verification link to ${email}.`
          : 'Account created successfully!'
      );
      if (onUserUpdated) onUserUpdated(user);
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered.');
      } else {
        setErrorMessage(err?.message || 'Sign up failed.');
      }
      soundFX.playPop();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationInModal = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail(currentUser);
      setSuccessMessage(`Fresh verification email sent to ${currentUser.email}.`);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((p) => {
          if (p <= 1) {
            clearInterval(timer);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerificationInModal = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const refreshed = await reloadUser(currentUser);
      if (refreshed.emailVerified) {
        soundFX.playSuccess();
        triggerCelebration();
        setSuccessMessage('Email verified successfully!');
        if (onUserUpdated) onUserUpdated(refreshed);
      } else {
        setErrorMessage('Email not verified yet. Please click the link sent to your inbox.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to check verification status.');
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
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-blue-900/60 shadow-2xl p-6 sm:p-8 space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto"
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
                  alt={currentUser.displayName || 'Account'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              )}
            </div>

            <div>
              {currentUser.emailVerified ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Google Verified Account</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Verification Link Pending</span>
                </div>
              )}

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {currentUser.displayName || 'Student Scholar'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentUser.email || currentUser.uid}
              </p>
            </div>

            {/* Verification prompt if pending */}
            {!currentUser.emailVerified && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left space-y-2">
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  Your email is not verified yet. Please click the link sent to your inbox to complete Google verification.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCheckVerificationInModal}
                    disabled={isLoading}
                    className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Check Status</span>
                  </button>
                  <button
                    onClick={handleResendVerificationInModal}
                    disabled={isLoading || resendCooldown > 0}
                    className="flex-1 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Link'}
                  </button>
                </div>
              </div>
            )}

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

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </div>
            )}

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
                {isLoading ? 'Signing Out...' : 'Sign Out of Account'}
              </button>
            </div>
          </div>
        ) : (
          /* Not Signed In State View with Tabs */
          <div className="space-y-4 pt-1">
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-2">
                <Logo size="lg" glow />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Account & Cloud Sync
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Sign in to save notes, streaks, and quiz mistakes in Firebase.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  tab === 'signin'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  tab === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              id="modal-google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="flex-shrink mx-2 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                or email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Sign In Mode */}
            {tab === 'signin' && (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3.5 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Sign Up Mode with Strong Password */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-2.5">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Strong password (min 8, Aa, 123, !@#)"
                    className="w-full px-3.5 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password strength checklist */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <span>Strong Password Requirements:</span>
                    <span className={passwordValidation.isStrong ? 'text-emerald-500' : 'text-slate-400'}>
                      {passwordValidation.feedback}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span className={passwordValidation.hasMinLength ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
                      {passwordValidation.hasMinLength ? '✓' : '✗'} 8+ chars
                    </span>
                    <span className={passwordValidation.hasUpperCase ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
                      {passwordValidation.hasUpperCase ? '✓' : '✗'} Uppercase
                    </span>
                    <span className={passwordValidation.hasLowerCase ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
                      {passwordValidation.hasLowerCase ? '✓' : '✗'} Lowercase
                    </span>
                    <span className={passwordValidation.hasNumber ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
                      {passwordValidation.hasNumber ? '✓' : '✗'} Number
                    </span>
                    <span className={`col-span-2 ${passwordValidation.hasSpecialChar ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                      {passwordValidation.hasSpecialChar ? '✓' : '✗'} Symbol (!@#$%...)
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3.5 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !passwordValidation.isStrong || !passwordsMatch}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Account & Send Verification'}
                </button>
              </form>
            )}

            <button
              onClick={onClose}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 transition"
            >
              Continue in Guest Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

