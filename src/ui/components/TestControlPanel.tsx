/**
 * Test Control Panel
 * UI component for controlling AI Testing Agent from chat
 *
 * Features:
 * - Voice command buttons for common test operations
 * - Real-time test progress visualization
 * - Test results display with detailed errors
 * - Auto-fix suggestions with approve/reject
 * - Test coverage reports
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Play,
  RefreshCw,
  FileText,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader,
  ChevronDown,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface TestProgress {
  testCommandId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentTest?: string;
  progress: number;
  totalTests: number;
  completedTests: number;
  failedTests: number;
  timestamp: Date;
}

interface TestResult {
  testCommandId: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  metrics?: Record<string, number>;
  timestamp: Date;
}

interface TestReport {
  testCommandId: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  recommendations: string[];
  criticalIssues: string[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  timestamp: Date;
}

interface AutoFixSuggestion {
  testCommandId: string;
  testName: string;
  issue: string;
  suggestedFix: string;
  confidence: number;
  autoApplicable: boolean;
  filePath?: string;
  lineNumber?: number;
  timestamp: Date;
}

interface TestControlPanelProps {
  userId: string;
  isAdmin: boolean;
  onSendVoiceCommand?: (command: string) => void;
}

export const TestControlPanel: React.FC<TestControlPanelProps> = ({
  userId,
  isAdmin,
  onSendVoiceCommand
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeProgress, setActiveProgress] = useState<TestProgress | null>(null);
  const [latestReport, setLatestReport] = useState<TestReport | null>(null);
  const [autoFixSuggestions, setAutoFixSuggestions] = useState<AutoFixSuggestion[]>([]);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [expandedFixes, setExpandedFixes] = useState<Set<string>>(new Set());

  const TEST_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(TEST_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Test Control Panel connected');
      setConnected(true);
      toast.success('Connected to Test Agent');
    });

    newSocket.on('disconnect', () => {
      console.log('Test Control Panel disconnected');
      setConnected(false);
    });

    // Listen for test events
    newSocket.on('test:progress', (progress: TestProgress) => {
      setActiveProgress(progress);
    });

    newSocket.on('test:result', (result: TestResult) => {
      // Update progress with result
      console.log('Test result:', result);
    });

    newSocket.on('test:complete', (report: TestReport) => {
      setLatestReport(report);
      setActiveProgress(null);

      if (report.failed > 0) {
        toast.error(`${report.failed} tests failed`);
      } else {
        toast.success(`All ${report.passed} tests passed!`);
      }
    });

    newSocket.on('test:auto-fix', (suggestion: AutoFixSuggestion) => {
      setAutoFixSuggestions(prev => [...prev, suggestion]);
      toast.info(`Auto-fix suggestion generated for ${suggestion.testName}`);
    });

    newSocket.on('test:error', (data: { testCommandId: string; error: string }) => {
      toast.error(`Test error: ${data.error}`);
      setActiveProgress(null);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [TEST_SERVER_URL]);

  // Send test command
  const sendTestCommand = (type: string, payload: any = {}) => {
    if (!isAdmin) {
      toast.error('Admin privileges required to run tests');
      return;
    }

    if (!socket || !connected) {
      toast.error('Not connected to test server');
      return;
    }

    const command = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      userId,
      timestamp: new Date()
    };

    socket.emit('test:command', { command });
    toast.info('Test command sent...');
  };

  // Approve auto-fix
  const approveAutoFix = (testCommandId: string, fixIndex: number) => {
    if (!socket || !connected) {
      toast.error('Not connected to test server');
      return;
    }

    socket.emit('test:approve-fix', {
      testCommandId,
      fixId: `fix-${fixIndex}`
    });

    toast.success('Auto-fix approved and applied');

    // Remove from suggestions
    setAutoFixSuggestions(prev => prev.filter((_, i) => i !== fixIndex));
  };

  // Reject auto-fix
  const rejectAutoFix = (fixIndex: number) => {
    setAutoFixSuggestions(prev => prev.filter((_, i) => i !== fixIndex));
    toast.info('Auto-fix rejected');
  };

  // Toggle result expansion
  const toggleResultExpansion = (testName: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testName)) {
        newSet.delete(testName);
      } else {
        newSet.add(testName);
      }
      return newSet;
    });
  };

  // Toggle fix expansion
  const toggleFixExpansion = (fixIndex: string) => {
    setExpandedFixes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fixIndex)) {
        newSet.delete(fixIndex);
      } else {
        newSet.add(fixIndex);
      }
      return newSet;
    });
  };

  if (!isAdmin) {
    return (
      <div className="bg-bg-surface-2 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text-base mb-2">Admin Access Required</h3>
        <p className="text-text-dim text-sm">
          Only administrators can access the Test Control Panel.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-xl border border-border-base p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-base flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            Test Control Panel
          </h2>
          <p className="text-sm text-text-dim mt-1">
            Control AI Testing Agent via voice commands
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-text-dim">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Voice Command Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => sendTestCommand('run_all')}
          disabled={!!activeProgress}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-text-base font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          Run All Tests
        </button>

        <button
          onClick={() => sendTestCommand('run_workflow')}
          disabled={!!activeProgress}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-5 h-5" />
          Workflow Tests
        </button>

        <button
          onClick={() => sendTestCommand('get_report')}
          disabled={!!activeProgress}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5" />
          Show Report
        </button>

        <button
          onClick={() => sendTestCommand('fix_tests')}
          disabled={!!activeProgress}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wrench className="w-5 h-5" />
          Fix Failing Tests
        </button>

        <button
          onClick={() => {
            const feature = prompt('Enter feature name:');
            if (feature) {
              sendTestCommand('create_test', { feature });
            }
          }}
          disabled={!!activeProgress}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5" />
          Create Test
        </button>

        <button
          onClick={() => {
            const testPath = prompt('Enter test path or workflow name:');
            if (testPath) {
              sendTestCommand('run_single', { testPath });
            }
          }}
          disabled={!!activeProgress}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          Run Specific Test
        </button>
      </div>

      {/* Active Test Progress */}
      {activeProgress && (
        <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader className="w-5 h-5 text-primary animate-spin" />
              <span className="font-medium text-text-base">
                {activeProgress.status === 'queued' ? 'Queued' : 'Running Tests'}
              </span>
            </div>
            <span className="text-sm text-text-dim">
              {activeProgress.completedTests}/{activeProgress.totalTests} completed
            </span>
          </div>

          {activeProgress.currentTest && (
            <p className="text-sm text-text-dim mb-3">
              Current: {activeProgress.currentTest}
            </p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-bg-surface-3 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${activeProgress.progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-green-400">
                ✓ {activeProgress.completedTests - activeProgress.failedTests} passed
              </span>
              <span className="text-red-400">
                ✗ {activeProgress.failedTests} failed
              </span>
            </div>
            <span className="text-text-dim">
              {Math.round(activeProgress.progress)}%
            </span>
          </div>
        </div>
      )}

      {/* Latest Test Report */}
      {latestReport && !activeProgress && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-text-dim">Passed</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{latestReport.passed}</p>
            </div>

            <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-text-dim">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{latestReport.failed}</p>
            </div>

            <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-text-dim">Skipped</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{latestReport.skipped}</p>
            </div>

            <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-text-dim">Duration</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {(latestReport.duration / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Coverage Report */}
          {latestReport.coverage && (
            <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
              <h3 className="font-semibold text-text-base mb-3">Code Coverage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(latestReport.coverage).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-dim capitalize">{key}</span>
                      <span className="text-xs font-medium text-text-base">{value}%</span>
                    </div>
                    <div className="w-full bg-bg-surface-3 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {latestReport.criticalIssues.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Critical Issues
              </h3>
              <ul className="space-y-1">
                {latestReport.criticalIssues.map((issue, i) => (
                  <li key={i} className="text-sm text-red-300">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {latestReport.recommendations.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {latestReport.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-blue-300">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Results */}
          {latestReport.results.length > 0 && (
            <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
              <h3 className="font-semibold text-text-base mb-3">Detailed Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {latestReport.results.map((result, i) => (
                  <div
                    key={i}
                    className="border border-border-base rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleResultExpansion(result.testName)}
                      className="w-full flex items-center justify-between p-3 hover:bg-bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {result.status === 'passed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {result.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                        {result.status === 'skipped' && <Clock className="w-4 h-4 text-yellow-500" />}
                        <span className="text-sm text-text-base">{result.testName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-dim">{result.duration}ms</span>
                        {expandedResults.has(result.testName) ? (
                          <ChevronDown className="w-4 h-4 text-text-dim" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-dim" />
                        )}
                      </div>
                    </button>

                    {expandedResults.has(result.testName) && result.error && (
                      <div className="p-3 bg-red-900/20 border-t border-border-base">
                        <p className="text-xs text-red-300 font-mono">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-Fix Suggestions */}
      {autoFixSuggestions.length > 0 && (
        <div className="bg-bg-surface-2 rounded-lg p-4 border border-border-base">
          <h3 className="font-semibold text-text-base mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-500" />
            Auto-Fix Suggestions ({autoFixSuggestions.length})
          </h3>

          <div className="space-y-3">
            {autoFixSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="border border-border-base rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFixExpansion(`fix-${i}`)}
                  className="w-full flex items-center justify-between p-3 hover:bg-bg-surface-hover transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text-base">{suggestion.testName}</p>
                    <p className="text-xs text-text-dim mt-1">{suggestion.issue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-text-dim">Confidence:</span>
                      <span className={`font-medium ${
                        suggestion.confidence >= 0.8 ? 'text-green-400' :
                        suggestion.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    {expandedFixes.has(`fix-${i}`) ? (
                      <ChevronDown className="w-4 h-4 text-text-dim" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-dim" />
                    )}
                  </div>
                </button>

                {expandedFixes.has(`fix-${i}`) && (
                  <div className="p-4 bg-bg-surface-3 border-t border-border-base space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-text-dim mb-1">Suggested Fix:</h4>
                      <pre className="text-xs text-text-base font-mono bg-bg-surface rounded p-2 overflow-x-auto">
                        {suggestion.suggestedFix}
                      </pre>
                    </div>

                    {suggestion.filePath && (
                      <p className="text-xs text-text-dim">
                        File: {suggestion.filePath}
                        {suggestion.lineNumber && ` (line ${suggestion.lineNumber})`}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveAutoFix(suggestion.testCommandId, i)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Apply Fix
                      </button>

                      <button
                        onClick={() => rejectAutoFix(i)}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
