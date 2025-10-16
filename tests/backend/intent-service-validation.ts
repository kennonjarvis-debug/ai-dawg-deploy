/**
 * Intent Service Validation Script
 * Run with: tsx tests/backend/intent-service-validation.ts
 */

import { IntentService } from '../../src/gateway/services/intent-service';

const intentService = new IntentService();

interface TestCase {
  input: string;
  expectedIntent: string;
  expectedEntities?: {
    genre?: string;
    bpm?: number;
    key?: string;
    mood?: string;
    effect?: string;
    parameter?: string;
  };
}

const testCases: TestCase[] = [
  // BEAT GENERATION (15 cases)
  { input: 'create a trap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap' } },
  { input: 'make a lo-fi beat at 80 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'lo-fi', bpm: 80 } },
  { input: 'generate a boom bap beat in Cm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'boom bap', key: 'Cm' } },
  { input: 'i want a drill beat at 140 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'drill', bpm: 140 } },
  { input: 'give me a dark trap beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', mood: 'dark' } },
  { input: 'create a jazz instrumental', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'jazz' } },
  { input: 'make a fast beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { bpm: 140 } },
  { input: 'produce a chill lo-fi track', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'lo-fi', mood: 'chill' } },
  { input: 'make an energetic house beat at 128 bpm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'house', bpm: 128, mood: 'energetic' } },
  { input: 'i need a hip hop beat in F#', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'hip hop', key: 'F#' } },
  { input: 'give me a slow sad beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { bpm: 80, mood: 'sad' } },
  { input: 'create a dubstep track', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'dubstep' } },
  { input: 'make a 120 bpm pop beat', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'pop', bpm: 120 } },
  { input: 'produce a techno beat with a dark mood', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'techno', mood: 'dark' } },
  { input: 'create a 140 bpm trap beat at Cm', expectedIntent: 'GENERATE_BEAT', expectedEntities: { genre: 'trap', bpm: 140, key: 'Cm' } },

  // MIXING (12 cases)
  { input: 'mix this track', expectedIntent: 'MIX_TRACK' },
  { input: 'add reverb', expectedIntent: 'MIX_TRACK', expectedEntities: { effect: 'reverb' } },
  { input: 'apply compression', expectedIntent: 'MIX_TRACK', expectedEntities: { effect: 'compression' } },
  { input: 'boost the bass', expectedIntent: 'MIX_TRACK', expectedEntities: { parameter: 'bass' } },
  { input: 'turn up the vocals', expectedIntent: 'MIX_TRACK', expectedEntities: { parameter: 'vocals' } },
  { input: 'make it sound brighter', expectedIntent: 'MIX_TRACK' },
  { input: 'add some delay', expectedIntent: 'MIX_TRACK', expectedEntities: { effect: 'delay' } },
  { input: 'cut the mids', expectedIntent: 'MIX_TRACK', expectedEntities: { parameter: 'mids' } },
  { input: 'make it warmer', expectedIntent: 'MIX_TRACK' },
  { input: 'balance the tracks', expectedIntent: 'MIX_TRACK' },
  { input: 'add eq to the drums', expectedIntent: 'MIX_TRACK', expectedEntities: { effect: 'eq' } },
  { input: 'make it punchier', expectedIntent: 'MIX_TRACK' },

  // MASTERING (8 cases)
  { input: 'master this track', expectedIntent: 'MASTER_TRACK' },
  { input: 'make it louder', expectedIntent: 'MASTER_TRACK' },
  { input: 'make it streaming ready', expectedIntent: 'MASTER_TRACK' },
  { input: 'spotify ready master', expectedIntent: 'MASTER_TRACK' },
  { input: 'make it professional', expectedIntent: 'MASTER_TRACK' },
  { input: 'finalize this mix', expectedIntent: 'MASTER_TRACK' },
  { input: 'apply final polish', expectedIntent: 'MASTER_TRACK' },
  { input: 'make it radio ready', expectedIntent: 'MASTER_TRACK' },

  // DAW CONTROL (15 cases)
  { input: 'play the track', expectedIntent: 'DAW_PLAY' },
  { input: 'stop playback', expectedIntent: 'DAW_STOP' },
  { input: 'pause', expectedIntent: 'DAW_STOP' },
  { input: 'start recording', expectedIntent: 'DAW_RECORD' },
  { input: 'record', expectedIntent: 'DAW_RECORD' },
  { input: 'change bpm to 140', expectedIntent: 'DAW_SET_BPM', expectedEntities: { bpm: 140 } },
  { input: 'set tempo to 120', expectedIntent: 'DAW_SET_BPM', expectedEntities: { bpm: 120 } },
  { input: 'faster', expectedIntent: 'DAW_INCREASE_BPM' },
  { input: 'slower', expectedIntent: 'DAW_DECREASE_BPM' },
  { input: 'increase volume', expectedIntent: 'DAW_VOLUME_UP' },
  { input: 'turn down the volume', expectedIntent: 'DAW_VOLUME_DOWN' },
  { input: 'mute the drums', expectedIntent: 'DAW_MUTE' },
  { input: 'unmute', expectedIntent: 'DAW_UNMUTE' },
  { input: 'export the track', expectedIntent: 'DAW_EXPORT' },
  { input: 'bounce this', expectedIntent: 'DAW_EXPORT' },

  // CONTEXT & REFINEMENT (10 cases)
  { input: 'try again', expectedIntent: 'REGENERATE' },
  { input: 'regenerate', expectedIntent: 'REGENERATE' },
  { input: 'redo that', expectedIntent: 'REGENERATE' },
  { input: 'save this', expectedIntent: 'SAVE' },
  { input: 'download the track', expectedIntent: 'SAVE' },
  { input: 'export this beat', expectedIntent: 'SAVE' },
  { input: 'change the genre to trap', expectedIntent: 'UPDATE_PARAMETER', expectedEntities: { genre: 'trap' } },
  { input: 'darker mood', expectedIntent: 'UPDATE_PARAMETER', expectedEntities: { mood: 'dark' } },
  { input: 'switch to a different key', expectedIntent: 'UPDATE_PARAMETER' },
  { input: 'make it more chill', expectedIntent: 'UPDATE_PARAMETER', expectedEntities: { mood: 'chill' } },
];

console.log('🎵 DAWG AI - Intent Detection Validation\n');
console.log('Testing 60+ patterns across 5 categories\n');
console.log('=' .repeat(80));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const results: { category: string; passed: number; failed: number }[] = [
  { category: 'Beat Generation', passed: 0, failed: 0 },
  { category: 'Mixing', passed: 0, failed: 0 },
  { category: 'Mastering', passed: 0, failed: 0 },
  { category: 'DAW Control', passed: 0, failed: 0 },
  { category: 'Context & Refinement', passed: 0, failed: 0 },
];

function getCategoryIndex(intent: string): number {
  if (intent === 'GENERATE_BEAT') return 0;
  if (intent === 'MIX_TRACK') return 1;
  if (intent === 'MASTER_TRACK') return 2;
  if (intent.startsWith('DAW_')) return 3;
  if (['REGENERATE', 'SAVE', 'UPDATE_PARAMETER'].includes(intent)) return 4;
  return -1;
}

testCases.forEach((testCase) => {
  totalTests++;
  const result = intentService.detectIntent(testCase.input);

  const intentMatch = result.intent === testCase.expectedIntent;
  const confidenceOk = result.confidence >= 0.5;

  let entitiesMatch = true;
  if (testCase.expectedEntities) {
    const { genre, bpm, key, mood, effect, parameter } = testCase.expectedEntities;
    if (genre && result.entities.genre !== genre) entitiesMatch = false;
    if (bpm && result.entities.bpm !== bpm) entitiesMatch = false;
    if (key && result.entities.key !== key) entitiesMatch = false;
    if (mood && result.entities.mood !== mood) entitiesMatch = false;
    if (effect && result.entities.effect !== effect) entitiesMatch = false;
    if (parameter && result.entities.parameter !== parameter) entitiesMatch = false;
  }

  const passed = intentMatch && confidenceOk && entitiesMatch;

  if (passed) {
    passedTests++;
    const categoryIndex = getCategoryIndex(testCase.expectedIntent);
    if (categoryIndex >= 0) results[categoryIndex].passed++;
    console.log(`✅ PASS: "${testCase.input}"`);
    console.log(`   Intent: ${result.intent} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
  } else {
    failedTests++;
    const categoryIndex = getCategoryIndex(testCase.expectedIntent);
    if (categoryIndex >= 0) results[categoryIndex].failed++;
    console.log(`❌ FAIL: "${testCase.input}"`);
    console.log(`   Expected: ${testCase.expectedIntent}`);
    console.log(`   Got: ${result.intent} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
    if (!entitiesMatch) {
      console.log(`   Expected entities:`, testCase.expectedEntities);
      console.log(`   Got entities:`, result.entities);
    }
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log('\n📊 RESULTS BY CATEGORY\n');

results.forEach((category) => {
  const total = category.passed + category.failed;
  const accuracy = total > 0 ? ((category.passed / total) * 100).toFixed(1) : '0.0';
  console.log(`${category.category}:`);
  console.log(`  ✅ Passed: ${category.passed}/${total}`);
  console.log(`  ❌ Failed: ${category.failed}/${total}`);
  console.log(`  📈 Accuracy: ${accuracy}%\n`);
});

const overallAccuracy = ((passedTests / totalTests) * 100).toFixed(1);

console.log('=' .repeat(80));
console.log('\n📈 OVERALL RESULTS\n');
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Accuracy: ${overallAccuracy}%\n`);

// Pattern statistics
const stats = intentService.getPatternStats();
console.log('=' .repeat(80));
console.log('\n🔍 PATTERN STATISTICS\n');
console.log(`Total Patterns Implemented: ${stats.totalPatterns}`);
console.log(`  - Beat Generation: ${stats.categories.beatGeneration}`);
console.log(`  - Mixing: ${stats.categories.mixing}`);
console.log(`  - Mastering: ${stats.categories.mastering}`);
console.log(`  - DAW Control: ${stats.categories.dawControl}`);
console.log(`  - Context Update: ${stats.categories.contextUpdate}\n`);

console.log('=' .repeat(80));

if (parseFloat(overallAccuracy) >= 90) {
  console.log('\n✨ SUCCESS: Intent detection accuracy meets 90%+ target!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  WARNING: Intent detection accuracy below 90% target\n');
  process.exit(1);
}
