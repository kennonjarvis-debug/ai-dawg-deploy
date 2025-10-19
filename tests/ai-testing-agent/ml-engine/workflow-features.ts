/**
 * Workflow-Specific Feature Extraction
 *
 * Defines feature vectors for each of the 8 DAWG AI workflows:
 * 1. Freestyle Recording
 * 2. Melody-to-Vocals
 * 3. Stem Separation
 * 4. AI Mastering
 * 5. Live Vocal Analysis
 * 6. AI Memory
 * 7. Voice Commands
 * 8. Budget Alerts
 */

export type WorkflowType =
  | 'freestyle'
  | 'melody-to-vocals'
  | 'stem-separation'
  | 'ai-mastering'
  | 'live-vocal-analysis'
  | 'ai-memory'
  | 'voice-commands'
  | 'budget-alerts';

export interface BaseWorkflowFeatures {
  workflowType: WorkflowType;
  timestamp: string;

  // Common features across all workflows
  networkLatencyMs: number;
  apiAvailable: boolean;
  userConcurrency: number;
  systemMemoryMB: number;
  cpuUtilization: number;

  // Time-based features
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  isWeekend: boolean;
}

// ========================================
// 1. FREESTYLE RECORDING FEATURES
// ========================================

export interface FreestyleFeatures extends BaseWorkflowFeatures {
  workflowType: 'freestyle';

  // Audio features
  microphonePermission: boolean;
  audioContextState: 'running' | 'suspended' | 'closed' | 'error';
  sampleRate: number;
  bufferSize: number;

  // Recording features
  recordingDuration: number;
  beatSyncEnabled: boolean;
  beatFileSize: number;

  // Transcription features
  speechRecognitionSupported: boolean;
  transcriptionAccuracy: number; // 0-1
  languageModel: 'en-US' | 'other';

  // Voice command features
  voiceCommandsEnabled: boolean;
  commandRecognitionRate: number; // 0-1

  // Take management
  currentTakeNumber: number;
  totalTakes: number;

  // Memory usage
  audioChunksCount: number;
  lyricsSegmentsCount: number;

  // Historical failure patterns
  previousTranscriptionFailures: number;
  previousAudioUploadFailures: number;
  previousBeatSyncIssues: number;
}

// ========================================
// 2. MELODY-TO-VOCALS FEATURES
// ========================================

export interface MelodyToVocalsFeatures extends BaseWorkflowFeatures {
  workflowType: 'melody-to-vocals';

  // Input audio features
  audioFileSize: number; // bytes
  audioDuration: number; // seconds
  audioFormat: 'wav' | 'mp3' | 'webm' | 'other';

  // AI service features
  expertMusicAIAvailable: boolean;
  expertMusicAILatency: number;
  aiProvider: 'anthropic' | 'openai';
  vocalModel: 'bark' | 'musicgen';

  // Melody analysis features
  expectedNoteCount: number;
  melodyComplexity: number; // 0-1

  // Generation parameters
  promptLength: number;
  genreSpecified: boolean;
  themeSpecified: boolean;
  moodSpecified: boolean;

  // Historical patterns
  previousGenerationFailures: number;
  previousModelTimeouts: number;
  averageProcessingTime: number;
}

// ========================================
// 3. STEM SEPARATION FEATURES
// ========================================

export interface StemSeparationFeatures extends BaseWorkflowFeatures {
  workflowType: 'stem-separation';

  // Input audio features
  audioBufferLength: number;
  audioChannels: number;
  audioSampleRate: number;
  audioDuration: number;

  // Processing configuration
  fftSize: number;
  hopSize: number;
  harmonicMargin: number;
  percussiveMargin: number;
  medianFilterLength: number;

  // Requested stems
  separateVocals: boolean;
  separateDrums: boolean;
  separateBass: boolean;
  separateOther: boolean;

  // Complexity indicators
  estimatedSpectralFrames: number;
  estimatedMemoryRequirement: number; // MB

  // Historical patterns
  previousSeparationFailures: number;
  previousOutOfMemoryErrors: number;
  averageSeparationTime: number;

  // Quality metrics (from past runs)
  averageSeparationQuality: number; // 0-1
}

// ========================================
// 4. AI MASTERING FEATURES
// ========================================

export interface AIMasteringFeatures extends BaseWorkflowFeatures {
  workflowType: 'ai-mastering';

  // Input audio features
  audioFileSize: number;
  audioDuration: number;
  peakLevel: number; // dB
  rmsLevel: number; // dB
  dynamicRange: number; // dB

  // Mastering parameters
  targetLUFS: number;
  enableLimiter: boolean;
  enableEQ: boolean;
  enableCompression: boolean;
  enableStereoWidening: boolean;

  // Quality targets
  targetClipping: number; // threshold
  targetFrequencyBalance: number; // 0-1

  // Processing load
  estimatedProcessingComplexity: number; // 0-1
  parallelProcessingEnabled: boolean;

  // Historical patterns
  previousClippingIssues: number;
  previousLUFSAccuracyErrors: number;
  previousProcessingTimeouts: number;
  averageMasteringTime: number;
}

// ========================================
// 5. LIVE VOCAL ANALYSIS FEATURES
// ========================================

export interface LiveVocalAnalysisFeatures extends BaseWorkflowFeatures {
  workflowType: 'live-vocal-analysis';

  // Real-time processing
  targetLatency: number; // ms
  bufferSize: number;
  sampleRate: number;
  processingInterval: number; // ms (typically 100ms)

  // WebSocket connection
  websocketConnected: boolean;
  websocketLatency: number; // ms
  messageQueueSize: number;

  // Analysis features
  pitchDetectionEnabled: boolean;
  rhythmDetectionEnabled: boolean;
  vibratoDetectionEnabled: boolean;
  qualityAnalysisEnabled: boolean;

  // Reference settings
  referenceKeySet: boolean;
  expectedBPMSet: boolean;

  // Performance indicators
  averageAnalysisTime: number; // ms
  droppedFramesCount: number;

  // Historical patterns
  previousPitchDetectionFailures: number;
  previousWebSocketDisconnects: number;
  previousLatencySpikes: number;
  averageReconnectionTime: number;
}

// ========================================
// 6. AI MEMORY FEATURES
// ========================================

export interface AIMemoryFeatures extends BaseWorkflowFeatures {
  workflowType: 'ai-memory';

  // Database features
  databaseConnected: boolean;
  databaseLatency: number; // ms
  totalMemoriesCount: number;

  // Memory operation
  operationType: 'store' | 'retrieve' | 'update' | 'delete' | 'search';
  memoryType: 'preference' | 'fact' | 'context' | 'interaction';

  // Retrieval features
  searchQueryComplexity: number; // 0-1
  retrievalLimit: number;
  minImportanceFilter: number; // 0-10
  categoryFilterApplied: boolean;

  // Vector similarity (if using embeddings)
  vectorSimilarityEnabled: boolean;
  embeddingDimensions: number;

  // Content size
  memoryContentSize: number; // characters
  metadataSize: number; // characters

  // Historical patterns
  previousDatabaseTimeouts: number;
  previousRetrievalFailures: number;
  previousAccessCountUpdateFailures: number;
  averageRetrievalTime: number;

  // Memory health
  expiredMemoriesCount: number;
  averageAccessCount: number;
}

// ========================================
// 7. VOICE COMMANDS FEATURES
// ========================================

export interface VoiceCommandsFeatures extends BaseWorkflowFeatures {
  workflowType: 'voice-commands';

  // Speech recognition
  speechRecognitionSupported: boolean;
  recognitionEngineType: 'webkit' | 'standard' | 'none';
  continuousMode: boolean;
  interimResultsEnabled: boolean;

  // Microphone features
  microphonePermission: boolean;
  microphoneQuality: number; // 0-1
  backgroundNoiseLevel: number; // 0-1

  // Command matching
  registeredCommandsCount: number;
  commandCategory: 'recording' | 'playback' | 'navigation' | 'ai' | 'general';
  fuzzyMatchingEnabled: boolean;
  minConfidenceThreshold: number; // 0-1

  // Transcript features
  transcriptLength: number; // words
  transcriptComplexity: number; // 0-1

  // Execution features
  commandHasParameters: boolean;
  parameterCount: number;
  asyncCommandExecution: boolean;

  // Historical patterns
  previousRecognitionErrors: number;
  previousPermissionDenials: number;
  previousCommandMismatches: number;
  previousExecutionFailures: number;
  averageRecognitionLatency: number;
  averageCommandMatchConfidence: number; // 0-1
}

// ========================================
// 8. BUDGET ALERTS FEATURES
// ========================================

export interface BudgetAlertsFeatures extends BaseWorkflowFeatures {
  workflowType: 'budget-alerts';

  // Budget configuration
  dailyLimitSet: boolean;
  monthlyLimitSet: boolean;
  alertThreshold: number; // 0-1 (e.g., 0.8 = 80%)
  pauseOnExceedEnabled: boolean;

  // Current spending
  dailySpent: number;
  monthlySpent: number;
  dailyPercentage: number; // 0-100
  monthlyPercentage: number; // 0-100

  // Alert operation
  operationType: 'check_budget' | 'create_alert' | 'resolve_alert' | 'reset_budget';
  isOverDailyBudget: boolean;
  isOverMonthlyBudget: boolean;

  // Alert features
  unreadAlertsCount: number;
  unresolvedAlertsCount: number;
  alertSeverity: 'info' | 'warning' | 'critical';

  // API usage tracking
  apiLogsCount: number;
  servicesUsedCount: number;
  costCalculationComplexity: number; // 0-1

  // Historical patterns
  previousCostCalculationErrors: number;
  previousAlertCreationFailures: number;
  previousThresholdDetectionMisses: number;
  averageAlertLatency: number; // ms

  // Spending trends
  spendingTrendDirection: 'increasing' | 'decreasing' | 'stable';
  spendingVelocity: number; // $ per day
  projectedMonthlyOverage: number; // $
}

// ========================================
// UNIFIED FEATURE VECTOR TYPE
// ========================================

export type WorkflowFeatures =
  | FreestyleFeatures
  | MelodyToVocalsFeatures
  | StemSeparationFeatures
  | AIMasteringFeatures
  | LiveVocalAnalysisFeatures
  | AIMemoryFeatures
  | VoiceCommandsFeatures
  | BudgetAlertsFeatures;

// ========================================
// FEATURE EXTRACTION UTILITIES
// ========================================

/**
 * Convert workflow features to numeric feature vector for ML
 */
export function featuresToVector(features: WorkflowFeatures): Record<string, number> {
  const baseVector = {
    // Common features (normalized)
    networkLatency: features.networkLatencyMs / 1000, // normalize to seconds
    apiAvailable: features.apiAvailable ? 1 : 0,
    userConcurrency: Math.min(features.userConcurrency / 100, 1), // cap at 100
    systemMemory: features.systemMemoryMB / 16384, // normalize to 16GB
    cpuUtilization: features.cpuUtilization,
    timeOfDay: features.timeOfDay / 24,
    dayOfWeek: features.dayOfWeek / 7,
    isWeekend: features.isWeekend ? 1 : 0,
  };

  // Add workflow-specific features
  switch (features.workflowType) {
    case 'freestyle':
      return {
        ...baseVector,
        micPermission: features.microphonePermission ? 1 : 0,
        audioContextOk: features.audioContextState === 'running' ? 1 : 0,
        sampleRate: features.sampleRate / 48000,
        recordingDuration: Math.min(features.recordingDuration / 600, 1), // cap at 10 min
        beatSync: features.beatSyncEnabled ? 1 : 0,
        beatFileSize: Math.min(features.beatFileSize / 10000000, 1), // cap at 10MB
        speechRecognitionOk: features.speechRecognitionSupported ? 1 : 0,
        transcriptionAccuracy: features.transcriptionAccuracy,
        voiceCommandsOn: features.voiceCommandsEnabled ? 1 : 0,
        commandRecognition: features.commandRecognitionRate,
        takeNumber: Math.min(features.currentTakeNumber / 20, 1), // cap at 20
        totalTakes: Math.min(features.totalTakes / 20, 1),
        audioChunks: Math.min(features.audioChunksCount / 1000, 1),
        lyricsSegments: Math.min(features.lyricsSegmentsCount / 100, 1),
        prevTranscriptionFails: Math.min(features.previousTranscriptionFailures / 10, 1),
        prevUploadFails: Math.min(features.previousAudioUploadFailures / 10, 1),
        prevBeatSyncIssues: Math.min(features.previousBeatSyncIssues / 10, 1),
      };

    case 'melody-to-vocals':
      return {
        ...baseVector,
        audioSize: Math.min(features.audioFileSize / 50000000, 1), // cap at 50MB
        audioDuration: Math.min(features.audioDuration / 300, 1), // cap at 5 min
        audioFormatWav: features.audioFormat === 'wav' ? 1 : 0,
        expertAIAvailable: features.expertMusicAIAvailable ? 1 : 0,
        expertAILatency: Math.min(features.expertMusicAILatency / 5000, 1), // cap at 5s
        aiProviderAnthropic: features.aiProvider === 'anthropic' ? 1 : 0,
        vocalModelBark: features.vocalModel === 'bark' ? 1 : 0,
        expectedNotes: Math.min(features.expectedNoteCount / 100, 1),
        melodyComplexity: features.melodyComplexity,
        promptLength: Math.min(features.promptLength / 500, 1),
        genreSet: features.genreSpecified ? 1 : 0,
        themeSet: features.themeSpecified ? 1 : 0,
        moodSet: features.moodSpecified ? 1 : 0,
        prevGenFails: Math.min(features.previousGenerationFailures / 10, 1),
        prevTimeouts: Math.min(features.previousModelTimeouts / 10, 1),
        avgProcessing: Math.min(features.averageProcessingTime / 60000, 1), // cap at 1 min
      };

    case 'stem-separation':
      return {
        ...baseVector,
        bufferLength: Math.min(features.audioBufferLength / 10000000, 1),
        audioChannels: features.audioChannels / 2,
        sampleRate: features.audioSampleRate / 48000,
        duration: Math.min(features.audioDuration / 600, 1),
        fftSize: Math.min(features.fftSize / 8192, 1),
        hopSize: Math.min(features.hopSize / 2048, 1),
        separateVocals: features.separateVocals ? 1 : 0,
        separateDrums: features.separateDrums ? 1 : 0,
        separateBass: features.separateBass ? 1 : 0,
        separateOther: features.separateOther ? 1 : 0,
        spectralFrames: Math.min(features.estimatedSpectralFrames / 10000, 1),
        memoryReq: Math.min(features.estimatedMemoryRequirement / 4096, 1), // cap at 4GB
        prevSepFails: Math.min(features.previousSeparationFailures / 10, 1),
        prevOOMErrors: Math.min(features.previousOutOfMemoryErrors / 10, 1),
        avgSepTime: Math.min(features.averageSeparationTime / 120000, 1), // cap at 2 min
        avgQuality: features.averageSeparationQuality,
      };

    case 'ai-mastering':
      return {
        ...baseVector,
        audioSize: Math.min(features.audioFileSize / 100000000, 1),
        duration: Math.min(features.audioDuration / 600, 1),
        peakLevel: (features.peakLevel + 60) / 60, // normalize from -60 to 0
        rmsLevel: (features.rmsLevel + 60) / 60,
        dynamicRange: Math.min(features.dynamicRange / 40, 1),
        targetLUFS: (features.targetLUFS + 30) / 30, // normalize from -30 to 0
        enableLimiter: features.enableLimiter ? 1 : 0,
        enableEQ: features.enableEQ ? 1 : 0,
        enableCompression: features.enableCompression ? 1 : 0,
        enableStereoWiden: features.enableStereoWidening ? 1 : 0,
        processingComplexity: features.estimatedProcessingComplexity,
        parallelProcessing: features.parallelProcessingEnabled ? 1 : 0,
        prevClipping: Math.min(features.previousClippingIssues / 10, 1),
        prevLUFSErrors: Math.min(features.previousLUFSAccuracyErrors / 10, 1),
        prevTimeouts: Math.min(features.previousProcessingTimeouts / 10, 1),
        avgMasterTime: Math.min(features.averageMasteringTime / 60000, 1),
      };

    case 'live-vocal-analysis':
      return {
        ...baseVector,
        targetLatency: Math.min(features.targetLatency / 100, 1),
        bufferSize: features.bufferSize / 4096,
        sampleRate: features.sampleRate / 48000,
        processingInterval: features.processingInterval / 1000,
        wsConnected: features.websocketConnected ? 1 : 0,
        wsLatency: Math.min(features.websocketLatency / 500, 1),
        queueSize: Math.min(features.messageQueueSize / 100, 1),
        pitchDetection: features.pitchDetectionEnabled ? 1 : 0,
        rhythmDetection: features.rhythmDetectionEnabled ? 1 : 0,
        vibratoDetection: features.vibratoDetectionEnabled ? 1 : 0,
        qualityAnalysis: features.qualityAnalysisEnabled ? 1 : 0,
        refKeySet: features.referenceKeySet ? 1 : 0,
        bpmSet: features.expectedBPMSet ? 1 : 0,
        avgAnalysisTime: Math.min(features.averageAnalysisTime / 100, 1),
        droppedFrames: Math.min(features.droppedFramesCount / 100, 1),
        prevPitchFails: Math.min(features.previousPitchDetectionFailures / 10, 1),
        prevWSDisconnects: Math.min(features.previousWebSocketDisconnects / 10, 1),
        prevLatencySpikes: Math.min(features.previousLatencySpikes / 10, 1),
        avgReconnectTime: Math.min(features.averageReconnectionTime / 5000, 1),
      };

    case 'ai-memory':
      return {
        ...baseVector,
        dbConnected: features.databaseConnected ? 1 : 0,
        dbLatency: Math.min(features.databaseLatency / 1000, 1),
        totalMemories: Math.min(features.totalMemoriesCount / 10000, 1),
        opStore: features.operationType === 'store' ? 1 : 0,
        opRetrieve: features.operationType === 'retrieve' ? 1 : 0,
        opSearch: features.operationType === 'search' ? 1 : 0,
        memTypePreference: features.memoryType === 'preference' ? 1 : 0,
        memTypeFact: features.memoryType === 'fact' ? 1 : 0,
        searchComplexity: features.searchQueryComplexity,
        retrievalLimit: Math.min(features.retrievalLimit / 100, 1),
        minImportance: features.minImportanceFilter / 10,
        categoryFilter: features.categoryFilterApplied ? 1 : 0,
        vectorSimilarity: features.vectorSimilarityEnabled ? 1 : 0,
        contentSize: Math.min(features.memoryContentSize / 5000, 1),
        metadataSize: Math.min(features.metadataSize / 1000, 1),
        prevDBTimeouts: Math.min(features.previousDatabaseTimeouts / 10, 1),
        prevRetrievalFails: Math.min(features.previousRetrievalFailures / 10, 1),
        avgRetrievalTime: Math.min(features.averageRetrievalTime / 1000, 1),
        expiredMemories: Math.min(features.expiredMemoriesCount / 100, 1),
      };

    case 'voice-commands':
      return {
        ...baseVector,
        speechRecognitionOk: features.speechRecognitionSupported ? 1 : 0,
        engineWebkit: features.recognitionEngineType === 'webkit' ? 1 : 0,
        continuous: features.continuousMode ? 1 : 0,
        interimResults: features.interimResultsEnabled ? 1 : 0,
        micPermission: features.microphonePermission ? 1 : 0,
        micQuality: features.microphoneQuality,
        noiseLevel: features.backgroundNoiseLevel,
        commandsCount: Math.min(features.registeredCommandsCount / 50, 1),
        categoryRecording: features.commandCategory === 'recording' ? 1 : 0,
        fuzzyMatching: features.fuzzyMatchingEnabled ? 1 : 0,
        minConfidence: features.minConfidenceThreshold,
        transcriptLength: Math.min(features.transcriptLength / 50, 1),
        transcriptComplexity: features.transcriptComplexity,
        hasParameters: features.commandHasParameters ? 1 : 0,
        paramCount: Math.min(features.parameterCount / 5, 1),
        asyncExec: features.asyncCommandExecution ? 1 : 0,
        prevRecognitionErrors: Math.min(features.previousRecognitionErrors / 10, 1),
        prevPermissionDenials: Math.min(features.previousPermissionDenials / 10, 1),
        prevMismatches: Math.min(features.previousCommandMismatches / 10, 1),
        prevExecFails: Math.min(features.previousExecutionFailures / 10, 1),
        avgRecogLatency: Math.min(features.averageRecognitionLatency / 1000, 1),
        avgMatchConfidence: features.averageCommandMatchConfidence,
      };

    case 'budget-alerts':
      return {
        ...baseVector,
        dailyLimitSet: features.dailyLimitSet ? 1 : 0,
        monthlyLimitSet: features.monthlyLimitSet ? 1 : 0,
        alertThreshold: features.alertThreshold,
        pauseOnExceed: features.pauseOnExceedEnabled ? 1 : 0,
        dailySpent: Math.min(features.dailySpent / 100, 1), // normalize to $100
        monthlySpent: Math.min(features.monthlySpent / 500, 1), // normalize to $500
        dailyPct: features.dailyPercentage / 100,
        monthlyPct: features.monthlyPercentage / 100,
        opCheckBudget: features.operationType === 'check_budget' ? 1 : 0,
        opCreateAlert: features.operationType === 'create_alert' ? 1 : 0,
        overDaily: features.isOverDailyBudget ? 1 : 0,
        overMonthly: features.isOverMonthlyBudget ? 1 : 0,
        unreadAlerts: Math.min(features.unreadAlertsCount / 20, 1),
        unresolvedAlerts: Math.min(features.unresolvedAlertsCount / 20, 1),
        severityCritical: features.alertSeverity === 'critical' ? 1 : 0,
        apiLogsCount: Math.min(features.apiLogsCount / 1000, 1),
        servicesUsed: Math.min(features.servicesUsedCount / 10, 1),
        costCalcComplexity: features.costCalculationComplexity,
        prevCostCalcErrors: Math.min(features.previousCostCalculationErrors / 10, 1),
        prevAlertFails: Math.min(features.previousAlertCreationFailures / 10, 1),
        prevThresholdMisses: Math.min(features.previousThresholdDetectionMisses / 10, 1),
        avgAlertLatency: Math.min(features.averageAlertLatency / 1000, 1),
        trendIncreasing: features.spendingTrendDirection === 'increasing' ? 1 : 0,
        spendingVelocity: Math.min(features.spendingVelocity / 10, 1),
        projectedOverage: Math.min(features.projectedMonthlyOverage / 100, 1),
      };

    default:
      return baseVector;
  }
}

/**
 * Get workflow-specific critical features
 */
export function getCriticalFeatures(workflowType: WorkflowType): string[] {
  const baseCritical = ['networkLatency', 'apiAvailable', 'cpuUtilization', 'systemMemory'];

  const workflowCritical: Record<WorkflowType, string[]> = {
    'freestyle': ['micPermission', 'audioContextOk', 'speechRecognitionOk', 'transcriptionAccuracy', 'prevTranscriptionFails'],
    'melody-to-vocals': ['expertAIAvailable', 'expertAILatency', 'audioSize', 'prevGenFails', 'prevTimeouts'],
    'stem-separation': ['memoryReq', 'spectralFrames', 'prevOOMErrors', 'avgSepTime'],
    'ai-mastering': ['processingComplexity', 'prevClipping', 'prevLUFSErrors', 'avgMasterTime'],
    'live-vocal-analysis': ['wsConnected', 'wsLatency', 'targetLatency', 'avgAnalysisTime', 'prevWSDisconnects'],
    'ai-memory': ['dbConnected', 'dbLatency', 'totalMemories', 'prevDBTimeouts', 'prevRetrievalFails'],
    'voice-commands': ['speechRecognitionOk', 'micPermission', 'micQuality', 'prevRecognitionErrors', 'avgMatchConfidence'],
    'budget-alerts': ['dailyPct', 'monthlyPct', 'overDaily', 'overMonthly', 'prevCostCalcErrors'],
  };

  return [...baseCritical, ...workflowCritical[workflowType]];
}

/**
 * Get workflow display name
 */
export function getWorkflowDisplayName(workflowType: WorkflowType): string {
  const names: Record<WorkflowType, string> = {
    'freestyle': 'Freestyle Recording',
    'melody-to-vocals': 'Melody-to-Vocals',
    'stem-separation': 'Stem Separation',
    'ai-mastering': 'AI Mastering',
    'live-vocal-analysis': 'Live Vocal Analysis',
    'ai-memory': 'AI Memory',
    'voice-commands': 'Voice Commands',
    'budget-alerts': 'Budget Alerts',
  };
  return names[workflowType];
}
