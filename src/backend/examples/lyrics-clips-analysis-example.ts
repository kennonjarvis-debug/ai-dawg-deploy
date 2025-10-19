/**
 * Example: Lyrics and Multi-Clip Analysis
 *
 * This example demonstrates how to use the lyrics analysis and multi-clip analysis systems.
 * Run with: npx ts-node src/backend/examples/lyrics-clips-analysis-example.ts
 */

import 'dotenv/config';
import {
  analyzeLyrics,
  estimateLyricsAnalysisCost,
  quickLyricsValidation,
} from '../services/lyrics-analysis-service';
import {
  estimateMultiClipAnalysisCost,
} from '../services/multi-clip-analyzer';

// Example lyrics for analysis
const exampleLyrics = `
I wake up every morning with the sunrise
Coffee brewing, birds singing their lullabies
Another day to chase what's on my mind
Leaving yesterday and its worries behind

We're dancing in the moonlight
Stars above shining so bright
No worries, just you and me tonight
Everything's gonna be alright

Walking down these empty streets alone
Thinking about where we've gone
Time moves fast but memories stay strong
Wondering where we went wrong

We're dancing in the moonlight
Stars above shining so bright
No worries, just you and me tonight
Everything's gonna be alright

Maybe tomorrow we'll find our way
Through all the things we never say
Maybe tomorrow, come what may
We'll be okay

We're dancing in the moonlight
Stars above shining so bright
No worries, just you and me tonight
Everything's gonna be alright
`;

async function exampleLyricsAnalysis() {
  console.log('='.repeat(80));
  console.log('EXAMPLE: Lyrics Analysis');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Quick validation
  console.log('Step 1: Quick Validation');
  console.log('-'.repeat(80));
  const validation = quickLyricsValidation(exampleLyrics);
  console.log('Valid:', validation.valid);
  console.log('Warnings:', validation.warnings.length > 0 ? validation.warnings : 'None');
  console.log();

  // Step 2: Estimate cost
  console.log('Step 2: Cost Estimation');
  console.log('-'.repeat(80));
  const costEstimate = estimateLyricsAnalysisCost(exampleLyrics, true);
  console.log('Estimated cost: $' + costEstimate.estimatedCost.toFixed(6));
  console.log('Input tokens:', costEstimate.inputTokens);
  console.log('Output tokens:', costEstimate.outputTokens);
  console.log('Breakdown:', costEstimate.breakdown);
  console.log();

  // Step 3: Perform analysis
  console.log('Step 3: Analyze Lyrics');
  console.log('-'.repeat(80));
  console.log('Analyzing lyrics...');

  try {
    const result = await analyzeLyrics(exampleLyrics, 'example-user', {
      genre: 'pop',
    });

    console.log('\nStructure:');
    console.log('  Song structure:', result.structure.structure);
    console.log('  Estimated length:', result.structure.estimatedLength, 'seconds');
    console.log('  Sections found:', result.structure.sections.length);
    console.log();

    console.log('Section Details:');
    for (const section of result.structure.sections) {
      console.log(`  ${section.sectionType.toUpperCase()}${section.sectionNumber ? ' ' + section.sectionNumber : ''}`);
      console.log(`    Lines: ${section.lineStart}-${section.lineEnd}`);
      console.log(`    Confidence: ${(section.confidence * 100).toFixed(0)}%`);
      if (section.reasoning) {
        console.log(`    Reasoning: ${section.reasoning}`);
      }
    }
    console.log();

    console.log('Repeated Sections:');
    for (const repeated of result.structure.repeatedSections) {
      console.log(`  ${repeated.sectionType.toUpperCase()}: ${repeated.occurrences} occurrences`);
    }
    console.log();

    console.log('Recommendations:');
    if (result.recommendations.length > 0) {
      for (const rec of result.recommendations) {
        console.log(`  [${rec.type.toUpperCase()}] ${rec.message}`);
        console.log(`    Reasoning: ${rec.reasoning}`);
      }
    } else {
      console.log('  No recommendations');
    }
    console.log();

    if (result.genreAdvice) {
      console.log('Genre-Specific Advice (Pop):');
      for (const suggestion of result.genreAdvice.suggestions) {
        console.log(`  - ${suggestion}`);
      }
      console.log();
    }

    console.log('Actual Cost:');
    console.log('  Total: $' + result.cost.totalCost.toFixed(6));
    console.log('  Input tokens:', result.cost.inputTokens);
    console.log('  Output tokens:', result.cost.outputTokens);
    console.log();

  } catch (error) {
    console.error('Error analyzing lyrics:', error);
  }
}

async function exampleMultiClipAnalysis() {
  console.log('='.repeat(80));
  console.log('EXAMPLE: Multi-Clip Analysis');
  console.log('='.repeat(80));
  console.log();

  // Simulated clip data
  const clipScenarios = [
    {
      name: '3 clips, no AI',
      clipCount: 3,
      includeArrangement: false,
    },
    {
      name: '5 clips, with AI arrangement',
      clipCount: 5,
      includeArrangement: true,
    },
    {
      name: '10 clips (max), with AI arrangement',
      clipCount: 10,
      includeArrangement: true,
    },
  ];

  console.log('Cost Estimates for Different Scenarios:');
  console.log('-'.repeat(80));
  console.log();

  for (const scenario of clipScenarios) {
    const estimate = estimateMultiClipAnalysisCost(
      scenario.clipCount,
      scenario.includeArrangement
    );

    console.log(`Scenario: ${scenario.name}`);
    console.log(`  Estimated cost: $${estimate.estimatedCost.toFixed(6)}`);
    console.log(`  Breakdown: ${estimate.breakdown}`);
    console.log();
  }

  console.log('Features:');
  console.log('-'.repeat(80));
  console.log('✓ Metadata extraction (BPM, key, energy) - FREE');
  console.log('✓ Relationship analysis - FREE');
  console.log('✓ Conflict detection - FREE');
  console.log('✓ AI arrangement suggestions - $0.003-0.008');
  console.log();

  console.log('Supported Analysis:');
  console.log('-'.repeat(80));
  console.log('• BPM matching (detects clips with similar tempo)');
  console.log('• Key compatibility (identifies complementary keys)');
  console.log('• Energy flow analysis');
  console.log('• Vocal vs. instrumental detection');
  console.log('• Tempo mismatch warnings');
  console.log('• Key clash detection');
  console.log('• AI-powered arrangement order suggestions');
  console.log('• Song section recommendations (intro, verse, chorus, etc.)');
  console.log();
}

async function exampleAPIUsage() {
  console.log('='.repeat(80));
  console.log('EXAMPLE: API Usage');
  console.log('='.repeat(80));
  console.log();

  console.log('Lyrics Analysis Endpoints:');
  console.log('-'.repeat(80));
  console.log();

  console.log('1. Analyze Lyrics:');
  console.log('POST /api/lyrics/analyze');
  console.log(`
{
  "lyrics": "${exampleLyrics.substring(0, 50).replace(/\n/g, '\\n')}...",
  "genre": "pop",
  "trackId": "track-123"
}
  `);
  console.log();

  console.log('2. Cost Estimate:');
  console.log('GET /api/lyrics/cost-estimate?lyricsLength=1000&includeGenreAdvice=true');
  console.log();

  console.log('3. Validate Lyrics:');
  console.log('POST /api/lyrics/validate');
  console.log(`
{
  "lyrics": "${exampleLyrics.substring(0, 30).replace(/\n/g, '\\n')}..."
}
  `);
  console.log();

  console.log('Multi-Clip Analysis Endpoints:');
  console.log('-'.repeat(80));
  console.log();

  console.log('1. Analyze Clips by IDs:');
  console.log('POST /api/clips/analyze-by-ids');
  console.log(`
{
  "clipIds": ["clip-1", "clip-2", "clip-3"],
  "suggestArrangement": true,
  "detectConflicts": true,
  "projectId": "project-123"
}
  `);
  console.log();

  console.log('2. Cost Estimate:');
  console.log('GET /api/clips/analysis-cost-estimate?clipCount=5&includeArrangement=true');
  console.log();

  console.log('3. Features Info:');
  console.log('GET /api/clips/features');
  console.log();
}

async function exampleWebSocketUsage() {
  console.log('='.repeat(80));
  console.log('EXAMPLE: WebSocket Events');
  console.log('='.repeat(80));
  console.log();

  console.log('Client-side JavaScript:');
  console.log('-'.repeat(80));
  console.log(`
import { wsClient } from './api/websocket';

// Connect to WebSocket
wsClient.connect('your-auth-token');

// Subscribe to lyrics events
wsClient.on('lyrics:analyzed', (data) => {
  console.log('Lyrics analysis complete:', data);
  // Update UI with section labels
  updateSectionMarkers(data.analysis.structure.sections);
});

wsClient.on('lyrics:recommendations', (data) => {
  console.log('Recommendations ready:', data);
  // Show recommendations to user
  showRecommendations(data.recommendations);
});

// Subscribe to clip events
wsClient.on('clips:analyzed', (data) => {
  console.log('Clip analysis complete:', data);
  // Show arrangement suggestions
  displayArrangement(data.analysis.arrangementSuggestions);
  // Highlight conflicts
  highlightConflicts(data.analysis.conflicts);
});
  `);
  console.log();
}

async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   Lyrics & Multi-Clip Analysis Examples                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Run examples
  await exampleLyricsAnalysis();
  await exampleMultiClipAnalysis();
  await exampleAPIUsage();
  await exampleWebSocketUsage();

  console.log('='.repeat(80));
  console.log('Examples complete!');
  console.log('='.repeat(80));
  console.log();
  console.log('For more information, see: LYRICS_AND_CLIPS_ANALYSIS.md');
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  exampleLyricsAnalysis,
  exampleMultiClipAnalysis,
  exampleAPIUsage,
  exampleWebSocketUsage,
};
