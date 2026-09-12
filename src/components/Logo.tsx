import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  textClassName?: string;
  className?: string;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = '',
  className = '',
  glow = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    hero: 'w-28 h-28 sm:w-36 sm:h-36',
  };

  const imageSrc = '/edunex_logo.png';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        {glow && (
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/30 via-indigo-500/20 to-amber-500/20 blur-xl animate-pulse -z-10`}
          />
        )}
        <img
          src={imageSrc}
          alt="Edunex Study AI Logo"
          referrerPolicy="no-referrer"
          className={`${sizeClasses[size]} object-contain drop-shadow-md rounded-2xl transition-transform duration-300 hover:scale-105`}
          onError={(e) => {
            // Graceful fallback to SVG representation if image path fails
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback container with identical aesthetic */}
        <div
          style={{ display: 'none' }}
          className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-lg font-black text-sm`}
        >
          E
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-none">
            <span
              className={`font-black tracking-tight text-slate-900 dark:text-white uppercase ${
                size === 'hero' ? 'text-2xl sm:text-3xl' : size === 'lg' ? 'text-xl' : 'text-base'
              } ${textClassName}`}
            >
              EDU<span className="text-cyan-500 dark:text-cyan-400">N</span>EX
            </span>
          </div>
          <span
            className={`font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase ${
              size === 'hero' ? 'text-xs' : 'text-[9px]'
            }`}
          >
            STUDY AI
          </span>
        </div>
      )}
    </div>
  );
};
