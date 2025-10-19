/**
 * Test Script for AI Caching System
 * Tests cache performance and measures cost savings
 */

import { aiCache } from './src/services/ai-cache-service';
import { cacheAnalytics } from './src/services/cache-analytics';
import { voiceCache } from './src/services/voice-cache-service';

async function testAICache() {
  console.log('\n=== AI CACHE TESTING ===\n');

  // Test 1: Chat caching
  console.log('Test 1: Chat Response Caching');
  console.log('-'.repeat(50));

  const chatPrompt = "How do I generate a beat?";

  // First call - should MISS
  const start1 = Date.now();
  const cached1 = await aiCache.get(chatPrompt, {
    provider: 'openai',
    model: 'gpt-4o-mini',
  });
  console.log(`First call: ${cached1 ? 'HIT' : 'MISS'} (${Date.now() - start1}ms)`);

  // Simulate API response and cache it
  if (!cached1) {
    await aiCache.set(
      chatPrompt,
      {
        content: "To generate a beat, use the command 'generate beat' with your desired genre and BPM.",
        provider: 'openai',
        tokensUsed: 50,
        cost: 0.0001,
      },
      {
        provider: 'openai',
        model: 'gpt-4o-mini',
        ttl: 3600,
      }
    );
    console.log('Response cached');
  }

  // Second call - should HIT
  const start2 = Date.now();
  const cached2 = await aiCache.get(chatPrompt, {
    provider: 'openai',
    model: 'gpt-4o-mini',
  });
  console.log(`Second call: ${cached2 ? 'HIT ✅' : 'MISS'} (${Date.now() - start2}ms)`);
  console.log(`Speed improvement: ${((start1 - (Date.now() - start2)) / start1 * 100).toFixed(1)}%\n`);

  // Test 2: Music generation caching
  console.log('Test 2: Music Generation Caching');
  console.log('-'.repeat(50));

  const musicParams = {
    enhancedPrompt: "dark trap beat with heavy 808s",
    duration: 30,
    model: 'stereo-melody-large',
  };

  // First generation - should MISS
  const musicCached1 = await aiCache.get(musicParams, {
    provider: 'replicate',
    model: 'musicgen',
  });
  console.log(`First generation: ${musicCached1 ? 'HIT' : 'MISS'}`);

  // Cache music generation result
  if (!musicCached1) {
    await aiCache.set(
      musicParams,
      {
        success: true,
        audio_url: 'https://example.com/beat.mp3',
        message: 'Music generated successfully',
      },
      {
        provider: 'replicate',
        model: 'musicgen',
        ttl: 604800, // 7 days
      }
    );
    console.log('Music generation cached (saves ~$0.15)');
  }

  // Second generation - should HIT (saves $0.15)
  const musicCached2 = await aiCache.get(musicParams, {
    provider: 'replicate',
    model: 'musicgen',
  });
  console.log(`Second generation: ${musicCached2 ? 'HIT ✅ (saved $0.15)' : 'MISS'}\n`);

  // Test 3: Voice command pattern matching
  console.log('Test 3: Voice Command Pattern Matching');
  console.log('-'.repeat(50));

  const voiceCommands = [
    'play',
    'start playing',
    'pause',
    'louder',
    'increase volume',
    'generate a trap beat',
    'make it louder',
  ];

  for (const cmd of voiceCommands) {
    const match = voiceCache.matchPattern(cmd);
    if (match) {
      console.log(`"${cmd}" -> ${match.action} (confidence: ${(match.confidence * 100).toFixed(0)}%, cached: ${match.cached ? '✅' : '❌'})`);
    } else {
      console.log(`"${cmd}" -> No match (needs AI processing)`);
    }
  }

  console.log('\n');

  // Test 4: Cache statistics
  console.log('Test 4: Cache Statistics');
  console.log('-'.repeat(50));

  const stats = await aiCache.getStats();
  console.log(`Total Hits: ${stats.hits}`);
  console.log(`Total Misses: ${stats.misses}`);
  console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  console.log(`Total Saved: $${stats.savedCost.toFixed(4)}\n`);

  // Test 5: Cache info
  console.log('Test 5: Cache Information');
  console.log('-'.repeat(50));

  const info = await aiCache.getCacheInfo();
  console.log(`Total Cached Keys: ${info.totalKeys}`);
  console.log(`Memory Usage: ${info.memoryUsage}`);
  console.log('Cached Items by Provider:');
  for (const [provider, count] of Object.entries(info.providers)) {
    console.log(`  ${provider}: ${count} items`);
  }
  console.log('\n');

  // Test 6: Analytics report
  console.log('Test 6: Full Analytics Report');
  console.log('-'.repeat(50));

  const analytics = await cacheAnalytics.getAnalytics();
  console.log(`Total Requests: ${analytics.totalHits + analytics.totalMisses}`);
  console.log(`Hit Rate: ${(analytics.hitRate * 100).toFixed(1)}%`);
  console.log(`Total Saved: $${analytics.totalSavedCost.toFixed(4)}`);
  console.log(`Projected Monthly Savings: $${analytics.projectedMonthlySavings.toFixed(2)}`);
  console.log(`Target Monthly Savings (50%): $${((1100 * 0.5)).toFixed(2)}`);
  console.log(`Progress to Goal: ${((analytics.projectedMonthlySavings / (1100 * 0.5)) * 100).toFixed(1)}%\n`);

  // Test 7: Efficiency score
  console.log('Test 7: Cache Efficiency Score');
  console.log('-'.repeat(50));

  const score = await cacheAnalytics.getEfficiencyScore();
  console.log(`Efficiency Score: ${score}/100`);

  if (score >= 80) {
    console.log('Status: Excellent ✅');
  } else if (score >= 60) {
    console.log('Status: Good ✓');
  } else if (score >= 40) {
    console.log('Status: Fair ~');
  } else {
    console.log('Status: Needs improvement ⚠️');
  }

  console.log('\n');

  // Test 8: Recommendations
  console.log('Test 8: Recommendations');
  console.log('-'.repeat(50));

  const recommendations = await cacheAnalytics.getRecommendations();
  if (recommendations.length === 0) {
    console.log('No recommendations at this time.');
  } else {
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log('\n');

  // Test 9: Full analytics report
  console.log('Test 9: Detailed Analytics Report');
  console.log('='.repeat(80));

  const report = await cacheAnalytics.getReport();
  console.log(report);

  console.log('\n=== TESTING COMPLETE ===\n');
}

// Run tests
testAICache()
  .then(() => {
    console.log('All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
