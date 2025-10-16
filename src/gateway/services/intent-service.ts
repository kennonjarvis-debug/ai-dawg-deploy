/**
 * Intent Detection Service
 * Analyzes user messages to detect intents and extract entities for music production
 */

export interface ExtractedEntities {
  genre?: string;
  bpm?: number;
  key?: string;
  mood?: string;
  duration?: number;
  target?: string;
  effect?: string;
  parameter?: string;
  value?: string | number;
  parameters?: Record<string, any>;
}

export interface IntentResult {
  intent: string;
  entities: ExtractedEntities;
  confidence: number;
  followUpQuestion?: string;
}

export class IntentService {
  // ====================================
  // BEAT GENERATION PATTERNS (10+)
  // ====================================

  private readonly BEAT_PATTERNS = [
    /(?:make|create|generate|produce|give me|i want|i need)\s+(?:a|an)?\s*(\w+)?\s*beat/i,
    /beat\s+(?:in|at|with)\s+(\d+)\s*(?:bpm)?/i,
    /(\d+)\s*bpm\s+(?:beat|instrumental)/i,
    /(\w+)\s+beat\s+(?:in|at)\s+([A-G][#b]?(?:m|maj|min|major|minor)?)/i,
    /(?:trap|drill|boom bap|lo-?fi|jazz|house|techno|hip hop|r&b|pop|edm|dubstep|drum and bass)\s+beat/i,
    /beat\s+(?:that sounds?|with a?|in a?)\s+(\w+)\s+(?:mood|vibe|feeling)/i,
    /(\w+)\s+(?:instrumental|track|vibe)/i,
    /(?:slow|chill)\s+(\w+)?\s*beat/i,
    /beat\s+around\s+(\d+)\s+(?:seconds?|minutes?)/i,
    /(?:make|create)\s+(?:a|an)?\s*(\d+)\s+(?:bar|measure)\s+beat/i,
  ];

  // ====================================
  // MIXING PATTERNS (8+)
  // ====================================

  private readonly MIX_PATTERNS = [
    /mix\s+(?:the|my|this)?\s*(?:track|song|audio|beat)?/i,
    /(?:balance|blend)\s+(?:the|my)?\s*(?:tracks|stems|instruments)/i,
    /(?:add|apply|put|use)\s+(?:some|more)?\s*(reverb|delay|echo|chorus|flanger|phaser|eq|compression|compressor)/i,
    /make\s+(?:it|this|the)\s+sound\s+(brighter|wider|cleaner|fuller|tighter)/i,
    /(?:turn up|boost|increase|raise)\s+(?:the)?\s*(bass|treble|mids?|highs?|lows?|vocals?|drums?)/i,
    /(?:turn down|cut|reduce|lower)\s+(?:the)?\s*(bass|treble|mids?|highs?|lows?|vocals?|drums?)/i,
    /(?:pan|move)\s+(?:the)?\s*(\w+)\s+(?:to the)?\s*(left|right|center)/i,
    /(?:add|apply)\s+(?:a|some)?\s*(\w+)\s+(?:effect|fx)/i,
  ];

  // ====================================
  // MASTERING PATTERNS (6+)
  // ====================================

  private readonly MASTER_PATTERNS = [
    /master\s+(?:the|my|this)?\s*(?:track|song|beat|mix)?/i,
    /make\s+(?:it|this)\s+(?:louder|professional|polished|radio ready)/i,
    /(?:loud(?:er|ness)|volume|level)\s+(?:at|to|around)\s*(-?\d+)\s*(?:LUFS|lufs|db|dB)?/i,
    /(?:streaming|spotify|apple music|youtube|soundcloud)\s+ready/i,
    /finali[sz]e\s+(?:the|my|this)?\s*(?:track|mix)/i,
    /(?:add|apply)\s+(?:final|mastering)\s+(?:touches|polish)/i,
  ];

  // ====================================
  // DAW CONTROL PATTERNS (11+)
  // ====================================

  private readonly DAW_CONTROL_PATTERNS = [
    /^(?:play|start|resume)(?:\s+(?:the)?\s*(?:track|song|beat|playback)?)?$/i,
    /(?:stop|pause|halt)\s+(?:the)?\s*(?:playback|track|song|beat)/i,
    /(?:start\s+)?recording?/i,
    /(?:stop recording|disarm)/i,
    /(?:change|set|adjust)\s+(?:the)?\s*(?:bpm|tempo)\s+(?:to)?\s*(\d+)/i,
    /(?:faster|slower|speed up|slow down)/i,
    /(?:increase|raise|boost)\s+(?:the)?\s*volume/i,
    /(?:decrease|lower|reduce|turn\s+down)\s+(?:the)?\s*volume/i,
    /(?:mute|unmute|solo)\s+(?:the)?\s*(\w+)?\s*(?:track|channel)?/i,
    /^unmute$/i,
    /(?:undo|redo)\s+(?:that|last action)?/i,
    /(?:export|bounce|render)\s+(?:the)?\s*(?:track|project|mix)?/i,
  ];

  // ====================================
  // CONTEXT & REFINEMENT PATTERNS (11+)
  // ====================================

  private readonly CONTEXT_PATTERNS = [
    /(?:change|modify|adjust|update)\s+(?:the)?\s*(\w+)/i,
    /(?:try|use|switch to)\s+(?:a different|another)\s+(\w+)/i,
    /(?:more|add more|increase)\s+(\w+)/i,
    /(?:less|reduce|decrease)\s+(\w+)/i,
    /(?:redo|regenerate|try again|remake)/i,
    /(?:save|download)\s+(?:this|that|the track)?/i,
    /(?:darker|brighter|heavier|lighter)\s+(?:mood|vibe)?/i,
    /^(?:darker|lighter|heavier|brighter|more|less)\s+(\w+)/i,
    /make\s+it\s+more\s+(\w+)/i,
    /(?:can you|could you|please)\s+(.*)/i,
    /(?:what|how)\s+(?:about|if)\s+(.*)/i,
  ];

  // ====================================
  // GENRE ENTITIES
  // ====================================

  private readonly GENRES = [
    'trap', 'drill', 'boom bap', 'boom-bap', 'lo-fi', 'lofi', 'jazz', 'house',
    'techno', 'hip hop', 'hip-hop', 'r&b', 'rnb', 'pop', 'rock', 'edm',
    'dubstep', 'drum and bass', 'dnb', 'ambient', 'chillwave', 'vaporwave',
    'synthwave', 'funk', 'soul', 'reggae', 'dancehall', 'afrobeat',
  ];

  // ====================================
  // MOOD ENTITIES
  // ====================================

  private readonly MOODS = [
    'dark', 'chill', 'energetic', 'upbeat', 'sad', 'happy', 'angry',
    'peaceful', 'aggressive', 'melancholic', 'euphoric', 'mysterious',
    'dramatic', 'romantic', 'intense', 'relaxing', 'dreamy', 'gritty',
  ];

  // ====================================
  // MUSICAL KEYS
  // ====================================

  private readonly KEYS = [
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
  ];

  // ====================================
  // MAIN DETECTION METHOD
  // ====================================

  detectIntent(message: string): IntentResult {
    const normalizedMessage = message.trim();

    // Try each intent category in priority order
    let result: IntentResult | null = null;

    // 1. Check for beat generation
    result = this.detectBeatGeneration(normalizedMessage);
    if (result && result.confidence > 0.7) return result;

    // 2. Check for mixing requests
    result = this.detectMixing(normalizedMessage);
    if (result && result.confidence > 0.7) return result;

    // 3. Check for mastering requests
    result = this.detectMastering(normalizedMessage);
    if (result && result.confidence > 0.7) return result;

    // 4. Check for DAW control
    result = this.detectDAWControl(normalizedMessage);
    if (result && result.confidence > 0.7) return result;

    // 5. Check for context/refinement
    result = this.detectContextUpdate(normalizedMessage);
    if (result && result.confidence > 0.5) return result;

    // Default: conversational
    return {
      intent: 'CONVERSATIONAL',
      entities: {},
      confidence: 0.3,
      followUpQuestion: 'I can help you create beats, mix tracks, or control the DAW. What would you like to do?',
    };
  }

  // ====================================
  // BEAT GENERATION DETECTION
  // ====================================

  private detectBeatGeneration(message: string): IntentResult | null {
    for (const pattern of this.BEAT_PATTERNS) {
      if (pattern.test(message)) {
        const entities = this.extractBeatEntities(message);
        return {
          intent: 'GENERATE_BEAT',
          entities,
          confidence: this.calculateConfidence(entities),
          followUpQuestion: this.generateBeatFollowUp(entities),
        };
      }
    }
    return null;
  }

  private extractBeatEntities(message: string): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // Extract genre
    const genre = this.extractGenre(message);
    if (genre) entities.genre = genre;

    // Extract BPM
    const bpm = this.extractBPM(message);
    if (bpm) entities.bpm = bpm;

    // Extract key
    const key = this.extractKey(message);
    if (key) entities.key = key;

    // Extract mood
    const mood = this.extractMood(message);
    if (mood) entities.mood = mood;

    // Extract duration
    const duration = this.extractDuration(message);
    if (duration) entities.duration = duration;

    return entities;
  }

  // ====================================
  // MIXING DETECTION
  // ====================================

  private detectMixing(message: string): IntentResult | null {
    for (const pattern of this.MIX_PATTERNS) {
      const match = pattern.exec(message);
      if (match) {
        const entities = this.extractMixEntities(message, match);
        return {
          intent: 'MIX_TRACK',
          entities,
          confidence: 0.9,
        };
      }
    }
    return null;
  }

  private extractMixEntities(message: string, match: RegExpExecArray): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // Check if it's a boost/turn up pattern (parameter, not effect)
    if (/(?:turn up|boost|increase|raise|turn down|cut|reduce|lower)/i.test(message)) {
      const paramMatch = message.match(/(?:turn up|boost|increase|raise|turn down|cut|reduce|lower)\s+(?:the)?\s*(\w+)/i);
      if (paramMatch) {
        entities.parameter = paramMatch[1].toLowerCase();
      }
    } else {
      // Extract effect type (reverb, delay, eq, etc.)
      if (match[1]) {
        entities.effect = match[1].toLowerCase();
      }

      // Extract parameter (bass, treble, vocals, etc.)
      if (match[2]) {
        entities.parameter = match[2].toLowerCase();
      }
    }

    // Extract value if present
    const valueMatch = message.match(/(\d+)%?/);
    if (valueMatch) {
      entities.value = parseInt(valueMatch[1]);
    }

    return entities;
  }

  // ====================================
  // MASTERING DETECTION
  // ====================================

  private detectMastering(message: string): IntentResult | null {
    for (const pattern of this.MASTER_PATTERNS) {
      const match = pattern.exec(message);
      if (match) {
        const entities: ExtractedEntities = {};

        // Extract target LUFS
        if (match[1]) {
          entities.value = parseFloat(match[1]);
          entities.parameter = 'lufs';
        }

        // Check for streaming platforms
        if (/spotify|streaming|apple music/i.test(message)) {
          entities.parameters = { target: 'streaming', lufs: -14 };
        }

        return {
          intent: 'MASTER_TRACK',
          entities,
          confidence: 0.95,
        };
      }
    }
    return null;
  }

  // ====================================
  // DAW CONTROL DETECTION
  // ====================================

  private detectDAWControl(message: string): IntentResult | null {
    // Play/Start
    if (/(?:play|start|resume)/i.test(message)) {
      return { intent: 'DAW_PLAY', entities: {}, confidence: 0.95 };
    }

    // Stop/Pause
    if (/(?:stop|pause|halt)/i.test(message)) {
      return { intent: 'DAW_STOP', entities: {}, confidence: 0.95 };
    }

    // Record
    if (/(?:record|start recording|arm)/i.test(message)) {
      return { intent: 'DAW_RECORD', entities: {}, confidence: 0.95 };
    }

    // BPM change
    const bpmMatch = message.match(/(?:change|set|adjust)\s+(?:the)?\s*(?:bpm|tempo)\s+(?:to)?\s*(\d+)/i);
    if (bpmMatch) {
      return {
        intent: 'DAW_SET_BPM',
        entities: { bpm: parseInt(bpmMatch[1]) },
        confidence: 0.98,
      };
    }

    // Faster/Slower
    if (/faster|speed up/i.test(message)) {
      return { intent: 'DAW_INCREASE_BPM', entities: {}, confidence: 0.9 };
    }
    if (/slower|slow down/i.test(message)) {
      return { intent: 'DAW_DECREASE_BPM', entities: {}, confidence: 0.9 };
    }

    // Volume
    if (/(?:increase|raise|boost)\s+(?:the)?\s*volume/i.test(message)) {
      return { intent: 'DAW_VOLUME_UP', entities: {}, confidence: 0.9 };
    }
    if (/(?:decrease|lower|reduce)\s+(?:the)?\s*volume/i.test(message)) {
      return { intent: 'DAW_VOLUME_DOWN', entities: {}, confidence: 0.9 };
    }

    // Mute/Solo
    const muteMatch = message.match(/(?:mute|unmute|solo)\s+(?:the)?\s*(\w+)?/i);
    if (muteMatch) {
      return {
        intent: message.toLowerCase().includes('unmute') ? 'DAW_UNMUTE' : 'DAW_MUTE',
        entities: { target: muteMatch[1] || 'current' },
        confidence: 0.9,
      };
    }

    // Export
    if (/(?:export|bounce|render)/i.test(message)) {
      return { intent: 'DAW_EXPORT', entities: {}, confidence: 0.95 };
    }

    return null;
  }

  // ====================================
  // CONTEXT UPDATE DETECTION
  // ====================================

  private detectContextUpdate(message: string): IntentResult | null {
    // Redo/Regenerate
    if (/(?:redo|regenerate|try again|remake)/i.test(message)) {
      return { intent: 'REGENERATE', entities: {}, confidence: 0.85 };
    }

    // Save/Export
    if (/(?:save|export|download)/i.test(message)) {
      return { intent: 'SAVE', entities: {}, confidence: 0.9 };
    }

    // Parameter adjustments
    const adjustMatch = message.match(/(?:change|modify|adjust)\s+(?:the)?\s*(\w+)/i);
    if (adjustMatch) {
      const parameter = adjustMatch[1].toLowerCase();
      const entities: ExtractedEntities = { parameter };

      // Check what they want to change to
      const genre = this.extractGenre(message);
      const bpm = this.extractBPM(message);
      const key = this.extractKey(message);
      const mood = this.extractMood(message);

      if (genre) entities.genre = genre;
      if (bpm) entities.bpm = bpm;
      if (key) entities.key = key;
      if (mood) entities.mood = mood;

      return {
        intent: 'UPDATE_PARAMETER',
        entities,
        confidence: 0.8,
      };
    }

    return null;
  }

  // ====================================
  // ENTITY EXTRACTION HELPERS
  // ====================================

  private extractGenre(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    for (const genre of this.GENRES) {
      if (lowerMessage.includes(genre)) {
        return genre;
      }
    }
    return undefined;
  }

  private extractBPM(message: string): number | undefined {
    // Direct BPM mention: "140 bpm", "at 120", etc.
    const bpmMatch = message.match(/(\d+)\s*(?:bpm)?/i);
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1]);
      if (bpm >= 60 && bpm <= 200) {
        return bpm;
      }
    }

    // Qualitative BPM: "fast", "slow"
    if (/fast|quick|rapid|uptempo/i.test(message)) {
      return 140; // Default fast tempo
    }
    if (/slow|chill|downtempo/i.test(message)) {
      return 80; // Default slow tempo
    }

    return undefined;
  }

  private extractKey(message: string): string | undefined {
    // Try to find keys with sharp/flat first (F#, C#, etc.)
    const sharpFlatMatch = message.match(/\b([A-G][#b](?:m|maj|min|major|minor)?)\b/i);
    if (sharpFlatMatch) {
      return sharpFlatMatch[1];
    }

    // Then try normal keys
    for (const key of this.KEYS) {
      const pattern = new RegExp(`\\b${key.replace(/([#b])/g, '\\$1')}\\b`, 'i');
      if (pattern.test(message)) {
        return key;
      }
    }
    return undefined;
  }

  private extractMood(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    for (const mood of this.MOODS) {
      if (lowerMessage.includes(mood)) {
        return mood;
      }
    }
    return undefined;
  }

  private extractDuration(message: string): number | undefined {
    // "30 seconds", "2 minutes", "16 bars"
    const secondsMatch = message.match(/(\d+)\s*(?:seconds?|secs?)/i);
    if (secondsMatch) {
      return parseInt(secondsMatch[1]);
    }

    const minutesMatch = message.match(/(\d+)\s*(?:minutes?|mins?)/i);
    if (minutesMatch) {
      return parseInt(minutesMatch[1]) * 60;
    }

    const barsMatch = message.match(/(\d+)\s*(?:bars?|measures?)/i);
    if (barsMatch) {
      // Assume 4/4 time at 120 bpm: 1 bar = 2 seconds
      return parseInt(barsMatch[1]) * 2;
    }

    return undefined;
  }

  // ====================================
  // CONFIDENCE CALCULATION
  // ====================================

  private calculateConfidence(entities: ExtractedEntities): number {
    let confidence = 0.6; // Base confidence

    // Add confidence for each entity found
    if (entities.genre) confidence += 0.15;
    if (entities.bpm) confidence += 0.1;
    if (entities.key) confidence += 0.05;
    if (entities.mood) confidence += 0.05;
    if (entities.duration) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  // ====================================
  // FOLLOW-UP QUESTION GENERATION
  // ====================================

  private generateBeatFollowUp(entities: ExtractedEntities): string | undefined {
    const missing: string[] = [];

    if (!entities.genre) missing.push('genre');
    if (!entities.bpm) missing.push('BPM');
    if (!entities.key) missing.push('key');

    if (missing.length === 0) {
      return undefined; // All required info present
    }

    if (missing.length === 3) {
      return 'What genre would you like? (e.g., trap, lo-fi, boom bap)';
    }

    return `What ${missing.join(' and ')} would you like for this beat?`;
  }

  // ====================================
  // PATTERN STATISTICS
  // ====================================

  getPatternStats(): {
    totalPatterns: number;
    categories: Record<string, number>;
  } {
    return {
      totalPatterns:
        this.BEAT_PATTERNS.length +
        this.MIX_PATTERNS.length +
        this.MASTER_PATTERNS.length +
        this.DAW_CONTROL_PATTERNS.length +
        this.CONTEXT_PATTERNS.length,
      categories: {
        beatGeneration: this.BEAT_PATTERNS.length,
        mixing: this.MIX_PATTERNS.length,
        mastering: this.MASTER_PATTERNS.length,
        dawControl: this.DAW_CONTROL_PATTERNS.length,
        contextUpdate: this.CONTEXT_PATTERNS.length,
      },
    };
  }
}
