/**
 * AudioWorklet Processor for Recording
 * Replaces the deprecated ScriptProcessorNode with modern AudioWorklet API
 *
 * This processor runs in a separate audio rendering thread for better performance
 * and more consistent timing compared to ScriptProcessorNode.
 */

// Type definitions for AudioWorkletProcessor (may not be in all TypeScript versions)
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: typeof AudioWorkletProcessor
): void;

interface RecordingProcessorMessage {
  type: 'audioData' | 'level';
  data?: Float32Array;
  level?: number;
}

/**
 * RecordingProcessor - Captures audio data and calculates RMS levels
 */
class RecordingProcessor extends AudioWorkletProcessor {
  private isRecording: boolean = false;
  private bufferSize: number = 4096;
  private buffer: Float32Array[] = [];
  private bufferSampleCount: number = 0;

  constructor() {
    super();

    // Listen for messages from the main thread
    this.port.onmessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'start':
          this.isRecording = true;
          this.buffer = [];
          this.bufferSampleCount = 0;
          break;

        case 'stop':
          this.isRecording = false;
          break;

        case 'configure':
          if (data?.bufferSize) {
            this.bufferSize = data.bufferSize;
          }
          break;
      }
    };
  }

  /**
   * Process audio data - called for each 128 sample block
   * This runs on the audio rendering thread
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];

    // If no input, keep processor alive
    if (!input || input.length === 0) {
      return true;
    }

    // Get the first channel (mono recording)
    const inputChannel = input[0];

    if (!inputChannel) {
      return true;
    }

    // Only process if recording is active
    if (this.isRecording) {
      // Accumulate samples into buffer
      this.buffer.push(new Float32Array(inputChannel));
      this.bufferSampleCount += inputChannel.length;

      // When we have accumulated enough samples, send to main thread
      if (this.bufferSampleCount >= this.bufferSize) {
        // Combine accumulated buffers
        const combined = new Float32Array(this.bufferSampleCount);
        let offset = 0;

        for (const chunk of this.buffer) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        // Send audio data to main thread
        this.port.postMessage({
          type: 'audioData',
          data: combined,
        } as RecordingProcessorMessage);

        // Calculate and send RMS level
        const rms = this.calculateRMS(combined);
        this.port.postMessage({
          type: 'level',
          level: rms,
        } as RecordingProcessorMessage);

        // Reset buffer
        this.buffer = [];
        this.bufferSampleCount = 0;
      }
    }

    // Pass through audio unchanged
    if (outputs[0] && outputs[0][0] && inputChannel) {
      outputs[0][0].set(inputChannel);
    }

    // Return true to keep processor alive
    return true;
  }

  /**
   * Calculate RMS (Root Mean Square) for level metering
   */
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }
}

// Register the processor
registerProcessor('recording-processor', RecordingProcessor);

export {}; // Make this a module
