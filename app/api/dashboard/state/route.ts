/**
 * Dashboard State API
 * Instance 4 (Data & Storage - Karen)
 *
 * GET  /api/dashboard/state?dashboardId=projects - Get dashboard state
 * POST /api/dashboard/state - Update dashboard state (optimistic updates)
 * DELETE /api/dashboard/state?dashboardId=projects - Reset dashboard state
 *
 * Supports resume-where-you-left-off functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getDefaultProjectsState,
  getDefaultRecordingsState,
  getDefaultJourneysState,
  getDefaultAnalyticsState,
  isProjectsState,
  isRecordingsState,
  isJourneysState,
  isAnalyticsState,
  type DashboardState,
} from '@/lib/types/dashboard-state';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get default state for dashboard
 */
function getDefaultState(userId: string, dashboardId: string): DashboardState {
  switch (dashboardId) {
    case 'projects':
      return getDefaultProjectsState(userId);
    case 'recordings':
      return getDefaultRecordingsState(userId);
    case 'journeys':
      return getDefaultJourneysState(userId);
    case 'analytics':
      return getDefaultAnalyticsState(userId);
    default:
      throw new Error(`Unknown dashboard ID: ${dashboardId}`);
  }
}

/**
 * GET /api/dashboard/state?dashboardId=projects
 * Retrieve dashboard state for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to access dashboard state' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboardId');

    if (!dashboardId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'dashboardId query parameter required' },
        { status: 400 }
      );
    }

    // Get state from database or create default
    let dbState = await prisma.dashboardState.findUnique({
      where: {
        userId_dashboardId: { userId, dashboardId },
      },
    });

    if (!dbState) {
      const defaults = getDefaultState(userId, dashboardId);

      // Use type guards for type-safe field extraction
      if (isProjectsState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            viewMode: defaults.viewMode,
            sortBy: defaults.sortBy,
            sortOrder: defaults.sortOrder,
            filters: defaults.filters,
            searchQuery: defaults.filters.searchQuery,
            page: defaults.page,
            pageSize: defaults.pageSize,
            selectedIds: defaults.selectedProjectIds,
          },
        });
      } else if (isRecordingsState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            viewMode: defaults.viewMode,
            sortBy: defaults.sortBy,
            sortOrder: defaults.sortOrder,
            filters: defaults.filters,
            searchQuery: defaults.filters.searchQuery,
            page: defaults.page,
            pageSize: defaults.pageSize,
            selectedIds: defaults.selectedRecordingIds,
          },
        });
      } else if (isJourneysState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            viewMode: defaults.viewMode,
            sortBy: defaults.sortBy,
            sortOrder: defaults.sortOrder,
            filters: defaults.filters,
            searchQuery: defaults.filters.searchQuery,
            page: defaults.page,
            pageSize: defaults.pageSize,
            selectedIds: [],
          },
        });
      } else if (isAnalyticsState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            sortBy: '',
            sortOrder: 'desc',
            filters: {
              dateRange: defaults.dateRange,
              selectedMetrics: defaults.selectedMetrics,
            },
            selectedIds: [],
          },
        });
      } else {
        throw new Error(`Unknown dashboard type: ${dashboardId}`);
      }
    }

    // Update lastAccessed in background
    prisma.dashboardState
      .update({
        where: { userId_dashboardId: { userId, dashboardId } },
        data: { lastAccessed: new Date() },
      })
      .catch((err) => console.error('[API] Failed to update lastAccessed:', err));

    // Convert to DashboardState type - use type guards for proper mapping
    let state: DashboardState;

    if (dashboardId === 'projects') {
      state = {
        dashboardId: 'projects',
        userId: dbState.userId,
        lastAccessed: dbState.lastAccessed.toISOString(),
        lastModified: dbState.lastModified.toISOString(),
        viewMode: (dbState.viewMode as any) || 'grid',
        sortBy: (dbState.sortBy as any) || 'modified',
        sortOrder: (dbState.sortOrder as any) || 'desc',
        filters: (dbState.filters as any) || {},
        page: dbState.page || 1,
        pageSize: dbState.pageSize || 20,
        selectedProjectIds: (dbState.selectedIds as any) || [],
        expandedGroups: [],
      };
    } else if (dashboardId === 'recordings') {
      state = {
        dashboardId: 'recordings',
        userId: dbState.userId,
        lastAccessed: dbState.lastAccessed.toISOString(),
        lastModified: dbState.lastModified.toISOString(),
        viewMode: (dbState.viewMode as any) || 'grid',
        sortBy: (dbState.sortBy as any) || 'date',
        sortOrder: (dbState.sortOrder as any) || 'desc',
        filters: (dbState.filters as any) || {},
        page: dbState.page || 1,
        pageSize: dbState.pageSize || 30,
        selectedRecordingIds: (dbState.selectedIds as any) || [],
        playbackPosition: 0,
      };
    } else if (dashboardId === 'journeys') {
      state = {
        dashboardId: 'journeys',
        userId: dbState.userId,
        lastAccessed: dbState.lastAccessed.toISOString(),
        lastModified: dbState.lastModified.toISOString(),
        viewMode: (dbState.viewMode as any) || 'list',
        sortBy: (dbState.sortBy as any) || 'modified',
        sortOrder: (dbState.sortOrder as any) || 'desc',
        filters: (dbState.filters as any) || {},
        page: dbState.page || 1,
        pageSize: dbState.pageSize || 20,
      };
    } else {
      // Analytics
      state = {
        dashboardId: 'analytics',
        userId: dbState.userId,
        lastAccessed: dbState.lastAccessed.toISOString(),
        lastModified: dbState.lastModified.toISOString(),
        dateRange: ((dbState.filters as any)?.dateRange) || { preset: 'month' },
        timeGranularity: 'day',
        selectedMetrics: ((dbState.filters as any)?.selectedMetrics) || ['pitch_accuracy', 'session_duration'],
        chartTypes: {},
        comparisonEnabled: false,
      };
    }

    return NextResponse.json({
      success: true,
      data: state,
      message: 'Dashboard state retrieved successfully',
    });
  } catch (error) {
    console.error('[API] /api/dashboard/state GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve dashboard state',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/state
 * Update dashboard state with optimistic updates support
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to update dashboard state' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const body = await request.json();

    const { dashboardId, updates } = body;

    if (!dashboardId || !updates) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'dashboardId and updates required' },
        { status: 400 }
      );
    }

    // Get existing state or create default
    let dbState = await prisma.dashboardState.findUnique({
      where: {
        userId_dashboardId: { userId, dashboardId },
      },
    });

    if (!dbState) {
      const defaults = getDefaultState(userId, dashboardId);

      // Use type guards for type-safe field extraction (same as GET)
      if (isProjectsState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            viewMode: defaults.viewMode,
            sortBy: defaults.sortBy,
            sortOrder: defaults.sortOrder,
            filters: defaults.filters,
            searchQuery: defaults.filters.searchQuery,
            page: defaults.page,
            pageSize: defaults.pageSize,
            selectedIds: defaults.selectedProjectIds,
          },
        });
      } else if (isRecordingsState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            viewMode: defaults.viewMode,
            sortBy: defaults.sortBy,
            sortOrder: defaults.sortOrder,
            filters: defaults.filters,
            searchQuery: defaults.filters.searchQuery,
            page: defaults.page,
            pageSize: defaults.pageSize,
            selectedIds: defaults.selectedRecordingIds,
          },
        });
      } else if (isJourneysState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            viewMode: defaults.viewMode,
            sortBy: defaults.sortBy,
            sortOrder: defaults.sortOrder,
            filters: defaults.filters,
            searchQuery: defaults.filters.searchQuery,
            page: defaults.page,
            pageSize: defaults.pageSize,
            selectedIds: [],
          },
        });
      } else if (isAnalyticsState(defaults)) {
        dbState = await prisma.dashboardState.create({
          data: {
            userId,
            dashboardId: defaults.dashboardId,
            sortBy: '',
            sortOrder: 'desc',
            filters: {
              dateRange: defaults.dateRange,
              selectedMetrics: defaults.selectedMetrics,
            },
            selectedIds: [],
          },
        });
      } else {
        throw new Error(`Unknown dashboard type: ${dashboardId}`);
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (updates.viewMode !== undefined) updateData.viewMode = updates.viewMode;
    if (updates.sortBy !== undefined) updateData.sortBy = updates.sortBy;
    if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;
    if (updates.searchQuery !== undefined) updateData.searchQuery = updates.searchQuery;
    if (updates.page !== undefined) updateData.page = updates.page;
    if (updates.pageSize !== undefined) updateData.pageSize = updates.pageSize;
    if (updates.selectedIds !== undefined) updateData.selectedIds = updates.selectedIds;

    // Handle nested filters (deep merge)
    if (updates.filters && typeof updates.filters === 'object') {
      updateData.filters = {
        ...(dbState.filters as any),
        ...updates.filters,
      };
    }

    // Update in database
    const updated = await prisma.dashboardState.update({
      where: { userId_dashboardId: { userId, dashboardId } },
      data: updateData,
    });

    // Convert to DashboardState type - use type guards for proper mapping (same as GET)
    let updatedState: DashboardState;

    if (dashboardId === 'projects') {
      updatedState = {
        dashboardId: 'projects',
        userId: updated.userId,
        lastAccessed: updated.lastAccessed.toISOString(),
        lastModified: updated.lastModified.toISOString(),
        viewMode: (updated.viewMode as any) || 'grid',
        sortBy: (updated.sortBy as any) || 'modified',
        sortOrder: (updated.sortOrder as any) || 'desc',
        filters: (updated.filters as any) || {},
        page: updated.page || 1,
        pageSize: updated.pageSize || 20,
        selectedProjectIds: (updated.selectedIds as any) || [],
        expandedGroups: [],
      };
    } else if (dashboardId === 'recordings') {
      updatedState = {
        dashboardId: 'recordings',
        userId: updated.userId,
        lastAccessed: updated.lastAccessed.toISOString(),
        lastModified: updated.lastModified.toISOString(),
        viewMode: (updated.viewMode as any) || 'grid',
        sortBy: (updated.sortBy as any) || 'date',
        sortOrder: (updated.sortOrder as any) || 'desc',
        filters: (updated.filters as any) || {},
        page: updated.page || 1,
        pageSize: updated.pageSize || 30,
        selectedRecordingIds: (updated.selectedIds as any) || [],
        playbackPosition: 0,
      };
    } else if (dashboardId === 'journeys') {
      updatedState = {
        dashboardId: 'journeys',
        userId: updated.userId,
        lastAccessed: updated.lastAccessed.toISOString(),
        lastModified: updated.lastModified.toISOString(),
        viewMode: (updated.viewMode as any) || 'list',
        sortBy: (updated.sortBy as any) || 'modified',
        sortOrder: (updated.sortOrder as any) || 'desc',
        filters: (updated.filters as any) || {},
        page: updated.page || 1,
        pageSize: updated.pageSize || 20,
      };
    } else {
      // Analytics
      updatedState = {
        dashboardId: 'analytics',
        userId: updated.userId,
        lastAccessed: updated.lastAccessed.toISOString(),
        lastModified: updated.lastModified.toISOString(),
        dateRange: ((updated.filters as any)?.dateRange) || { preset: 'month' },
        timeGranularity: 'day',
        selectedMetrics: ((updated.filters as any)?.selectedMetrics) || ['pitch_accuracy', 'session_duration'],
        chartTypes: {},
        comparisonEnabled: false,
      };
    }

    // TODO: Publish dashboard state update event to event bus

    return NextResponse.json({
      success: true,
      data: updatedState,
      message: 'Dashboard state updated successfully',
    });
  } catch (error) {
    console.error('[API] /api/dashboard/state POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update dashboard state',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/state?dashboardId=projects
 * Reset dashboard state to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to reset dashboard state' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboardId');

    if (!dashboardId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'dashboardId query parameter required' },
        { status: 400 }
      );
    }

    // Reset to defaults in database - use type guards for type-safe field extraction
    const defaults = getDefaultState(userId, dashboardId);
    let resetData: any;

    if (isProjectsState(defaults)) {
      resetData = {
        userId,
        dashboardId: defaults.dashboardId,
        viewMode: defaults.viewMode,
        sortBy: defaults.sortBy,
        sortOrder: defaults.sortOrder,
        filters: defaults.filters,
        searchQuery: defaults.filters.searchQuery,
        page: defaults.page,
        pageSize: defaults.pageSize,
        selectedIds: defaults.selectedProjectIds,
      };
    } else if (isRecordingsState(defaults)) {
      resetData = {
        userId,
        dashboardId: defaults.dashboardId,
        viewMode: defaults.viewMode,
        sortBy: defaults.sortBy,
        sortOrder: defaults.sortOrder,
        filters: defaults.filters,
        searchQuery: defaults.filters.searchQuery,
        page: defaults.page,
        pageSize: defaults.pageSize,
        selectedIds: defaults.selectedRecordingIds,
      };
    } else if (isJourneysState(defaults)) {
      resetData = {
        userId,
        dashboardId: defaults.dashboardId,
        viewMode: defaults.viewMode,
        sortBy: defaults.sortBy,
        sortOrder: defaults.sortOrder,
        filters: defaults.filters,
        searchQuery: defaults.filters.searchQuery,
        page: defaults.page,
        pageSize: defaults.pageSize,
        selectedIds: [],
      };
    } else if (isAnalyticsState(defaults)) {
      resetData = {
        userId,
        dashboardId: defaults.dashboardId,
        sortBy: '',
        sortOrder: 'desc',
        filters: {
          dateRange: defaults.dateRange,
          selectedMetrics: defaults.selectedMetrics,
        },
        selectedIds: [],
      };
    } else {
      throw new Error(`Unknown dashboard type: ${dashboardId}`);
    }

    const resetState = await prisma.dashboardState.upsert({
      where: {
        userId_dashboardId: { userId, dashboardId },
      },
      create: resetData,
      update: resetData,
    });

    // Convert to DashboardState type - use type guards for proper mapping (same as GET/POST)
    let resetDashboardState: DashboardState;

    if (dashboardId === 'projects') {
      resetDashboardState = {
        dashboardId: 'projects',
        userId: resetState.userId,
        lastAccessed: resetState.lastAccessed.toISOString(),
        lastModified: resetState.lastModified.toISOString(),
        viewMode: (resetState.viewMode as any) || 'grid',
        sortBy: (resetState.sortBy as any) || 'modified',
        sortOrder: (resetState.sortOrder as any) || 'desc',
        filters: (resetState.filters as any) || {},
        page: resetState.page || 1,
        pageSize: resetState.pageSize || 20,
        selectedProjectIds: (resetState.selectedIds as any) || [],
        expandedGroups: [],
      };
    } else if (dashboardId === 'recordings') {
      resetDashboardState = {
        dashboardId: 'recordings',
        userId: resetState.userId,
        lastAccessed: resetState.lastAccessed.toISOString(),
        lastModified: resetState.lastModified.toISOString(),
        viewMode: (resetState.viewMode as any) || 'grid',
        sortBy: (resetState.sortBy as any) || 'date',
        sortOrder: (resetState.sortOrder as any) || 'desc',
        filters: (resetState.filters as any) || {},
        page: resetState.page || 1,
        pageSize: resetState.pageSize || 30,
        selectedRecordingIds: (resetState.selectedIds as any) || [],
        playbackPosition: 0,
      };
    } else if (dashboardId === 'journeys') {
      resetDashboardState = {
        dashboardId: 'journeys',
        userId: resetState.userId,
        lastAccessed: resetState.lastAccessed.toISOString(),
        lastModified: resetState.lastModified.toISOString(),
        viewMode: (resetState.viewMode as any) || 'list',
        sortBy: (resetState.sortBy as any) || 'modified',
        sortOrder: (resetState.sortOrder as any) || 'desc',
        filters: (resetState.filters as any) || {},
        page: resetState.page || 1,
        pageSize: resetState.pageSize || 20,
      };
    } else {
      // Analytics
      resetDashboardState = {
        dashboardId: 'analytics',
        userId: resetState.userId,
        lastAccessed: resetState.lastAccessed.toISOString(),
        lastModified: resetState.lastModified.toISOString(),
        dateRange: ((resetState.filters as any)?.dateRange) || { preset: 'month' },
        timeGranularity: 'day',
        selectedMetrics: ((resetState.filters as any)?.selectedMetrics) || ['pitch_accuracy', 'session_duration'],
        chartTypes: {},
        comparisonEnabled: false,
      };
    }

    return NextResponse.json({
      success: true,
      data: resetDashboardState,
      message: 'Dashboard state reset to defaults',
    });
  } catch (error) {
    console.error('[API] /api/dashboard/state DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to reset dashboard state',
      },
      { status: 500 }
    );
  }
}
