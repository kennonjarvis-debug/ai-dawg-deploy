'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Target } from 'lucide-react';

interface BucketStatus {
  id: string;
  label: string;
  owner: string;
  instance: number;
  errors: number;
  status: 'ready' | 'blocked' | 'in_progress' | 'complete';
  estimate: string;
}

interface ErrorByFile {
  file: string;
  count: number;
  owner: string;
  priority: string;
}

export default function TypeErrorsDashboard() {
  const [totalErrors, setTotalErrors] = useState(147);
  const [criticalErrors, setCriticalErrors] = useState(58);
  const [nonCriticalErrors, setNonCriticalErrors] = useState(89);
  const [fixedErrors, setFixedErrors] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const buckets: BucketStatus[] = [
    {
      id: 'D',
      label: 'Shared Types',
      owner: 'Karen',
      instance: 4,
      errors: 10,
      status: 'ready',
      estimate: '1.5 days',
    },
    {
      id: 'A',
      label: 'UI Types',
      owner: 'Alexis',
      instance: 1,
      errors: 26,
      status: 'blocked',
      estimate: '1 day',
    },
    {
      id: 'B',
      label: 'Audio Types',
      owner: 'Tom',
      instance: 2,
      errors: 17,
      status: 'blocked',
      estimate: '1 day',
    },
    {
      id: 'C',
      label: 'Data Types',
      owner: 'Jerry',
      instance: 3,
      errors: 11,
      status: 'blocked',
      estimate: '1 day',
    },
  ];

  const errorsByFile: ErrorByFile[] = [
    { file: 'src/widgets/_examples/EffectsPanel.example.tsx', count: 79, owner: 'Karen', priority: 'P2' },
    { file: 'tests/e2e/journey-beginner.spec.ts', count: 10, owner: 'Karen', priority: 'P2' },
    { file: 'packages/types/src/events.ts', count: 9, owner: 'Karen', priority: 'P0' },
    { file: 'src/widgets/EffectsPanel/EffectsPanel.tsx', count: 8, owner: 'Tom', priority: 'P0' },
    { file: 'components/layout/transport-bar.tsx', count: 6, owner: 'Alexis', priority: 'P0' },
    { file: 'src/widgets/PianoRoll/PianoRoll.tsx', count: 5, owner: 'Alexis', priority: 'P0' },
    { file: 'app/api/voice/clone/route.ts', count: 4, owner: 'Jerry', priority: 'P0' },
    { file: 'app/journey/page.tsx', count: 4, owner: 'Alexis', priority: 'P0' },
    { file: 'src/utils/pitchDetection.ts', count: 3, owner: 'Tom', priority: 'P0' },
    { file: 'INTEGRATION_EXAMPLE.tsx', count: 3, owner: 'Karen', priority: 'P0' },
  ];

  const greenGateCriteria = [
    { label: 'Bucket D: Shared types package created', done: false },
    { label: 'Bucket D: packages/types/src/events.ts errors fixed (9)', done: false },
    { label: 'Bucket A: All UI type errors fixed (26)', done: false },
    { label: 'Bucket B: All audio type errors fixed (17)', done: false },
    { label: 'Bucket C: All data type errors fixed (11)', done: false },
    { label: 'npm run type-check passes (critical files only)', done: false },
    { label: 'npm run build succeeds', done: false },
    { label: 'Max 5 TypeScript warnings allowed', done: false },
    { label: 'Zero new \'any\' types added (≤3 exceptions with comments)', done: false },
    { label: 'All instances report completion via event bus', done: false },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/type-errors');
        const data = await response.json();

        if (data.success) {
          setTotalErrors(data.total_errors);
          setCriticalErrors(data.critical_errors);
          setNonCriticalErrors(data.non_critical_errors);
          setFixedErrors(data.fixed);
        }

        setLastUpdate(new Date().toLocaleString());
      } catch (error) {
        console.error('Failed to load type errors:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.round((fixedErrors / criticalErrors) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'ready': return '#f59e0b';
      case 'blocked': return '#9ca3af';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return '✅';
      case 'in_progress': return '🟡';
      case 'ready': return '🟢';
      case 'blocked': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '24px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          🔧 Type Errors Burn-down
        </h1>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          fontSize: '14px',
          color: '#888',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            <span>Last Update: {lastUpdate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} />
            <span>Sprint Status: IN PROGRESS | Target: 0 errors</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>TOTAL</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>{totalErrors}</div>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>CRITICAL</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>{criticalErrors}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>P0 - Blocking</div>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>NON-CRITICAL</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{nonCriticalErrors}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>P2 - Examples</div>
        </div>

        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>FIXED</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>{fixedErrors}</div>
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>PROGRESS</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{progressPercent}%</div>
          <div style={{
            marginTop: '8px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: '#3b82f6',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      {/* Task Buckets */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#00e5ff',
        }}>
          Stability Sprint Buckets
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          {buckets.map((bucket) => (
            <div key={bucket.id} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${getStatusColor(bucket.status)}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: getStatusColor(bucket.status),
                }}>
                  {bucket.id}
                </div>
                <div style={{ fontSize: '24px' }}>{getStatusIcon(bucket.status)}</div>
              </div>

              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                {bucket.label}
              </div>

              <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                {bucket.owner} (Instance {bucket.instance})
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#888',
              }}>
                <span>{bucket.errors} errors</span>
                <span>{bucket.estimate}</span>
              </div>

              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                fontSize: '12px',
                textAlign: 'center',
                color: getStatusColor(bucket.status),
                textTransform: 'uppercase',
                fontWeight: '600',
              }}>
                {bucket.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Details Table */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#00e5ff',
        }}>
          Top Files with Errors
        </h2>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#888' }}>FILE</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#888' }}>COUNT</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#888' }}>OWNER</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#888' }}>PRIORITY</th>
              </tr>
            </thead>
            <tbody>
              {errorsByFile.map((item, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <td style={{
                    padding: '16px',
                    fontSize: '13px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#ccc',
                  }}>
                    {item.file}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: item.priority === 'P0' ? '#ef4444' : '#f59e0b',
                  }}>
                    {item.count}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#888',
                  }}>
                    {item.owner}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: item.priority === 'P0' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: item.priority === 'P0' ? '#ef4444' : '#f59e0b',
                    }}>
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Green Gate Checklist */}
      <div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#00e5ff',
        }}>
          ✅ Green Gate Acceptance Criteria
        </h2>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          {greenGateCriteria.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: index < greenGateCriteria.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
            }}>
              {item.done ? (
                <CheckCircle size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #444',
                  borderRadius: '4px',
                  flexShrink: 0,
                }} />
              )}
              <span style={{
                fontSize: '14px',
                color: item.done ? '#22c55e' : '#ccc',
                textDecoration: item.done ? 'line-through' : 'none',
              }}>
                {item.label}
              </span>
            </div>
          ))}

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <AlertCircle size={24} style={{ color: '#ef4444', marginBottom: '8px' }} />
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>
              🔴 Green Gate CLOSED
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
              58 critical errors remaining
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
