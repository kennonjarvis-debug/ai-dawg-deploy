import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/projects/save
 *
 * Saves or updates a project with all tracks and recordings
 *
 * Request body:
 * {
 *   userId: string;           // User ID (from auth session)
 *   project: {
 *     id?: string;            // Omit for new project
 *     name: string;
 *     bpm?: number;
 *     genre?: string;
 *     key?: string;
 *     settings?: object;
 *   };
 *   tracks: Array<{
 *     id?: string;            // Omit for new track
 *     name: string;
 *     position: number;
 *     volume: number;
 *     pan: number;
 *     isSolo: boolean;
 *     isMuted: boolean;
 *     inputDeviceId?: string;
 *     outputDeviceId?: string;
 *     effects?: object;
 *     recordings: Array<{
 *       id?: string;          // Omit for new recording
 *       audioUrl: string;     // S3 URL or temporary URL
 *       name?: string;
 *       duration: number;
 *       fileSize: number;
 *       format: string;
 *       sampleRate: number;
 *       startTime: number;
 *       waveformData?: object;
 *       isActive: boolean;
 *     }>;
 *   }>;
 * }
 */

interface SaveProjectRequest {
  userId: string;
  project: {
    id?: string;
    name: string;
    bpm?: number;
    genre?: string;
    key?: string;
    description?: string;
    settings?: any;
  };
  tracks: Array<{
    id?: string;
    name: string;
    position: number;
    volume: number;
    pan: number;
    isSolo: boolean;
    isMuted: boolean;
    isRecordArmed?: boolean;
    inputDeviceId?: string;
    outputDeviceId?: string;
    color?: string;
    effects?: any;
    recordings: Array<{
      id?: string;
      name?: string;
      audioUrl: string;
      duration: number;
      fileSize: number;
      format: string;
      sampleRate: number;
      startTime?: number;
      waveformData?: any;
      isActive: boolean;
      isMaster?: boolean;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const body: SaveProjectRequest = await request.json();
    const { project, tracks } = body;

    // Validate required fields
    if (!project || !project.name) {
      return NextResponse.json(
        { error: 'Missing required fields: project.name' },
        { status: 400 }
      );
    }

    // Upsert project (create if new, update if exists)
    const savedProject = await prisma.project.upsert({
      where: { id: project.id || 'new' },
      create: {
        userId,
        name: project.name,
        bpm: project.bpm || 120,
        genre: project.genre,
        key: project.key,
        description: project.description,
        settings: project.settings,
      },
      update: {
        name: project.name,
        bpm: project.bpm,
        genre: project.genre,
        key: project.key,
        description: project.description,
        settings: project.settings,
        lastOpenedAt: new Date(),
      },
    });

    // Delete tracks that are no longer in the project
    if (project.id) {
      const trackIds = tracks.filter(t => t.id).map(t => t.id!);
      await prisma.track.deleteMany({
        where: {
          projectId: savedProject.id,
          id: {
            notIn: trackIds.length > 0 ? trackIds : [''],
          },
        },
      });
    }

    // Save tracks and recordings
    const savedTracks = await Promise.all(
      tracks.map(async (track) => {
        const savedTrack = await prisma.track.upsert({
          where: { id: track.id || 'new' },
          create: {
            projectId: savedProject.id,
            name: track.name,
            position: track.position,
            volume: track.volume,
            pan: track.pan,
            isSolo: track.isSolo,
            isMuted: track.isMuted,
            isRecordArmed: track.isRecordArmed || false,
            inputDeviceId: track.inputDeviceId,
            outputDeviceId: track.outputDeviceId,
            color: track.color,
            effects: track.effects,
          },
          update: {
            name: track.name,
            position: track.position,
            volume: track.volume,
            pan: track.pan,
            isSolo: track.isSolo,
            isMuted: track.isMuted,
            isRecordArmed: track.isRecordArmed,
            inputDeviceId: track.inputDeviceId,
            outputDeviceId: track.outputDeviceId,
            color: track.color,
            effects: track.effects,
          },
        });

        // Delete recordings that are no longer in the track
        if (track.id) {
          const recordingIds = track.recordings.filter(r => r.id).map(r => r.id!);
          await prisma.recording.deleteMany({
            where: {
              trackId: savedTrack.id,
              id: {
                notIn: recordingIds.length > 0 ? recordingIds : [''],
              },
            },
          });
        }

        // Save recordings
        const savedRecordings = await Promise.all(
          track.recordings.map(async (recording) => {
            return await prisma.recording.upsert({
              where: { id: recording.id || 'new' },
              create: {
                trackId: savedTrack.id,
                name: recording.name,
                audioUrl: recording.audioUrl,
                duration: recording.duration,
                fileSize: recording.fileSize,
                format: recording.format,
                sampleRate: recording.sampleRate,
                startTime: recording.startTime || 0,
                waveformData: recording.waveformData,
                isActive: recording.isActive,
                isMaster: recording.isMaster || false,
              },
              update: {
                name: recording.name,
                audioUrl: recording.audioUrl,
                duration: recording.duration,
                fileSize: recording.fileSize,
                startTime: recording.startTime,
                waveformData: recording.waveformData,
                isActive: recording.isActive,
                isMaster: recording.isMaster,
              },
            });
          })
        );

        return {
          ...savedTrack,
          recordings: savedRecordings,
        };
      })
    );

    return NextResponse.json({
      success: true,
      project: {
        ...savedProject,
        tracks: savedTracks,
      },
    });
  } catch (error: any) {
    console.error('Save project error:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Project or track not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to save project' },
      { status: 500 }
    );
  }
}
