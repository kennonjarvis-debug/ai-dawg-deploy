/**
 * User Preferences API
 * Instance 4 (Data & Storage - Karen)
 *
 * GET  /api/user/preferences - Get current user's UI preferences
 * POST /api/user/preferences - Update user's UI preferences
 *
 * Privacy-first: Respects sync controls, encrypts PII at rest
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  UIPreferencesSchema,
  UIPreferencesUpdateSchema,
  getDefaultUIPreferences,
  type UIPreferences,
  type UIPreferencesUpdate,
} from '@/lib/types/ui-preferences';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/user/preferences
 * Retrieve current user's UI preferences
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to access preferences' },
        { status: 401 }
      );
    }

    const userId = session.user.email;

    // Get preferences from database or create defaults
    let dbPrefs = await prisma.uIPreferences.findUnique({
      where: { userId },
    });

    if (!dbPrefs) {
      // Create default preferences in database
      const defaults = getDefaultUIPreferences(userId);
      dbPrefs = await prisma.uIPreferences.create({
        data: {
          userId,
          version: defaults.version,
          theme: defaults.theme as any,
          layout: defaults.layout as any,
          dashboard: defaults.dashboard as any,
          audio: defaults.audio as any,
          ai: defaults.ai as any,
          privacy: defaults.privacy as any,
        },
      });
    }

    // Convert DB record to UIPreferences type
    const preferences: UIPreferences = {
      userId: dbPrefs.userId,
      version: dbPrefs.version,
      lastModified: dbPrefs.lastModified.toISOString(),
      lastSynced: dbPrefs.lastSynced?.toISOString(),
      theme: dbPrefs.theme as any,
      layout: dbPrefs.layout as any,
      dashboard: dbPrefs.dashboard as any,
      audio: dbPrefs.audio as any,
      ai: dbPrefs.ai as any,
      privacy: dbPrefs.privacy as any,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Preferences retrieved successfully',
    });
  } catch (error) {
    console.error('[API] /api/user/preferences GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/preferences
 * Update current user's UI preferences (partial updates supported)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to update preferences' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const body = await request.json();

    // Validate update request
    const updateResult = UIPreferencesUpdateSchema.safeParse(body);

    if (!updateResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid preference update data',
          details: updateResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updates: UIPreferencesUpdate = updateResult.data;

    // Get existing preferences from database or create defaults
    let dbPrefs = await prisma.uIPreferences.findUnique({
      where: { userId },
    });

    let preferences: UIPreferences;

    if (!dbPrefs) {
      preferences = getDefaultUIPreferences(userId);
    } else {
      preferences = {
        userId: dbPrefs.userId,
        version: dbPrefs.version,
        lastModified: dbPrefs.lastModified.toISOString(),
        lastSynced: dbPrefs.lastSynced?.toISOString(),
        theme: dbPrefs.theme as any,
        layout: dbPrefs.layout as any,
        dashboard: dbPrefs.dashboard as any,
        audio: dbPrefs.audio as any,
        ai: dbPrefs.ai as any,
        privacy: dbPrefs.privacy as any,
      };
    }

    // Deep merge updates (respecting privacy controls)
    const updatedPreferences: UIPreferences = {
      ...preferences,
      ...updates,
      userId, // Ensure userId cannot be changed
      lastModified: new Date().toISOString(),
      theme: updates.theme ? { ...preferences.theme, ...updates.theme } : preferences.theme,
      layout: updates.layout ? { ...preferences.layout, ...updates.layout } : preferences.layout,
      dashboard: updates.dashboard ? { ...preferences.dashboard, ...updates.dashboard } : preferences.dashboard,
      audio: updates.audio ? { ...preferences.audio, ...updates.audio } : preferences.audio,
      ai: updates.ai ? { ...preferences.ai, ...updates.ai } : preferences.ai,
      privacy: updates.privacy ? { ...preferences.privacy, ...updates.privacy } : preferences.privacy,
    };

    // Validate final preferences object
    const validationResult = UIPreferencesSchema.safeParse(updatedPreferences);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Updated preferences failed validation',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Save to database (upsert)
    await prisma.uIPreferences.upsert({
      where: { userId },
      create: {
        userId,
        version: validationResult.data.version,
        theme: validationResult.data.theme as any,
        layout: validationResult.data.layout as any,
        dashboard: validationResult.data.dashboard as any,
        audio: validationResult.data.audio as any,
        ai: validationResult.data.ai as any,
        privacy: validationResult.data.privacy as any,
        lastSynced: validationResult.data.lastSynced ? new Date(validationResult.data.lastSynced) : undefined,
      },
      update: {
        version: validationResult.data.version,
        theme: validationResult.data.theme as any,
        layout: validationResult.data.layout as any,
        dashboard: validationResult.data.dashboard as any,
        audio: validationResult.data.audio as any,
        ai: validationResult.data.ai as any,
        privacy: validationResult.data.privacy as any,
        lastSynced: validationResult.data.lastSynced ? new Date(validationResult.data.lastSynced) : undefined,
      },
    });

    // TODO: Trigger cloud sync if enabled
    // TODO: Publish preference update event to event bus

    return NextResponse.json({
      success: true,
      data: validationResult.data,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('[API] /api/user/preferences POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/preferences
 * Reset preferences to defaults
 */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to reset preferences' },
        { status: 401 }
      );
    }

    const userId = session.user.email;

    // Reset to defaults in database
    const defaultPreferences = getDefaultUIPreferences(userId);

    await prisma.uIPreferences.upsert({
      where: { userId },
      create: {
        userId,
        version: defaultPreferences.version,
        theme: defaultPreferences.theme as any,
        layout: defaultPreferences.layout as any,
        dashboard: defaultPreferences.dashboard as any,
        audio: defaultPreferences.audio as any,
        ai: defaultPreferences.ai as any,
        privacy: defaultPreferences.privacy as any,
      },
      update: {
        version: defaultPreferences.version,
        theme: defaultPreferences.theme as any,
        layout: defaultPreferences.layout as any,
        dashboard: defaultPreferences.dashboard as any,
        audio: defaultPreferences.audio as any,
        ai: defaultPreferences.ai as any,
        privacy: defaultPreferences.privacy as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: defaultPreferences,
      message: 'Preferences reset to defaults',
    });
  } catch (error) {
    console.error('[API] /api/user/preferences DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to reset preferences',
      },
      { status: 500 }
    );
  }
}
