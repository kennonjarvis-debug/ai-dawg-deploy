/**
 * Profile Export API - GDPR data export
 * Returns complete profile as JSON download
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfileManager } from '@/lib/profile/ProfileManager';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const profileJson = ProfileManager.exportProfile(userId);

    return new NextResponse(profileJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dawg-ai-profile-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Profile export GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
