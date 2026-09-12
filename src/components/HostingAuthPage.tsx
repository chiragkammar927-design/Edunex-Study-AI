import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
  Cloud,
  Check,
  X,
  BookOpen,
  BrainCircuit,
  Target,
  Zap,
  KeyRound,
  Bot,
  Layers,
  Users,
  Compass,
  GraduationCap,
  Send,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  resendVerificationEmail,
  reloadUser,
  validateStrongPassword,
} from '../services/firebase';
import { soundFX, triggerCelebration } from '../utils/soundOrConfetti';
import { Logo } from './Logo';

interface HostingAuthPageProps {
  onSignedIn: (user: User) => void;
  onExploreDemo: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  appName?: string;
}

type ActiveSectionModal = 'about' | 'whatWeProvide' | 'courses' | 'community' | 'vision' | null;

export const HostingAuthPage: React.FC<HostingAuthPageProps> = ({
  onSignedIn,
  onExploreDemo,
  isDarkMode,
  onToggleDarkMode,
  appName = 'EduNex',
}) => {
  // Navigation & Modals
  const [activeModal, setActiveModal] = useState<ActiveSectionModal>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am the EduNex AI Study Companion. How can I help you prepare for the future of learning today?',
    },
  ]);

  // Card view mode: 'illustration' | 'auth'
  const [cardMode, setCardMode] = useState<'illustration' | 'auth'>('illustration');

  // Auth Modes: 'signin' | 'signup' | 'verify' | 'forgot'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verify' | 'forgot'>('signup');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationTargetUser, setVerificationTargetUser] = useState<User | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Live password validation
  const passwordValidation = validateStrongPassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      soundFX.playPop();
      const user = await signInWithGoogle();
      if (user) {
        soundFX.playSuccess();
        triggerCelebration();
        onSignedIn(user);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Your browser blocked the Google popup. Please enable popups or try email sign-in.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('The Google sign-in window was closed before finishing.');
      } else {
        setErrorMessage(err?.message || 'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email / Password Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      soundFX.playPop();
      const user = await signInWithEmail(email, password);
      soundFX.playSuccess();
      onSignedIn(user);
    } catch (err: any) {
      console.error('Email sign-in failed:', err);
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password'
      ) {
        setErrorMessage('Invalid email or password. Please check your credentials.');
      } else if (err?.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please reset your password or wait a moment.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in with email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up with Strong Password + Auto Google Verification Dispatch
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!passwordValidation.isStrong) {
      setErrorMessage('Please satisfy all strong password requirements before creating your account.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      soundFX.playPop();
      const { user, verificationSent } = await signUpWithEmail(email, password, fullName);
      setVerificationTargetUser(user);
      setSuccessMessage(
        verificationSent
          ? `We sent a Google verification link to ${email}. Please check your inbox to verify!`
          : `Account created successfully. Verification link queued for ${email}.`
      );
      soundFX.playSuccess();
      triggerCelebration();
      setAuthMode('verify');
    } catch (err: any) {
      console.error('Sign up failed:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in or reset your password.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMessage('The email address format is invalid.');
      } else {
        setErrorMessage(err?.message || 'Failed to create account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async () => {
    if (!verificationTargetUser) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail(verificationTargetUser);
      setSuccessMessage(`A fresh verification link has been sent to ${verificationTargetUser.email}.`);
      soundFX.playPop();
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send verification email. Try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check Email Verification Status
  const handleCheckVerification = async () => {
    if (!verificationTargetUser) return;
    setIsLoading(true);
    try {
      const refreshedUser = await reloadUser(verificationTargetUser);
      setVerificationTargetUser(refreshedUser);
      if (refreshedUser.emailVerified) {
        soundFX.playSuccess();
        triggerCelebration();
        setSuccessMessage('Email verified successfully! Welcome aboard.');
        setTimeout(() => {
          onSignedIn(refreshedUser);
        }, 1200);
      } else {
        soundFX.playPop();
        setErrorMessage('Email not verified yet. Please click the link in the email sent by Google Firebase, then click check status.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to check verification status.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your account email address first.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      soundFX.playSuccess();
      setSuccessMessage(`Password reset link dispatched to ${email}. Check your inbox!`);
      setTimeout(() => {
        setAuthMode('signin');
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to dispatch password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick chatbot send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    soundFX.playPop();

    setTimeout(() => {
      let botReply =
        "EduNex Study AI utilizes Socratic tutoring, real-time misconception detection, and spaced repetition curves. Click 'Explore EduNex' or 'Join' to test the full interactive dashboard!";
      const lower = userText.toLowerCase();
      if (lower.includes('course') || lower.includes('subject')) {
        botReply =
          'We offer comprehensive modules in AI Foundations, Advanced Physics, Calculus, Cellular Biology, and Data Structures. Click "View Courses" to explore the full curriculum!';
      } else if (lower.includes('join') || lower.includes('sign') || lower.includes('login')) {
        botReply =
          'You can join immediately using Google One-Tap or email sign-up, or click "Explore EduNex" to test our live interactive demo sandbox!';
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#060a17] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background Radial Electric Blue Glow in top-left matching the design */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/22 rounded-full blur-[150px] pointer-events-none -translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-700/10 rounded-full blur-[150px] pointer-events-none translate-x-1/4 translate-y-1/4" />

      {/* 1. TOP FLOATING NAVBAR PILL (Exact match to design screenshot) */}
      <header className="w-full px-4 sm:px-6 pt-5 sm:pt-7 sticky top-0 z-40">
        <nav
          id="edunex-navbar-pill"
          className="max-w-5xl mx-auto px-6 sm:px-8 py-3.5 rounded-2xl bg-[#091124]/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl flex items-center justify-between transition-all duration-200"
        >
          {/* Logo / Brand Name */}
          <button
            type="button"
            onClick={() => {
              setActiveModal(null);
              setIsJoinModalOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group text-left"
          >
            <Logo size="xs" glow />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-blue-400 transition">
              EduNex
            </span>
          </button>

          {/* Navigation Links (About, What We Provide, Courses, Community, Vision) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-medium text-slate-300">
            <button
              type="button"
              id="nav-link-about"
              onClick={() => setActiveModal('about')}
              className="hover:text-white transition cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              id="nav-link-what-we-provide"
              onClick={() => setActiveModal('whatWeProvide')}
              className="hover:text-white transition cursor-pointer"
            >
              What We Provide
            </button>
            <button
              type="button"
              id="nav-link-courses"
              onClick={() => setActiveModal('courses')}
              className="hover:text-white transition cursor-pointer"
            >
              Courses
            </button>
            <button
              type="button"
              id="nav-link-community"
              onClick={() => setActiveModal('community')}
              className="hover:text-white transition cursor-pointer"
            >
              Community
            </button>
            <button
              type="button"
              id="nav-link-vision"
              onClick={() => setActiveModal('vision')}
              className="hover:text-white transition cursor-pointer"
            >
              Vision
            </button>
          </div>

          {/* Right CTA Button: "Join" */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="navbar-join-btn"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
                setIsJoinModalOpen(true);
              }}
              className="px-5 py-1.5 rounded-full bg-[#3b82f6] hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition duration-200 shadow-md shadow-blue-500/30 cursor-pointer active:scale-95"
            >
              Join
            </button>
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION (Pixel-perfect recreation of user uploaded mockup) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 w-full my-auto">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Eyebrow, Main Headline, Paragraph, and 2 CTA Buttons */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tag / Eyebrow */}
            <div className="text-blue-400 font-bold tracking-wider text-xs sm:text-sm uppercase font-mono">
              NEXT-GENERATION EDUCATION PLATFORM
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.15]">
              Building AI-Ready <br />
              Students for the <br />
              Future
            </h1>

            {/* Description Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              EduNex is reimagining education with AI-powered learning paths, future-focused skill development, and innovation-first experiences that prepare students to lead tomorrow.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Button 1: Explore EduNex (Solid Blue Pill) */}
              <button
                type="button"
                id="hero-explore-edunex-btn"
                onClick={onExploreDemo}
                className="px-7 py-3 rounded-full bg-[#3b82f6] hover:bg-blue-500 text-white font-semibold text-sm sm:text-base transition duration-200 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30 cursor-pointer active:scale-98 flex items-center gap-2"
              >
                <span>Explore EduNex</span>
              </button>

              {/* Button 2: View Courses (Dark Outlined Pill) */}
              <button
                type="button"
                id="hero-view-courses-btn"
                onClick={() => setActiveModal('courses')}
                className="px-7 py-3 rounded-full bg-[#0c162b] hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-500 font-semibold text-sm sm:text-base transition duration-200 cursor-pointer active:scale-98 flex items-center gap-2"
              >
                <span>View Courses</span>
              </button>
            </div>
          </div>

          {/* Right Column: AI Illustration Card (Exact match to design screenshot) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-blue-900/60 bg-[#0c152a]/80 backdrop-blur-md p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl shadow-blue-950/60 min-h-[380px] sm:min-h-[440px] group transition-all duration-300">
              {/* Subtle card glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-cyan-500/10 opacity-70 pointer-events-none" />

              {/* Mode toggles on top right of card for user convenience */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#070c1b]/80 border border-slate-800 rounded-full p-1 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setCardMode('illustration')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    cardMode === 'illustration' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Visual
                </button>
                <button
                  type="button"
                  onClick={() => setCardMode('auth')}
                  className={`px-3 py-1 rounded-full transition cursor-pointer ${
                    cardMode === 'auth' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quick Sign In
                </button>
              </div>

              {cardMode === 'illustration' ? (
                /* Illustration View matching the graphic card with "AI Illustration" typography */
                <div className="w-full flex flex-col items-center justify-center text-center relative z-10 py-4">
                  <div className="relative w-full aspect-4/3 max-w-[340px] rounded-2xl overflow-hidden border border-blue-800/40 shadow-xl bg-slate-900/60 group-hover:border-blue-500/50 transition">
                    <img
                      src="/ai_education_hero.png"
                      alt="AI Illustration"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c152a] via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-blue-600/80 backdrop-blur-md text-white border border-blue-400/40 shadow-xs flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-300" />
                        AI Neural Tutor Active
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono font-semibold">
                        v2.5
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-200 mt-4 tracking-tight">
                    AI Illustration
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Autonomous Socratic dialogue & real-time adaptive learning vectors.
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setIsJoinModalOpen(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer"
                    >
                      Create Student Profile →
                    </button>
                  </div>
                </div>
              ) : (
                /* Quick Auth view inside card */
                <div className="w-full relative z-10 py-2">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white">Student Portal</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sign in to synchronize study cards & AI sessions
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer mb-3 disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center gap-2 my-2 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span>or email</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  {/* Email Sign In Form */}
                  <form onSubmit={handleEmailSignIn} className="space-y-2.5">
                    <div>
                      <input
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setIsJoinModalOpen(true);
                      }}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      New user? Register
                    </button>
                    <button
                      type="button"
                      onClick={onExploreDemo}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      Guest Sandbox
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EduNex Study AI • Powered by Google Cloud & Gemini Socratic Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="hover:text-white transition cursor-pointer"
            >
              Pedagogy
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('vision')}
              className="hover:text-white transition cursor-pointer"
            >
              Vision
            </button>
            <button
              type="button"
              onClick={onExploreDemo}
              className="hover:text-blue-400 font-semibold transition cursor-pointer"
            >
              Demo Mode
            </button>
          </div>
        </div>
      </footer>

      {/* 4. FLOATING CHATBOT AVATAR (Bottom Right - Exactly matches the design screenshot) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          id="edunex-floating-ai-bot"
          onClick={() => {
            soundFX.playPop();
            setIsChatbotOpen(!isChatbotOpen);
          }}
          className="w-12 h-12 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/40 ring-4 ring-cyan-400/20 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Ask EduNex Study AI"
        >
          {/* Exact robot icon styling */}
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-cyan-400" />
          </div>
        </button>

        {/* Floating Chat Popup */}
        {isChatbotOpen && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 rounded-2xl bg-[#0c152a] border border-blue-800/80 shadow-2xl p-4 text-left z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-400 text-slate-950 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">EduNex AI Assistant</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Ready to help
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatbotOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2.5 max-h-56 overflow-y-auto text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl ${
                    msg.sender === 'bot'
                      ? 'bg-slate-900 border border-slate-800 text-slate-200'
                      : 'bg-blue-600 text-white ml-auto max-w-[85%]'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about AI study features..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 5. MODALS FOR NAVBAR LINKS: About, What We Provide, Courses, Community, Vision */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1325] border border-blue-900/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-left shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* About Modal */}
            {activeModal === 'about' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">About EduNex</h3>
                    <p className="text-xs text-blue-400">Next-Generation Autonomous Socratic Learning</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  EduNex is an advanced AI-powered educational ecosystem engineered to bridge the gap between traditional syllabus learning and the future of AI-driven cognitive mastery.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <h5 className="font-bold text-xs text-white mb-1">🎯 Socratic Dialogue</h5>
                    <p className="text-xs text-slate-400">
                      Instead of giving away answers, our AI questions the student step-by-step to build lasting intuition.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <h5 className="font-bold text-xs text-white mb-1">⚡ Spaced Repetition</h5>
                    <p className="text-xs text-slate-400">
                      Automated memory curves ensure topics are reviewed at optimal intervals right before forgetting occurs.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onExploreDemo();
                  }}
                  className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Explore Interactive Learning Sandbox
                </button>
              </div>
            )}

            {/* What We Provide Modal */}
            {activeModal === 'whatWeProvide' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">What EduNex Provides</h3>
                    <p className="text-xs text-cyan-400">4 Core Pillars of Academic Intelligence</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-white">AI Study Coach & Socratic Tutor</h4>
                      <p className="text-xs text-slate-400">
                        Interactive dialogue that adapts to your thinking style, identifying mental misconceptions instantly.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Target className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-white">Weakness Detector & Targeted Drills</h4>
                      <p className="text-xs text-slate-400">
                        Scans quiz mistakes and calculates confidence indexes, generating targeted 10-minute micro-drills.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-white">SnapStudy OCR Note Converter</h4>
                      <p className="text-xs text-slate-400">
                        Snap a photo of handwritten study notes or textbook pages to convert them into instant flashcards and practice tests.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Cloud className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-white">Cloud Firestore Persistent Sync</h4>
                      <p className="text-xs text-slate-400">
                        Your study history, mastery badges, streak points, and drafts remain synchronized securely on Google Cloud.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setAuthMode('signup');
                    setIsJoinModalOpen(true);
                  }}
                  className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Join & Unlock All 4 Pillars
                </button>
              </div>
            )}

            {/* Courses Modal */}
            {activeModal === 'courses' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">EduNex Curriculum & Courses</h3>
                    <p className="text-xs text-indigo-400">Future-Focused STEM & AI Disciplines</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { title: 'AI & Machine Learning', level: 'Intermediate', count: '14 Modules' },
                    { title: 'Calculus & Linear Algebra', level: 'College Prep', count: '18 Modules' },
                    { title: 'Classical & Quantum Physics', level: 'Advanced', count: '16 Modules' },
                    { title: 'Molecular Biology & Genetics', level: 'Advanced', count: '12 Modules' },
                    { title: 'Data Structures & Python', level: 'Foundational', count: '20 Modules' },
                    { title: 'Organic Chemistry & Synthesis', level: 'Honors', count: '15 Modules' },
                  ].map((course, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{course.title}</span>
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                          {course.level}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">{course.count} • Interactive Drills</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onExploreDemo();
                  }}
                  className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Start Learning Any Course Now
                </button>
              </div>
            )}

            {/* Community Modal */}
            {activeModal === 'community' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Global Student Community</h3>
                    <p className="text-xs text-emerald-400">Peer Circles, Boss Battles & Leaderboards</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">
                  Study together in real-time study circles, participate in 24-hour sprint challenges, and challenge study rivals to Boss Battles.
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold">⚡ Weekly Challenge: Calculus Marathon</span>
                    <span className="text-emerald-400 font-mono font-bold">+500 XP</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Over 1,200 students are currently practicing limits and derivatives right now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onExploreDemo();
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Enter Community Circles
                </button>
              </div>
            )}

            {/* Vision Modal */}
            {activeModal === 'vision' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Our Vision for AI-Ready Students</h3>
                    <p className="text-xs text-purple-400">Education Built for the Next Era</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We believe artificial intelligence should never replace human curiosity or critical reasoning. Instead, EduNex acts as an intellectual amplifier, accelerating deep comprehension and training students to think creatively, systematically, and boldly.
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 italic">
                  "The future belongs to students who can synthesize concepts across disciplines and partner with artificial intelligence to solve real-world problems."
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setAuthMode('signup');
                    setIsJoinModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Join the Future of Education
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. JOIN / SIGN IN / SIGN UP MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0c152a] border border-blue-900/80 rounded-3xl p-6 sm:p-8 max-w-md w-full text-left shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1 mb-5">
              <div className="flex justify-center mb-1">
                <Logo size="md" glow />
              </div>
              <h3 className="text-2xl font-black text-white">
                {authMode === 'signup'
                  ? 'Join EduNex'
                  : authMode === 'signin'
                  ? 'Welcome Back'
                  : authMode === 'verify'
                  ? 'Verify Google Email'
                  : 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {authMode === 'signup'
                  ? 'Create an account with strong password & Google verification'
                  : authMode === 'signin'
                  ? 'Log in to synchronize your AI Study Coach across devices'
                  : authMode === 'verify'
                  ? 'Check your inbox for the official verification link'
                  : 'Enter your email to receive recovery instructions'}
              </p>
            </div>

            {/* Switch Tabs: Sign Up vs Sign In */}
            {authMode !== 'verify' && authMode !== 'forgot' && (
              <div className="flex p-1 bg-slate-900 rounded-2xl mb-4 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    authMode === 'signup' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    authMode === 'signin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Notifications */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Verification Target Mode */}
            {authMode === 'verify' ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We have dispatched a verification email to{' '}
                  <strong className="text-cyan-400">{verificationTargetUser?.email || email}</strong>. Click the link in
                  your inbox to confirm.
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {isLoading ? 'Checking status...' : "I've Verified My Email — Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isLoading || resendCooldown > 0}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend Verification Email'}
                  </button>
                </div>
              </div>
            ) : authMode === 'forgot' ? (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Your Registered Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  {isLoading ? 'Sending Reset Link...' : 'Send Password Reset Email'}
                </button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Main Auth Forms */
              <div className="space-y-4">
                {/* One Tap Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span>or email credentials</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {authMode === 'signup' ? (
                  /* Sign Up Form with Strong Password Meter */
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Student Name</label>
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-300">Create Strong Password</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[10px] text-blue-400 cursor-pointer"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars, mixed case, symbol"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />

                      {/* Live Password Checklist */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px]">
                        <span className={passwordValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                          {passwordValidation.hasMinLength ? '✓' : '•'} 8+ Characters
                        </span>
                        <span className={passwordValidation.hasUpperCase ? 'text-emerald-400' : 'text-slate-500'}>
                          {passwordValidation.hasUpperCase ? '✓' : '•'} Uppercase Letter
                        </span>
                        <span className={passwordValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                          {passwordValidation.hasNumber ? '✓' : '•'} Contains Number
                        </span>
                        <span className={passwordValidation.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}>
                          {passwordValidation.hasSpecialChar ? '✓' : '•'} Special Character
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Confirm Password</label>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !passwordValidation.isStrong || !passwordsMatch}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Creating Account...' : 'Join & Create Account'}
                    </button>
                  </form>
                ) : (
                  /* Sign In Form */
                  <form onSubmit={handleEmailSignIn} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-300">Password</label>
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot')}
                          className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In to EduNex'}
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      onExploreDemo();
                    }}
                    className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    ⚡ Or explore in Guest Demo Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
