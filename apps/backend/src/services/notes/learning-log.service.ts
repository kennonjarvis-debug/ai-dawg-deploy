/**
 * Learning Log Service
 * Tracks all improvements JARVIS makes from voice memo analysis
 */

import fs from 'fs';

const LEARNING_LOG_FILE = '/tmp/jarvis-learning-log.json';

export interface LearningLogEntry {
  timestamp: string;
  batchNumber: number;
  type: 'insight' | 'rule' | 'improvement' | 'action' | 'metric';
  category: 'parsing' | 'quality' | 'structure' | 'cleanup' | 'management';
  message: string;
  details?: any;
}

export interface LearningMetrics {
  totalBatches: number;
  totalMemos: number;
  totalRules: number;
  totalInsights: number;
  totalActions: number;
  averageConfidence: number;
  startTime: string;
  lastUpdate: string;
}

export class LearningLogService {
  private log: LearningLogEntry[] = [];
  private metrics: LearningMetrics;

  constructor() {
    this.load();
    this.metrics = this.calculateMetrics();
  }

  /**
   * Load existing log
   */
  private load(): void {
    if (fs.existsSync(LEARNING_LOG_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEARNING_LOG_FILE, 'utf-8'));
      this.log = data.log || [];
      this.metrics = data.metrics || this.initMetrics();
    } else {
      this.metrics = this.initMetrics();
    }
  }

  /**
   * Save log to file
   */
  private save(): void {
    fs.writeFileSync(LEARNING_LOG_FILE, JSON.stringify({
      log: this.log,
      metrics: this.metrics,
    }, null, 2));
  }

  /**
   * Initialize metrics
   */
  private initMetrics(): LearningMetrics {
    return {
      totalBatches: 0,
      totalMemos: 0,
      totalRules: 0,
      totalInsights: 0,
      totalActions: 0,
      averageConfidence: 0,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Calculate current metrics from log
   */
  private calculateMetrics(): LearningMetrics {
    if (!this.metrics) {
      return this.initMetrics();
    }

    const rules = this.log.filter(e => e.type === 'rule').length;
    const insights = this.log.filter(e => e.type === 'insight').length;
    const actions = this.log.filter(e => e.type === 'action').length;

    // Infer batches from log entries
    const batchNumbers = [...new Set(this.log.map(e => e.batchNumber))];
    const totalBatches = batchNumbers.length > 0 ? Math.max(...batchNumbers) : this.metrics.totalBatches;

    // Recalculate memos and confidence from metric entries
    const batchMetrics = this.log.filter(e => e.type === 'metric' && e.details?.memosProcessed !== undefined);
    const totalMemos = batchMetrics.reduce((sum, e) => sum + (e.details?.memosProcessed || 0), 0);

    const confidenceMetrics = this.log.filter(e => e.type === 'metric' && e.details?.confidence !== undefined);
    const averageConfidence = confidenceMetrics.length > 0
      ? confidenceMetrics.reduce((sum, e) => sum + (e.details?.confidence || 0), 0) / confidenceMetrics.length
      : 0;

    return {
      ...this.metrics,
      totalBatches,
      totalMemos,
      totalRules: rules,
      totalInsights: insights,
      totalActions: actions,
      averageConfidence,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Add a learning entry
   */
  addEntry(entry: Omit<LearningLogEntry, 'timestamp'>): void {
    const newEntry: LearningLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.log.push(newEntry);
    this.metrics = this.calculateMetrics();
    this.save();
  }

  /**
   * Log batch completion
   */
  logBatch(batchNumber: number, memosProcessed: number, confidence: number): void {
    // Update total memos
    this.metrics.totalMemos += memosProcessed;

    // Calculate running average confidence
    const batchMetrics = this.log.filter(e => e.type === 'metric' && e.details?.confidence !== undefined);
    const totalConfidence = batchMetrics.reduce((sum, e) => sum + (e.details?.confidence || 0), 0) + confidence;
    const totalBatches = batchMetrics.length + 1;
    this.metrics.averageConfidence = totalConfidence / totalBatches;

    this.addEntry({
      batchNumber,
      type: 'metric',
      category: 'management',
      message: `Batch ${batchNumber} completed: ${memosProcessed} memos processed (${Math.round(confidence * 100)}% confidence)`,
      details: { memosProcessed, confidence },
    });
  }

  /**
   * Log insights discovered
   */
  logInsights(batchNumber: number, insights: string[]): void {
    insights.forEach(insight => {
      this.addEntry({
        batchNumber,
        type: 'insight',
        category: 'quality',
        message: insight,
      });
    });
  }

  /**
   * Log new rules added
   */
  logRules(batchNumber: number, rules: string[]): void {
    rules.forEach(rule => {
      this.addEntry({
        batchNumber,
        type: 'rule',
        category: 'parsing',
        message: rule,
      });
    });
  }

  /**
   * Log improvements
   */
  logImprovements(batchNumber: number, improvements: string[]): void {
    improvements.forEach(improvement => {
      this.addEntry({
        batchNumber,
        type: 'improvement',
        category: 'quality',
        message: improvement,
      });
    });
  }

  /**
   * Log management actions
   */
  logActions(batchNumber: number, actions: Array<{ type: string; reason: string }>): void {
    actions.forEach(action => {
      this.addEntry({
        batchNumber,
        type: 'action',
        category: 'management',
        message: `${action.type}: ${action.reason}`,
        details: action,
      });
    });
  }

  /**
   * Get recent log entries
   */
  getRecentEntries(limit: number = 100): LearningLogEntry[] {
    return this.log.slice(-limit).reverse();
  }

  /**
   * Get entries by type
   */
  getEntriesByType(type: LearningLogEntry['type'], limit?: number): LearningLogEntry[] {
    const filtered = this.log.filter(e => e.type === type);
    return limit ? filtered.slice(-limit).reverse() : filtered.reverse();
  }

  /**
   * Get entries by batch
   */
  getEntriesByBatch(batchNumber: number): LearningLogEntry[] {
    return this.log.filter(e => e.batchNumber === batchNumber);
  }

  /**
   * Get current metrics
   */
  getMetrics(): LearningMetrics {
    return this.metrics;
  }

  /**
   * Get full log
   */
  getFullLog(): { log: LearningLogEntry[]; metrics: LearningMetrics } {
    return {
      log: this.log,
      metrics: this.metrics,
    };
  }

  /**
   * Reset log
   */
  reset(): void {
    this.log = [];
    this.metrics = this.initMetrics();
    this.save();
  }
}

export const learningLogService = new LearningLogService();
