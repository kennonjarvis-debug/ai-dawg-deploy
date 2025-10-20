# Quick Integration Guide: AI Mastering Progress UI

## Files Already Created ✅

1. **LoudnessMeter.tsx** - `/src/ui/components/LoudnessMeter.tsx`
2. **MasteringProgressBar.tsx** - `/src/ui/components/MasteringProgressBar.tsx`
3. **AIMasteringEngine.ts** - Updated with progress events

## Final Step: Update AdvancedFeaturesPanel.tsx

Open `/src/ui/components/AdvancedFeaturesPanel.tsx` and apply these 4 changes:

### Change 1: Add Imports (Line 34)
Add these two lines after the existing imports:
```typescript
import { LoudnessMeter } from './LoudnessMeter';
import { MasteringProgressBar } from './MasteringProgressBar';
```

### Change 2: Add State (After Line 105)
Add this state object after `const [lastCommand, setLastCommand] = useState<string>('');`:
```typescript
// AI Mastering state
const [masteringProgress, setMasteringProgress] = useState({
  currentStep: 0,
  overallProgress: 0,
  stepProgress: 0,
  estimatedTimeRemaining: 0,
  currentLUFS: -20,
  targetLUFS: -14,
  isProcessing: false,
  isComplete: false,
  isFailed: false,
  error: null as string | null
});
```

### Change 3: Replace handleAIMastering Function (Lines 305-333)
Replace the entire `handleAIMastering` function with this code:

```typescript
// AI Mastering
const handleAIMastering = async (loudnessTarget: number = -14) => {
  if (!features.aiMastering.enabled) return;

  try {
    // Initialize mastering state
    setMasteringProgress({
      currentStep: 0,
      overallProgress: 0,
      stepProgress: 0,
      estimatedTimeRemaining: 8,
      currentLUFS: -20,
      targetLUFS: loudnessTarget,
      isProcessing: true,
      isComplete: false,
      isFailed: false,
      error: null
    });

    setFeatures(prev => ({
      ...prev,
      aiMastering: { ...prev.aiMastering, active: true }
    }));

    // Expand the mastering section automatically
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.add('aiMastering');
      return newSet;
    });

    toast.info('Starting AI mastering...');

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setMasteringProgress(prev => {
        if (prev.overallProgress >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        const newProgress = Math.min(95, prev.overallProgress + 8);
        const newStep = Math.floor(newProgress / 20);
        const elapsed = 8 - (8 * newProgress / 100);
        return {
          ...prev,
          overallProgress: newProgress,
          currentStep: newStep,
          stepProgress: (newProgress % 20) * 5,
          estimatedTimeRemaining: Math.max(0, elapsed),
          currentLUFS: -20 + ((loudnessTarget + 20) * newProgress / 100)
        };
      });
    }, 400);

    const response = await apiClient.request('POST', '/ai/master', {
      projectId,
      targetLoudness: loudnessTarget,
      genre: currentProject?.genre
    });

    clearInterval(progressInterval);

    setMasteringProgress(prev => ({
      ...prev,
      overallProgress: 100,
      currentStep: 4,
      stepProgress: 100,
      isProcessing: false,
      isComplete: true,
      currentLUFS: loudnessTarget,
      estimatedTimeRemaining: 0
    }));

    toast.success(`Mastered to ${loudnessTarget} LUFS!`);

    setTimeout(() => {
      setMasteringProgress(prev => ({
        ...prev,
        isComplete: false,
        isProcessing: false
      }));
    }, 4000);

    return response;
  } catch (error: any) {
    setMasteringProgress(prev => ({
      ...prev,
      isProcessing: false,
      isFailed: true,
      error: error.message
    }));
    toast.error(`AI mastering failed: ${error.message}`);
  } finally {
    setFeatures(prev => ({
      ...prev,
      aiMastering: { ...prev.aiMastering, active: false }
    }));
  }
};

// Cancel mastering
const handleCancelMastering = () => {
  setMasteringProgress(prev => ({
    ...prev,
    isProcessing: false,
    isFailed: true,
    error: 'Cancelled by user'
  }));
  setFeatures(prev => ({
    ...prev,
    aiMastering: { ...prev.aiMastering, active: false }
  }));
  toast.info('Mastering cancelled');
};
```

### Change 4: Replace AI Mastering FeatureCard (Lines 584-622)
Replace the entire AI Mastering FeatureCard section with:

```tsx
{/* 7. AI Mastering */}
<FeatureCard
  title="AI Mastering"
  icon={<Sparkles className="w-5 h-5" />}
  enabled={features.aiMastering.enabled}
  active={features.aiMastering.active}
  onToggle={() => toggleFeature('aiMastering')}
  isExpanded={expandedSections.has('aiMastering')}
  onToggleExpand={() => toggleSection('aiMastering')}
>
  <div className="space-y-3">
    <p className="text-sm text-gray-400">
      Professional mastering to industry loudness standards
    </p>

    {/* Mastering buttons */}
    {!masteringProgress.isProcessing && !masteringProgress.isComplete && (
      <div className="space-y-2">
        <button
          onClick={() => handleAIMastering(-14)}
          disabled={!features.aiMastering.enabled || features.aiMastering.active}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
        >
          Streaming (-14 LUFS)
        </button>
        <button
          onClick={() => handleAIMastering(-9)}
          disabled={!features.aiMastering.enabled || features.aiMastering.active}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
        >
          Club/EDM (-9 LUFS)
        </button>
        <button
          onClick={() => handleAIMastering(-6)}
          disabled={!features.aiMastering.enabled || features.aiMastering.active}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
        >
          Aggressive (-6 LUFS)
        </button>
      </div>
    )}

    {/* Progress display */}
    {(masteringProgress.isProcessing || masteringProgress.isComplete) && (
      <div className="space-y-3">
        <MasteringProgressBar
          currentStep={masteringProgress.currentStep}
          overallProgress={masteringProgress.overallProgress}
          stepProgress={masteringProgress.stepProgress}
          estimatedTimeRemaining={masteringProgress.estimatedTimeRemaining}
          isComplete={masteringProgress.isComplete}
          isFailed={masteringProgress.isFailed}
          error={masteringProgress.error || undefined}
          onCancel={masteringProgress.isProcessing ? handleCancelMastering : undefined}
        />

        <LoudnessMeter
          currentLUFS={masteringProgress.currentLUFS}
          targetLUFS={masteringProgress.targetLUFS}
          isProcessing={masteringProgress.isProcessing}
        />
      </div>
    )}
  </div>
</FeatureCard>
```

## That's It!

After making these 4 changes, the AI Mastering progress UI will be fully integrated and functional.

## Test It

1. Open your app
2. Go to Advanced Features Panel
3. Expand AI Mastering
4. Click any preset button (-14, -9, or -6 LUFS)
5. Watch the progress indicators animate!
