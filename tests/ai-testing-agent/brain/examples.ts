/**
 * AgentBrain Examples
 *
 * This file demonstrates how to use the agent brain system
 * for memory, learning, and knowledge management.
 */

import { AgentBrain } from './agent-brain';

/**
 * Example 1: Basic Memory Storage and Recall
 */
async function example1_BasicMemory() {
  console.log('\n=== Example 1: Basic Memory Storage and Recall ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Store a test failure
  await brain.remember({
    type: 'test_failure',
    content: 'Test "user-authentication" failed with timeout error after 30 seconds',
    metadata: {
      testName: 'user-authentication',
      errorType: 'timeout',
      affectedFiles: ['src/backend/auth/auth-service.ts'],
      tags: ['auth', 'timeout', 'critical'],
    },
  });

  // Store a successful fix
  await brain.remember({
    type: 'fix_applied',
    content: 'Increased timeout and added retry logic',
    metadata: {
      testName: 'user-authentication',
      errorType: 'timeout',
      fixStrategy: 'Increased timeout from 30s to 60s and added 3 retry attempts with exponential backoff',
      successRate: 1.0,
      affectedFiles: ['src/backend/auth/auth-service.ts'],
      tags: ['timeout', 'retry', 'fix'],
    },
  });

  // Recall similar experiences
  const similar = await brain.recall('authentication timeout error', 5);

  console.log('Similar memories found:');
  similar.forEach(m => {
    console.log(`- ${m.memory.type}: ${m.memory.content.substring(0, 80)}... (relevance: ${m.relevanceScore.toFixed(2)})`);
  });

  const stats = await brain.getMemoryStats();
  console.log(`\nMemory Stats: ${stats.totalMemories} total memories`);
}

/**
 * Example 2: Learning from Failures and Fixes
 */
async function example2_LearningFromFixes() {
  console.log('\n=== Example 2: Learning from Failures and Fixes ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Scenario: Same type of error occurs multiple times
  const errorScenarios = [
    { test: 'api-endpoint-1', error: 'Network timeout connecting to external API', success: true },
    { test: 'api-endpoint-2', error: 'Network timeout connecting to external API', success: true },
    { test: 'api-endpoint-3', error: 'Network timeout connecting to external API', success: false },
    { test: 'api-endpoint-4', error: 'Network timeout connecting to external API', success: true },
  ];

  // Learn from each scenario
  for (const scenario of errorScenarios) {
    await brain.learnFromFix(
      scenario.test,
      scenario.error,
      'Add circuit breaker pattern and increase timeout to 10s',
      scenario.success,
      ['src/backend/services/api-client.ts']
    );
  }

  // Now when a similar error occurs, the brain can suggest a fix
  const suggestion = await brain.suggestFix(
    'Network timeout connecting to external API',
    'api-endpoint-5'
  );

  console.log('Fix Suggestion:');
  console.log(`Strategy: ${suggestion.suggestedFix}`);
  console.log(`Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${suggestion.reasoning}`);
  console.log(`Based on ${suggestion.similarCases.length} similar cases`);
}

/**
 * Example 3: Codebase Knowledge Storage
 */
async function example3_CodebaseKnowledge() {
  console.log('\n=== Example 3: Codebase Knowledge Storage ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Store knowledge about key files
  await brain.storeCodebaseKnowledge(
    'src/backend/ai-brain-server.ts',
    'Main AI brain server handling chat completions, function calling, and streaming responses',
    ['chat-to-create', 'function-calling', 'voice-chat', 'intent-detection'],
    ['openai', 'anthropic', 'socket.io']
  );

  await brain.storeCodebaseKnowledge(
    'src/backend/services/udio-service.ts',
    'Udio API integration for music generation from lyrics and prompts',
    ['music-generation', 'lyrics-to-music', 'audio-processing'],
    ['axios', 'ai-brain-server']
  );

  await brain.storeCodebaseKnowledge(
    'src/audio/ai/SmartMixAssistant.ts',
    'AI-powered mixing assistant that analyzes audio and suggests optimal mix settings',
    ['smart-mixing', 'audio-analysis', 'mix-recommendations'],
    ['tone.js', 'pitchfinder']
  );

  // Query knowledge
  const knowledge = await brain.getCodebaseKnowledge('music-generation');

  console.log('Codebase Knowledge for "music-generation":');
  console.log(`Summary: ${knowledge.summary.substring(0, 150)}...`);
  console.log(`Related Files: ${knowledge.relatedFiles.join(', ')}`);
  console.log(`Dependencies: ${knowledge.dependencies.join(', ')}`);
}

/**
 * Example 4: Impact Analysis
 */
async function example4_ImpactAnalysis() {
  console.log('\n=== Example 4: Impact Analysis ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Build knowledge graph
  await brain.storeCodebaseKnowledge(
    'src/backend/ai-brain-server.ts',
    'AI brain server',
    ['chat', 'voice'],
    ['openai', 'socket.io']
  );

  await brain.storeCodebaseKnowledge(
    'src/backend/services/udio-service.ts',
    'Music generation service',
    ['music-generation'],
    ['ai-brain-server', 'axios']
  );

  // Analyze impact of changing a file
  const impact = await brain.identifyImpactZone([
    'src/backend/ai-brain-server.ts'
  ]);

  console.log('Impact Analysis:');
  console.log(`Risk Level: ${impact.riskLevel.toUpperCase()}`);
  console.log(`Reasoning: ${impact.reasoning}`);
  console.log(`Affected Features: ${impact.affectedFeatures.join(', ')}`);
  console.log(`Affected Tests: ${impact.affectedTests.join(', ') || 'None tracked yet'}`);
}

/**
 * Example 5: Test Pattern Tracking
 */
async function example5_TestPatterns() {
  console.log('\n=== Example 5: Test Pattern Tracking ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Track different test patterns and their effectiveness
  await brain.trackTestPattern(
    'page-object-model',
    'user-login-test',
    0.95,
    'Using Page Object Model for login flow improved maintainability and reduced flakiness'
  );

  await brain.trackTestPattern(
    'page-object-model',
    'user-registration-test',
    0.92,
    'Page Object Model works well for form-heavy tests'
  );

  await brain.trackTestPattern(
    'visual-regression',
    'homepage-layout-test',
    0.88,
    'Visual regression testing caught layout issues that unit tests missed'
  );

  await brain.trackTestPattern(
    'mock-external-apis',
    'payment-integration-test',
    0.85,
    'Mocking external payment API made tests faster and more reliable'
  );

  // Get best patterns
  const bestPatterns = await brain.getBestTestPatterns();

  console.log('Best Test Patterns:');
  bestPatterns.forEach(pattern => {
    console.log(`\n${pattern.pattern}:`);
    console.log(`  Avg Effectiveness: ${(pattern.avgEffectiveness * 100).toFixed(1)}%`);
    console.log(`  Usage Count: ${pattern.usageCount}`);
    console.log(`  Examples: ${pattern.examples.join(', ')}`);
  });
}

/**
 * Example 6: Learning Insights
 */
async function example6_LearningInsights() {
  console.log('\n=== Example 6: Learning Insights ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Simulate learning from multiple test runs
  const testRuns = [
    { test: 'api-health-check', error: 'timeout', fix: 'increase timeout', success: true },
    { test: 'api-user-fetch', error: 'timeout', fix: 'increase timeout', success: true },
    { test: 'api-data-sync', error: 'network', fix: 'add retry logic', success: true },
    { test: 'ui-button-click', error: 'assertion', fix: 'wait for element', success: true },
    { test: 'ui-form-submit', error: 'assertion', fix: 'wait for element', success: false },
    { test: 'ui-modal-open', error: 'assertion', fix: 'wait for element', success: true },
  ];

  for (const run of testRuns) {
    await brain.learnFromFix(
      run.test,
      run.error,
      run.fix,
      run.success,
      ['src/tests/' + run.test + '.spec.ts']
    );
  }

  // Get insights
  const insights = await brain.getLearningInsights();

  console.log('Learning Insights:');
  insights.forEach((insight, i) => {
    console.log(`\n${i + 1}. ${insight.pattern}:`);
    console.log(`   Confidence: ${(insight.confidence * 100).toFixed(1)}%`);
    console.log(`   Recommendation: ${insight.recommendation}`);
    console.log(`   Based on ${insight.examples.length} examples`);
  });
}

/**
 * Example 7: Full Workflow - From Failure to Fix
 */
async function example7_FullWorkflow() {
  console.log('\n=== Example 7: Full Workflow - From Failure to Fix ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Step 1: Test fails
  console.log('Step 1: Test fails with error...');
  const testName = 'music-generation-flow';
  const errorMessage = 'Network timeout: Failed to connect to Udio API after 30s';

  await brain.remember({
    type: 'test_failure',
    content: `Test "${testName}" failed: ${errorMessage}`,
    metadata: {
      testName,
      errorType: 'network',
      affectedFiles: ['src/backend/services/udio-service.ts'],
      tags: ['network', 'timeout', 'music-generation'],
    },
  });

  // Step 2: Find similar past failures
  console.log('\nStep 2: Searching for similar past failures...');
  const similarFailures = await brain.findSimilarFailures(errorMessage, testName, 3);

  console.log(`Found ${similarFailures.length} similar failures`);

  // Step 3: Get fix suggestion
  console.log('\nStep 3: Getting fix suggestion...');
  const fixSuggestion = await brain.suggestFix(errorMessage, testName);

  console.log(`Suggested Fix: ${fixSuggestion.suggestedFix}`);
  console.log(`Confidence: ${(fixSuggestion.confidence * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${fixSuggestion.reasoning}`);

  // Step 4: Apply fix and record outcome
  console.log('\nStep 4: Applying fix and recording outcome...');
  const wasSuccessful = true; // Simulated success

  await brain.learnFromFix(
    testName,
    errorMessage,
    'Added circuit breaker and increased timeout to 60s with retry logic',
    wasSuccessful,
    ['src/backend/services/udio-service.ts']
  );

  console.log('Fix applied and learned from!');

  // Step 5: View updated insights
  console.log('\nStep 5: Updated learning insights:');
  const insights = await brain.getLearningInsights('network');

  if (insights.length > 0) {
    console.log(`Pattern: ${insights[0].pattern}`);
    console.log(`Confidence: ${(insights[0].confidence * 100).toFixed(1)}%`);
    console.log(`Recommendation: ${insights[0].recommendation}`);
  }
}

/**
 * Example 8: Export and Import Knowledge
 */
async function example8_ExportImport() {
  console.log('\n=== Example 8: Export and Import Knowledge ===\n');

  const brain = new AgentBrain();
  await brain.initialize();

  // Add some knowledge
  await brain.remember({
    type: 'codebase_insight',
    content: 'Critical authentication service',
    metadata: {
      filePath: 'src/backend/auth/auth-service.ts',
      tags: ['security', 'critical'],
    },
  });

  // Export
  const exportPath = '/tmp/brain-backup.json';
  await brain.exportKnowledge(exportPath);
  console.log(`Knowledge exported to: ${exportPath}`);

  // Create new brain instance
  const newBrain = new AgentBrain();
  await newBrain.initialize();

  // Import
  await newBrain.importKnowledge(exportPath);
  console.log('Knowledge imported into new brain instance');

  const stats = await newBrain.getMemoryStats();
  console.log(`New brain has ${stats.totalMemories} memories`);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_BasicMemory();
    await example2_LearningFromFixes();
    await example3_CodebaseKnowledge();
    await example4_ImpactAnalysis();
    await example5_TestPatterns();
    await example6_LearningInsights();
    await example7_FullWorkflow();
    await example8_ExportImport();

    console.log('\n=== All Examples Complete! ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_BasicMemory,
  example2_LearningFromFixes,
  example3_CodebaseKnowledge,
  example4_ImpactAnalysis,
  example5_TestPatterns,
  example6_LearningInsights,
  example7_FullWorkflow,
  example8_ExportImport,
};
