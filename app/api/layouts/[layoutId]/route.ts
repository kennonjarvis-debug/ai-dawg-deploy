/**
 * Layout API - GET/DELETE specific layout
 * Instance 4 (Data & Storage) - Layout persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { LayoutManager } from '@/lib/layout/LayoutManager';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { layoutId } = await params;

    const layouts = await LayoutManager.loadLayouts(userId);
    const layout = layouts.find((l) => l.layoutId === layoutId);

    if (!layout) {
      return NextResponse.json(
        { success: false, error: 'Layout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      layout,
    });
  } catch (error: any) {
    console.error('Layout GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { layoutId } = await params;

    await LayoutManager.deleteLayout(userId, layoutId);

    return NextResponse.json({
      success: true,
      message: 'Layout deleted',
    });
  } catch (error: any) {
    console.error('Layout DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
