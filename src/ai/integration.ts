// Frontend stub for AI integration (backend implementation not included in deployment)

export class VocalCoachClient {
  constructor() {}
  async analyze() {
    return { message: 'AI backend not available in this build' };
  }
}

export class ProducerAIClient {
  constructor() {}
  async suggest() {
    return { message: 'AI backend not available in this build' };
  }
}

export function preparePitchVisualization(data: any) {
  return { pitches: [], timestamps: [] };
}

export function prepareChordVisualization(data: any) {
  return { chords: [], progression: [] };
}
