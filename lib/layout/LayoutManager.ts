/**
 * LayoutManager - Centralized Layout Persistence
 * Instance 4 (Data & Storage) - Layout state management
 * Saves user's UI layout preferences to database
 */

import {
  UserLayout,
  UserLayoutSchema,
  validateStorageData,
} from '@/lib/types';

class LayoutManagerClass {
  private layouts: Map<string, UserLayout> = new Map();
  private activeLayoutId: string | null = null;

  /**
   * Get default layout configuration
   */
  getDefaultLayout(userId: string): UserLayout {
    return {
      userId,
      layoutId: `layout_${Date.now()}`,
      name: 'Default Layout',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),

      sidebar: {
        visible: true,
        width: 300,
        collapsed: false,
      },

      mainContent: {
        tracksHeight: 35,
        waveformHeight: 65,
      },

      bottomWidgets: {
        columns: 5,
        height: 140,
        widgets: [
          { id: 'compactPitchMonitor', x: 0, y: 0, width: 1, height: 1, visible: true },
          { id: 'compactEQ', x: 1, y: 0, width: 1, height: 1, visible: true },
          { id: 'projectStats', x: 2, y: 0, width: 1, height: 1, visible: true },
          { id: 'quickActions', x: 3, y: 0, width: 1, height: 1, visible: true },
          { id: 'voiceInterface', x: 4, y: 0, width: 1.5, height: 1, visible: true },
        ],
      },

      widgets: {
        compactPitchMonitor: true,
        compactEQ: true,
        projectStats: true,
        quickActions: true,
        voiceInterface: true,
        chatPanel: true,
        projectSelector: true,
      },
    };
  }

  /**
   * Load user's layouts from localStorage or API
   */
  async loadLayouts(userId: string): Promise<UserLayout[]> {
    if (typeof window === 'undefined') return [];

    // Try localStorage first (migration path)
    const savedLayouts = localStorage.getItem(`layouts_${userId}`);
    if (savedLayouts) {
      try {
        const parsed = JSON.parse(savedLayouts);
        const layouts = parsed.map((layout: any) => ({
          ...layout,
          createdAt: new Date(layout.createdAt),
          updatedAt: new Date(layout.updatedAt),
        }));

        // Validate each layout
        return layouts.map((layout: unknown) =>
          validateStorageData(UserLayoutSchema, layout, `layouts_${userId}`)
        );
      } catch (error) {
        console.error('Failed to load layouts from localStorage:', error);
        return [this.getDefaultLayout(userId)];
      }
    }

    // TODO: Load from API in production
    // const response = await fetch(`/api/layouts?userId=${userId}`);
    // return await response.json();

    return [this.getDefaultLayout(userId)];
  }

  /**
   * Save layout
   */
  async saveLayout(userId: string, layout: Partial<UserLayout>): Promise<UserLayout> {
    const existing = this.layouts.get(userId) || this.getDefaultLayout(userId);

    const updatedLayout: UserLayout = {
      ...existing,
      ...layout,
      userId,
      updatedAt: new Date(),
    };

    this.layouts.set(userId, updatedLayout);

    // Save to localStorage (migration path)
    if (typeof window !== 'undefined') {
      const allLayouts = await this.loadLayouts(userId);
      const layoutIndex = allLayouts.findIndex((l) => l.layoutId === updatedLayout.layoutId);

      if (layoutIndex >= 0) {
        allLayouts[layoutIndex] = updatedLayout;
      } else {
        allLayouts.push(updatedLayout);
      }

      localStorage.setItem(`layouts_${userId}`, JSON.stringify(allLayouts));
    }

    // TODO: Save to API in production
    // await fetch('/api/layouts', {
    //   method: 'POST',
    //   body: JSON.stringify(updatedLayout),
    // });

    return updatedLayout;
  }

  /**
   * Get active layout
   */
  getActiveLayout(userId: string): UserLayout | null {
    return this.layouts.get(userId) || null;
  }

  /**
   * Set active layout
   */
  setActiveLayout(userId: string, layoutId: string): void {
    this.activeLayoutId = layoutId;
  }

  /**
   * Delete layout
   */
  async deleteLayout(userId: string, layoutId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      const allLayouts = await this.loadLayouts(userId);
      const filtered = allLayouts.filter((l) => l.layoutId !== layoutId);
      localStorage.setItem(`layouts_${userId}`, JSON.stringify(filtered));
    }

    this.layouts.delete(userId);

    // TODO: Delete from API
    // await fetch(`/api/layouts/${layoutId}`, { method: 'DELETE' });
  }

  /**
   * Create new layout from current state
   */
  async createLayout(userId: string, name: string, state: Partial<UserLayout>): Promise<UserLayout> {
    const newLayout: UserLayout = {
      ...this.getDefaultLayout(userId),
      ...state,
      layoutId: `layout_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.saveLayout(userId, newLayout);
  }

  /**
   * Export layout to JSON
   */
  exportLayout(userId: string): string {
    const layout = this.getActiveLayout(userId);
    if (!layout) return JSON.stringify({ error: 'No active layout' });

    return JSON.stringify(layout, null, 2);
  }

  /**
   * Import layout from JSON
   */
  async importLayout(userId: string, jsonData: string): Promise<UserLayout> {
    const imported = JSON.parse(jsonData);
    return await this.saveLayout(userId, {
      ...imported,
      userId, // Ensure correct user
      layoutId: `layout_${Date.now()}`, // Generate new ID
    });
  }
}

export const LayoutManager = new LayoutManagerClass();
