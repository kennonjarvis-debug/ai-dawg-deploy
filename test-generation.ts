/**
 * Test script for generation queue
 * Run with: tsx test-generation.ts
 */

import { generationService } from './src/backend/services/generation-service';
import { logger } from './src/backend/utils/logger';

async function testBeatGeneration() {
  try {
    console.log('\n=== Testing Beat Generation ===\n');

    // Test 1: Generate a trap beat
    console.log('Test 1: Generating trap beat at 140 BPM in C minor...');
    const trapResult = await generationService.generateBeat({
      userId: 'test-user-123',
      genre: 'trap',
      bpm: 140,
      key: 'Cm',
      mood: 'dark',
      duration: 30,
    });

    console.log('✓ Trap beat job queued:', trapResult);

    // Test 2: Generate a house beat with defaults
    console.log('\nTest 2: Generating house beat with defaults...');
    const lofiResult = await generationService.generateBeat({
      userId: 'test-user-123',
      genre: 'house',
    });

    console.log('✓ Lo-fi beat job queued:', lofiResult);

    // Test 3: Get job status
    console.log('\nTest 3: Checking job status...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit

    const status = await generationService.getJobStatus(trapResult.jobId);
    console.log('✓ Job status:', {
      state: status.state,
      progress: status.progress,
      generationId: status.generationId,
    });

    // Test 4: Get supported genres
    console.log('\nTest 4: Getting supported genres...');
    const genres = generationService.getSupportedGenres();
    console.log('✓ Supported genres:', genres.length);
    console.log('  Examples:', genres.slice(0, 3).map(g => g.name));

    // Test 5: Get queue stats
    console.log('\nTest 5: Getting queue statistics...');
    const stats = await generationService.getQueueStats();
    console.log('✓ Queue stats:', stats);

    // Wait for jobs to complete
    console.log('\nWaiting 5 seconds for jobs to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check final status
    const finalStatus = await generationService.getJobStatus(trapResult.jobId);
    console.log('\n✓ Final job status:', {
      state: finalStatus.state,
      progress: finalStatus.progress,
    });

    if (finalStatus.state === 'completed') {
      const result = await generationService.getJobResult(trapResult.jobId);
      console.log('✓ Job result:', {
        audioUrl: result.result.audioUrl,
        duration: result.result.duration,
        bpm: result.result.bpm,
        genre: result.result.genre,
      });
    }

    console.log('\n=== All tests passed! ===\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testBeatGeneration();
