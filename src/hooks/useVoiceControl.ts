/**
 * useVoiceControl Hook
 *
 * React hook for integrating voice control into DAWG AI components.
 * Provides state management and callbacks for the VoiceController.
 *
 * @module useVoiceControl
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceController, type VoiceMode, type VoiceControllerState, type VoiceCommandResult } from '../services/VoiceController';
import { logger } from '../backend/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface UseVoiceControlOptions {
  mode?: VoiceMode;
  enableTTS?: boolean;
  autoStart?: boolean;
  onCommandExecuted?: (result: VoiceCommandResult) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceControlReturn {
  // State
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  lastCommand: string | null;
  mode: VoiceMode;
  error: Error | null;

  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => void;
  setMode: (mode: VoiceMode) => void;
  clearError: () => void;

  // Status
  isSupported: boolean;
  isActive: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * React hook for voice control
 *
 * @example
 * ```tsx
 * function VoiceControlButton() {
 *   const {
 *     isListening,
 *     isProcessing,
 *     currentTranscript,
 *     startListening,
 *     stopListening,
 *     toggleListening,
 *   } = useVoiceControl({
 *     mode: 'hybrid',
 *     enableTTS: true,
 *     onCommandExecuted: (result) => {
 *       console.log('Command executed:', result);
 *     },
 *   });
 *
 *   return (
 *     <button onClick={toggleListening}>
 *       {isListening ? 'Stop' : 'Start'} Voice Control
 *       {isProcessing && <Spinner />}
 *       {currentTranscript && <p>{currentTranscript}</p>}
 *     </button>
 *   );
 * }
 * ```
 */
export function useVoiceControl(options: UseVoiceControlOptions = {}): UseVoiceControlReturn {
  // State from VoiceController
  const [controllerState, setControllerState] = useState<VoiceControllerState>(voiceController.getState());

  // Options
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // ==========================================================================
  // Initialization & Cleanup
  // ==========================================================================

  useEffect(() => {
    logger.info('[useVoiceControl] Hook mounted', { options });

    // Set mode if specified
    if (options.mode) {
      voiceController.setMode(options.mode);
    }

    // Register callbacks
    voiceController.setOnStateChange((state) => {
      setControllerState(state);
    });

    if (options.onCommandExecuted) {
      voiceController.setOnCommandExecuted(options.onCommandExecuted);
    }

    if (options.onError) {
      voiceController.setOnError(options.onError);
    }

    // Auto-start if requested
    if (options.autoStart) {
      voiceController.startListening().catch((error) => {
        logger.error('[useVoiceControl] Auto-start failed', { error });
        optionsRef.current.onError?.(error);
      });
    }

    // Cleanup on unmount
    return () => {
      logger.info('[useVoiceControl] Hook unmounting');
      voiceController.stopListening();
    };
  }, []); // Empty deps - run once on mount

  // ==========================================================================
  // Actions
  // ==========================================================================

  const startListening = useCallback(async () => {
    try {
      await voiceController.startListening();
    } catch (error) {
      logger.error('[useVoiceControl] Start listening failed', { error });
      optionsRef.current.onError?.(error as Error);
      throw error;
    }
  }, []);

  const stopListening = useCallback(() => {
    voiceController.stopListening();
  }, []);

  const toggleListening = useCallback(() => {
    if (controllerState.isListening) {
      stopListening();
    } else {
      startListening().catch((error) => {
        logger.error('[useVoiceControl] Toggle listening failed', { error });
      });
    }
  }, [controllerState.isListening, startListening, stopListening]);

  const setMode = useCallback((mode: VoiceMode) => {
    voiceController.setMode(mode);
  }, []);

  const clearError = useCallback(() => {
    setControllerState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==========================================================================
  // Status
  // ==========================================================================

  const isSupported = typeof navigator !== 'undefined' &&
    ('mediaDevices' in navigator) &&
    ('getUserMedia' in navigator.mediaDevices);

  const isActive = controllerState.isListening || controllerState.isProcessing;

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    isListening: controllerState.isListening,
    isProcessing: controllerState.isProcessing,
    isSpeaking: controllerState.isSpeaking,
    currentTranscript: controllerState.currentTranscript,
    lastCommand: controllerState.lastCommand,
    mode: controllerState.mode,
    error: controllerState.error,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    setMode,
    clearError,

    // Status
    isSupported,
    isActive,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for voice command shortcuts
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useVoiceCommandShortcut('Cmd+Shift+V', () => {
 *     // Start voice control
 *   });
 * }
 * ```
 */
export function useVoiceCommandShortcut(
  key: string,
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Parse shortcut string (e.g., "Cmd+Shift+V")
      const parts = key.toLowerCase().split('+');
      const modifiers = {
        ctrl: parts.includes('ctrl'),
        cmd: parts.includes('cmd') || parts.includes('meta'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
      };
      const keyChar = parts[parts.length - 1];

      // Check if event matches shortcut
      const matches =
        event.key.toLowerCase() === keyChar &&
        event.ctrlKey === modifiers.ctrl &&
        (event.metaKey || event.ctrlKey) === modifiers.cmd &&
        event.shiftKey === modifiers.shift &&
        event.altKey === modifiers.alt;

      if (matches) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, enabled]);
}

/**
 * Hook to track voice activity (speaking detected)
 *
 * @example
 * ```tsx
 * function VoiceActivityIndicator() {
 *   const isSpeaking = useVoiceActivity();
 *   return <div>{isSpeaking ? '🔴 Speaking' : '⚪ Quiet'}</div>;
 * }
 * ```
 */
export function useVoiceActivity(threshold: number = 0.01): boolean {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const checkActivity = () => {
          if (!analyserRef.current || !mounted) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate RMS (Root Mean Square)
          const rms = Math.sqrt(
            dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length
          ) / 255;

          setIsSpeaking(rms > threshold);

          animationFrameRef.current = requestAnimationFrame(checkActivity);
        };

        checkActivity();
      } catch (error) {
        logger.error('[useVoiceActivity] Failed to initialize', { error });
      }
    };

    initAudioAnalysis();

    return () => {
      mounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [threshold]);

  return isSpeaking;
}
