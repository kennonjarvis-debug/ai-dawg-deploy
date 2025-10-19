import fs from 'fs/promises';
import path from 'path';
import { MemoryEntry, LearningInsight } from './agent-brain';

/**
 * Fix pattern tracked by the learning engine
 */
export interface FixPattern {
  errorType: string;
  fixStrategy: string;
  successCount: number;
  failureCount: number;
  successRate: number;
  examples: Array<{
    testName: string;
    timestamp: string;
    successful: boolean;
  }>;
  confidence: number;
  lastUsed: string;
}

/**
 * Test generation pattern
 */
export interface TestPattern {
  name: string;
  description: string;
  effectiveness: number; // 0-1
  usageCount: number;
  category: string;
  template?: string;
  examples: string[];
}

/**
 * Learning statistics
 */
export interface LearningStats {
  totalFixesLearned: number;
  totalTestPatternsLearned: number;
  avgFixSuccessRate: number;
  mostEffectivePatterns: TestPattern[];
  recentImprovements: string[];
}

/**
 * LearningEngine: Learns from past experiences to improve over time
 *
 * Capabilities:
 * - Track fix success rates
 * - Learn test generation patterns
 * - Identify effective strategies
 * - Improve recommendations based on outcomes
 * - Detect patterns in failures
 */
export class LearningEngine {
  private fixPatterns: Map<string, FixPattern>;
  private testPatterns: Map<string, TestPattern>;
  private learningHistory: Array<{
    timestamp: string;
    type: 'fix' | 'pattern' | 'insight';
    description: string;
    impact: number;
  }>;
  private storageDir: string;
  private storageFile: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || path.join(process.cwd(), 'tests/ai-testing-agent/brain/.storage');
    this.storageFile = path.join(this.storageDir, 'learning-engine.json');
    this.fixPatterns = new Map();
    this.testPatterns = new Map();
    this.learningHistory = [];
  }

  /**
   * Initialize the learning engine
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    await this.load();

    console.log(`  LearningEngine initialized with ${this.fixPatterns.size} fix patterns`);
  }

  /**
   * Record an event (test run, failure, fix, etc.)
   */
  async recordEvent(memory: MemoryEntry): Promise<void> {
    // Extract learnings based on memory type
    switch (memory.type) {
      case 'fix_applied':
        await this.learnFromFix(
          memory.metadata.testName || 'unknown',
          memory.metadata.errorType || 'unknown',
          memory.metadata.fixStrategy || memory.content,
          memory.metadata.successRate === 1.0
        );
        break;

      case 'test_pattern':
        await this.learnTestPattern(
          memory.metadata.patternName || 'unknown',
          memory.content,
          memory.metadata.effectiveness || 0.5,
          memory.metadata.testName || 'unknown'
        );
        break;

      case 'test_failure':
        await this.analyzeFailurePattern(memory);
        break;
    }
  }

  /**
   * Learn from a fix attempt
   */
  async learnFromFix(
    testName: string,
    errorType: string,
    fixStrategy: string,
    wasSuccessful: boolean
  ): Promise<void> {
    const patternKey = `${errorType}::${this.normalizeStrategy(fixStrategy)}`;

    let pattern = this.fixPatterns.get(patternKey);

    if (!pattern) {
      pattern = {
        errorType,
        fixStrategy,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        examples: [],
        confidence: 0,
        lastUsed: new Date().toISOString(),
      };
      this.fixPatterns.set(patternKey, pattern);
    }

    // Update counts
    if (wasSuccessful) {
      pattern.successCount++;
    } else {
      pattern.failureCount++;
    }

    // Recalculate success rate
    const total = pattern.successCount + pattern.failureCount;
    pattern.successRate = pattern.successCount / total;

    // Calculate confidence (higher with more data)
    pattern.confidence = this.calculateConfidence(total, pattern.successRate);

    // Add example
    pattern.examples.push({
      testName,
      timestamp: new Date().toISOString(),
      successful: wasSuccessful,
    });

    // Keep only recent examples
    if (pattern.examples.length > 10) {
      pattern.examples = pattern.examples.slice(-10);
    }

    pattern.lastUsed = new Date().toISOString();

    // Record learning event
    this.learningHistory.push({
      timestamp: new Date().toISOString(),
      type: 'fix',
      description: `Learned fix pattern: ${errorType} -> ${fixStrategy.substring(0, 50)}... (success: ${wasSuccessful})`,
      impact: wasSuccessful ? 0.8 : 0.2,
    });

    await this.save();
  }

  /**
   * Learn a test pattern
   */
  async learnTestPattern(
    patternName: string,
    description: string,
    effectiveness: number,
    example: string
  ): Promise<void> {
    let pattern = this.testPatterns.get(patternName);

    if (!pattern) {
      pattern = {
        name: patternName,
        description,
        effectiveness,
        usageCount: 0,
        category: this.categorizePattern(patternName),
        examples: [],
      };
      this.testPatterns.set(patternName, pattern);
    }

    // Update effectiveness (moving average)
    pattern.effectiveness = (pattern.effectiveness * pattern.usageCount + effectiveness) / (pattern.usageCount + 1);
    pattern.usageCount++;

    // Add example
    if (!pattern.examples.includes(example)) {
      pattern.examples.push(example);

      // Keep only recent examples
      if (pattern.examples.length > 5) {
        pattern.examples = pattern.examples.slice(-5);
      }
    }

    // Record learning event
    this.learningHistory.push({
      timestamp: new Date().toISOString(),
      type: 'pattern',
      description: `Updated test pattern: ${patternName} (effectiveness: ${effectiveness.toFixed(2)})`,
      impact: effectiveness,
    });

    await this.save();
  }

  /**
   * Analyze a failure to detect patterns
   */
  private async analyzeFailurePattern(memory: MemoryEntry): Promise<void> {
    // Extract common failure characteristics
    const errorType = memory.metadata.errorType || 'unknown';
    const errorMessage = memory.content;

    // Look for recurring patterns
    const similarFailures = Array.from(this.fixPatterns.values())
      .filter(p => p.errorType === errorType);

    if (similarFailures.length >= 3) {
      // We have a pattern - record insight
      this.learningHistory.push({
        timestamp: new Date().toISOString(),
        type: 'insight',
        description: `Detected recurring failure pattern: ${errorType} (${similarFailures.length} occurrences)`,
        impact: 0.6,
      });
    }
  }

  /**
   * Get learning insights
   */
  async getInsights(category?: string): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Insight 1: Most effective fix patterns
    const topFixes = Array.from(this.fixPatterns.values())
      .filter(p => p.confidence > 0.5)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    if (topFixes.length > 0) {
      insights.push({
        pattern: 'High Success Fix Strategies',
        confidence: topFixes.reduce((acc, p) => acc + p.confidence, 0) / topFixes.length,
        examples: topFixes.map(p => ({
          id: `fix_${p.errorType}`,
          type: 'fix_applied',
          content: `${p.errorType}: ${p.fixStrategy}`,
          timestamp: p.lastUsed,
          metadata: {
            errorType: p.errorType,
            fixStrategy: p.fixStrategy,
            successRate: p.successRate,
          },
        })),
        recommendation: `Use these proven fix strategies for common errors: ${topFixes.map(p => p.errorType).join(', ')}`,
        applicability: topFixes.map(p => p.errorType),
      });
    }

    // Insight 2: Most effective test patterns
    const topPatterns = Array.from(this.testPatterns.values())
      .filter(p => p.effectiveness > 0.7)
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);

    if (topPatterns.length > 0) {
      insights.push({
        pattern: 'Effective Test Patterns',
        confidence: topPatterns.reduce((acc, p) => acc + p.effectiveness, 0) / topPatterns.length,
        examples: topPatterns.map(p => ({
          id: `pattern_${p.name}`,
          type: 'test_pattern',
          content: p.description,
          timestamp: new Date().toISOString(),
          metadata: {
            patternName: p.name,
            effectiveness: p.effectiveness,
          },
        })),
        recommendation: `Apply these test patterns for better coverage: ${topPatterns.map(p => p.name).join(', ')}`,
        applicability: topPatterns.map(p => p.category),
      });
    }

    // Insight 3: Common failure patterns
    const errorTypeCounts = new Map<string, number>();
    for (const pattern of this.fixPatterns.values()) {
      const count = errorTypeCounts.get(pattern.errorType) || 0;
      errorTypeCounts.set(pattern.errorType, count + pattern.successCount + pattern.failureCount);
    }

    const commonErrors = Array.from(errorTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (commonErrors.length > 0) {
      insights.push({
        pattern: 'Common Error Types',
        confidence: 0.9,
        examples: commonErrors.map(([errorType, count]) => ({
          id: `error_${errorType}`,
          type: 'test_failure',
          content: `${errorType} (${count} occurrences)`,
          timestamp: new Date().toISOString(),
          metadata: { errorType },
        })),
        recommendation: `Focus on preventing these common errors: ${commonErrors.map(e => e[0]).join(', ')}`,
        applicability: commonErrors.map(e => e[0]),
      });
    }

    // Insight 4: Improving patterns (upward trends)
    const improvingPatterns = Array.from(this.testPatterns.values())
      .filter(p => p.usageCount >= 3 && p.effectiveness > 0.6);

    if (improvingPatterns.length > 0) {
      insights.push({
        pattern: 'Consistently Effective Patterns',
        confidence: 0.8,
        examples: improvingPatterns.map(p => ({
          id: `improving_${p.name}`,
          type: 'test_pattern',
          content: `${p.name}: ${p.description}`,
          timestamp: new Date().toISOString(),
          metadata: { patternName: p.name, effectiveness: p.effectiveness },
        })),
        recommendation: `Continue using these reliable patterns: ${improvingPatterns.map(p => p.name).join(', ')}`,
        applicability: improvingPatterns.map(p => p.category),
      });
    }

    // Filter by category if specified
    if (category) {
      return insights.filter(i =>
        i.applicability.some(a => a.toLowerCase().includes(category.toLowerCase()))
      );
    }

    return insights;
  }

  /**
   * Get best fix recommendation for an error type
   */
  async getBestFix(errorType: string): Promise<FixPattern | undefined> {
    const candidates = Array.from(this.fixPatterns.values())
      .filter(p => p.errorType === errorType)
      .sort((a, b) => {
        // Sort by confidence first, then success rate
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
          return b.confidence - a.confidence;
        }
        return b.successRate - a.successRate;
      });

    return candidates[0];
  }

  /**
   * Get learning statistics
   */
  async getStats(): Promise<LearningStats> {
    const fixes = Array.from(this.fixPatterns.values());
    const patterns = Array.from(this.testPatterns.values());

    const avgSuccessRate = fixes.length > 0
      ? fixes.reduce((acc, f) => acc + f.successRate, 0) / fixes.length
      : 0;

    const mostEffectivePatterns = patterns
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);

    const recentImprovements = this.learningHistory
      .filter(h => h.impact > 0.7)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(h => h.description);

    return {
      totalFixesLearned: fixes.length,
      totalTestPatternsLearned: patterns.length,
      avgFixSuccessRate: avgSuccessRate,
      mostEffectivePatterns,
      recentImprovements,
    };
  }

  /**
   * Export learning data
   */
  async export(filepath: string): Promise<void> {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      fixPatterns: Array.from(this.fixPatterns.entries()),
      testPatterns: Array.from(this.testPatterns.entries()),
      learningHistory: this.learningHistory,
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Import learning data
   */
  async import(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    const data = JSON.parse(content);

    if (data.fixPatterns) {
      this.fixPatterns = new Map(data.fixPatterns);
    }

    if (data.testPatterns) {
      this.testPatterns = new Map(data.testPatterns);
    }

    if (data.learningHistory) {
      this.learningHistory = data.learningHistory;
    }

    await this.save();
  }

  // ==================== Private Helper Methods ====================

  private normalizeStrategy(strategy: string): string {
    // Normalize strategy string for pattern matching
    return strategy
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  private calculateConfidence(sampleSize: number, successRate: number): number {
    // Confidence increases with sample size and high/low success rates
    // Uses a modified Wilson score interval concept

    if (sampleSize === 0) return 0;

    const minSamples = 5;
    const sampleConfidence = Math.min(sampleSize / minSamples, 1);

    // Higher confidence for clear success or clear failure
    const rateConfidence = Math.abs(successRate - 0.5) * 2;

    return (sampleConfidence * 0.6 + rateConfidence * 0.4);
  }

  private categorizePattern(patternName: string): string {
    const name = patternName.toLowerCase();

    if (name.includes('e2e') || name.includes('end-to-end')) return 'e2e';
    if (name.includes('integration')) return 'integration';
    if (name.includes('unit')) return 'unit';
    if (name.includes('performance') || name.includes('load')) return 'performance';
    if (name.includes('visual') || name.includes('screenshot')) return 'visual';
    if (name.includes('api') || name.includes('endpoint')) return 'api';
    if (name.includes('ui') || name.includes('interface')) return 'ui';

    return 'general';
  }

  private async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.storageFile, 'utf-8');
      const data = JSON.parse(content);

      if (data.fixPatterns) {
        this.fixPatterns = new Map(data.fixPatterns);
      }

      if (data.testPatterns) {
        this.testPatterns = new Map(data.testPatterns);
      }

      if (data.learningHistory) {
        this.learningHistory = data.learningHistory;
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn('  Warning: Failed to load learning engine:', error.message);
      }
    }
  }

  private async save(): Promise<void> {
    const data = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      fixPatterns: Array.from(this.fixPatterns.entries()),
      testPatterns: Array.from(this.testPatterns.entries()),
      learningHistory: this.learningHistory.slice(-100), // Keep last 100 events
    };

    await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
