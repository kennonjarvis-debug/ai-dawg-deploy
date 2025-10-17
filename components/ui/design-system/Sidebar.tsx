/**
 * Sidebar - Core primitive component
 * Responsive sidebar with collapse/expand functionality
 * Mobile drawer on small screens, persistent on larger screens
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

export interface SidebarProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  position?: 'left' | 'right';
  width?: string;
  collapsedWidth?: string;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export function Sidebar({
  children,
  defaultCollapsed = false,
  collapsible = true,
  position = 'left',
  width = '280px',
  collapsedWidth = '64px',
  className,
  header,
  footer,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileOpen]);

  const currentWidth = isCollapsed ? collapsedWidth : width;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-overlay md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col',
          'glass-dark border-r border-border-light',
          'transition-all duration-300',
          'fixed md:relative',
          'h-full z-overlay md:z-base',
          // Mobile positioning
          'md:translate-x-0',
          position === 'left' && !isMobileOpen && '-translate-x-full',
          position === 'right' && !isMobileOpen && 'translate-x-full',
          position === 'left' && 'left-0',
          position === 'right' && 'right-0',
          className
        )}
        style={{ width: currentWidth }}
      >
        {/* Header */}
        {header && (
          <div className="flex-shrink-0 p-4 border-b border-border-subtle">
            {header}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0 p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 p-4 border-t border-border-subtle">
            {footer}
          </div>
        )}

        {/* Collapse Toggle (Desktop only) */}
        {collapsible && (
          <div className="hidden md:block absolute -right-3 top-6">
            <IconButton
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    'transition-transform',
                    position === 'left' && isCollapsed && 'rotate-180',
                    position === 'right' && !isCollapsed && 'rotate-180'
                  )}
                >
                  {position === 'left' ? (
                    <polyline points="15 18 9 12 15 6" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              }
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="sm"
              variant="default"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            />
          </div>
        )}
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full glass-dark border border-border-light shadow-xl flex items-center justify-center md:hidden z-sticky hover-glow-blue"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle sidebar"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </>
  );
}

/**
 * SidebarNav - Navigation list for sidebar
 */
export interface SidebarNavProps {
  children: ReactNode;
  className?: string;
}

export function SidebarNav({ children, className }: SidebarNavProps) {
  return <nav className={cn('flex flex-col gap-1', className)}>{children}</nav>;
}

/**
 * SidebarNavItem - Individual navigation item
 */
export interface SidebarNavItemProps {
  children: ReactNode;
  icon?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function SidebarNavItem({
  children,
  icon,
  isActive = false,
  onClick,
  href,
  className,
}: SidebarNavItemProps) {
  const baseClasses = [
    'flex items-center gap-3',
    'px-3 py-2',
    'rounded-lg',
    'text-sm font-medium',
    'transition-colors duration-150',
    'hover:bg-bg-hover',
    isActive ? 'bg-bg-active text-accent-blue' : 'text-text-secondary',
  ];

  const content = (
    <>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(baseClasses, className)}
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, 'w-full text-left', className)}
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </button>
  );
}

/**
 * SidebarSection - Labeled section in sidebar
 */
export interface SidebarSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function SidebarSection({ children, title, className }: SidebarSectionProps) {
  return (
    <div className={cn('', className)}>
      {title && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
