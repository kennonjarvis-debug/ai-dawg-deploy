/**
 * Pitch Correction AudioWorklet Processor
 *
 * Performs real-time pitch correction using pitch shifting.
 * This runs on the audio rendering thread for better performance.
 */

class PitchCorrectionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Processing parameters
    this.enabled = false;
    this.strength = 0.5;
    this.targetPitch = 0;
    this.currentPitch = 0;
    this.correctionSmoothingBuffer = [];
    this.speed = 50; // in milliseconds

    // Buffer for processing
    this.inputBuffer = [];

    // Listen for parameter updates from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'updateParams':
          this.enabled = data.enabled ?? this.enabled;
          this.strength = data.strength ?? this.strength;
          this.speed = data.speed ?? this.speed;
          break;

        case 'setPitch':
          this.targetPitch = data.targetPitch;
          this.currentPitch = data.currentPitch;
          break;

        case 'reset':
          this.correctionSmoothingBuffer = [];
          break;
      }
    };
  }

  /**
   * Apply smoothing to pitch correction (prevents robotic sound)
   */
  applyCorrectionSmoothing(pitchRatio) {
    // Interpolate between original and corrected pitch
    const correctedRatio = 1 + (pitchRatio - 1) * this.strength;

    // Smooth over time (simple exponential smoothing)
    this.correctionSmoothingBuffer.push(correctedRatio);

    // Calculate buffer length based on speed and sample rate
    const maxBufferLength = Math.floor((this.speed / 1000) * sampleRate / 128);

    if (this.correctionSmoothingBuffer.length > maxBufferLength) {
      this.correctionSmoothingBuffer.shift();
    }

    const smoothedRatio = this.correctionSmoothingBuffer.reduce((a, b) => a + b, 0) /
      this.correctionSmoothingBuffer.length;

    return smoothedRatio;
  }

  /**
   * Apply pitch shift (simplified - production would use phase vocoder/PSOLA)
   */
  applyPitchShift(input, output, ratio) {
    const bufferLength = input.length;
    const stretchFactor = 1 / ratio;

    for (let i = 0; i < bufferLength; i++) {
      const sourceIndex = i * stretchFactor;
      const index0 = Math.floor(sourceIndex);
      const index1 = Math.min(index0 + 1, bufferLength - 1);
      const frac = sourceIndex - index0;

      // Linear interpolation
      const val0 = input[index0] || 0;
      const val1 = input[index1] || 0;
      output[i] = val0 * (1 - frac) + val1 * frac;
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // If no input or disabled, pass through
    if (!input || !input[0] || !this.enabled) {
      if (input && input[0] && output && output[0]) {
        output[0].set(input[0]);
      }
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];

    // If we have pitch correction data
    if (this.targetPitch > 0 && this.currentPitch > 0) {
      // Calculate pitch shift ratio
      const pitchRatio = this.targetPitch / this.currentPitch;

      // Apply correction with strength and speed
      const correctedRatio = this.applyCorrectionSmoothing(pitchRatio);

      // Apply pitch shifting
      this.applyPitchShift(inputChannel, outputChannel, correctedRatio);
    } else {
      // No pitch data - pass through
      outputChannel.set(inputChannel);
    }

    return true; // Keep processor alive
  }
}

registerProcessor('pitch-correction-processor', PitchCorrectionProcessor);
