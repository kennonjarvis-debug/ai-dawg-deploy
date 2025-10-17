import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/projects/load?projectId=xxx
 * GET /api/projects/load?userId=xxx (loads most recent project)
 *
 * Loads a project with all tracks and recordings
 *
 * Query parameters:
 * - projectId: Load specific project by ID
 * - userId: Load most recent project for user
 */

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId: authUserId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let project;

    if (projectId) {
      // Load specific project (verify ownership)
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: authUserId,
        },
        include: {
          tracks: {
            orderBy: { position: 'asc' },
            include: {
              recordings: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      // Load most recent project for authenticated user
      project = await prisma.project.findFirst({
        where: {
          userId: authUserId,
          isArchived: false,
        },
        orderBy: { lastOpenedAt: 'desc' },
        include: {
          tracks: {
            orderBy: { position: 'asc' },
            include: {
              recordings: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'No projects found' },
          { status: 404 }
        );
      }
    }

    // Update lastOpenedAt
    await prisma.project.update({
      where: { id: project!.id },
      data: { lastOpenedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error('Load project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load project' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/load (alternative - for larger payloads)
 *
 * Request body:
 * {
 *   projectId?: string;
 *   userId?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId: authUserId } = await requireAuth();

    const body = await request.json();
    const { projectId } = body;

    let project;

    if (projectId) {
      // Load specific project (verify ownership)
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: authUserId,
        },
        include: {
          tracks: {
            orderBy: { position: 'asc' },
            include: {
              recordings: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });
    } else {
      // Load most recent project
      project = await prisma.project.findFirst({
        where: {
          userId: authUserId,
          isArchived: false,
        },
        orderBy: { lastOpenedAt: 'desc' },
        include: {
          tracks: {
            orderBy: { position: 'asc' },
            include: {
              recordings: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Update lastOpenedAt
    await prisma.project.update({
      where: { id: project.id },
      data: { lastOpenedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error('Load project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load project' },
      { status: 500 }
    );
  }
}
