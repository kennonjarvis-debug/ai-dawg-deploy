/**
 * useLayout Hook - Client-side layout state management
 * Instance 4 (Data & Storage) - Layout persistence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { UserLayout } from '@/lib/types';
import { LayoutManager } from '@/lib/layout/LayoutManager';

export function useLayout() {
  const { data: session } = useSession();
  const [layout, setLayout] = useState<UserLayout | null>(null);
  const [layouts, setLayouts] = useState<UserLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load layouts on mount
  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const loadLayouts = async () => {
      try {
        const userId = session.user?.email;
        if (!userId) return;

        const userLayouts = await LayoutManager.loadLayouts(userId);
        setLayouts(userLayouts);

        // Set default layout
        const defaultLayout = userLayouts.find((l) => l.isDefault) || userLayouts[0];
        if (defaultLayout) {
          setLayout(defaultLayout);
          LayoutManager.setActiveLayout(userId, defaultLayout.layoutId);
        }
      } catch (error) {
        console.error('Failed to load layouts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLayouts();
  }, [session]);

  /**
   * Update layout (debounced save)
   */
  const updateLayout = useCallback(
    async (updates: Partial<UserLayout>) => {
      const userId = session?.user?.email;
      if (!userId || !layout) return;

      const updatedLayout = {
        ...layout,
        ...updates,
        updatedAt: new Date(),
      };

      setLayout(updatedLayout);

      // Debounced save (wait 500ms after last change)
      setSaving(true);
      setTimeout(async () => {
        try {
          await LayoutManager.saveLayout(userId, updatedLayout);
        } catch (error) {
          console.error('Failed to save layout:', error);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [session, layout]
  );

  /**
   * Update sidebar state
   */
  const updateSidebar = useCallback(
    (updates: Partial<UserLayout['sidebar']>) => {
      if (!layout) return;
      updateLayout({
        sidebar: {
          ...layout.sidebar,
          ...updates,
        },
      });
    },
    [layout, updateLayout]
  );

  /**
   * Update main content split
   */
  const updateMainContent = useCallback(
    (updates: Partial<UserLayout['mainContent']>) => {
      if (!layout) return;
      updateLayout({
        mainContent: {
          ...layout.mainContent,
          ...updates,
        },
      });
    },
    [layout, updateLayout]
  );

  /**
   * Toggle widget visibility
   */
  const toggleWidget = useCallback(
    (widgetId: keyof UserLayout['widgets']) => {
      if (!layout) return;
      updateLayout({
        widgets: {
          ...layout.widgets,
          [widgetId]: !layout.widgets[widgetId],
        },
      });
    },
    [layout, updateLayout]
  );

  /**
   * Update bottom widget grid
   */
  const updateBottomWidgets = useCallback(
    (updates: Partial<UserLayout['bottomWidgets']>) => {
      if (!layout) return;
      updateLayout({
        bottomWidgets: {
          ...layout.bottomWidgets,
          ...updates,
        },
      });
    },
    [layout, updateLayout]
  );

  /**
   * Create new layout
   */
  const createLayout = useCallback(
    async (name: string) => {
      const userId = session?.user?.email;
      if (!userId || !layout) return;

      try {
        const newLayout = await LayoutManager.createLayout(
          userId,
          name,
          layout // Clone current layout
        );
        setLayouts([...layouts, newLayout]);
        setLayout(newLayout);
        LayoutManager.setActiveLayout(userId, newLayout.layoutId);
        return newLayout;
      } catch (error) {
        console.error('Failed to create layout:', error);
        return null;
      }
    },
    [session, layout, layouts]
  );

  /**
   * Switch to different layout
   */
  const switchLayout = useCallback(
    (layoutId: string) => {
      const userId = session?.user?.email;
      if (!userId) return;

      const targetLayout = layouts.find((l) => l.layoutId === layoutId);
      if (targetLayout) {
        setLayout(targetLayout);
        LayoutManager.setActiveLayout(userId, layoutId);
      }
    },
    [session, layouts]
  );

  /**
   * Delete layout
   */
  const deleteLayout = useCallback(
    async (layoutId: string) => {
      const userId = session?.user?.email;
      if (!userId) return;

      try {
        await LayoutManager.deleteLayout(userId, layoutId);
        const updatedLayouts = layouts.filter((l) => l.layoutId !== layoutId);
        setLayouts(updatedLayouts);

        // If deleted active layout, switch to first available
        const firstLayout = updatedLayouts[0];
        if (layout?.layoutId === layoutId && firstLayout) {
          switchLayout(firstLayout.layoutId);
        }
      } catch (error) {
        console.error('Failed to delete layout:', error);
      }
    },
    [session, layouts, layout, switchLayout]
  );

  /**
   * Export current layout
   */
  const exportLayout = useCallback(() => {
    const userId = session?.user?.email;
    if (!userId) return;

    const json = LayoutManager.exportLayout(userId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout?.name || 'layout'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [session, layout]);

  /**
   * Import layout from JSON
   */
  const importLayout = useCallback(
    async (jsonData: string) => {
      const userId = session?.user?.email;
      if (!userId) return;

      try {
        const imported = await LayoutManager.importLayout(userId, jsonData);
        setLayouts([...layouts, imported]);
        setLayout(imported);
        LayoutManager.setActiveLayout(userId, imported.layoutId);
        return imported;
      } catch (error) {
        console.error('Failed to import layout:', error);
        return null;
      }
    },
    [session, layouts]
  );

  /**
   * Reset to default layout
   */
  const resetToDefault = useCallback(() => {
    const userId = session?.user?.email;
    if (!userId) return;

    const defaultLayout = LayoutManager.getDefaultLayout(userId);
    setLayout(defaultLayout);
    updateLayout(defaultLayout);
  }, [session, updateLayout]);

  return {
    layout,
    layouts,
    loading,
    saving,
    updateLayout,
    updateSidebar,
    updateMainContent,
    toggleWidget,
    updateBottomWidgets,
    createLayout,
    switchLayout,
    deleteLayout,
    exportLayout,
    importLayout,
    resetToDefault,
  };
}
