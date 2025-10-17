/**
 * User Profile API
 * Instance 4 (Data & Storage - Karen)
 *
 * GET  /api/user/profile - Get current user's profile
 * POST /api/user/profile - Update user's profile
 * DELETE /api/user/profile - Request profile deletion (GDPR)
 *
 * GDPR compliant: Right to access, rectification, erasure, data portability
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  UserProfileUpdateSchema,
  getDefaultUserProfileUI,
  validateDisplayName,
  validateBio,
  type UserProfileUI,
  type UserProfileUpdate,
} from '@/lib/types/user-profile-ui';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate anonymous user hash
 */
function generateUserHash(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return `usr_${hash.substring(0, 16)}`;
}

/**
 * GET /api/user/profile
 * Retrieve current user's profile
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to access profile' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const userHash = generateUserHash(userId);

    // Get profile from database or create default
    let dbProfile = await prisma.userProfileUI.findUnique({
      where: { userId },
    });

    if (!dbProfile) {
      // Create default profile
      const defaults = getDefaultUserProfileUI(userId, userHash);

      // Pre-populate from session if available
      const displayName = session.user.name || defaults.displayName;
      const avatarUrl = session.user.image || undefined;

      dbProfile = await prisma.userProfileUI.create({
        data: {
          userId,
          userHash,
          displayName,
          avatarUrl,
          visibility: defaults.visibility as any,
          socialLinks: [],
          dataProcessingConsent: false,
          marketingConsent: false,
        },
      });
    }

    // Convert DB record to UserProfileUI type
    const profile: UserProfileUI = {
      userId: dbProfile.userId,
      userHash: dbProfile.userHash,
      displayName: dbProfile.displayName || undefined,
      realName: dbProfile.realName || undefined,
      bio: dbProfile.bio || undefined,
      location: dbProfile.location || undefined,
      timezone: dbProfile.timezone || undefined,
      avatar: dbProfile.avatarUrl
        ? {
            url: dbProfile.avatarUrl,
            thumbnailUrl: dbProfile.thumbnailUrl || undefined,
            uploadedAt: dbProfile.createdAt.toISOString(),
            size: 0,
            mimeType: 'image/jpeg',
          }
        : undefined,
      socialLinks: (dbProfile.socialLinks as any) || [],
      achievements: [], // TODO: Load from database when achievements system is implemented
      visibility: (dbProfile.visibility as any) || {},
      dataProcessingConsent: dbProfile.dataProcessingConsent,
      marketingConsent: dbProfile.marketingConsent,
      createdAt: dbProfile.createdAt.toISOString(),
      updatedAt: dbProfile.updatedAt.toISOString(),
      lastActive: new Date().toISOString(),
    };

    // Update lastActive timestamp in background (don't await)
    prisma.userProfileUI
      .update({
        where: { userId },
        data: { updatedAt: new Date() },
      })
      .catch((err) => console.error('[API] Failed to update lastActive:', err));

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    console.error('[API] /api/user/profile GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve profile',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Update current user's profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to update profile' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const body = await request.json();

    // Validate update request
    const updateResult = UserProfileUpdateSchema.safeParse(body);

    if (!updateResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid profile update data',
          details: updateResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updates: UserProfileUpdate = updateResult.data;

    // Additional validation
    if (updates.displayName) {
      const nameValidation = validateDisplayName(updates.displayName);
      if (!nameValidation.valid) {
        return NextResponse.json(
          { error: 'Validation Error', message: nameValidation.error },
          { status: 400 }
        );
      }
    }

    if (updates.bio) {
      const bioValidation = validateBio(updates.bio);
      if (!bioValidation.valid) {
        return NextResponse.json(
          { error: 'Validation Error', message: bioValidation.error },
          { status: 400 }
        );
      }
    }

    const userHash = generateUserHash(userId);

    // Get existing profile from database or create default
    let dbProfile = await prisma.userProfileUI.findUnique({
      where: { userId },
    });

    if (!dbProfile) {
      const defaults = getDefaultUserProfileUI(userId, userHash);
      dbProfile = await prisma.userProfileUI.create({
        data: {
          userId,
          userHash,
          visibility: defaults.visibility as any,
          socialLinks: [],
          dataProcessingConsent: false,
          marketingConsent: false,
        },
      });
    }

    // Prepare update data (only include changed fields)
    const updateData: any = {};

    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.realName !== undefined) updateData.realName = updates.realName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
    if (updates.dataProcessingConsent !== undefined) updateData.dataProcessingConsent = updates.dataProcessingConsent;
    if (updates.marketingConsent !== undefined) updateData.marketingConsent = updates.marketingConsent;

    if (updates.visibility) {
      updateData.visibility = { ...(dbProfile.visibility as any), ...updates.visibility };
    }
    if (updates.socialLinks) {
      updateData.socialLinks = updates.socialLinks;
    }

    // Update in database
    const updated = await prisma.userProfileUI.update({
      where: { userId },
      data: updateData,
    });

    // Convert to UserProfileUI type
    const updatedProfile: UserProfileUI = {
      userId: updated.userId,
      userHash: updated.userHash,
      displayName: updated.displayName || undefined,
      realName: updated.realName || undefined,
      bio: updated.bio || undefined,
      location: updated.location || undefined,
      timezone: updated.timezone || undefined,
      avatar: updated.avatarUrl
        ? {
            url: updated.avatarUrl,
            thumbnailUrl: updated.thumbnailUrl || undefined,
            uploadedAt: updated.createdAt.toISOString(),
            size: 0,
            mimeType: 'image/jpeg',
          }
        : undefined,
      socialLinks: (updated.socialLinks as any) || [],
      achievements: [], // TODO: Load from database when achievements system is implemented
      visibility: (updated.visibility as any) || {},
      dataProcessingConsent: updated.dataProcessingConsent,
      marketingConsent: updated.marketingConsent,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastActive: new Date().toISOString(),
    };

    // TODO: Publish profile update event to event bus
    // TODO: Update search index if visibility.searchable === true

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[API] /api/user/profile POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/profile
 * Request profile deletion (GDPR right to erasure)
 * Initiates 30-day grace period before permanent deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to delete profile' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const body = await request.json().catch(() => ({}));

    const { reason } = body;

    // Calculate 30-day grace period
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 30);

    // Create deletion request in database
    const deletionRequest = await prisma.profileDeletionRequest.create({
      data: {
        userId,
        scheduledFor,
        reason: reason || undefined,
        status: 'pending',
      },
    });

    // TODO: Send confirmation email to user
    // TODO: Schedule deletion job for scheduledFor date
    // TODO: Publish deletion request event to event bus

    console.log('[API] Profile deletion requested:', {
      userId,
      requestId: deletionRequest.id,
      scheduledFor: deletionRequest.scheduledFor.toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId: deletionRequest.id,
        scheduledFor: deletionRequest.scheduledFor.toISOString(),
        status: deletionRequest.status,
      },
      message: 'Deletion request submitted. You have 30 days to cancel.',
    });
  } catch (error) {
    console.error('[API] /api/user/profile DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to process deletion request',
      },
      { status: 500 }
    );
  }
}
