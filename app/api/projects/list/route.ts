import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/projects/list
 *
 * Lists all projects for the authenticated user
 *
 * Query parameters:
 * - includeArchived: Optional - Include archived projects (default: false)
 * - limit: Optional - Max number of results (default: 50)
 * - offset: Optional - Pagination offset (default: 0)
 */

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const projects = await prisma.project.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { lastOpenedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    const total = await prisma.project.count({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
    });

    return NextResponse.json({
      success: true,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        bpm: p.bpm,
        genre: p.genre,
        key: p.key,
        isArchived: p.isArchived,
        trackCount: p._count.tracks,
        lastOpenedAt: p.lastOpenedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('List projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list projects' },
      { status: 500 }
    );
  }
}
