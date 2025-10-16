/**
 * Intent Service Tests
 * Validates intent detection accuracy across 50+ test cases
 */

import { IntentService } from '../../src/gateway/services/intent-service';

describe('IntentService', () => {
  let intentService: IntentService;

  beforeEach(() => {
    intentService = new IntentService();
  });

  // ====================================
  // BEAT GENERATION TESTS (15 cases)
  // ====================================

  describe('Beat Generation Intent', () => {
    const beatTestCases = [
      {
        input: 'create a trap beat',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'trap',
      },
      {
        input: 'make a lo-fi beat at 80 bpm',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'lo-fi',
        expectedBpm: 80,
      },
      {
        input: 'generate a boom bap beat in Cm',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'boom bap',
        expectedKey: 'Cm',
      },
      {
        input: 'i want a drill beat at 140 bpm',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'drill',
        expectedBpm: 140,
      },
      {
        input: 'give me a dark trap beat',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'trap',
        expectedMood: 'dark',
      },
      {
        input: 'create a jazz instrumental',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'jazz',
      },
      {
        input: 'make a fast beat',
        expectedIntent: 'GENERATE_BEAT',
        expectedBpm: 140,
      },
      {
        input: 'produce a chill lo-fi track',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'lo-fi',
        expectedMood: 'chill',
      },
      {
        input: 'create a 16 bar beat',
        expectedIntent: 'GENERATE_BEAT',
        expectedDuration: 32,
      },
      {
        input: 'make an energetic house beat at 128 bpm',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'house',
        expectedBpm: 128,
        expectedMood: 'energetic',
      },
      {
        input: 'i need a hip hop beat in F#',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'hip hop',
        expectedKey: 'F#',
      },
      {
        input: 'give me a slow sad beat',
        expectedIntent: 'GENERATE_BEAT',
        expectedBpm: 80,
        expectedMood: 'sad',
      },
      {
        input: 'create a dubstep track',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'dubstep',
      },
      {
        input: 'make a 120 bpm pop beat',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'pop',
        expectedBpm: 120,
      },
      {
        input: 'produce a techno beat with a dark mood',
        expectedIntent: 'GENERATE_BEAT',
        expectedGenre: 'techno',
        expectedMood: 'dark',
      },
    ];

    beatTestCases.forEach(({ input, expectedIntent, expectedGenre, expectedBpm, expectedKey, expectedMood, expectedDuration }) => {
      test(`should detect "${input}"`, () => {
        const result = intentService.detectIntent(input);

        expect(result.intent).toBe(expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.7);

        if (expectedGenre) {
          expect(result.entities.genre).toBe(expectedGenre);
        }
        if (expectedBpm) {
          expect(result.entities.bpm).toBe(expectedBpm);
        }
        if (expectedKey) {
          expect(result.entities.key).toBe(expectedKey);
        }
        if (expectedMood) {
          expect(result.entities.mood).toBe(expectedMood);
        }
        if (expectedDuration) {
          expect(result.entities.duration).toBe(expectedDuration);
        }
      });
    });
  });

  // ====================================
  // MIXING TESTS (12 cases)
  // ====================================

  describe('Mixing Intent', () => {
    const mixingTestCases = [
      {
        input: 'mix this track',
        expectedIntent: 'MIX_TRACK',
      },
      {
        input: 'add reverb',
        expectedIntent: 'MIX_TRACK',
        expectedEffect: 'reverb',
      },
      {
        input: 'apply compression',
        expectedIntent: 'MIX_TRACK',
        expectedEffect: 'compression',
      },
      {
        input: 'boost the bass',
        expectedIntent: 'MIX_TRACK',
        expectedParameter: 'bass',
      },
      {
        input: 'turn up the vocals',
        expectedIntent: 'MIX_TRACK',
        expectedParameter: 'vocals',
      },
      {
        input: 'make it sound brighter',
        expectedIntent: 'MIX_TRACK',
      },
      {
        input: 'add some delay',
        expectedIntent: 'MIX_TRACK',
        expectedEffect: 'delay',
      },
      {
        input: 'cut the mids',
        expectedIntent: 'MIX_TRACK',
        expectedParameter: 'mids',
      },
      {
        input: 'make it warmer',
        expectedIntent: 'MIX_TRACK',
      },
      {
        input: 'balance the tracks',
        expectedIntent: 'MIX_TRACK',
      },
      {
        input: 'add eq to the drums',
        expectedIntent: 'MIX_TRACK',
        expectedEffect: 'eq',
      },
      {
        input: 'make it punchier',
        expectedIntent: 'MIX_TRACK',
      },
    ];

    mixingTestCases.forEach(({ input, expectedIntent, expectedEffect, expectedParameter }) => {
      test(`should detect "${input}"`, () => {
        const result = intentService.detectIntent(input);

        expect(result.intent).toBe(expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.7);

        if (expectedEffect) {
          expect(result.entities.effect).toBe(expectedEffect);
        }
        if (expectedParameter) {
          expect(result.entities.parameter).toBe(expectedParameter);
        }
      });
    });
  });

  // ====================================
  // MASTERING TESTS (8 cases)
  // ====================================

  describe('Mastering Intent', () => {
    const masteringTestCases = [
      {
        input: 'master this track',
        expectedIntent: 'MASTER_TRACK',
      },
      {
        input: 'make it louder',
        expectedIntent: 'MASTER_TRACK',
      },
      {
        input: 'master at -14 LUFS',
        expectedIntent: 'MASTER_TRACK',
        expectedValue: -14,
      },
      {
        input: 'make it streaming ready',
        expectedIntent: 'MASTER_TRACK',
      },
      {
        input: 'spotify ready master',
        expectedIntent: 'MASTER_TRACK',
      },
      {
        input: 'make it professional',
        expectedIntent: 'MASTER_TRACK',
      },
      {
        input: 'finalize this mix',
        expectedIntent: 'MASTER_TRACK',
      },
      {
        input: 'apply final polish',
        expectedIntent: 'MASTER_TRACK',
      },
    ];

    masteringTestCases.forEach(({ input, expectedIntent, expectedValue }) => {
      test(`should detect "${input}"`, () => {
        const result = intentService.detectIntent(input);

        expect(result.intent).toBe(expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.7);

        if (expectedValue) {
          expect(result.entities.value).toBe(expectedValue);
        }
      });
    });
  });

  // ====================================
  // DAW CONTROL TESTS (15 cases)
  // ====================================

  describe('DAW Control Intent', () => {
    const dawControlTestCases = [
      {
        input: 'play the track',
        expectedIntent: 'DAW_PLAY',
      },
      {
        input: 'stop playback',
        expectedIntent: 'DAW_STOP',
      },
      {
        input: 'pause',
        expectedIntent: 'DAW_STOP',
      },
      {
        input: 'start recording',
        expectedIntent: 'DAW_RECORD',
      },
      {
        input: 'record',
        expectedIntent: 'DAW_RECORD',
      },
      {
        input: 'change bpm to 140',
        expectedIntent: 'DAW_SET_BPM',
        expectedBpm: 140,
      },
      {
        input: 'set tempo to 120',
        expectedIntent: 'DAW_SET_BPM',
        expectedBpm: 120,
      },
      {
        input: 'faster',
        expectedIntent: 'DAW_INCREASE_BPM',
      },
      {
        input: 'slower',
        expectedIntent: 'DAW_DECREASE_BPM',
      },
      {
        input: 'increase volume',
        expectedIntent: 'DAW_VOLUME_UP',
      },
      {
        input: 'turn down the volume',
        expectedIntent: 'DAW_VOLUME_DOWN',
      },
      {
        input: 'mute the drums',
        expectedIntent: 'DAW_MUTE',
      },
      {
        input: 'unmute',
        expectedIntent: 'DAW_UNMUTE',
      },
      {
        input: 'export the track',
        expectedIntent: 'DAW_EXPORT',
      },
      {
        input: 'bounce this',
        expectedIntent: 'DAW_EXPORT',
      },
    ];

    dawControlTestCases.forEach(({ input, expectedIntent, expectedBpm }) => {
      test(`should detect "${input}"`, () => {
        const result = intentService.detectIntent(input);

        expect(result.intent).toBe(expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.7);

        if (expectedBpm) {
          expect(result.entities.bpm).toBe(expectedBpm);
        }
      });
    });
  });

  // ====================================
  // CONTEXT & REFINEMENT TESTS (10 cases)
  // ====================================

  describe('Context Update Intent', () => {
    const contextTestCases = [
      {
        input: 'try again',
        expectedIntent: 'REGENERATE',
      },
      {
        input: 'regenerate',
        expectedIntent: 'REGENERATE',
      },
      {
        input: 'redo that',
        expectedIntent: 'REGENERATE',
      },
      {
        input: 'save this',
        expectedIntent: 'SAVE',
      },
      {
        input: 'download the track',
        expectedIntent: 'SAVE',
      },
      {
        input: 'export this beat',
        expectedIntent: 'SAVE',
      },
      {
        input: 'change the genre to trap',
        expectedIntent: 'UPDATE_PARAMETER',
        expectedGenre: 'trap',
      },
      {
        input: 'adjust the bpm to 140',
        expectedIntent: 'UPDATE_PARAMETER',
        expectedBpm: 140,
      },
      {
        input: 'darker mood',
        expectedIntent: 'UPDATE_PARAMETER',
        expectedMood: 'dark',
      },
      {
        input: 'switch to a different key',
        expectedIntent: 'UPDATE_PARAMETER',
      },
    ];

    contextTestCases.forEach(({ input, expectedIntent, expectedGenre, expectedBpm, expectedMood }) => {
      test(`should detect "${input}"`, () => {
        const result = intentService.detectIntent(input);

        expect(result.intent).toBe(expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.5);

        if (expectedGenre) {
          expect(result.entities.genre).toBe(expectedGenre);
        }
        if (expectedBpm) {
          expect(result.entities.bpm).toBe(expectedBpm);
        }
        if (expectedMood) {
          expect(result.entities.mood).toBe(expectedMood);
        }
      });
    });
  });

  // ====================================
  // PATTERN STATISTICS TEST
  // ====================================

  test('should have 35+ total patterns', () => {
    const stats = intentService.getPatternStats();

    expect(stats.totalPatterns).toBeGreaterThanOrEqual(35);
    expect(stats.categories.beatGeneration).toBeGreaterThanOrEqual(10);
    expect(stats.categories.mixing).toBeGreaterThanOrEqual(8);
    expect(stats.categories.mastering).toBeGreaterThanOrEqual(6);
    expect(stats.categories.dawControl).toBeGreaterThanOrEqual(11);
  });

  // ====================================
  // ACCURACY SUMMARY
  // ====================================

  test('overall accuracy test', () => {
    const testMessages = [
      'create a trap beat at 140 bpm',
      'add reverb to the vocals',
      'master this track',
      'play',
      'change bpm to 120',
      'try again',
      'make a lo-fi beat',
      'boost the bass',
      'make it louder',
      'stop',
    ];

    let successCount = 0;
    testMessages.forEach((msg) => {
      const result = intentService.detectIntent(msg);
      if (result.confidence > 0.7) {
        successCount++;
      }
    });

    const accuracy = (successCount / testMessages.length) * 100;
    console.log(`Intent detection accuracy: ${accuracy}%`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
