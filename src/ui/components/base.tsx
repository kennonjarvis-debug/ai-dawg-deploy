import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: ReactNode;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  contentClassName,
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={clsx(
          'bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl w-full p-6',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || icon || showCloseButton) && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {icon && <div>{icon}</div>}
              <div>
                {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25',
    secondary:
      'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white',
    danger:
      'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold',
    ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        'rounded-lg transition-all duration-200 flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// ButtonGroup Component
interface ButtonGroupProps {
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, fullWidth, className }) => {
  return (
    <div className={clsx('flex gap-3', fullWidth && 'w-full', className)}>
      {children}
    </div>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input: React.FC<InputProps> = ({ className, error, ...props }) => {
  return (
    <div className="w-full">
      <input
        className={clsx(
          'w-full px-4 py-2 bg-black/40 border rounded-lg text-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          error ? 'border-red-500' : 'border-white/10 focus:border-purple-500',
          'placeholder:text-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ className, error, children, ...props }) => {
  return (
    <div className="w-full">
      <select
        className={clsx(
          'w-full px-4 py-2 bg-black/40 border rounded-lg text-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          error ? 'border-red-500' : 'border-white/10 focus:border-purple-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// Textarea Component
interface TextareaProps extends React.TextAreaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ className, error, ...props }) => {
  return (
    <div className="w-full">
      <textarea
        className={clsx(
          'w-full px-4 py-2 bg-black/40 border rounded-lg text-white transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          error ? 'border-red-500' : 'border-white/10 focus:border-purple-500',
          'placeholder:text-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// Checkbox Component
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, error, className, id, ...props }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={id}
          className={clsx(
            'w-5 h-5 bg-black/40 border border-white/10 rounded',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
            'checked:bg-purple-500 checked:border-purple-500',
            'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-gray-300 cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// FormField Component
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}) => {
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
