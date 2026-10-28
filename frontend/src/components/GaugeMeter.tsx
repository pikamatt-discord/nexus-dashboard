import React from 'react';

interface GaugeMeterProps {
  value: number; // 0 to 100
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  value,
  label,
  sublabel,
  size = 150,
  strokeWidth = 14,
  colorClass
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const gradientId = `gauge-gradient-${Math.random().toString(36).substr(2, 9)}`;

  let stopColorStart = "#8b5cf6";
  let stopColorEnd = "#06b6d4";

  if (colorClass) {
    if (colorClass.includes("emerald")) {
      stopColorStart = "#10b981";
      stopColorEnd = "#34d399";
    } else if (colorClass.includes("blue")) {
      stopColorStart = "#3b82f6";
      stopColorEnd = "#60a5fa";
    } else if (colorClass.includes("cyan")) {
      stopColorStart = "#06b6d4";
      stopColorEnd = "#38bdf8";
    } else if (colorClass.includes("amber")) {
      stopColorStart = "#f59e0b";
      stopColorEnd = "#fbbf24";
    } else if (colorClass.includes("rose")) {
      stopColorStart = "#f43f5e";
      stopColorEnd = "#fb7185";
    }
  } else {
    if (clampedValue >= 90) {
      stopColorStart = "#f43f5e";
      stopColorEnd = "#e11d48";
    } else if (clampedValue >= 80) {
      stopColorStart = "#f59e0b";
      stopColorEnd = "#d97706";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center relative group">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 filter drop-shadow-lg">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stopColorStart} />
              <stop offset="100%" stopColor={stopColorEnd} />
            </linearGradient>
            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#172236"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing Animated Progress Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            filter="url(#glow-filter)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">
            {Math.round(clampedValue)}%
          </span>
          {sublabel && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <span className="text-xs font-bold text-slate-300 mt-2.5 tracking-wider uppercase group-hover:text-white transition-colors">
        {label}
      </span>
    </div>
  );
};
