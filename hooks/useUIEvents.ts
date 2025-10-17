/**
 * UI Event Bus Hooks
 * Typed hooks for subscribing to and emitting UI events
 *
 * Browser-only event bus for client-side UI events
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  EventTopics,
  UIThemeChangedPayload,
  UILayoutResizedPayload,
  UIRouteChangedPayload,
  UIModalOpenedPayload,
  UIModalClosedPayload,
  UINotificationShownPayload,
  UIErrorDisplayedPayload,
} from '@dawg-ai/types';

// ============================================================================
// Browser-Only Event Bus
// ============================================================================

type EventHandler = (event: any) => void;

class BrowserEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  publish(topic: string, payload: any, metadata?: { traceId: string }) {
    const event = {
      topic,
      payload,
      metadata: metadata || { traceId: crypto.randomUUID() },
      timestamp: new Date().toISOString(),
    };

    const topicHandlers = this.handlers.get(topic);
    if (topicHandlers) {
      topicHandlers.forEach(handler => handler(event));
    }
  }

  subscribe(topic: string, handler: EventHandler) {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);
  }

  unsubscribe(topic: string, handler: EventHandler) {
    const topicHandlers = this.handlers.get(topic);
    if (topicHandlers) {
      topicHandlers.delete(handler);
    }
  }
}

const browserEventBus = new BrowserEventBus();

// ============================================================================
// useUIEvent - Generic hook for any UI event
// ============================================================================

export function useUIEvent<T>(
  topic: string,
  handler: (payload: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const wrappedHandler = (event: any) => {
      handler(event.payload);
    };

    browserEventBus.subscribe(topic, wrappedHandler);

    return () => {
      browserEventBus.unsubscribe(topic, wrappedHandler);
    };
  }, deps);
}

// ============================================================================
// useTheme - Hook for theme management
// ============================================================================

export function useTheme() {
  const emit = useCallback((payload: UIThemeChangedPayload) => {
    browserEventBus.publish(EventTopics.UI_THEME_CHANGED, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const subscribe = useCallback((handler: (payload: UIThemeChangedPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_THEME_CHANGED, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_THEME_CHANGED, wrappedHandler);
  }, []);

  return { emit, subscribe };
}

// ============================================================================
// useLayout - Hook for layout/viewport changes
// ============================================================================

export function useLayout() {
  const emit = useCallback((payload: UILayoutResizedPayload) => {
    browserEventBus.publish(EventTopics.UI_LAYOUT_RESIZED, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const subscribe = useCallback((handler: (payload: UILayoutResizedPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_LAYOUT_RESIZED, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_LAYOUT_RESIZED, wrappedHandler);
  }, []);

  // Automatically track viewport changes
  useEffect(() => {
    const getBreakpoint = (width: number): UILayoutResizedPayload['breakpoint'] => {
      if (width < 640) return 'xs';
      if (width < 768) return 'sm';
      if (width < 1024) return 'md';
      if (width < 1280) return 'lg';
      if (width < 1536) return 'xl';
      return '2xl';
    };

    let previousBreakpoint = getBreakpoint(window.innerWidth);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getBreakpoint(width);

      if (breakpoint !== previousBreakpoint) {
        emit({
          viewport_width: width,
          viewport_height: height,
          breakpoint,
          previous_breakpoint: previousBreakpoint,
        });
        previousBreakpoint = breakpoint;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [emit]);

  return { emit, subscribe };
}

// ============================================================================
// useWidget - Hook for widget lifecycle tracking
// ============================================================================

export function useWidget(widgetId: string, widgetType: string, props?: Record<string, any>) {
  const mountTimeRef = useRef<number>();

  useEffect(() => {
    // Widget mounted
    mountTimeRef.current = Date.now();

    browserEventBus.publish(EventTopics.UI_WIDGET_MOUNTED, {
      widget_id: widgetId,
      widget_type: widgetType,
      props,
    }, {
      traceId: crypto.randomUUID(),
    });

    // Widget unmounted
    return () => {
      const duration_ms = Date.now() - (mountTimeRef.current || Date.now());

      browserEventBus.publish(EventTopics.UI_WIDGET_UNMOUNTED, {
        widget_id: widgetId,
        widget_type: widgetType,
        duration_ms,
      }, {
        traceId: crypto.randomUUID(),
      });
    };
  }, [widgetId, widgetType, props]);
}

// ============================================================================
// useRoute - Hook for route/navigation tracking
// ============================================================================

export function useRoute() {
  const emit = useCallback((payload: UIRouteChangedPayload) => {
    browserEventBus.publish(EventTopics.UI_ROUTE_CHANGED, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const subscribe = useCallback((handler: (payload: UIRouteChangedPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_ROUTE_CHANGED, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_ROUTE_CHANGED, wrappedHandler);
  }, []);

  return { emit, subscribe };
}

// ============================================================================
// useModal - Hook for modal state tracking
// ============================================================================

export function useModal() {
  const open = useCallback((payload: UIModalOpenedPayload) => {
    browserEventBus.publish(EventTopics.UI_MODAL_OPENED, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const close = useCallback((payload: UIModalClosedPayload) => {
    browserEventBus.publish(EventTopics.UI_MODAL_CLOSED, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const subscribeOpen = useCallback((handler: (payload: UIModalOpenedPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_MODAL_OPENED, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_MODAL_OPENED, wrappedHandler);
  }, []);

  const subscribeClose = useCallback((handler: (payload: UIModalClosedPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_MODAL_CLOSED, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_MODAL_CLOSED, wrappedHandler);
  }, []);

  return { open, close, subscribeOpen, subscribeClose };
}

// ============================================================================
// useNotification - Hook for showing notifications
// ============================================================================

export function useNotification() {
  const show = useCallback((payload: UINotificationShownPayload) => {
    browserEventBus.publish(EventTopics.UI_NOTIFICATION_SHOWN, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const subscribe = useCallback((handler: (payload: UINotificationShownPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_NOTIFICATION_SHOWN, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_NOTIFICATION_SHOWN, wrappedHandler);
  }, []);

  return { show, subscribe };
}

// ============================================================================
// useErrorTracking - Hook for error tracking
// ============================================================================

export function useErrorTracking() {
  const trackError = useCallback((payload: UIErrorDisplayedPayload) => {
    browserEventBus.publish(EventTopics.UI_ERROR_DISPLAYED, payload, {
      traceId: crypto.randomUUID(),
    });
  }, []);

  const subscribe = useCallback((handler: (payload: UIErrorDisplayedPayload) => void) => {
    const wrappedHandler = (event: any) => handler(event.payload);
    browserEventBus.subscribe(EventTopics.UI_ERROR_DISPLAYED, wrappedHandler);
    return () => browserEventBus.unsubscribe(EventTopics.UI_ERROR_DISPLAYED, wrappedHandler);
  }, []);

  // Automatic error boundary integration
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError({
        error_id: crypto.randomUUID(),
        error_type: event.error?.name || 'UnknownError',
        message: event.message,
        stack: event.error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError({
        error_id: crypto.randomUUID(),
        error_type: 'UnhandledPromiseRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  return { trackError, subscribe };
}
