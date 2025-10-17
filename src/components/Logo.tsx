import React from 'react';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
  className?: string;
};

const sizeMap = {
  sm: { img: 'w-6 h-6', text: 'text-xl' },
  md: { img: 'w-8 h-8', text: 'text-2xl' },
  lg: { img: 'w-10 h-10', text: 'text-3xl' },
} as const;

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, text = 'DAWG AI', className }) => {
  const classes = sizeMap[size] || sizeMap.md;
  return (
    <div className={["flex items-center gap-2", className || ''].filter(Boolean).join(' ')}>
      <img
        src="/assets/ai-dawg-logo.svg"
        alt="DAWG AI logo"
        className={classes.img}
        decoding="async"
        loading="eager"
      />
      {showText && (
        <span className={[
          classes.text,
          'font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent',
        ].join(' ')}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Logo;

