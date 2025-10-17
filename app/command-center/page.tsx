'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Cpu,
  MemoryStick,
  Zap,
  Users,
  ListTodo,
  Activity,
  XCircle,
  ArrowRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AgentInstance {
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  currentTask?: string;
  lastActivity: string;
  tasksCompleted: number;
  uptime: number;
  cpu?: number;
  memory?: number;
}

interface Task {
  id: string;
  title: string;
  assignedTo: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  blockers?: string[];
  dependencies?: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface Blocker {
  taskId: string;
  taskTitle: string;
  reason: string;
  blockedSince: string;
  assignedTo: string | null;
}

interface CommandCenterData {
  timestamp: string;
  agents: AgentInstance[];
  tasks: Task[];
  blockers: Blocker[];
  statistics: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    blockedTasks: number;
    activeAgents: number;
    idleAgents: number;
    averageTaskTime: number;
  };
}

// ============================================================================
// Agent Status Badge
// ============================================================================

function AgentStatusBadge({ status }: { status: AgentInstance['status'] }) {
  const statusConfig = {
    active: { icon: CheckCircle2, label: 'Active', className: 'bg-green-500 text-white' },
    idle: { icon: Circle, label: 'Idle', className: 'bg-gray-400 text-white' },
    error: { icon: XCircle, label: 'Error', className: 'bg-red-500 text-white' },
    offline: { icon: XCircle, label: 'Offline', className: 'bg-gray-600 text-white' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Task Status Badge
// ============================================================================

function TaskStatusBadge({ status, priority }: { status: Task['status']; priority: Task['priority'] }) {
  const statusConfig = {
    pending: { icon: Clock, label: 'Pending', className: 'bg-gray-400 text-white' },
    assigned: { icon: Clock, label: 'Assigned', className: 'bg-purple-500 text-white' },
    ready: { icon: Clock, label: 'Ready', className: 'bg-indigo-500 text-white' },
    in_progress: { icon: Zap, label: 'In Progress', className: 'bg-blue-500 text-white' },
    completed: { icon: CheckCircle2, label: 'Completed', className: 'bg-green-500 text-white' },
    blocked: { icon: AlertTriangle, label: 'Blocked', className: 'bg-red-500 text-white' },
  };

  const priorityConfig = {
    low: 'border-gray-300',
    medium: 'border-yellow-400',
    high: 'border-orange-500',
    critical: 'border-red-600 ring-2 ring-red-300',
  };

  // Fallback for unknown status
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 border-l-4 ${priorityConfig[priority]} pl-2`}>
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
      {priority === 'critical' && (
        <Badge variant="destructive" className="text-xs">CRITICAL</Badge>
      )}
    </div>
  );
}

// ============================================================================
// Agent Card
// ============================================================================

function AgentCard({ agent }: { agent: AgentInstance }) {
  const uptimeHours = Math.floor(agent.uptime / 3600);
  const uptimeMinutes = Math.floor((agent.uptime % 3600) / 60);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
          <AgentStatusBadge status={agent.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {agent.currentTask && (
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <div className="font-medium">Current Task</div>
                <div className="text-gray-600">{agent.currentTask}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-gray-600">
            <span>Tasks Completed</span>
            <Badge variant="secondary">{agent.tasksCompleted}</Badge>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span>Uptime</span>
            <span className="font-mono text-xs">
              {uptimeHours}h {uptimeMinutes}m
            </span>
          </div>

          {agent.cpu !== undefined && (
            <div className="flex items-center justify-between text-gray-600">
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                <span>CPU</span>
              </div>
              <span className="font-mono text-xs">{agent.cpu.toFixed(1)}%</span>
            </div>
          )}

          {agent.memory !== undefined && (
            <div className="flex items-center justify-between text-gray-600">
              <div className="flex items-center gap-1">
                <MemoryStick className="w-3 h-3" />
                <span>Memory</span>
              </div>
              <span className="font-mono text-xs">{agent.memory.toFixed(1)} MB</span>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-2">
            Last activity: {new Date(agent.lastActivity).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Task Row
// ============================================================================

function TaskRow({ task, onReassign }: { task: Task; onReassign: (taskId: string, newAgent: string) => void }) {
  const [isReassigning, setIsReassigning] = useState(false);
  const [newAgent, setNewAgent] = useState(task.assignedTo || '');

  const handleReassign = async () => {
    if (newAgent !== task.assignedTo) {
      await onReassign(task.id, newAgent);
      setIsReassigning(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 border-b hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 w-48">
        <TaskStatusBadge status={task.status} priority={task.priority} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{task.title}</div>
        <div className="text-xs text-gray-500 mt-1">ID: {task.id}</div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {task.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 w-48">
        {isReassigning ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newAgent}
              onChange={(e) => setNewAgent(e.target.value)}
              className="px-2 py-1 text-sm border rounded w-32"
              placeholder="Agent name"
            />
            <button
              onClick={handleReassign}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsReassigning(false)}
              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={task.assignedTo ? 'default' : 'outline'}>
              {task.assignedTo || 'Unassigned'}
            </Badge>
            <button
              onClick={() => setIsReassigning(true)}
              className="text-blue-500 hover:text-blue-700 text-xs"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-xs text-gray-500">
        {task.estimatedHours && (
          <div>Est: {task.estimatedHours}h</div>
        )}
        {task.actualHours && (
          <div>Actual: {task.actualHours}h</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Blocker Alert
// ============================================================================

function BlockerAlert({ blocker }: { blocker: Blocker }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
      <div className="flex-1">
        <div className="font-medium text-red-900">{blocker.taskTitle}</div>
        <div className="text-sm text-red-700 mt-1">{blocker.reason}</div>
        <div className="flex items-center gap-3 mt-2 text-xs text-red-600">
          <span>Blocked since: {new Date(blocker.blockedSince).toLocaleString()}</span>
          {blocker.assignedTo && (
            <span>Assigned to: {blocker.assignedTo}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Command Center Page
// ============================================================================

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch command center data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/command-center');
      if (!response.ok) throw new Error('Failed to fetch data');
      const newData = await response.json();
      setData(newData);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 5 seconds (DISABLED auto-scroll by default)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle task reassignment
  const handleReassign = async (taskId: string, newAgent: string) => {
    try {
      const response = await fetch('/api/command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reassign',
          taskId,
          assignedTo: newAgent,
        }),
      });

      if (!response.ok) throw new Error('Failed to reassign task');

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Failed to reassign task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">Loading Command Center...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <div>Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time monitoring and task management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Refresh Now
              </button>
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {data.statistics.activeAgents}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.statistics.idleAgents} idle
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {data.statistics.activeTasks}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.statistics.totalTasks} total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {data.statistics.completedTasks}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {data.statistics.averageTaskTime}h
              </div>
            </CardContent>
          </Card>

          <Card className={data.statistics.blockedTasks > 0 ? 'border-red-300 bg-red-50' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${data.statistics.blockedTasks > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {data.statistics.blockedTasks}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.statistics.blockedTasks > 0 ? 'Action required' : 'All clear'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blockers Alert */}
        {data.blockers.length > 0 && (
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Critical Blockers ({data.blockers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.blockers.map(blocker => (
                  <BlockerAlert key={blocker.taskId} blocker={blocker} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Agent Instances ({data.agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.agents.map(agent => (
                <AgentCard key={agent.name} agent={agent} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              All Tasks ({data.tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* NO AUTO-SCROLL - User can scroll manually */}
            <div className="max-h-[600px] overflow-y-auto">
              {data.tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No tasks found
                </div>
              ) : (
                data.tasks.map(task => (
                  <TaskRow key={task.id} task={task} onReassign={handleReassign} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
