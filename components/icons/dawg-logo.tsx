export function DawgLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dog silhouette - minimalist cute style */}
      <g>
        {/* Head */}
        <circle cx="50" cy="40" r="20" fill="url(#dogGradient)" />

        {/* Ears */}
        <ellipse cx="35" cy="30" rx="8" ry="15" fill="url(#dogGradient)" opacity="0.9" />
        <ellipse cx="65" cy="30" rx="8" ry="15" fill="url(#dogGradient)" opacity="0.9" />

        {/* Body */}
        <ellipse cx="50" cy="70" rx="22" ry="18" fill="url(#dogGradient)" />

        {/* Legs */}
        <rect x="40" y="82" width="5" height="12" rx="2.5" fill="url(#dogGradient)" />
        <rect x="55" y="82" width="5" height="12" rx="2.5" fill="url(#dogGradient)" />

        {/* Tail */}
        <path
          d="M 70 75 Q 80 70 85 80"
          stroke="url(#dogGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes */}
        <circle cx="43" cy="38" r="2.5" fill="white" />
        <circle cx="57" cy="38" r="2.5" fill="white" />

        {/* Nose */}
        <ellipse cx="50" cy="45" rx="3" ry="2" fill="white" opacity="0.9" />

        {/* Purple accent on ear tip */}
        <circle cx="65" cy="25" r="4" fill="#b066ff" opacity="0.6" className="animate-pulse-slow" />
      </g>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="dogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#00a3cc" />
          <stop offset="100%" stopColor="#0088aa" />
        </linearGradient>
      </defs>
    </svg>
  );
}
