/**
 * Layout API - GET/POST user layouts
 * Instance 4 (Data & Storage) - Layout persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { LayoutManager } from '@/lib/layout/LayoutManager';
import {
  LayoutSaveRequestSchema,
  validateUserInput,
  UserLayoutSchema,
  validateApiResponse,
} from '@/lib/types';

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
    const layouts = await LayoutManager.loadLayouts(userId);

    return NextResponse.json({
      success: true,
      layouts,
    });
  } catch (error: any) {
    console.error('Layouts GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = session.user.email;

    // Validate input with centralized schema
    try {
      const validatedInput = validateUserInput(LayoutSaveRequestSchema, body, 'layout save');
      const layout = await LayoutManager.saveLayout(userId, validatedInput);

      // Validate output before sending to client
      const validatedLayout = validateApiResponse(UserLayoutSchema, layout, 'POST /api/layouts');

      return NextResponse.json({
        success: true,
        layout: validatedLayout,
      });
    } catch (validationError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationError.message,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Layouts POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
