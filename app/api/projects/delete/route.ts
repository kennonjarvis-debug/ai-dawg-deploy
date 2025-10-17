import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * DELETE /api/projects/delete
 *
 * Soft deletes a project (sets isArchived = true)
 * Use hardDelete=true to permanently delete
 *
 * Request body:
 * {
 *   projectId: string;
 *   hardDelete?: boolean; // Default: false
 * }
 */

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const body = await request.json();
    const { projectId, hardDelete = false } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Verify project belongs to authenticated user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Permanently delete project and all related data
      await prisma.project.delete({
        where: { id: projectId },
      });

      return NextResponse.json({
        success: true,
        message: 'Project permanently deleted',
      });
    } else {
      // Soft delete (archive)
      await prisma.project.update({
        where: { id: projectId },
        data: { isArchived: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Project archived',
      });
    }
  } catch (error: any) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
