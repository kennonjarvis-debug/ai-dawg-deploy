/**
 * Profile Delete API - GDPR right to deletion
 * Removes all user data permanently
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfileManager } from '@/lib/profile/ProfileManager';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email;

    // Confirmation check
    const body = await request.json();
    const { confirmDelete } = body;

    if (confirmDelete !== 'DELETE_MY_DATA') {
      return NextResponse.json(
        { success: false, error: 'Confirmation required' },
        { status: 400 }
      );
    }

    await ProfileManager.deleteProfile(userId);

    return NextResponse.json({
      success: true,
      message: 'Profile deleted permanently',
    });
  } catch (error: any) {
    console.error('Profile delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
