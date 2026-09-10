import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { soundFX } from '../utils/soundOrConfetti';

interface SubscriptionQRCodeProps {
  planName: string;
  price: number;
  billingCycle: 'annual' | 'monthly' | 'lifetime';
  onSimulateSuccess?: () => void;
  className?: string;
  showSimulateButton?: boolean;
}

export const SubscriptionQRCode: React.FC<SubscriptionQRCodeProps> = ({
  planName,
  price,
  billingCycle,
  onSimulateSuccess,
  className = '',
  showSimulateButton = true,
}) => {
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedApp, setSelectedApp] = useState<'any' | 'gpay' | 'phonepe' | 'paytm' | 'bhim'>('any');

  const vpaAddress = 'nexora@upi';

  // Construct official standard UPI deep link
  const note = encodeURIComponent(`Nexora Pro ${planName}`);
  const payeeName = encodeURIComponent('Nexora Study AI');
  const upiUri = `upi://pay?pa=${vpaAddress}&pn=${payeeName}&am=${price}&cu=USD&tn=${note}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(vpaAddress);
    setCopiedVpa(true);
    soundFX.playPop();
    setTimeout(() => setCopiedVpa(false), 2200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopiedLink(true);
    soundFX.playPop();
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-purple-50/40 dark:from-[#0c1326] dark:via-[#10172e] dark:to-[#17122b] border border-blue-200/80 dark:border-blue-900/60 shadow-md ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center gap-5">
        {/* QR Code Container with Nexora Branded Border */}
        <div className="relative group shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-blue-500/30 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Live Scan indicator line */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 top-2 group-hover:top-full transition-all duration-1000 ease-in-out opacity-80" />

            <QRCodeSVG
              value={upiUri}
              size={148}
              level="H"
              includeMargin={false}
              className="rounded-lg"
              imageSettings={{
                src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9.25L4.5 7.5 12 3.75l7.5 3.75L12 11.25zm0 3.25L4.5 10.75V16l7.5 4.5 7.5-4.5v-5.25L12 14.5z"/></svg>',
                x: undefined,
                y: undefined,
                height: 28,
                width: 28,
                excavate: true,
              }}
            />

            <div className="mt-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center justify-center gap-1">
                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                Nexora Pro Pay
              </span>
              <span className="text-[11px] font-black text-blue-700">
                ${price} {billingCycle === 'annual' ? '/yr' : billingCycle === 'monthly' ? '/mo' : 'once'}
              </span>
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <Smartphone className="w-3 h-3 text-blue-600 dark:text-cyan-300" />
            <span>Scan with any camera / UPI</span>
          </div>
        </div>

        {/* Subscription QR Instructions & Quick Actions */}
        <div className="flex-1 space-y-3 text-left w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                Instant Subscription QR
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                1-Click Activation
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
              Scan QR code to activate {planName}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Open your mobile camera, Google Pay, PhonePe, Paytm, BHIM, or Banking app to scan and instantly unlock unlimited AI features.
            </p>
          </div>

          {/* VPA Address & Copy Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-[#131d33] border border-blue-200 dark:border-blue-900/60 font-mono text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-500 text-[10px] font-sans font-bold">UPI ID:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate">{vpaAddress}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-cyan-300 hover:underline cursor-pointer shrink-0"
              >
                {copiedVpa ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer shrink-0 flex items-center justify-center gap-1"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <ExternalLink className="w-3 h-3" />}
              <span>{copiedLink ? 'Link Copied' : 'Share QR Link'}</span>
            </button>
          </div>

          {/* App Badges supported */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Supports:
            </span>
            {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'WhatsApp Pay', 'Apple Pay'].map((app) => (
              <span
                key={app}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                {app}
              </span>
            ))}
          </div>

          {/* Mobile direct deep link & Simulation option */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100 dark:border-blue-900/40">
            <a
              href={upiUri}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open in UPI App</span>
            </a>

            {showSimulateButton && onSimulateSuccess && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playSuccess();
                  onSimulateSuccess();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Simulate QR Payment (Instant Approve)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
