/**
 * AI Action Handlers
 * Client-side handlers for executing DAW actions from AI tool calls
 */

import { useTrackStore } from '@/src/core/store';
import { useTransport } from '@/src/core/transport';
import type { ToolInput } from './tools';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Execute a DAW action based on AI tool call
 */
export async function executeAction(
  toolName: string,
  toolInput: ToolInput
): Promise<ActionResult> {
  console.log('[executeAction] 🎯 Executing tool:', toolName);
  console.log('[executeAction] 📥 Tool input:', toolInput);

  try {
    switch (toolName) {
      case 'start_recording':
        return await handleStartRecording(toolInput);
      case 'stop_recording':
        return handleStopRecording(toolInput);
      case 'start_playback':
        return await handleStartPlayback(toolInput);
      case 'stop_playback':
        return handleStopPlayback(toolInput);
      case 'set_bpm':
        return handleSetBPM(toolInput);
      case 'adjust_volume':
        return handleAdjustVolume(toolInput);
      case 'adjust_pan':
        return handleAdjustPan(toolInput);
      case 'toggle_mute':
        return handleToggleMute(toolInput);
      case 'toggle_solo':
        return handleToggleSolo(toolInput);
      case 'arm_track':
        return handleArmTrack(toolInput);
      case 'create_track':
        return handleCreateTrack(toolInput);
      case 'rename_track':
        return handleRenameTrack(toolInput);
      case 'delete_track':
        return handleDeleteTrack(toolInput);
      case 'generate_backing_track':
        return await handleGenerateBackingTrack(toolInput);
      case 'generate_from_melody':
        return await handleGenerateFromMelody(toolInput);
      case 'create_voice_profile':
        return await handleCreateVoiceProfile(toolInput);
      case 'generate_harmony':
        return await handleGenerateHarmony(toolInput);
      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Action failed',
    };
  }
}

// Action Handlers

async function handleStartRecording(input: any): Promise<ActionResult> {
  const { trackId } = input;
  const { tracks, activeTrackId, toggleRecordArm } = useTrackStore.getState();
  const { record } = useTransport.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected for recording',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  // Arm track if not already armed
  if (!track.recordArm) {
    toggleRecordArm(targetTrackId);
  }

  // Start recording
  await record();

  return {
    success: true,
    message: `Started recording on track "${track.name}"`,
    data: { trackId: targetTrackId, trackName: track.name },
  };
}

function handleStopRecording(_input: any): ActionResult {
  const { stopRecording } = useTransport.getState();
  stopRecording();

  return {
    success: true,
    message: 'Recording stopped',
  };
}

async function handleStartPlayback(_input: any): Promise<ActionResult> {
  const { play } = useTransport.getState();
  await play();

  return {
    success: true,
    message: 'Playback started',
  };
}

function handleStopPlayback(_input: any): ActionResult {
  const { stop } = useTransport.getState();
  stop();

  return {
    success: true,
    message: 'Playback stopped',
  };
}

function handleSetBPM(input: any): ActionResult {
  const { bpm } = input;
  console.log('[handleSetBPM] 🎵 Setting BPM to:', bpm);

  const { setBPM } = useTransport.getState();
  console.log('[handleSetBPM] 📊 Transport state:', useTransport.getState());

  if (bpm < 20 || bpm > 300) {
    console.log('[handleSetBPM] ❌ Invalid BPM:', bpm);
    return {
      success: false,
      message: 'BPM must be between 20 and 300',
    };
  }

  setBPM(bpm);
  console.log('[handleSetBPM] ✅ BPM set to:', bpm);

  return {
    success: true,
    message: `Tempo set to ${bpm} BPM`,
    data: { bpm },
  };
}

function handleAdjustVolume(input: any): ActionResult {
  const { trackId, volume } = input;
  const { tracks, activeTrackId, setVolume } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  if (volume < 0 || volume > 100) {
    return {
      success: false,
      message: 'Volume must be between 0 and 100',
    };
  }

  setVolume(targetTrackId, volume);

  return {
    success: true,
    message: `Volume set to ${volume} on track "${track.name}"`,
    data: { trackId: targetTrackId, trackName: track.name, volume },
  };
}

function handleAdjustPan(input: any): ActionResult {
  const { trackId, pan } = input;
  const { tracks, activeTrackId, setPan } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  if (pan < -50 || pan > 50) {
    return {
      success: false,
      message: 'Pan must be between -50 (left) and 50 (right)',
    };
  }

  setPan(targetTrackId, pan);

  const panDescription =
    pan === 0 ? 'center' : pan < 0 ? `${Math.abs(pan)}% left` : `${pan}% right`;

  return {
    success: true,
    message: `Pan set to ${panDescription} on track "${track.name}"`,
    data: { trackId: targetTrackId, trackName: track.name, pan },
  };
}

function handleToggleMute(input: any): ActionResult {
  const { trackId } = input;
  const { tracks, activeTrackId, toggleMute } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  toggleMute(targetTrackId);
  const newMuteState = !track.mute;

  return {
    success: true,
    message: `Track "${track.name}" ${newMuteState ? 'muted' : 'unmuted'}`,
    data: { trackId: targetTrackId, trackName: track.name, muted: newMuteState },
  };
}

function handleToggleSolo(input: any): ActionResult {
  const { trackId } = input;
  const { tracks, activeTrackId, toggleSolo } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  toggleSolo(targetTrackId);
  const newSoloState = !track.solo;

  return {
    success: true,
    message: `Track "${track.name}" ${newSoloState ? 'soloed' : 'unsoloed'}`,
    data: { trackId: targetTrackId, trackName: track.name, solo: newSoloState },
  };
}

function handleArmTrack(input: any): ActionResult {
  const { trackId } = input;
  const { tracks, activeTrackId, toggleRecordArm } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  toggleRecordArm(targetTrackId);
  const newArmState = !track.recordArm;

  return {
    success: true,
    message: `Track "${track.name}" ${newArmState ? 'armed' : 'disarmed'}`,
    data: { trackId: targetTrackId, trackName: track.name, armed: newArmState },
  };
}

function handleCreateTrack(input: any): ActionResult {
  const { name } = input;
  const { addTrack, tracks, updateTrack } = useTrackStore.getState();

  addTrack('audio');
  const newTrack = tracks[tracks.length];

  // Rename if name provided
  if (name && newTrack) {
    updateTrack(newTrack.id, { name });
  }

  return {
    success: true,
    message: `Created new track${name ? ` "${name}"` : ''}`,
    data: { trackId: newTrack?.id, trackName: name || newTrack?.name },
  };
}

function handleRenameTrack(input: any): ActionResult {
  const { trackId, name } = input;
  const { tracks, activeTrackId, updateTrack } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  updateTrack(targetTrackId, { name });

  return {
    success: true,
    message: `Track renamed to "${name}"`,
    data: { trackId: targetTrackId, oldName: track.name, newName: name },
  };
}

function handleDeleteTrack(input: any): ActionResult {
  const { trackId } = input;
  const { tracks, activeTrackId, removeTrack } = useTrackStore.getState();

  const targetTrackId = trackId || activeTrackId;
  if (!targetTrackId) {
    return {
      success: false,
      message: 'No track selected',
    };
  }

  const track = tracks.find((t) => t.id === targetTrackId);
  if (!track) {
    return {
      success: false,
      message: 'Track not found',
    };
  }

  removeTrack(targetTrackId);

  return {
    success: true,
    message: `Track "${track.name}" deleted`,
    data: { trackId: targetTrackId, trackName: track.name },
  };
}

async function handleGenerateBackingTrack(input: any): Promise<ActionResult> {
  const { genre, mood, instruments, tempo, key, duration } = input;

  // This calls the API endpoint (client-side implementation will handle actual fetch)
  // For now, return pending status
  return {
    success: true,
    message: `Generating ${mood} ${genre} backing track... This will take 30-60 seconds.`,
    data: {
      genre,
      mood,
      instruments,
      tempo,
      key,
      duration: duration || 30,
      status: 'pending',
    },
  };
}

async function handleGenerateFromMelody(input: any): Promise<ActionResult> {
  const { recordingId, genre, mood, instruments, complexity } = input;
  const { tracks } = useTrackStore.getState();

  // Find the recording
  let foundRecording = null;
  let foundTrack = null;

  for (const track of tracks) {
    const recording = track.recordings.find(r => r.id === recordingId);
    if (recording) {
      foundRecording = recording;
      foundTrack = track;
      break;
    }
  }

  if (!foundRecording || !foundTrack) {
    return {
      success: false,
      message: 'Recording not found',
    };
  }

  // Return pending status (actual API call handled by client)
  return {
    success: true,
    message: `Transforming "${foundTrack.name}" melody into ${genre} arrangement... This will take 30-60 seconds.`,
    data: {
      recordingId,
      trackName: foundTrack.name,
      genre,
      mood,
      instruments,
      complexity: complexity || 'moderate',
      status: 'pending',
    },
  };
}

async function handleCreateVoiceProfile(input: any): Promise<ActionResult> {
  const { recordingId, name } = input;
  const { tracks } = useTrackStore.getState();

  // Find the recording
  let foundRecording = null;
  let foundTrack = null;

  for (const track of tracks) {
    const recording = track.recordings.find((r) => r.id === recordingId);
    if (recording) {
      foundRecording = recording;
      foundTrack = track;
      break;
    }
  }

  if (!foundRecording || !foundTrack) {
    return {
      success: false,
      message: 'Recording not found',
    };
  }

  // Validate duration (6-30 seconds required)
  const duration = foundRecording.duration || 0;
  if (duration < 6) {
    return {
      success: false,
      message: 'Voice sample must be at least 6 seconds long. Please record a longer sample.',
    };
  }

  if (duration > 30) {
    return {
      success: false,
      message: 'Voice sample must be 30 seconds or less. Please trim the recording.',
    };
  }

  // Return pending status (actual API call handled by client)
  return {
    success: true,
    message: `Creating voice profile "${name}" from "${foundTrack.name}"... This will take a few seconds.`,
    data: {
      recordingId,
      trackName: foundTrack.name,
      name,
      duration,
      status: 'pending',
    },
  };
}

async function handleGenerateHarmony(input: any): Promise<ActionResult> {
  const { leadVocalRecordingId, voiceProfileId, intervals } = input;
  const { tracks } = useTrackStore.getState();

  // Find the lead vocal recording
  let foundRecording = null;
  let foundTrack = null;

  for (const track of tracks) {
    const recording = track.recordings.find((r) => r.id === leadVocalRecordingId);
    if (recording) {
      foundRecording = recording;
      foundTrack = track;
      break;
    }
  }

  if (!foundRecording || !foundTrack) {
    return {
      success: false,
      message: 'Lead vocal recording not found',
    };
  }

  // Format intervals for user message
  const intervalNames = intervals.map((i: string) => {
    return i
      .split('_')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  });

  // Return pending status (actual API call handled by client)
  return {
    success: true,
    message: `Generating ${intervals.length} harmony part${intervals.length > 1 ? 's' : ''} (${intervalNames.join(', ')}) from "${foundTrack.name}"... This will take 1-2 minutes.`,
    data: {
      leadVocalRecordingId,
      voiceProfileId,
      intervals,
      trackName: foundTrack.name,
      status: 'pending',
    },
  };
}
