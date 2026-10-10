import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 36, showText = true }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f2b48] via-[#1e3a8a] to-[#1e40af] shadow-md shadow-blue-950/30 text-white shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* Knowledge Sphere Orbit */}
          <circle
            cx="24"
            cy="24"
            r="19"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 3"
            className="opacity-40 animate-[spin_18s_linear_infinite]"
          />
          {/* Central Neural Node Axis */}
          <ellipse
            cx="24"
            cy="24"
            rx="18"
            ry="7"
            stroke="currentColor"
            strokeWidth="1.5"
            transform="rotate(-25 24 24)"
            className="opacity-50"
          />

          {/* Book Wings / Pages */}
          <path
            d="M24 28C20 25 14 25 11 26.5V14.5C14 13 20 13 24 16C28 13 34 13 37 14.5V26.5C34 25 28 25 24 28Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M24 16V28"
            stroke="#1b4356"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Neural AI Nodes */}
          <circle cx="24" cy="11" r="2.5" fill="#93c5fd" />
          <circle cx="12" cy="20" r="2" fill="#60a5fa" />
          <circle cx="36" cy="20" r="2" fill="#60a5fa" />
          <circle cx="17" cy="34" r="2" fill="#ffffff" />
          <circle cx="31" cy="34" r="2" fill="#ffffff" />

          {/* Connecting Synaptic Fibers */}
          <line x1="24" y1="11" x2="12" y2="20" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.7" />
          <line x1="24" y1="11" x2="36" y2="20" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.7" />
          <line x1="12" y1="20" x2="17" y2="34" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="36" y1="20" x2="31" y2="34" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-lg text-[#1b4356] dark:text-white leading-none">
              Study<span className="text-[#1e3a8a] dark:text-[#38bdf8]">Sphere</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/80 dark:bg-sky-950/70 text-[#1b4356] dark:text-sky-300 rounded-full border border-[#b2e8e4]">
              AI Tutor
            </span>
          </div>
          <span className="text-[11px] text-[#4d7a8d] dark:text-slate-400 font-medium tracking-tight">
            Your Personal Learning Assistant
          </span>
        </div>
      )}
    </div>
  );
};
