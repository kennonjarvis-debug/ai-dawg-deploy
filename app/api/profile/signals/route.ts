/**
 * Profile Signals API - Get personalization signals (PII-safe)
 * For other agents to consume via events
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
    const signals = ProfileManager.getSignals(userId);

    if (!signals) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      signals,
      pii: false, // Contract: signals are always PII-safe
    });
  } catch (error: any) {
    console.error('Profile signals GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
