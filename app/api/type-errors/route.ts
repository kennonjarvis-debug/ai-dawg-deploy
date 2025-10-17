import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Run type-check and capture output
    const { stdout, stderr } = await execAsync('npm run type-check 2>&1', {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    const output = stdout + stderr;

    // Parse errors
    const errorLines = output.split('\n').filter(line => line.includes('error TS'));
    const totalErrors = errorLines.length;

    // Count errors by file
    const errorsByFile: { [key: string]: number } = {};
    errorLines.forEach(line => {
      const match = line.match(/^(.+?)\(/);
      if (match && match[1]) {
        const file = match[1].trim();
        errorsByFile[file] = (errorsByFile[file] || 0) + 1;
      }
    });

    // Sort files by error count
    const sortedFiles = Object.entries(errorsByFile)
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count);

    // Categorize errors
    const criticalFiles = [
      'packages/types/src/events.ts',
      'src/widgets/EffectsPanel/EffectsPanel.tsx',
      'components/layout/transport-bar.tsx',
      'src/widgets/PianoRoll/PianoRoll.tsx',
      'app/journey/page.tsx',
      'app/api/voice/clone/route.ts',
      'app/page.tsx',
      'src/utils/pitchDetection.ts',
      'INTEGRATION_EXAMPLE.tsx',
      'app/api/chat-openai/route.ts',
      'app/api/profile/route.ts',
      'app/api/voice/harmony/route.ts',
      'lib/profile/ProfileManager.ts',
      'src/core/usePitchDetection.ts',
      'src/core/usePlayback.ts',
      'src/core/eventBus.ts',
      'src/utils/melodyAnalyzer.ts',
      'src/utils/widgetIntegration.ts',
      'src/voice/VoiceInterface.tsx',
      'src/widgets/TrackItem/TrackItem.tsx',
      'src/widgets/TrackItem/DeviceSelector.tsx',
      'src/widgets/WaveformDisplay/WaveformDisplay.tsx',
      'src/widgets/MusicGenerator/MusicGenerator.tsx',
      'src/widgets/HarmonyGenerator/HarmonyGenerator.tsx',
      'src/widgets/AIFeedbackTimeline/AIFeedbackTimeline.tsx',
    ];

    let criticalErrors = 0;
    let nonCriticalErrors = 0;

    sortedFiles.forEach(({ file, count }) => {
      if (criticalFiles.some(cf => file.includes(cf))) {
        criticalErrors += count;
      } else {
        nonCriticalErrors += count;
      }
    });

    // Read task status from deps.json
    const depsPath = path.join(process.cwd(), '_bus', 'state', 'deps.json');
    let bucketStatus = {};
    try {
      const depsContent = await fs.readFile(depsPath, 'utf-8');
      const depsData = JSON.parse(depsContent);

      bucketStatus = {
        A: {
          errors: 26,
          status: depsData.tasks['T-STABILITY-A-UI-TYPES']?.status || 'blocked',
          owner: 'Alexis',
          instance: 1,
        },
        B: {
          errors: 17,
          status: depsData.tasks['T-STABILITY-B-AUDIO-TYPES']?.status || 'blocked',
          owner: 'Tom',
          instance: 2,
        },
        C: {
          errors: 11,
          status: depsData.tasks['T-STABILITY-C-DATA-TYPES']?.status || 'blocked',
          owner: 'Jerry',
          instance: 3,
        },
        D: {
          errors: 10,
          status: depsData.tasks['T-STABILITY-D-SHARED-TYPES']?.status || 'ready',
          owner: 'Karen',
          instance: 4,
        },
      };
    } catch (error) {
      console.error('Failed to read deps.json:', error);
    }

    // Calculate fixed errors
    const fixedErrors = Math.max(0, 58 - criticalErrors);
    const progressPercent = Math.round((fixedErrors / 58) * 100);

    // Green gate status
    const greenGate = {
      ready: criticalErrors === 0,
      blockers: [] as string[],
    };

    if (criticalErrors > 0) {
      greenGate.blockers.push(`${criticalErrors} critical errors remaining`);
    }

    Object.entries(bucketStatus).forEach(([bucket, data]: [string, any]) => {
      if (data.status !== 'complete') {
        greenGate.blockers.push(`Bucket ${bucket} not complete`);
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_errors: totalErrors,
      critical_errors: criticalErrors,
      non_critical_errors: nonCriticalErrors,
      fixed: fixedErrors,
      progress_percent: progressPercent,
      by_bucket: bucketStatus,
      by_file: sortedFiles.slice(0, 20), // Top 20 files
      green_gate: greenGate,
    });
  } catch (error: any) {
    console.error('Type check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run type check',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { bucket, instance, errors_fixed, errors_remaining, files_modified, commit_sha } = await request.json();

    // Log progress event
    const eventLog = {
      event: 'tasks.progress',
      timestamp: new Date().toISOString(),
      producer: `instance-${instance}`,
      payload: {
        bucket,
        errors_fixed,
        errors_remaining,
        files_modified: files_modified || [],
        commit_sha: commit_sha || null,
      },
    };

    // Append to event log
    const today = new Date().toISOString().split('T')[0] as string;
    const eventsDir = path.join(process.cwd(), '_bus', 'events', today);
    const eventsFile = path.join(eventsDir, 'events.jsonl');

    await fs.mkdir(eventsDir, { recursive: true });
    await fs.appendFile(eventsFile, JSON.stringify(eventLog) + '\n');

    return NextResponse.json({
      success: true,
      message: 'Progress reported',
      event: eventLog,
    });
  } catch (error: any) {
    console.error('Failed to report progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to report progress',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
