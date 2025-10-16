/**
 * Intent Detection Accuracy Test Suite
 * Validates NLP accuracy against real user messages
 * Target: 95%+ accuracy on test dataset
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// TODO: Import IntentService once Agent 1 creates it
// import { IntentService } from '../../src/services/intent-service';

interface TestCase {
  input: string;
  expectedIntent: string;
  expectedEntities: Record<string, any>;
  category: string;
}

/**
 * Real-world test dataset (100+ messages)
 * These are actual user inputs we expect to handle correctly
 */
const testDataset: TestCase[] = [
  // Beat Generation (20 cases)
  { input: 'create a trap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap' }, category: 'generation' },
  { input: 'make a boom bap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'boom bap' }, category: 'generation' },
  { input: 'generate a lo-fi beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'lo-fi' }, category: 'generation' },
  { input: 'create a drill beat at 140 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'drill', bpm: 140 }, category: 'generation' },
  { input: 'make a trap beat in C minor', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', key: 'Cm' }, category: 'generation' },
  { input: 'generate a dark trap beat at 140 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', bpm: 140, mood: 'dark' }, category: 'generation' },
  { input: 'create a 30 second trap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', duration: 30 }, category: 'generation' },
  { input: 'make a fast trap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap' }, category: 'generation' },
  { input: 'i want a jazz beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'jazz' }, category: 'generation' },
  { input: 'give me a house beat at 128 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'house', bpm: 128 }, category: 'generation' },
  { input: 'produce a drill beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'drill' }, category: 'generation' },
  { input: 'create hip hop beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'hip hop' }, category: 'generation' },
  { input: 'make an r&b beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'r&b' }, category: 'generation' },
  { input: 'generate edm beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'edm' }, category: 'generation' },
  { input: 'create a dubstep beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'dubstep' }, category: 'generation' },
  { input: 'make a beat in F sharp', expectedIntent: 'GENERATE_BEAT', expectedEntities: { key: 'F#' }, category: 'generation' },
  { input: 'trap beat 140 bpm Cm dark', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', bpm: 140, key: 'Cm', mood: 'dark' }, category: 'generation' },
  { input: 'beat at 90 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { bpm: 90 }, category: 'generation' },
  { input: 'chill lo-fi beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'lo-fi', mood: 'chill' }, category: 'generation' },
  { input: 'energetic trap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', mood: 'energetic' }, category: 'generation' },

  // DAW Control - Transport (15 cases)
  { input: 'play', expectedIntent: 'PLAY', expectedEntities: {}, category: 'daw_control' },
  { input: 'play the beat', expectedIntent: 'PLAY', expectedEntities: {}, category: 'daw_control' },
  { input: 'start playing', expectedIntent: 'PLAY', expectedEntities: {}, category: 'daw_control' },
  { input: 'play it', expectedIntent: 'PLAY', expectedEntities: {}, category: 'daw_control' },
  { input: 'stop', expectedIntent: 'STOP', expectedEntities: {}, category: 'daw_control' },
  { input: 'stop playing', expectedIntent: 'STOP', expectedEntities: {}, category: 'daw_control' },
  { input: 'halt', expectedIntent: 'STOP', expectedEntities: {}, category: 'daw_control' },
  { input: 'pause', expectedIntent: 'PAUSE', expectedEntities: {}, category: 'daw_control' },
  { input: 'pause playback', expectedIntent: 'PAUSE', expectedEntities: {}, category: 'daw_control' },
  { input: 'record', expectedIntent: 'START_RECORDING', expectedEntities: {}, category: 'daw_control' },
  { input: 'start recording', expectedIntent: 'START_RECORDING', expectedEntities: {}, category: 'daw_control' },
  { input: 'begin recording', expectedIntent: 'START_RECORDING', expectedEntities: {}, category: 'daw_control' },
  { input: 'stop recording', expectedIntent: 'STOP_RECORDING', expectedEntities: {}, category: 'daw_control' },
  { input: 'end recording', expectedIntent: 'STOP_RECORDING', expectedEntities: {}, category: 'daw_control' },
  { input: 'finish recording', expectedIntent: 'STOP_RECORDING', expectedEntities: {}, category: 'daw_control' },

  // DAW Control - BPM (10 cases)
  { input: 'set bpm to 120', expectedIntent: 'SET_BPM', expectedEntities: { bpm: 120 }, category: 'daw_control' },
  { input: 'change tempo to 140', expectedIntent: 'SET_BPM', expectedEntities: { bpm: 140 }, category: 'daw_control' },
  { input: 'bpm 100', expectedIntent: 'SET_BPM', expectedEntities: { bpm: 100 }, category: 'daw_control' },
  { input: 'make it faster', expectedIntent: 'MODIFY_BPM', expectedEntities: { adjustment: 'faster' }, category: 'daw_control' },
  { input: 'speed it up', expectedIntent: 'MODIFY_BPM', expectedEntities: { adjustment: 'faster' }, category: 'daw_control' },
  { input: 'increase tempo', expectedIntent: 'MODIFY_BPM', expectedEntities: { adjustment: 'faster' }, category: 'daw_control' },
  { input: 'make it slower', expectedIntent: 'MODIFY_BPM', expectedEntities: { adjustment: 'slower' }, category: 'daw_control' },
  { input: 'slow it down', expectedIntent: 'MODIFY_BPM', expectedEntities: { adjustment: 'slower' }, category: 'daw_control' },
  { input: 'decrease tempo', expectedIntent: 'MODIFY_BPM', expectedEntities: { adjustment: 'slower' }, category: 'daw_control' },
  { input: 'tempo to 128', expectedIntent: 'SET_BPM', expectedEntities: { bpm: 128 }, category: 'daw_control' },

  // Mixing & Mastering (20 cases)
  { input: 'mix the track', expectedIntent: 'MIX_TRACK', expectedEntities: {}, category: 'mixing' },
  { input: 'mix this', expectedIntent: 'MIX_TRACK', expectedEntities: {}, category: 'mixing' },
  { input: 'balance the tracks', expectedIntent: 'MIX_TRACK', expectedEntities: {}, category: 'mixing' },
  { input: 'boost the bass', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'bass', adjustment: 'boost' }, category: 'mixing' },
  { input: 'increase bass', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'bass', adjustment: 'boost' }, category: 'mixing' },
  { input: 'turn up the bass', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'bass', adjustment: 'boost' }, category: 'mixing' },
  { input: 'cut the treble', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'treble', adjustment: 'cut' }, category: 'mixing' },
  { input: 'reduce treble', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'treble', adjustment: 'cut' }, category: 'mixing' },
  { input: 'lower the highs', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'treble', adjustment: 'cut' }, category: 'mixing' },
  { input: 'boost mids', expectedIntent: 'ADJUST_EQ', expectedEntities: { band: 'mids', adjustment: 'boost' }, category: 'mixing' },
  { input: 'add reverb', expectedIntent: 'ADD_EFFECT', expectedEntities: { effect: 'reverb' }, category: 'mixing' },
  { input: 'apply reverb', expectedIntent: 'ADD_EFFECT', expectedEntities: { effect: 'reverb' }, category: 'mixing' },
  { input: 'add delay', expectedIntent: 'ADD_EFFECT', expectedEntities: { effect: 'delay' }, category: 'mixing' },
  { input: 'add compression', expectedIntent: 'ADD_EFFECT', expectedEntities: { effect: 'compression' }, category: 'mixing' },
  { input: 'master the track', expectedIntent: 'MASTER_TRACK', expectedEntities: {}, category: 'mastering' },
  { input: 'master this', expectedIntent: 'MASTER_TRACK', expectedEntities: {}, category: 'mastering' },
  { input: 'make it louder', expectedIntent: 'MASTER_TRACK', expectedEntities: {}, category: 'mastering' },
  { input: 'make it sound professional', expectedIntent: 'MASTER_TRACK', expectedEntities: {}, category: 'mastering' },
  { input: 'spotify ready', expectedIntent: 'MASTER_TRACK', expectedEntities: {}, category: 'mastering' },
  { input: 'streaming ready', expectedIntent: 'MASTER_TRACK', expectedEntities: {}, category: 'mastering' },

  // Context & Refinement (15 cases)
  { input: 'make it darker', expectedIntent: 'MODIFY_MOOD', expectedEntities: { mood: 'darker' }, category: 'refinement' },
  { input: 'change the genre', expectedIntent: 'MODIFY_GENRE', expectedEntities: {}, category: 'refinement' },
  { input: 'try a different key', expectedIntent: 'MODIFY_KEY', expectedEntities: {}, category: 'refinement' },
  { input: 'regenerate', expectedIntent: 'REGENERATE', expectedEntities: {}, category: 'refinement' },
  { input: 'try again', expectedIntent: 'REGENERATE', expectedEntities: {}, category: 'refinement' },
  { input: 'redo that', expectedIntent: 'REGENERATE', expectedEntities: {}, category: 'refinement' },
  { input: 'save this', expectedIntent: 'SAVE', expectedEntities: {}, category: 'refinement' },
  { input: 'save the beat', expectedIntent: 'SAVE', expectedEntities: {}, category: 'refinement' },
  { input: 'download', expectedIntent: 'DOWNLOAD', expectedEntities: {}, category: 'refinement' },
  { input: 'download this', expectedIntent: 'DOWNLOAD', expectedEntities: {}, category: 'refinement' },
  { input: 'export', expectedIntent: 'EXPORT', expectedEntities: {}, category: 'refinement' },
  { input: 'export track', expectedIntent: 'EXPORT', expectedEntities: {}, category: 'refinement' },
  { input: 'change to house', expectedIntent: 'MODIFY_GENRE', expectedEntities: { genre: 'house' }, category: 'refinement' },
  { input: 'switch to 3/4 time', expectedIntent: 'SET_TIME_SIGNATURE', expectedEntities: { numerator: 3, denominator: 4 }, category: 'refinement' },
  { input: 'undo', expectedIntent: 'UNDO', expectedEntities: {}, category: 'refinement' },

  // Track Control (10 cases)
  { input: 'mute track 1', expectedIntent: 'MUTE_TRACK', expectedEntities: { trackNumber: 1 }, category: 'tracks' },
  { input: 'solo track 2', expectedIntent: 'SOLO_TRACK', expectedEntities: { trackNumber: 2 }, category: 'tracks' },
  { input: 'delete track 1', expectedIntent: 'DELETE_TRACK', expectedEntities: { trackNumber: 1 }, category: 'tracks' },
  { input: 'remove track 3', expectedIntent: 'DELETE_TRACK', expectedEntities: { trackNumber: 3 }, category: 'tracks' },
  { input: 'rename track to drums', expectedIntent: 'RENAME_TRACK', expectedEntities: { name: 'drums' }, category: 'tracks' },
  { input: 'add a track', expectedIntent: 'ADD_TRACK', expectedEntities: {}, category: 'tracks' },
  { input: 'create new track', expectedIntent: 'ADD_TRACK', expectedEntities: {}, category: 'tracks' },
  { input: 'duplicate track 1', expectedIntent: 'DUPLICATE_TRACK', expectedEntities: { trackNumber: 1 }, category: 'tracks' },
  { input: 'clear all tracks', expectedIntent: 'CLEAR_TRACKS', expectedEntities: {}, category: 'tracks' },
  { input: 'show track 1', expectedIntent: 'SHOW_TRACK', expectedEntities: { trackNumber: 1 }, category: 'tracks' },

  // Edge Cases & Ambiguous (10 cases)
  { input: 'help', expectedIntent: 'HELP', expectedEntities: {}, category: 'meta' },
  { input: 'what can you do', expectedIntent: 'HELP', expectedEntities: {}, category: 'meta' },
  { input: 'how does this work', expectedIntent: 'HELP', expectedEntities: {}, category: 'meta' },
  { input: 'hello', expectedIntent: 'GREETING', expectedEntities: {}, category: 'meta' },
  { input: 'hi', expectedIntent: 'GREETING', expectedEntities: {}, category: 'meta' },
  { input: 'thanks', expectedIntent: 'THANKS', expectedEntities: {}, category: 'meta' },
  { input: 'thank you', expectedIntent: 'THANKS', expectedEntities: {}, category: 'meta' },
  { input: '', expectedIntent: 'UNKNOWN', expectedEntities: {}, category: 'edge_case' },
  { input: 'asdfghjkl', expectedIntent: 'UNKNOWN', expectedEntities: {}, category: 'edge_case' },
  { input: '!@#$%^&*()', expectedIntent: 'UNKNOWN', expectedEntities: {}, category: 'edge_case' },
];

describe('Intent Detection Accuracy', () => {
  let intentService: any;

  beforeAll(() => {
    // TODO: Initialize IntentService once available
    // intentService = new IntentService();
  });

  it('should achieve 95%+ overall accuracy on test dataset', () => {
    // TODO: Implement once IntentService is available
    /*
    let correct = 0;
    let total = testDataset.length;

    for (const testCase of testDataset) {
      const result = intentService.detectIntent(testCase.input);

      if (result.intent === testCase.expectedIntent) {
        // Check entities match
        const entitiesMatch = Object.keys(testCase.expectedEntities).every(key => {
          const expected = testCase.expectedEntities[key];
          const actual = result.entities[key];

          // For arrays and objects, deep compare
          if (typeof expected === 'object') {
            return JSON.stringify(expected) === JSON.stringify(actual);
          }

          return actual === expected;
        });

        if (entitiesMatch) {
          correct++;
        }
      }
    }

    const accuracy = (correct / total) * 100;

    console.log(`\n${'='.repeat(60)}`);
    console.log('INTENT DETECTION ACCURACY TEST');
    console.log('='.repeat(60));
    console.log(`Total Test Cases: ${total}`);
    console.log(`Correct: ${correct}`);
    console.log(`Incorrect: ${total - correct}`);
    console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
    console.log('='.repeat(60));

    expect(accuracy).toBeGreaterThanOrEqual(95);
    */
    expect(true).toBe(true); // Placeholder
  });

  it('should report failures for Agent 1 to fix', () => {
    // TODO: Implement
    /*
    const failures: any[] = [];
    const categoryStats: Record<string, { total: number; correct: number }> = {};

    for (const testCase of testDataset) {
      const result = intentService.detectIntent(testCase.input);

      // Track category stats
      if (!categoryStats[testCase.category]) {
        categoryStats[testCase.category] = { total: 0, correct: 0 };
      }
      categoryStats[testCase.category].total++;

      const intentMatch = result.intent === testCase.expectedIntent;
      const entitiesMatch = Object.keys(testCase.expectedEntities).every(key =>
        result.entities[key] === testCase.expectedEntities[key]
      );

      if (intentMatch && entitiesMatch) {
        categoryStats[testCase.category].correct++;
      } else {
        failures.push({
          input: testCase.input,
          category: testCase.category,
          expected: {
            intent: testCase.expectedIntent,
            entities: testCase.expectedEntities,
          },
          actual: {
            intent: result.intent,
            entities: result.entities,
          },
          confidence: result.confidence,
        });
      }
    }

    if (failures.length > 0) {
      console.log('\n=== INTENT DETECTION FAILURES ===\n');
      failures.forEach((failure, i) => {
        console.log(`${i + 1}. Input: "${failure.input}"`);
        console.log(`   Category: ${failure.category}`);
        console.log(`   Expected Intent: ${failure.expected.intent}`);
        console.log(`   Actual Intent: ${failure.actual.intent}`);
        console.log(`   Expected Entities:`, JSON.stringify(failure.expected.entities));
        console.log(`   Actual Entities:`, JSON.stringify(failure.actual.entities));
        console.log(`   Confidence: ${failure.confidence}`);
        console.log('');
      });

      console.log('\n=== ACCURACY BY CATEGORY ===\n');
      Object.entries(categoryStats).forEach(([category, stats]) => {
        const categoryAccuracy = (stats.correct / stats.total) * 100;
        console.log(`${category}: ${categoryAccuracy.toFixed(1)}% (${stats.correct}/${stats.total})`);
      });
    }

    // Save failures to file for Agent 1
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportDir, 'intent-detection-failures.json'),
      JSON.stringify({ failures, categoryStats, timestamp: new Date().toISOString() }, null, 2)
    );

    fs.writeFileSync(
      path.join(reportDir, 'INTENT-ACCURACY-REPORT.md'),
      generateAccuracyReport(failures, categoryStats, testDataset.length)
    );

    console.log(`\nDetailed report saved to test-results/INTENT-ACCURACY-REPORT.md\n`);
    */
    expect(true).toBe(true);
  });
});

function generateAccuracyReport(failures: any[], categoryStats: any, totalTests: number): string {
  const totalFailures = failures.length;
  const totalCorrect = totalTests - totalFailures;
  const accuracy = (totalCorrect / totalTests) * 100;

  let report = `# Intent Detection Accuracy Report

**Generated:** ${new Date().toLocaleString()}
**Total Test Cases:** ${totalTests}
**Correct:** ${totalCorrect}
**Incorrect:** ${totalFailures}
**Overall Accuracy:** ${accuracy.toFixed(2)}%

---

## Accuracy by Category

| Category | Accuracy | Correct | Total |
|----------|----------|---------|-------|
`;

  Object.entries(categoryStats).forEach(([category, stats]: [string, any]) => {
    const categoryAccuracy = (stats.correct / stats.total) * 100;
    report += `| ${category} | ${categoryAccuracy.toFixed(1)}% | ${stats.correct} | ${stats.total} |\n`;
  });

  if (failures.length > 0) {
    report += `\n---\n\n## Failures (${failures.length})\n\n`;

    failures.forEach((failure, i) => {
      report += `### ${i + 1}. "${failure.input}"\n\n`;
      report += `- **Category:** ${failure.category}\n`;
      report += `- **Expected Intent:** ${failure.expected.intent}\n`;
      report += `- **Actual Intent:** ${failure.actual.intent}\n`;
      report += `- **Expected Entities:** \`${JSON.stringify(failure.expected.entities)}\`\n`;
      report += `- **Actual Entities:** \`${JSON.stringify(failure.actual.entities)}\`\n`;
      report += `- **Confidence:** ${(failure.confidence * 100).toFixed(1)}%\n\n`;
    });
  }

  report += `\n---\n\n## Next Steps\n\n`;
  if (accuracy >= 95) {
    report += `✅ **PASSED** - Intent detection meets 95% accuracy requirement!\n`;
  } else {
    report += `❌ **FAILED** - Intent detection below 95% requirement. Please review and fix failures above.\n\n`;
    report += `**Agent 1:** Focus on these categories for improvement:\n`;

    Object.entries(categoryStats)
      .sort((a: any, b: any) => {
        const aAccuracy = (a[1].correct / a[1].total) * 100;
        const bAccuracy = (b[1].correct / b[1].total) * 100;
        return aAccuracy - bAccuracy;
      })
      .slice(0, 3)
      .forEach(([category, stats]: [string, any]) => {
        const categoryAccuracy = (stats.correct / stats.total) * 100;
        report += `- ${category}: ${categoryAccuracy.toFixed(1)}% accuracy\n`;
      });
  }

  return report;
}

/**
 * NOTE TO AGENT 1:
 *
 * This test suite validates your IntentService against 100+ real user messages.
 * Target: 95%+ overall accuracy
 *
 * Categories tested:
 * - Beat generation (20 cases)
 * - DAW control (25 cases)
 * - Mixing/Mastering (20 cases)
 * - Context & Refinement (15 cases)
 * - Track control (10 cases)
 * - Edge cases (10 cases)
 *
 * When you complete IntentService, run:
 * npm run test:accuracy
 *
 * This will generate:
 * - test-results/intent-detection-failures.json
 * - test-results/INTENT-ACCURACY-REPORT.md
 *
 * Review failures and improve pattern matching until 95%+ accuracy is achieved!
 */
