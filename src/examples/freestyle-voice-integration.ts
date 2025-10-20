/**
 * Freestyle Voice Command Integration Example
 *
 * Shows how to integrate the FreestyleOrchestrator with voice commands
 * using the VoiceTestCommander service
 */

import { freestyleOrchestrator } from '../backend/services/freestyle-orchestrator';
import { voiceTestCommander } from '../backend/services/voice-test-commander';
import type {
  FreestyleConfig,
  ProgressCallback,
  LyricSegment,
} from '../types/freestyle';

// ============================================================================
// Example 1: Basic Voice Command Integration
// ============================================================================

/**
 * Handle "Record me freestyle" voice command
 */
export async function handleRecordMeFreestyleCommand(
  userId: string,
  projectId: string
): Promise<void> {
  console.log('[Example] Processing "Record me freestyle" command');

  try {
    // Define progress callback for UI updates
    const onProgress: ProgressCallback = (stage, progress, details) => {
      console.log(`[Freestyle] ${stage} - ${(progress * 100).toFixed(0)}%`, details);
      // Emit to UI via WebSocket
      // socket.emit('freestyle:progress', { stage, progress, details });
    };

    // Configure freestyle session
    const config: FreestyleConfig = {
      projectId,
      userId,
      autoCreateBeat: false, // Ask user first
      countdown: 3, // 3-second countdown
      maxDuration: 300, // 5 minutes max
    };

    // Start freestyle session
    const result = await freestyleOrchestrator.startFreestyleSession(config, onProgress);

    console.log('[Example] Freestyle session started:', result.sessionId);
    console.log('[Example] Status:', result.status);
    console.log('[Example] Recommendations:', result.setup.recommendations);

    // Session is now ready for recording
    // Recording is controlled by FreestyleSession.tsx component

  } catch (error) {
    console.error('[Example] Freestyle command failed:', error);
    // Speak error to user
    const errorMessage = `Failed to start freestyle: ${error}`;
    const audioResponse = await voiceTestCommander.synthesizeSpeech(errorMessage);
    // Play audio response
  }
}

// ============================================================================
// Example 2: Voice Command with Beat Creation
// ============================================================================

/**
 * Handle "Create a hip-hop beat and record me" voice command
 */
export async function handleCreateBeatAndRecordCommand(
  userId: string,
  projectId: string,
  beatStyle: string = 'hip-hop',
  bpm?: number
): Promise<void> {
  console.log('[Example] Processing "Create beat and record" command');

  try {
    const onProgress: ProgressCallback = (stage, progress, details) => {
      console.log(`[Freestyle] ${stage} - ${(progress * 100).toFixed(0)}%`, details);
    };

    const config: FreestyleConfig = {
      projectId,
      userId,
      autoCreateBeat: true, // Automatically create beat
      beatStyle: beatStyle as any,
      targetBPM: bpm || 120,
      targetKey: 'C',
      countdown: 5, // Give user more time since beat is being created
      maxDuration: 300,
    };

    const result = await freestyleOrchestrator.startFreestyleSession(config, onProgress);

    // Speak confirmation
    const confirmMessage = `Created a ${beatStyle} beat at ${result.setup.detectedBPM} BPM. Starting recording in 5...`;
    const audioResponse = await voiceTestCommander.synthesizeSpeech(confirmMessage);
    // Play audio response

    console.log('[Example] Session ready with beat:', result.setup.backingTrackId);

  } catch (error) {
    console.error('[Example] Beat creation failed:', error);
  }
}

// ============================================================================
// Example 3: Post-Recording Analysis
// ============================================================================

/**
 * Analyze recorded freestyle after recording stops
 */
export async function handleFreestyleAnalysis(
  sessionId: string,
  audioBlob: Blob,
  lyrics: LyricSegment[],
  options: {
    projectId: string;
    trackId: string;
    hasBeat: boolean;
  }
): Promise<void> {
  console.log('[Example] Starting post-recording analysis');

  try {
    // Convert Blob to AudioBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const onProgress: ProgressCallback = (stage, progress, details) => {
      console.log(`[Analysis] ${stage} - ${(progress * 100).toFixed(0)}%`, details);
      // Update UI with progress
    };

    // Run analysis pipeline
    const analysis = await freestyleOrchestrator.analyzeRecording(
      audioBuffer,
      lyrics,
      options,
      onProgress
    );

    console.log('[Example] Analysis complete:', {
      key: analysis.metadata.key,
      bpm: analysis.metadata.bpm,
      noteCount: analysis.melody?.notes.length || 0,
      lyricCount: analysis.enhancedLyrics.length,
      confidence: analysis.confidence,
    });

    // Display results in UI
    await freestyleOrchestrator.displayResults(
      analysis,
      options.projectId,
      options.trackId
    );

    // Speak results summary
    const summary = `Analysis complete! Detected ${analysis.metadata.key} at ${analysis.metadata.bpm} BPM. Found ${analysis.melody?.notes.length || 0} notes and ${analysis.enhancedLyrics.length} lyric sections.`;
    const audioResponse = await voiceTestCommander.synthesizeSpeech(summary);
    // Play audio response

  } catch (error) {
    console.error('[Example] Analysis failed:', error);
  }
}

// ============================================================================
// Example 4: Complete Voice-to-Music Workflow
// ============================================================================

/**
 * Complete workflow from voice command to displayed results
 */
export class FreestyleVoiceWorkflow {
  private sessionId?: string;
  private audioBlob?: Blob;
  private lyrics: LyricSegment[] = [];

  /**
   * Step 1: Voice command detected - start session
   */
  async onVoiceCommand(
    command: string,
    userId: string,
    projectId: string
  ): Promise<void> {
    console.log('[Workflow] Voice command:', command);

    // Parse command intent
    const intent = await this.parseIntent(command);

    const config: FreestyleConfig = {
      projectId,
      userId,
      autoCreateBeat: intent.createBeat,
      beatStyle: intent.beatStyle,
      targetBPM: intent.bpm,
      countdown: 3,
    };

    // Start session
    const result = await freestyleOrchestrator.startFreestyleSession(
      config,
      (stage, progress, details) => {
        console.log(`[Workflow] ${stage}:`, details);
        this.emitProgress(stage, progress, details);
      }
    );

    this.sessionId = result.sessionId;

    // Speak confirmation
    const message = result.setup.hasBackingTrack
      ? 'Ready to record with beat. Starting in 3, 2, 1...'
      : 'Ready to record a cappella. Starting in 3, 2, 1...';

    await this.speakToUser(message);
  }

  /**
   * Step 2: Recording complete - store data
   */
  onRecordingComplete(audioBlob: Blob, lyrics: LyricSegment[]): void {
    console.log('[Workflow] Recording complete:', {
      audioSize: audioBlob.size,
      lyricCount: lyrics.length,
    });

    this.audioBlob = audioBlob;
    this.lyrics = lyrics;

    // Auto-trigger analysis
    this.startAnalysis();
  }

  /**
   * Step 3: Analyze recording
   */
  async startAnalysis(): Promise<void> {
    if (!this.sessionId || !this.audioBlob) {
      throw new Error('No recording to analyze');
    }

    console.log('[Workflow] Starting analysis...');

    // Get session info
    const session = freestyleOrchestrator.getSession(this.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Convert blob to AudioBuffer
    const arrayBuffer = await this.audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Run analysis
    const analysis = await freestyleOrchestrator.analyzeRecording(
      audioBuffer,
      this.lyrics,
      {
        projectId: session.projectId,
        trackId: session.recordingSetup.trackId,
        hasBeat: session.setup.hasBackingTrack,
        sessionId: this.sessionId,
      },
      (stage, progress, details) => {
        this.emitProgress(stage, progress, details);
      }
    );

    // Display results
    await freestyleOrchestrator.displayResults(
      analysis,
      session.projectId,
      session.recordingSetup.trackId
    );

    // Speak summary
    await this.speakAnalysisSummary(analysis);

    console.log('[Workflow] Workflow complete!');
  }

  /**
   * Parse voice command intent
   */
  private async parseIntent(command: string): Promise<{
    createBeat: boolean;
    beatStyle?: string;
    bpm?: number;
  }> {
    const lowerCommand = command.toLowerCase();

    // Check for beat creation
    const createBeat =
      lowerCommand.includes('beat') ||
      lowerCommand.includes('instrumental') ||
      lowerCommand.includes('track');

    // Detect beat style
    let beatStyle: string | undefined;
    if (lowerCommand.includes('hip-hop') || lowerCommand.includes('hip hop')) {
      beatStyle = 'hip-hop';
    } else if (lowerCommand.includes('trap')) {
      beatStyle = 'trap';
    } else if (lowerCommand.includes('boom bap')) {
      beatStyle = 'boom-bap';
    } else if (lowerCommand.includes('drill')) {
      beatStyle = 'drill';
    }

    // Detect BPM
    const bpmMatch = lowerCommand.match(/(\d+)\s*bpm/);
    const bpm = bpmMatch ? parseInt(bpmMatch[1]) : undefined;

    return { createBeat, beatStyle, bpm };
  }

  /**
   * Speak message to user via TTS
   */
  private async speakToUser(message: string): Promise<void> {
    const audioBuffer = await voiceTestCommander.synthesizeSpeech(message);
    // Play audio buffer
    console.log('[Workflow] Speaking:', message);
  }

  /**
   * Speak analysis summary
   */
  private async speakAnalysisSummary(analysis: any): Promise<void> {
    const message = `
      Your freestyle is ready!
      I detected ${analysis.metadata.key} at ${analysis.metadata.bpm} BPM.
      Found ${analysis.melody?.notes.length || 0} melodic notes.
      Your lyrics have been organized into ${analysis.enhancedLyrics.filter((l: any) => l.section === 'verse').length} verses
      and ${analysis.enhancedLyrics.filter((l: any) => l.section === 'chorus').length} choruses.
      Overall confidence: ${(analysis.confidence.lyrics * 100).toFixed(0)}%.
      Great job!
    `;

    await this.speakToUser(message);
  }

  /**
   * Emit progress to UI
   */
  private emitProgress(stage: string, progress: number, details?: string): void {
    // Emit WebSocket event
    // socket.emit('freestyle:progress', { stage, progress, details });
    console.log(`[Progress] ${stage}: ${(progress * 100).toFixed(0)}%`, details);
  }
}

// ============================================================================
// Example 5: Usage in Voice Command Handler
// ============================================================================

/**
 * Integration with VoiceTestCommander
 */
export async function integrateWithVoiceCommander(): Promise<void> {
  const workflow = new FreestyleVoiceWorkflow();

  // Listen for voice commands
  voiceTestCommander.on('transcription', async ({ text, userId }) => {
    console.log('[Integration] Transcribed:', text);

    // Check if it's a freestyle command
    if (
      text.toLowerCase().includes('record me') ||
      text.toLowerCase().includes('freestyle') ||
      text.toLowerCase().includes('lets rap') ||
      text.toLowerCase().includes("let's rap")
    ) {
      const projectId = 'current-project-id'; // Get from context
      await workflow.onVoiceCommand(text, userId, projectId);
    }
  });

  // Listen for recording completion
  freestyleOrchestrator.on('session:recording-complete', (data) => {
    console.log('[Integration] Recording complete, starting analysis');
    workflow.onRecordingComplete(data.audioBlob, data.lyrics);
  });

  // Listen for analysis completion
  freestyleOrchestrator.on('display:complete', ({ projectId, trackId }) => {
    console.log('[Integration] Results displayed:', { projectId, trackId });
  });
}

// ============================================================================
// Example 6: API Route Handlers
// ============================================================================

/**
 * Express route handler for starting freestyle session
 */
export async function handleStartFreestyleRoute(req: any, res: any): Promise<void> {
  try {
    const { projectId, userId, config } = req.body;

    const result = await freestyleOrchestrator.startFreestyleSession(
      { projectId, userId, ...config },
      (stage, progress, details) => {
        // Send progress via SSE or WebSocket
        res.write(`data: ${JSON.stringify({ stage, progress, details })}\n\n`);
      }
    );

    res.json({
      success: true,
      sessionId: result.sessionId,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Express route handler for analyzing recording
 */
export async function handleAnalyzeRecordingRoute(req: any, res: any): Promise<void> {
  try {
    const { sessionId, audioData, lyrics, options } = req.body;

    // Convert base64 audio to AudioBuffer
    const audioBuffer = await decodeAudioData(audioData);

    const analysis = await freestyleOrchestrator.analyzeRecording(
      audioBuffer,
      lyrics,
      options,
      (stage, progress, details) => {
        // Send progress updates
        res.write(`data: ${JSON.stringify({ stage, progress, details })}\n\n`);
      }
    );

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Helper function
async function decodeAudioData(base64Data: string): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const buffer = Buffer.from(base64Data, 'base64');
  return await audioContext.decodeAudioData(buffer.buffer);
}

// ============================================================================
// Export Examples
// ============================================================================

export default {
  handleRecordMeFreestyleCommand,
  handleCreateBeatAndRecordCommand,
  handleFreestyleAnalysis,
  FreestyleVoiceWorkflow,
  integrateWithVoiceCommander,
  handleStartFreestyleRoute,
  handleAnalyzeRecordingRoute,
};
