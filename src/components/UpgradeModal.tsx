import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  Crown,
  Lock,
  ArrowRight,
  Clock,
  Flame,
  Award,
  CreditCard,
  CheckCircle2,
  Tag,
  Phone,
  MessageCircle,
  QrCode,
  Copy,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';
import { SubscriptionQRCode } from './SubscriptionQRCode';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onUpgradeSuccess: (planName: string, pricePaid: number) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpgradeSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly' | 'lifetime'>('annual');
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeComplete, setUpgradeComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'upi' | 'card' | 'gpay' | 'paypal'>('qr');
  const [copiedVpa, setCopiedVpa] = useState(false);

  if (!isOpen) return null;

  const trialDaysLeft = profile.subscription?.trialDaysLeft ?? 4;
  const isAlreadyUpgraded = profile.subscription?.isUpgraded ?? false;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'STUDENT20' || clean === 'PRO20' || clean === 'ACE99') {
      setDiscountApplied(true);
      setCouponError('');
      soundFX.playSuccess();
    } else {
      setCouponError('Invalid coupon. Try "STUDENT20" for $20 off!');
      setDiscountApplied(false);
    }
  };

  const getPrice = (plan: 'annual' | 'monthly' | 'lifetime') => {
    if (plan === 'annual') {
      return discountApplied ? 79 : 99;
    }
    if (plan === 'monthly') {
      return discountApplied ? 11.99 : 14.99;
    }
    return discountApplied ? 169 : 199;
  };

  const currentPrice = getPrice(billingCycle);

  const handleUpgrade = () => {
    setIsProcessing(true);
    soundFX.playChime();

    setTimeout(() => {
      setIsProcessing(false);
      setUpgradeComplete(true);
      triggerCelebration();
      soundFX.playSuccess();

      const planName =
        billingCycle === 'annual'
          ? 'Pro Annual Pass'
          : billingCycle === 'monthly'
          ? 'Pro Monthly Flex'
          : 'Pro Lifetime Master';

      onUpgradeSuccess(planName, currentPrice);
    }, 1200);
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('nexora@upi');
    setCopiedVpa(true);
    soundFX.playPop();
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Top Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-xs">
              <Crown className="w-3.5 h-3.5 fill-current" />
              Pro Upgrade
            </span>
            <span className="text-xs font-semibold text-cyan-300">
              Starting from $99/year
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Unlock Full AI Superpowers
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Keep your personalized AI Coach, instant camera note solvers, and targeted weakness drills without limits.
          </p>

          {/* Free Trial Countdown Pill */}
          {!isAlreadyUpgraded && (
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Free Trial Active</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400/30 text-amber-300">
                      {trialDaysLeft} Days Remaining
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Lock in 40% student savings before your trial ends!
                  </p>
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="hidden sm:block text-right">
                <p className="text-[11px] font-semibold text-cyan-300">Day 3 of 7</p>
                <div className="w-24 bg-white/20 h-2 rounded-full overflow-hidden mt-1">
                  <div className="bg-gradient-to-r from-amber-400 to-cyan-400 h-full w-[45%]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {upgradeComplete ? (
            <div className="text-center py-8 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                You're Officially a Pro Scholar! 🎉
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Your account has been upgraded with unlimited AI Tutor reasoning, high-res SnapStudy transcription, and full Study Circles access.
              </p>

              {/* Confirmation Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 max-w-md mx-auto text-left text-xs text-slate-600 dark:text-slate-300 space-y-2 border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Plan Activated:</span>
                  <span className="text-blue-600 dark:text-cyan-300">Pro Scholar Annual</span>
                </div>
                <div className="flex justify-between">
                  <span>Price Paid:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">${currentPrice}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Activation Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Instant Full Access Unlocked
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md transition"
                >
                  Start Learning Now
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Billing Interval Selector */}
              <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Annual ($99/yr)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                    SAVE 40%
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2.5 rounded-xl transition ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly ($14.99/mo)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('lifetime')}
                  className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    billingCycle === 'lifetime'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Lifetime ($199)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                    VIP
                  </span>
                </button>
              </div>

              {/* Plan Details Card (Upgrade from $99) */}
              <div
                className={`p-5 rounded-2xl border-2 transition-all ${
                  billingCycle === 'annual'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {billingCycle === 'annual'
                          ? 'Pro Scholar Annual'
                          : billingCycle === 'monthly'
                          ? 'Pro Monthly Flex'
                          : 'Pro Lifetime Master'}
                      </h4>
                      {billingCycle === 'annual' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                          Best Value from $99
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {billingCycle === 'annual'
                        ? 'Billed $99 once a year (equivalent to only $8.25/month)'
                        : billingCycle === 'monthly'
                        ? 'Billed monthly, cancel anytime in one click'
                        : 'Single payment of $199 for perpetual 4-year access'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      ${currentPrice}
                      <span className="text-xs font-normal text-slate-500">
                        {billingCycle === 'annual' ? '/yr' : billingCycle === 'monthly' ? '/mo' : ''}
                      </span>
                    </p>
                    {discountApplied && (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 line-through">
                        ${billingCycle === 'annual' ? 99 : billingCycle === 'monthly' ? 14.99 : 199}
                      </p>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited AI Tutor explanations & hints</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>SnapStudy high-res OCR & cheat sheets</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Adaptive AI Mock Exams with Root-Cause AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Spaced Repetition decay prediction</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Study Circles audio & focus rooms</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Syllabus exam revision planner</span>
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Promo code (e.g. STUDENT20)"
                    disabled={discountApplied}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={discountApplied}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    discountApplied
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {discountApplied ? '✓ Applied ($20 off)' : 'Apply Code'}
                </button>
              </form>
              {couponError && <p className="text-[11px] text-rose-500 font-semibold">{couponError}</p>}

              {/* Payment selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Payment Method:</p>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Instant Auto-Activation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'qr'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 ring-2 ring-blue-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Scan QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 ring-2 ring-blue-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                    <span>UPI ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gpay')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'gpay'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 ring-2 ring-blue-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Google Pay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 ring-2 ring-blue-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2 sm:col-span-1 ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 ring-2 ring-blue-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>PayPal</span>
                  </button>
                </div>

                {/* QR Code Subscription Panel */}
                {(paymentMethod === 'qr' || paymentMethod === 'gpay') && (
                  <SubscriptionQRCode
                    planName={
                      billingCycle === 'annual'
                        ? 'Pro Scholar Annual'
                        : billingCycle === 'monthly'
                        ? 'Pro Monthly Flex'
                        : 'Pro Lifetime Master'
                    }
                    price={currentPrice}
                    billingCycle={billingCycle}
                    onSimulateSuccess={handleUpgrade}
                    showSimulateButton={true}
                  />
                )}

                {/* UPI Subpanel when UPI is selected */}
                {paymentMethod === 'upi' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131d33] border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Official Nexora Study UPI VPA:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-cyan-300 hover:underline cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedVpa ? 'Copied!' : 'Copy UPI ID'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-700 font-mono text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">nexora@upi</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        Verified Nexora Merchant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports BHIM, Google Pay, PhonePe, Paytm, and WhatsApp Pay directly.
                    </p>
                  </div>
                )}

                {/* Card Subpanel */}
                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131d33] border border-slate-200 dark:border-slate-700 text-xs space-y-3 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PayPal Subpanel */}
                {paymentMethod === 'paypal' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131d33] border border-slate-200 dark:border-slate-700 text-xs text-center space-y-2 animate-fadeIn">
                    <p className="text-slate-600 dark:text-slate-300">
                      You will be redirected to PayPal to complete your payment of <strong>${currentPrice}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* VIP Concierge / Support Box */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-[#131d33] border border-blue-200/80 dark:border-blue-900/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Need assistance with institutional access?
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      Nexora Academic Support & Advisor Team
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
                >
                  <span>Instant Pro</span>
                </button>
              </div>

              {/* Main CTA Button */}
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/25 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Securing Pro Upgrade...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>
                      {billingCycle === 'annual'
                        ? `Upgrade to Pro Annual for $${currentPrice}`
                        : billingCycle === 'monthly'
                        ? `Start Pro Monthly for $${currentPrice}/mo`
                        : `Get Lifetime Master for $${currentPrice}`}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  30-Day Money-Back Guarantee
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Cancel anytime in 1 click
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Loved by 15,000+ STEM students
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
