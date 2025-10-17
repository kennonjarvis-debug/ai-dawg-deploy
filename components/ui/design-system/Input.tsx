/**
 * Input - Core primitive component
 * Accessible input with multiple variants and sizes
 */

'use client';

import { ReactNode, InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'glass';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      variant = 'default',
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {

    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const baseClasses = [
      'w-full',
      'rounded-lg',
      'transition-all duration-150',
      'focus:outline-none',
      'placeholder:text-text-tertiary',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variantClasses = {
      default: [
        'bg-transparent',
        'border border-border-light',
        'text-text-primary',
        'hover:border-border-medium',
        'focus:border-accent-blue',
        'focus:shadow-[0_0_0_1px_var(--accent-blue)]',
      ],
      filled: [
        'bg-bg-secondary',
        'border border-transparent',
        'text-text-primary',
        'hover:bg-bg-tertiary',
        'focus:border-accent-blue',
        'focus:bg-bg-tertiary',
      ],
      glass: [
        'glass',
        'text-text-primary',
        'hover:border-border-medium',
        'focus:border-accent-blue',
        'focus-ring',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-6 py-3 text-lg h-12',
    };

    const iconPadding = {
      sm: leftIcon ? 'pl-9' : rightIcon ? 'pr-9' : '',
      md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '',
    };

    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              iconPadding[inputSize],
              hasError && 'border-accent-red focus:border-accent-red focus:shadow-[0_0_0_1px_var(--accent-red)]',
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-accent-red"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-text-secondary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea - Multi-line text input
 */
export interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  rows?: number;
  variant?: 'default' | 'filled' | 'glass';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      rows = 4,
      variant = 'default',
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const baseClasses = [
      'w-full',
      'rounded-lg',
      'px-4 py-2',
      'text-base',
      'transition-all duration-150',
      'focus:outline-none',
      'placeholder:text-text-tertiary',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'resize-y',
      'custom-scrollbar',
    ];

    const variantClasses = {
      default: [
        'bg-transparent',
        'border border-border-light',
        'text-text-primary',
        'hover:border-border-medium',
        'focus:border-accent-blue',
        'focus:shadow-[0_0_0_1px_var(--accent-blue)]',
      ],
      filled: [
        'bg-bg-secondary',
        'border border-transparent',
        'text-text-primary',
        'hover:bg-bg-tertiary',
        'focus:border-accent-blue',
        'focus:bg-bg-tertiary',
      ],
      glass: [
        'glass',
        'text-text-primary',
        'hover:border-border-medium',
        'focus:border-accent-blue',
        'focus-ring',
      ],
    };

    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            baseClasses,
            variantClasses[variant],
            hasError && 'border-accent-red focus:border-accent-red focus:shadow-[0_0_0_1px_var(--accent-red)]',
            className
          )}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-sm text-accent-red"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="mt-1.5 text-sm text-text-secondary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
