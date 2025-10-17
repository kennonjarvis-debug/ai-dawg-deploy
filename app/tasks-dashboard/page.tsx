'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Loader2, Users, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  owner: string;
  status: 'ready' | 'in_progress' | 'completed' | 'blocked';
  priority: string;
  estimate: string;
  type?: 'create' | 'integrate' | 'enhance';
  dependencies?: string[];
}

export default function TasksDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Load tasks and events
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch from API
        const response = await fetch('/api/tasks');
        const data = await response.json();

        if (data.success) {
          setTasks(data.tasks);

          // Calculate stats
          const newStats = {
            total: data.tasks.length,
            ready: data.tasks.filter((t: Task) => t.status === 'ready').length,
            in_progress: data.tasks.filter((t: Task) => t.status === 'in_progress').length,
            completed: data.tasks.filter((t: Task) => t.status === 'completed').length,
            blocked: data.tasks.filter((t: Task) => t.status === 'blocked').length,
          };
          setStats(newStats);
        }

        setLastUpdate(new Date().toLocaleString());
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'in_progress':
        return <Loader2 className="text-blue-400 animate-spin" size={20} />;
      case 'blocked':
        return <AlertCircle className="text-red-400" size={20} />;
      default:
        return <Circle className="text-gray-400" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority.startsWith('P1')) return 'text-red-400 bg-red-400/20';
    if (priority === 'P2') return 'text-yellow-400 bg-yellow-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  const groupedTasks = {
    'UI Redesign': tasks.filter(t => t.priority.includes('Redesign')),
    'Journey Enhancements': tasks.filter(t => !t.priority.includes('Redesign')),
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
          background: 'linear-gradient(135deg, #00e5ff, #b066ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          DAWG AI - Task Dashboard
        </h1>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          fontSize: '14px',
          color: '#888',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} />
            <span>Last Update: {lastUpdate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} />
            <span>4 Instances Active</span>
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
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>{stats.total}</div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(156, 163, 175, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>READY</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#9ca3af' }}>{stats.ready}</div>
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>IN PROGRESS</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{stats.in_progress}</div>
        </div>

        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>COMPLETED</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>{stats.completed}</div>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>BLOCKED</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>{stats.blocked}</div>
        </div>
      </div>

      {/* Task Boards */}
      {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
        <div key={groupName} style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#00e5ff',
          }}>
            {groupName} ({groupTasks.length} tasks)
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}>
            {/* Ready Column */}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#9ca3af',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                Ready ({groupTasks.filter(t => t.status === 'ready').length})
              </div>
              {groupTasks.filter(t => t.status === 'ready').map(task => (
                <TaskCard key={task.id} task={task} getStatusIcon={getStatusIcon} getPriorityColor={getPriorityColor} />
              ))}
            </div>

            {/* In Progress Column */}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                In Progress ({groupTasks.filter(t => t.status === 'in_progress').length})
              </div>
              {groupTasks.filter(t => t.status === 'in_progress').map(task => (
                <TaskCard key={task.id} task={task} getStatusIcon={getStatusIcon} getPriorityColor={getPriorityColor} />
              ))}
            </div>

            {/* Completed Column */}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#22c55e',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                Completed ({groupTasks.filter(t => t.status === 'completed').length})
              </div>
              {groupTasks.filter(t => t.status === 'completed').map(task => (
                <TaskCard key={task.id} task={task} getStatusIcon={getStatusIcon} getPriorityColor={getPriorityColor} />
              ))}
            </div>

            {/* Blocked Column */}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#ef4444',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                Blocked ({groupTasks.filter(t => t.status === 'blocked').length})
              </div>
              {groupTasks.filter(t => t.status === 'blocked').map(task => (
                <TaskCard key={task.id} task={task} getStatusIcon={getStatusIcon} getPriorityColor={getPriorityColor} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, getStatusIcon, getPriorityColor }: any) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      transition: 'all 0.2s',
    }}
    className="hover:border-cyan-400/30"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        {getStatusIcon(task.status)}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            {task.title}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {task.id.slice(0, 12)}...
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: '600',
        }}
        className={getPriorityColor(task.priority)}
        >
          {task.priority}
        </span>
        {task.type && (
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#888',
          }}>
            {task.type}
          </span>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
        {task.estimate}
      </div>

      <div style={{ fontSize: '12px', color: '#00e5ff' }}>
        {task.owner}
      </div>

      {task.dependencies && task.dependencies.length > 0 && (
        <div style={{
          fontSize: '11px',
          color: '#ff9f4a',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          ⚠️ {task.dependencies.length} dependency
        </div>
      )}
    </div>
  );
}
