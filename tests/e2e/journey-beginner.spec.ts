/**
 * E2E Test: Complete Beginner Journey
 *
 * Tests the full adaptive song creation journey from vocal assessment
 * to final mastered track for a beginner user.
 *
 * Flow:
 * 1. User completes VocalAssessment
 * 2. System generates personalized journey
 * 3. User practices with Coach feedback
 * 4. User records multiple takes
 * 5. CompGenie suggests comping
 * 6. AutoMix applies effects
 * 7. MasterMe finalizes track
 * 8. Journey marked complete
 */

import { test, expect } from '@playwright/test';
import { EventBus } from '@/src/core/eventBus';

const TEST_USER_ID = 'usr_test_beginner_001';
const TEST_JOURNEY_TYPE = 'record_song';

test.describe('Complete Beginner Journey', () => {
  let eventBus: EventBus;
  let journeyId: string;

  test.beforeAll(async () => {
    // Initialize event bus for test monitoring
    eventBus = new EventBus({ mode: 'test' });
    await eventBus.connect();
  });

  test.afterAll(async () => {
    await eventBus.disconnect();
  });

  test('Step 1: User completes VocalAssessment widget', async ({ page }) => {
    // Navigate to assessment
    await page.goto('/');
    await page.click('[data-testid="start-assessment"]');

    // Step 0: Welcome screen
    await expect(page.locator('h2')).toContainText('Welcome to Vocal Assessment');
    await page.click('[data-testid="next-button"]');

    // Step 1: Find lowest note
    await expect(page.locator('h2')).toContainText('Find Your Lowest Note');

    // Simulate microphone input (mocked in test)
    await page.evaluate(() => {
      // Mock pitch detection to return A2
      (window as any).__mockPitchData = {
        note: 'A2',
        frequency: 110.0,
        inTune: true,
        confidence: 0.95
      };
    });

    await page.click('[data-testid="start-recording"]');
    await page.waitForTimeout(3000); // Hold note for 3 seconds
    await page.click('[data-testid="stop-recording"]');

    await expect(page.locator('[data-testid="captured-note"]')).toContainText('A2');
    await page.click('[data-testid="next-button"]');

    // Step 2: Find highest note
    await expect(page.locator('h2')).toContainText('Find Your Highest Note');

    await page.evaluate(() => {
      (window as any).__mockPitchData = {
        note: 'D5',
        frequency: 587.3,
        inTune: true,
        confidence: 0.92
      };
    });

    await page.click('[data-testid="start-recording"]');
    await page.waitForTimeout(3000);
    await page.click('[data-testid="stop-recording"]');

    await expect(page.locator('[data-testid="captured-note"]')).toContainText('D5');
    await page.click('[data-testid="next-button"]');

    // Step 3: Pitch control test
    await expect(page.locator('h2')).toContainText('Pitch Control Test');

    const targetNotes = ['C4', 'E4', 'G4', 'C5', 'E5'];
    for (const note of targetNotes) {
      await page.evaluate((n) => {
        (window as any).__mockPitchData = {
          note: n,
          frequency: 261.6, // Simplified
          inTune: true,
          confidence: 0.88
        };
      }, note);

      await page.click('[data-testid="start-recording"]');
      await page.waitForTimeout(2000);
      await page.click('[data-testid="stop-recording"]');
    }

    await page.click('[data-testid="next-button"]');

    // Step 4: Results
    await expect(page.locator('h2')).toContainText('Assessment Complete');
    await expect(page.locator('[data-testid="skill-level"]')).toContainText('beginner');
    await expect(page.locator('[data-testid="vocal-range"]')).toContainText('A2 - D5');

    // Wait for assessment.completed event
    const assessmentEvent = await eventBus.waitForEvent('assessment.completed', 5000);
    expect(assessmentEvent.payload.user_id).toBe(TEST_USER_ID);
    expect(assessmentEvent.payload.vocal_profile.skill_level).toBe('beginner');

    await page.click('[data-testid="continue-button"]');
  });

  test('Step 2: User completes GoalSettingWizard', async ({ page }) => {
    // Should auto-navigate to goal setting
    await expect(page.locator('h2')).toContainText('Create Your Vocal Journey');
    await page.click('[data-testid="next-button"]');

    // Select goal: Record a Full Song
    await page.click('[data-testid="goal-card-record-song"]');
    await page.click('[data-testid="next-button"]');

    // Select timeframe: 30 min/day
    await page.click('[data-testid="timeframe-30min"]');
    await page.click('[data-testid="next-button"]');

    // Select focus areas
    await page.click('[data-testid="focus-breath-control"]');
    await page.click('[data-testid="focus-pitch-accuracy"]');
    await page.click('[data-testid="next-button"]');

    // Review journey preview
    await expect(page.locator('h2')).toContainText('Your Journey Preview');
    await expect(page.locator('[data-testid="journey-weeks"]')).toContainText('4 weeks');

    // Start journey
    await page.click('[data-testid="start-journey-button"]');

    // Wait for journey.started event
    const journeyEvent = await eventBus.waitForEvent('journey.started', 5000);
    journeyId = journeyEvent.payload.journey_id;
    expect(journeyEvent.payload.journey_type).toBe(TEST_JOURNEY_TYPE);
    expect(journeyEvent.payload.estimated_weeks).toBe(4);
  });

  test('Step 3: User practices with Coach feedback', async ({ page }) => {
    // Navigate to practice session
    await page.goto(`/journey/${journeyId}/practice`);

    // Select warmup exercise
    await page.click('[data-testid="exercise-scales"]');
    await page.click('[data-testid="start-practice"]');

    // Wait for recording.started event
    const recordingStarted = await eventBus.waitForEvent('recording.started', 5000);
    expect(recordingStarted.payload.session_type).toBe('practice');

    // Simulate singing with pitch variations
    await page.evaluate(() => {
      (window as any).__mockPitchData = {
        note: 'C4',
        frequency: 261.6,
        inTune: false, // Intentionally off
        confidence: 0.75,
        centsOff: -15
      };
    });

    // Wait for coach.feedback event
    const coachFeedback = await eventBus.waitForEvent('coach.feedback', 10000);
    expect(coachFeedback.payload.feedback_type).toBe('pitch');
    expect(coachFeedback.payload.detected_issue.deviation_cents).toBeCloseTo(-15, 1);

    // Verify feedback appears in UI
    await expect(page.locator('[data-testid="coach-feedback"]')).toContainText('pitch');

    // Stop recording
    await page.click('[data-testid="stop-practice"]');

    const recordingStopped = await eventBus.waitForEvent('recording.stopped', 5000);
    expect(recordingStopped.payload.pitch_analysis.in_tune_percentage).toBeLessThan(90);
  });

  test('Step 4: User records multiple takes', async ({ page }) => {
    // Navigate to recording session
    await page.goto(`/journey/${journeyId}/record`);

    // Record Take 1
    await page.click('[data-testid="start-recording"]');
    await page.waitForTimeout(5000); // 5 second take
    await page.click('[data-testid="stop-recording"]');

    await expect(page.locator('[data-testid="take-count"]')).toContainText('1 take');

    // Record Take 2
    await page.click('[data-testid="start-recording"]');
    await page.waitForTimeout(5000);
    await page.click('[data-testid="stop-recording"]');

    await expect(page.locator('[data-testid="take-count"]')).toContainText('2 takes');

    // Record Take 3
    await page.click('[data-testid="start-recording"]');
    await page.waitForTimeout(5000);
    await page.click('[data-testid="stop-recording"]');

    await expect(page.locator('[data-testid="take-count"]')).toContainText('3 takes');

    // Continue to comping
    await page.click('[data-testid="continue-to-comping"]');

    // Wait for takes.uploaded event
    const takesUploaded = await eventBus.waitForEvent('takes.uploaded', 10000);
    expect(takesUploaded.payload.takes.length).toBe(3);
  });

  test('Step 5: CompGenie suggests comping', async ({ page }) => {
    // Should navigate to comping view
    await expect(page.locator('h2')).toContainText('Take Comparison');

    // Click "Auto-Comp" button
    await page.click('[data-testid="auto-comp-button"]');

    // Wait for comping.suggestion event
    const compingSuggestion = await eventBus.waitForEvent('comping.suggestion', 15000);
    expect(compingSuggestion.payload.suggested_comp.length).toBeGreaterThan(0);
    expect(compingSuggestion.payload.confidence_score).toBeGreaterThan(0.7);

    // Verify comping suggestion appears in UI
    await expect(page.locator('[data-testid="comp-suggestion"]')).toBeVisible();
    await expect(page.locator('[data-testid="comp-confidence"]')).toContainText('confidence');

    // Accept comping suggestion
    await page.click('[data-testid="accept-comp-button"]');

    // Wait for take.selected event
    const takeSelected = await eventBus.waitForEvent('take.selected', 5000);
    expect(takeSelected.payload.selection_type).toBe('ai_comped');
    expect(takeSelected.payload.comp_regions).toBeDefined();
  });

  test('Step 6: AutoMix applies effects', async ({ page }) => {
    // Navigate to mixing stage
    await page.goto(`/journey/${journeyId}/mix`);

    // Click "Get Mix Suggestions"
    await page.click('[data-testid="get-mix-suggestions"]');

    // Wait for mix.suggestion event
    const mixSuggestion = await eventBus.waitForEvent('mix.suggestion', 15000);
    expect(mixSuggestion.payload.suggested_effects.length).toBeGreaterThan(0);

    // Verify EQ suggestion
    const eqEffect = mixSuggestion.payload.suggested_effects.find(
      (e: any) => e.effect_type === 'eq'
    );
    expect(eqEffect).toBeDefined();
    expect(eqEffect.confidence_score).toBeGreaterThan(0.8);

    // Apply suggested mix
    await page.click('[data-testid="apply-mix-button"]');

    // Verify mix applied in UI
    await expect(page.locator('[data-testid="mix-status"]')).toContainText('applied');

    // Continue to mastering
    await page.click('[data-testid="continue-to-mastering"]');
  });

  test('Step 7: MasterMe finalizes track', async ({ page }) => {
    // Should navigate to mastering stage
    await expect(page.locator('h2')).toContainText('Master Your Track');

    // Set target loudness
    await page.selectOption('[data-testid="target-loudness"]', '-14');

    // Request mastering
    await page.click('[data-testid="request-mastering"]');

    // Wait for master.completed event
    const masterCompleted = await eventBus.waitForEvent('master.completed', 30000);
    expect(masterCompleted.payload.achieved_loudness_lufs).toBeCloseTo(-14, 1);
    expect(masterCompleted.payload.quality_report.overall_score).toBeGreaterThan(80);

    // Verify mastered file available
    await expect(page.locator('[data-testid="download-master"]')).toBeVisible();
    await expect(page.locator('[data-testid="master-quality-score"]')).toContainText('92');

    // Complete journey
    await page.click('[data-testid="complete-journey"]');
  });

  test('Step 8: Journey marked complete', async ({ page }) => {
    // Wait for journey.completed event
    const journeyCompleted = await eventBus.waitForEvent('journey.completed', 5000);
    expect(journeyCompleted.payload.journey_id).toBe(journeyId);
    expect(journeyCompleted.payload.stages_completed).toBe(7);
    expect(journeyCompleted.payload.final_artifact.type).toBe('song_recording');

    // Verify completion screen
    await expect(page.locator('h1')).toContainText('Journey Complete');
    await expect(page.locator('[data-testid="completion-badge"]')).toBeVisible();

    // Wait for profile.updated event
    const profileUpdated = await eventBus.waitForEvent('profile.updated', 5000);
    expect(profileUpdated.payload.user_id).toBe(TEST_USER_ID);
    expect(profileUpdated.payload.improvement_metrics).toBeDefined();

    // Verify improvement metrics
    await expect(page.locator('[data-testid="pitch-improvement"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-improvement"]')).toBeVisible();
  });

  test('Metrics: Journey completion rate tracked', async () => {
    // Verify metrics.tick event was published
    const metricsTick = await eventBus.waitForEvent('metrics.tick', 5000);

    const journeyMetrics = metricsTick.payload.metrics.find(
      (m: any) => m.name === 'journey.completion_rate'
    );

    expect(journeyMetrics).toBeDefined();
    expect(journeyMetrics.value).toBeGreaterThan(0);
  });
});
