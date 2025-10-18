/**
 * Voice Memo Upload API Route
 * Handles file upload and triggers the complete 10-stage pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Import backend services (we'll need to adjust paths based on your tsconfig)
// For now, we'll call the backend scripts directly

const TEMP_UPLOAD_DIR = '/tmp/dawg-ai-uploads';
const VOICE_MEMOS_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';

export async function POST(request: NextRequest) {
  try {
    // Ensure temp upload directory exists
    if (!existsSync(TEMP_UPLOAD_DIR)) {
      await mkdir(TEMP_UPLOAD_DIR, { recursive: true });
    }

    // Get the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav|mp4|webm)$/i)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: .mp3, .m4a, .wav, .mp4, .webm' },
        { status: 400 }
      );
    }

    // Validate file size (25MB max for Whisper API)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    // Save file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = join(TEMP_UPLOAD_DIR, `${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    console.log(`📁 File uploaded: ${tempFilePath} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Option 1: Copy to Voice Memos folder for auto-processing
    const voiceMemoPath = join(VOICE_MEMOS_PATH, file.name);

    try {
      // Copy file to Voice Memos folder
      await execAsync(`cp "${tempFilePath}" "${voiceMemoPath}"`);
      console.log(`📱 Copied to Voice Memos: ${voiceMemoPath}`);
    } catch (error) {
      console.warn('⚠️  Could not copy to Voice Memos folder:', error);
    }

    // Option 2: Trigger the pipeline directly using the backend script
    const runPipeline = formData.get('runPipeline') === 'true';
    let pipelineResult = null;

    if (runPipeline) {
      console.log('🚀 Starting voice memo pipeline...');

      try {
        // Run the single song processor
        const { stdout, stderr } = await execAsync(
          `cd /Users/benkennon/dawg-ai/apps/backend && npx tsx src/scripts/test-single-song.ts "${tempFilePath}"`,
          { timeout: 300000 } // 5 minute timeout
        );

        console.log('Pipeline output:', stdout);
        if (stderr) console.error('Pipeline stderr:', stderr);

        pipelineResult = {
          completed: true,
          output: stdout,
        };
      } catch (error: any) {
        console.error('Pipeline error:', error);
        pipelineResult = {
          completed: false,
          error: error.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        path: tempFilePath,
        voiceMemoPath: voiceMemoPath,
      },
      pipeline: pipelineResult,
      message: runPipeline
        ? 'File uploaded and pipeline started'
        : 'File uploaded successfully. Use the backend sync scripts to process.',
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check pipeline status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    pipeline: {
      stages: [
        'Voice Memo Input',
        'Audio Analysis',
        'Transcription (Whisper)',
        'Lyric Parsing (Claude)',
        'Song Completion (Claude)',
        'Vocal Separation (Demucs)',
        'Beat Generation (MusicGen)',
        'Mixing (FFmpeg)',
        'Mastering (FFmpeg)',
        'Apple Notes Sync',
      ],
      estimatedTime: '3-5 minutes',
      cost: '~$0.10 per song',
    },
    voiceMemosPath: VOICE_MEMOS_PATH,
    tempUploadPath: TEMP_UPLOAD_DIR,
  });
}
