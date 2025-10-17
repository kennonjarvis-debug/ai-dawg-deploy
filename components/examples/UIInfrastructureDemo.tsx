/**
 * UI Infrastructure Demo Component
 *
 * Demonstrates the complete UI infrastructure:
 * - Design tokens (colors, spacing, typography, etc.)
 * - UI events (theme, layout, widget lifecycle)
 * - Event bus integration
 *
 * This component shows how to properly use the infrastructure
 * in real components.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, useLayout, useWidget, useNotification } from '@/hooks/useUIEvents';

export function UIInfrastructureDemo() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [breakpoint, setBreakpoint] = useState<string>('unknown');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Theme management with UI events
  const { emit: emitTheme, subscribe: onThemeChange } = useTheme();

  // Layout tracking (auto-tracks viewport)
  const { subscribe: onLayoutChange } = useLayout();

  // Notifications
  const { show: showNotification, subscribe: onNotification } = useNotification();

  // Widget lifecycle tracking
  useWidget('ui-demo-001', 'UIInfrastructureDemo', { version: '1.0' });

  // Subscribe to theme changes
  useEffect(() => {
    const sub = onThemeChange((payload) => {
      console.log('[Demo] Theme changed:', payload);
      setCurrentTheme(payload.theme);
    });
    return () => sub.unsubscribe();
  }, [onThemeChange]);

  // Subscribe to layout changes
  useEffect(() => {
    const sub = onLayoutChange((payload) => {
      console.log('[Demo] Layout changed:', payload);
      setBreakpoint(payload.breakpoint);
    });
    return () => sub.unsubscribe();
  }, [onLayoutChange]);

  // Subscribe to notifications
  useEffect(() => {
    const sub = onNotification((payload) => {
      console.log('[Demo] Notification shown:', payload);
      setNotifications(prev => [...prev.slice(-4), payload.message]);
    });
    return () => sub.unsubscribe();
  }, [onNotification]);

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    emitTheme({
      theme: newTheme,
      previous_theme: currentTheme,
      user_id: 'demo-user',
    });

    // Show notification
    showNotification({
      notification_id: crypto.randomUUID(),
      type: 'info',
      message: `Theme changed to ${newTheme}`,
      duration_ms: 3000,
    });
  };

  return (
    <div style={{
      // Using design tokens via CSS variables
      padding: 'var(--spacing-8)',
      background: 'var(--color-neutral-50)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      maxWidth: 'var(--spacing-128)',
      margin: '0 auto',
    }}>
      <h1 style={{
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--font-weight-bold)',
        marginBottom: 'var(--spacing-6)',
        color: 'var(--color-neutral-900)',
      }}>
        UI Infrastructure Demo
      </h1>

      {/* Design Tokens Section */}
      <section style={{
        marginBottom: 'var(--spacing-8)',
        padding: 'var(--spacing-6)',
        background: 'var(--color-primary-50)',
        borderRadius: 'var(--radius-md)',
        border: '2px solid var(--color-primary-200)',
      }}>
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-4)',
          color: 'var(--color-primary-900)',
        }}>
          🎨 Design Tokens
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-4)',
        }}>
          {/* Color Tokens */}
          <div style={{
            padding: 'var(--spacing-4)',
            background: 'var(--color-neutral-0)',
            borderRadius: 'var(--radius-base)',
          }}>
            <h3 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--color-neutral-700)',
            }}>
              Colors
            </h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <div style={{
                width: 'var(--spacing-12)',
                height: 'var(--spacing-12)',
                background: 'var(--color-primary-500)',
                borderRadius: 'var(--radius-base)',
              }} />
              <div style={{
                width: 'var(--spacing-12)',
                height: 'var(--spacing-12)',
                background: 'var(--color-secondary-500)',
                borderRadius: 'var(--radius-base)',
              }} />
              <div style={{
                width: 'var(--spacing-12)',
                height: 'var(--spacing-12)',
                background: 'var(--color-accent-500)',
                borderRadius: 'var(--radius-base)',
              }} />
            </div>
          </div>

          {/* Spacing Tokens */}
          <div style={{
            padding: 'var(--spacing-4)',
            background: 'var(--color-neutral-0)',
            borderRadius: 'var(--radius-base)',
          }}>
            <h3 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--color-neutral-700)',
            }}>
              Spacing
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-2)' }}>
              <div style={{ width: 'var(--spacing-4)', height: 'var(--spacing-4)', background: 'var(--color-neutral-400)' }} />
              <div style={{ width: 'var(--spacing-4)', height: 'var(--spacing-8)', background: 'var(--color-neutral-400)' }} />
              <div style={{ width: 'var(--spacing-4)', height: 'var(--spacing-12)', background: 'var(--color-neutral-400)' }} />
              <div style={{ width: 'var(--spacing-4)', height: 'var(--spacing-16)', background: 'var(--color-neutral-400)' }} />
            </div>
          </div>

          {/* Shadow Tokens */}
          <div style={{
            padding: 'var(--spacing-4)',
            background: 'var(--color-neutral-0)',
            borderRadius: 'var(--radius-base)',
          }}>
            <h3 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--color-neutral-700)',
            }}>
              Shadows
            </h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <div style={{
                width: 'var(--spacing-12)',
                height: 'var(--spacing-12)',
                background: 'var(--color-neutral-0)',
                boxShadow: 'var(--shadow-sm)',
                borderRadius: 'var(--radius-base)',
              }} />
              <div style={{
                width: 'var(--spacing-12)',
                height: 'var(--spacing-12)',
                background: 'var(--color-neutral-0)',
                boxShadow: 'var(--shadow-md)',
                borderRadius: 'var(--radius-base)',
              }} />
              <div style={{
                width: 'var(--spacing-12)',
                height: 'var(--spacing-12)',
                background: 'var(--color-neutral-0)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-base)',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* UI Events Section */}
      <section style={{
        marginBottom: 'var(--spacing-8)',
        padding: 'var(--spacing-6)',
        background: 'var(--color-secondary-50)',
        borderRadius: 'var(--radius-md)',
        border: '2px solid var(--color-secondary-200)',
      }}>
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-4)',
          color: 'var(--color-secondary-900)',
        }}>
          📡 UI Events
        </h2>

        {/* Theme Control */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <h3 style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-2)',
            color: 'var(--color-neutral-700)',
          }}>
            Theme: <span style={{ color: 'var(--color-secondary-600)' }}>{currentTheme}</span>
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            {(['light', 'dark', 'system'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                style={{
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  background: theme === currentTheme ? 'var(--color-secondary-500)' : 'var(--color-neutral-0)',
                  color: theme === currentTheme ? 'var(--color-neutral-0)' : 'var(--color-neutral-900)',
                  border: '2px solid var(--color-secondary-300)',
                  borderRadius: 'var(--radius-base)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Info */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <h3 style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-2)',
            color: 'var(--color-neutral-700)',
          }}>
            Breakpoint: <span style={{ color: 'var(--color-secondary-600)' }}>{breakpoint}</span>
          </h3>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-neutral-600)',
          }}>
            Resize window to see breakpoint changes tracked automatically
          </p>
        </div>

        {/* Notifications */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-2)',
            color: 'var(--color-neutral-700)',
          }}>
            Recent Notifications:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {notifications.length === 0 ? (
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-neutral-500)',
                fontStyle: 'italic',
              }}>
                No notifications yet. Change theme to trigger one.
              </p>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={i}
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    background: 'var(--color-neutral-0)',
                    borderRadius: 'var(--radius-base)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-neutral-700)',
                    border: '1px solid var(--color-secondary-200)',
                  }}
                >
                  {notif}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Event Bus Info */}
      <section style={{
        padding: 'var(--spacing-6)',
        background: 'var(--color-accent-50)',
        borderRadius: 'var(--radius-md)',
        border: '2px solid var(--color-accent-200)',
      }}>
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-4)',
          color: 'var(--color-accent-900)',
        }}>
          📊 Event Bus Status
        </h2>
        <div style={{
          padding: 'var(--spacing-4)',
          background: 'var(--color-neutral-0)',
          borderRadius: 'var(--radius-base)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-neutral-700)',
        }}>
          <p>✅ Widget lifecycle tracked: ui.widget.mounted</p>
          <p>✅ Theme changes: ui.theme.changed</p>
          <p>✅ Layout resize: ui.layout.resized (auto)</p>
          <p>✅ Notifications: ui.notification.shown</p>
          <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-accent-700)' }}>
            Open console to see event logs
          </p>
        </div>
      </section>
    </div>
  );
}
