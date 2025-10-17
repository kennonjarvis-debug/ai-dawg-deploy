/**
 * Layout - Core primitive component
 * Main application layout with header, sidebar, and content area
 * Mobile-first, responsive, accessible
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Layout({ children, header, sidebar, footer, className }: LayoutProps) {
  return (
    <div className={cn('flex flex-col h-screen overflow-hidden', className)}>
      {/* Header */}
      {header && (
        <header className="flex-shrink-0 h-16 glass-dark border-b border-border-light">
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        {sidebar && <aside className="flex-shrink-0">{sidebar}</aside>}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0 h-16 glass-dark border-t border-border-light">
          {footer}
        </footer>
      )}
    </div>
  );
}

/**
 * LayoutHeader - Header component for use in Layout
 */
export interface LayoutHeaderProps {
  children: ReactNode;
  className?: string;
  logo?: ReactNode;
  actions?: ReactNode;
}

export function LayoutHeader({ children, className, logo, actions }: LayoutHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between h-full px-6', className)}>
      {logo && <div className="flex items-center gap-4">{logo}</div>}
      <div className="flex-1 flex items-center justify-center">{children}</div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/**
 * LayoutContent - Main content wrapper with consistent padding
 */
export interface LayoutContentProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function LayoutContent({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
}: LayoutContentProps) {
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[1920px]',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * LayoutGrid - Responsive grid system
 */
export interface LayoutGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LayoutGrid({ children, cols = 12, gap = 'md', className }: LayoutGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

/**
 * LayoutSection - Section wrapper with optional title
 */
export interface LayoutSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function LayoutSection({
  children,
  title,
  description,
  action,
  className,
}: LayoutSectionProps) {
  return (
    <section className={cn('', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-6">
          {title && (
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-text-secondary">{description}</p>
              )}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * LayoutDivider - Visual divider
 */
export function LayoutDivider({ className }: { className?: string }) {
  return <hr className={cn('separator-horizontal my-6', className)} />;
}
