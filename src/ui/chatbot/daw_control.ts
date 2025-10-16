/**
 * DAW Control System
 * Maps natural language chat intents to DAW actions
 * Enables full DAW control through conversational interface
 */

import { useTransportStore } from '@/stores';

export enum DAWIntent {
  // Transport controls
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  STOP = 'STOP',
  RECORD = 'RECORD',
  STOP_RECORD = 'STOP_RECORD',

  // Navigation
  SKIP_FORWARD = 'SKIP_FORWARD',
  SKIP_BACKWARD = 'SKIP_BACKWARD',
  RETURN_TO_START = 'RETURN_TO_START',
  SEEK_TO_TIME = 'SEEK_TO_TIME',

  // Tempo and time signature
  SET_BPM = 'SET_BPM',
  INCREASE_BPM = 'INCREASE_BPM',
  DECREASE_BPM = 'DECREASE_BPM',
  SET_TIME_SIGNATURE = 'SET_TIME_SIGNATURE',

  // Loop controls
  TOGGLE_LOOP = 'TOGGLE_LOOP',
  SET_LOOP_REGION = 'SET_LOOP_REGION',

  // Metronome
  TOGGLE_METRONOME = 'TOGGLE_METRONOME',
  SET_METRONOME_VOLUME = 'SET_METRONOME_VOLUME',

  // Recording aids
  SET_PRE_ROLL = 'SET_PRE_ROLL',
  SET_POST_ROLL = 'SET_POST_ROLL',
  SET_COUNT_IN = 'SET_COUNT_IN',

  // Volume
  SET_MASTER_VOLUME = 'SET_MASTER_VOLUME',
  INCREASE_VOLUME = 'INCREASE_VOLUME',
  DECREASE_VOLUME = 'DECREASE_VOLUME',

  // Punch recording
  SET_PUNCH_MODE = 'SET_PUNCH_MODE',
  SET_PUNCH_IN = 'SET_PUNCH_IN',
  SET_PUNCH_OUT = 'SET_PUNCH_OUT',

  // Markers
  ADD_MARKER = 'ADD_MARKER',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

export interface DAWCommandParams {
  bpm?: number;
  time?: number;
  numerator?: number;
  denominator?: number;
  volume?: number;
  bars?: number;
  mode?: 'off' | 'quick-punch' | 'track-punch';
  loopStart?: number;
  loopEnd?: number;
}

/**
 * Intent patterns for DAW control
 * Maps natural language phrases to DAW intents
 */
const DAW_INTENT_PATTERNS: Record<string, RegExp[]> = {
  [DAWIntent.PLAY]: [
    /\b(play|start|begin|resume)\b/i,
    /\bpress play\b/i,
    /\bstart playback\b/i,
  ],
  [DAWIntent.PAUSE]: [
    /\b(pause|hold)\b/i,
    /\bpress pause\b/i,
  ],
  [DAWIntent.STOP]: [
    /\b(stop|halt)\b/i,
    /\bstop playback\b/i,
    /\bstop playing\b/i,
  ],
  [DAWIntent.RECORD]: [
    /\b(record|start recording|begin recording)\b/i,
    /\bpress record\b/i,
    /\bhit record\b/i,
  ],
  [DAWIntent.STOP_RECORD]: [
    /\b(stop recording|end recording)\b/i,
  ],
  [DAWIntent.SKIP_FORWARD]: [
    /\b(skip forward|next|forward)\b/i,
    /\bskip ahead\b/i,
  ],
  [DAWIntent.SKIP_BACKWARD]: [
    /\b(skip back|previous|back|backward|rewind)\b/i,
    /\bgo back\b/i,
  ],
  [DAWIntent.RETURN_TO_START]: [
    /\b(return to start|go to start|beginning|restart)\b/i,
    /\bback to the start\b/i,
  ],
  [DAWIntent.SET_BPM]: [
    /\bset (the )?bpm to (\d+)\b/i,
    /\bchange (the )?tempo to (\d+)\b/i,
    /\b(\d+) bpm\b/i,
  ],
  [DAWIntent.INCREASE_BPM]: [
    /\b(increase|raise|speed up|faster) (the )?(bpm|tempo)\b/i,
  ],
  [DAWIntent.DECREASE_BPM]: [
    /\b(decrease|lower|slow down|slower) (the )?(bpm|tempo)\b/i,
  ],
  [DAWIntent.SET_TIME_SIGNATURE]: [
    /\bset (the )?time signature to (\d+)\/(\d+)\b/i,
    /\bchange (to )?(\d+)\/(\d+) time\b/i,
  ],
  [DAWIntent.TOGGLE_LOOP]: [
    /\b(toggle|enable|disable|turn on|turn off) (the )?loop\b/i,
    /\blooping (on|off)\b/i,
  ],
  [DAWIntent.SET_LOOP_REGION]: [
    /\b(set|create) (a )?loop (from|between) (\d+\.?\d*) (to|and) (\d+\.?\d*)\b/i,
  ],
  [DAWIntent.TOGGLE_METRONOME]: [
    /\b(toggle|enable|disable|turn on|turn off) (the )?metronome\b/i,
    /\bclick (on|off)\b/i,
  ],
  [DAWIntent.SET_METRONOME_VOLUME]: [
    /\bset (the )?metronome volume to (\d+)\b/i,
    /\bmetronome (at|to) (\d+)%?\b/i,
  ],
  [DAWIntent.SET_MASTER_VOLUME]: [
    /\bset (the )?(master )?volume to (\d+)\b/i,
    /\bvolume (at|to) (\d+)%?\b/i,
  ],
  [DAWIntent.INCREASE_VOLUME]: [
    /\b(increase|raise|turn up|louder) (the )?(master )?volume\b/i,
  ],
  [DAWIntent.DECREASE_VOLUME]: [
    /\b(decrease|lower|turn down|quieter) (the )?(master )?volume\b/i,
  ],
  [DAWIntent.SET_PRE_ROLL]: [
    /\bset (the )?pre-?roll to (\d+) bars?\b/i,
  ],
  [DAWIntent.SET_POST_ROLL]: [
    /\bset (the )?post-?roll to (\d+) bars?\b/i,
  ],
  [DAWIntent.SET_COUNT_IN]: [
    /\bset (the )?count-?in to (\d+) bars?\b/i,
    /\b(\d+) bar count-?in\b/i,
  ],
  [DAWIntent.SET_PUNCH_MODE]: [
    /\bset (the )?punch (mode )?(to )?(off|quick-punch|track-punch)\b/i,
    /\b(enable|disable) punch (recording|mode)\b/i,
  ],
  [DAWIntent.ADD_MARKER]: [
    /\b(add|create|place|drop) (a )?marker\b/i,
  ],
};

/**
 * Detect DAW control intent from user message
 */
export function detectDAWIntent(message: string): { intent: DAWIntent; params: DAWCommandParams } {
  const lowerMessage = message.toLowerCase();

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(DAW_INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return {
          intent: intent as DAWIntent,
          params: extractDAWParams(intent as DAWIntent, match),
        };
      }
    }
  }

  return { intent: DAWIntent.UNKNOWN, params: {} };
}

/**
 * Extract parameters from regex match
 */
function extractDAWParams(intent: DAWIntent, match: RegExpMatchArray): DAWCommandParams {
  const params: DAWCommandParams = {};

  switch (intent) {
    case DAWIntent.SET_BPM:
      // Extract BPM value
      const bpmMatch = match[0].match(/\d+/);
      if (bpmMatch) {
        params.bpm = parseInt(bpmMatch[0], 10);
      }
      break;

    case DAWIntent.SET_TIME_SIGNATURE:
      // Extract numerator and denominator
      const timeMatch = match[0].match(/(\d+)\/(\d+)/);
      if (timeMatch) {
        params.numerator = parseInt(timeMatch[1], 10);
        params.denominator = parseInt(timeMatch[2], 10);
      }
      break;

    case DAWIntent.SET_LOOP_REGION:
      // Extract loop start and end times
      const loopMatch = match[0].match(/(\d+\.?\d*)\s+(to|and)\s+(\d+\.?\d*)/);
      if (loopMatch) {
        params.loopStart = parseFloat(loopMatch[1]);
        params.loopEnd = parseFloat(loopMatch[3]);
      }
      break;

    case DAWIntent.SET_MASTER_VOLUME:
    case DAWIntent.SET_METRONOME_VOLUME:
      // Extract volume percentage (0-100)
      const volumeMatch = match[0].match(/(\d+)/);
      if (volumeMatch) {
        params.volume = parseInt(volumeMatch[0], 10) / 100; // Convert to 0-1 range
      }
      break;

    case DAWIntent.SET_PRE_ROLL:
    case DAWIntent.SET_POST_ROLL:
    case DAWIntent.SET_COUNT_IN:
      // Extract number of bars
      const barsMatch = match[0].match(/(\d+)/);
      if (barsMatch) {
        params.bars = parseInt(barsMatch[0], 10);
      }
      break;

    case DAWIntent.SET_PUNCH_MODE:
      // Extract punch mode
      const modeMatch = match[0].match(/(off|quick-punch|track-punch)/i);
      if (modeMatch) {
        params.mode = modeMatch[1].toLowerCase() as 'off' | 'quick-punch' | 'track-punch';
      }
      break;

    case DAWIntent.SEEK_TO_TIME:
      // Extract time in seconds
      const timeMatch2 = match[0].match(/(\d+\.?\d*)/);
      if (timeMatch2) {
        params.time = parseFloat(timeMatch2[0]);
      }
      break;
  }

  return params;
}

/**
 * Execute DAW command
 * Returns true if command was successfully executed
 */
export function executeDAWCommand(intent: DAWIntent, params: DAWCommandParams = {}): boolean {
  const transport = useTransportStore.getState();

  try {
    switch (intent) {
      case DAWIntent.PLAY:
        transport.play();
        return true;

      case DAWIntent.PAUSE:
        transport.pause();
        return true;

      case DAWIntent.STOP:
        transport.stop();
        return true;

      case DAWIntent.RECORD:
        transport.startRecording();
        return true;

      case DAWIntent.STOP_RECORD:
        transport.stopRecording();
        return true;

      case DAWIntent.SKIP_FORWARD:
        transport.skipForward();
        return true;

      case DAWIntent.SKIP_BACKWARD:
        transport.skipBackward();
        return true;

      case DAWIntent.RETURN_TO_START:
        transport.returnToStart();
        return true;

      case DAWIntent.TOGGLE_LOOP:
        transport.toggleLoop();
        return true;

      case DAWIntent.TOGGLE_METRONOME:
        transport.toggleMetronome();
        return true;

      case DAWIntent.SET_BPM:
        if (params.bpm) {
          transport.setBpm(params.bpm);
          return true;
        }
        return false;

      case DAWIntent.INCREASE_BPM:
        transport.setBpm(transport.bpm + 5);
        return true;

      case DAWIntent.DECREASE_BPM:
        transport.setBpm(transport.bpm - 5);
        return true;

      case DAWIntent.SET_TIME_SIGNATURE:
        if (params.numerator && params.denominator) {
          transport.setTimeSignature(params.numerator, params.denominator);
          return true;
        }
        return false;

      case DAWIntent.SET_LOOP_REGION:
        if (params.loopStart !== undefined && params.loopEnd !== undefined) {
          transport.setLoopRegion(params.loopStart, params.loopEnd);
          return true;
        }
        return false;

      case DAWIntent.SET_MASTER_VOLUME:
        if (params.volume !== undefined) {
          transport.setMasterVolume(params.volume);
          return true;
        }
        return false;

      case DAWIntent.INCREASE_VOLUME:
        transport.setMasterVolume(Math.min(1, transport.masterVolume + 0.1));
        return true;

      case DAWIntent.DECREASE_VOLUME:
        transport.setMasterVolume(Math.max(0, transport.masterVolume - 0.1));
        return true;

      case DAWIntent.SET_METRONOME_VOLUME:
        if (params.volume !== undefined) {
          transport.setMetronomeVolume(params.volume);
          return true;
        }
        return false;

      case DAWIntent.SET_PRE_ROLL:
        if (params.bars !== undefined) {
          transport.setPreRoll(params.bars);
          transport.setPreRollEnabled(true);
          return true;
        }
        return false;

      case DAWIntent.SET_POST_ROLL:
        if (params.bars !== undefined) {
          transport.setPostRoll(params.bars);
          transport.setPostRollEnabled(true);
          return true;
        }
        return false;

      case DAWIntent.SET_COUNT_IN:
        if (params.bars !== undefined) {
          transport.setCountIn(params.bars);
          return true;
        }
        return false;

      case DAWIntent.SET_PUNCH_MODE:
        if (params.mode) {
          transport.setPunchMode(params.mode);
          return true;
        }
        return false;

      case DAWIntent.ADD_MARKER:
        transport.addMarker();
        return true;

      case DAWIntent.SEEK_TO_TIME:
        if (params.time !== undefined) {
          transport.seek(params.time);
          return true;
        }
        return false;

      default:
        console.warn('[DAWControl] Unknown intent:', intent);
        return false;
    }
  } catch (error) {
    console.error('[DAWControl] Error executing command:', error);
    return false;
  }
}

/**
 * Get human-readable confirmation message for executed command
 */
export function getDAWCommandConfirmation(intent: DAWIntent, params: DAWCommandParams): string {
  switch (intent) {
    case DAWIntent.PLAY:
      return 'Playing';
    case DAWIntent.PAUSE:
      return 'Paused';
    case DAWIntent.STOP:
      return 'Stopped';
    case DAWIntent.RECORD:
      return 'Recording started';
    case DAWIntent.STOP_RECORD:
      return 'Recording stopped';
    case DAWIntent.SKIP_FORWARD:
      return 'Skipped forward';
    case DAWIntent.SKIP_BACKWARD:
      return 'Skipped backward';
    case DAWIntent.RETURN_TO_START:
      return 'Returned to start';
    case DAWIntent.TOGGLE_LOOP:
      return 'Loop toggled';
    case DAWIntent.TOGGLE_METRONOME:
      return 'Metronome toggled';
    case DAWIntent.SET_BPM:
      return `BPM set to ${params.bpm}`;
    case DAWIntent.INCREASE_BPM:
      return 'BPM increased';
    case DAWIntent.DECREASE_BPM:
      return 'BPM decreased';
    case DAWIntent.SET_TIME_SIGNATURE:
      return `Time signature set to ${params.numerator}/${params.denominator}`;
    case DAWIntent.SET_LOOP_REGION:
      return `Loop region set: ${params.loopStart}s to ${params.loopEnd}s`;
    case DAWIntent.SET_MASTER_VOLUME:
      return `Master volume set to ${Math.round((params.volume || 0) * 100)}%`;
    case DAWIntent.INCREASE_VOLUME:
      return 'Volume increased';
    case DAWIntent.DECREASE_VOLUME:
      return 'Volume decreased';
    case DAWIntent.SET_METRONOME_VOLUME:
      return `Metronome volume set to ${Math.round((params.volume || 0) * 100)}%`;
    case DAWIntent.SET_PRE_ROLL:
      return `Pre-roll set to ${params.bars} bars`;
    case DAWIntent.SET_POST_ROLL:
      return `Post-roll set to ${params.bars} bars`;
    case DAWIntent.SET_COUNT_IN:
      return `Count-in set to ${params.bars} bars`;
    case DAWIntent.SET_PUNCH_MODE:
      return `Punch mode set to ${params.mode}`;
    case DAWIntent.ADD_MARKER:
      return 'Marker added';
    case DAWIntent.SEEK_TO_TIME:
      return `Seeked to ${params.time}s`;
    default:
      return 'Command executed';
  }
}

/**
 * Process a chat message and execute DAW commands if detected
 * Returns null if no DAW command detected, or confirmation message if executed
 */
export function processDAWCommand(message: string): string | null {
  const { intent, params } = detectDAWIntent(message);

  if (intent === DAWIntent.UNKNOWN) {
    return null;
  }

  const success = executeDAWCommand(intent, params);

  if (success) {
    return getDAWCommandConfirmation(intent, params);
  }

  return 'Failed to execute DAW command';
}
