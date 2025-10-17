'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
}

export function GlassButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
  icon,
}: GlassButtonProps) {
  const [rippleArray, setRippleArray] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !onClick) return;

    // Ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRippleArray([...rippleArray, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRippleArray((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick();
  };

  const variantClasses = {
    default: 'hover:shadow-glow-blue hover:border-neon-blue/30',
    primary: 'neon-border-blue hover:shadow-glow-blue',
    danger: 'neon-border-red hover:shadow-glow-red border-red-500/30',
    success: 'neon-border-green hover:shadow-glow-green',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'glass relative overflow-hidden',
        'rounded-lg font-medium',
        'transition-all duration-200 ease-smooth',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {/* Ripple effect */}
      {rippleArray.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Content */}
      {children && <span className="relative z-10">{children}</span>}
    </button>
  );
}
