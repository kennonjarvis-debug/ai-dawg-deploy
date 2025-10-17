/**
 * Button - Core primitive component
 * Accessible, responsive, with multiple variants and sizes
 */

'use client';

import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  isActive?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      icon,
      iconPosition = 'left',
      isLoading = false,
      isActive = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center gap-2',
      'font-medium',
      'transition-all duration-150',
      'focus-ring',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    ];

    const variantClasses = {
      default: [
        'glass',
        'hover:scale-105 active:scale-95',
        'hover-glow-blue',
      ],
      primary: [
        'neon-border-blue',
        'hover:scale-105 active:scale-95',
        'hover-glow-blue',
      ],
      secondary: [
        'glass-panel',
        'hover:border-accent-purple',
        'hover-glow-purple',
      ],
      danger: [
        'neon-border-red',
        'hover-glow-red',
        'text-accent-red',
      ],
      success: [
        'neon-border-green',
        'hover-glow-green',
        'text-accent-green',
      ],
      ghost: [
        'hover:bg-bg-hover',
        'active:bg-bg-active',
        'text-text-secondary',
        'hover:text-text-primary',
      ],
    };

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs rounded-md h-6',
      sm: 'px-3 py-1.5 text-sm rounded-md h-8',
      md: 'px-4 py-2 text-base rounded-lg h-10',
      lg: 'px-6 py-3 text-lg rounded-lg h-12',
      xl: 'px-8 py-4 text-xl rounded-xl h-14',
    };

    const activeClasses = isActive ? 'glow-blue scale-105' : '';
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          activeClasses,
          widthClass,
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-pressed={isActive}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="animate-pulse">⏳</span>
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - Button variant for icon-only buttons
 */
export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, children, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-6 h-6 p-1',
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-3',
      xl: 'w-14 h-14 p-4',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn('!p-0', sizeClasses[size], className)}
        {...props}
      >
        <span className="flex items-center justify-center">{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
