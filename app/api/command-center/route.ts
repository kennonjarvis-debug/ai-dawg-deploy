/**
 * Command Center API
 * Real-time agent monitoring, task management, and status reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
// Helper Functions
// ============================================================================

async function getAgentInstances(): Promise<AgentInstance[]> {
  const agents: AgentInstance[] = [];
  const voiceDir = path.join(process.cwd(), 'agents', 'voice');

  try {
    const voiceFiles = await fs.readdir(voiceDir);

    for (const file of voiceFiles) {
      if (!file.endsWith('.yaml')) continue;

      try {
        const content = await fs.readFile(path.join(voiceDir, file), 'utf-8');
        const agent = yaml.load(content) as any;

        // Try to get runtime status from monitor scripts
        const status = await getAgentStatus(agent.name);

        agents.push({
          name: agent.name,
          status: status.status,
          currentTask: status.currentTask,
          lastActivity: status.lastActivity,
          tasksCompleted: status.tasksCompleted,
          uptime: status.uptime,
          cpu: status.cpu,
          memory: status.memory,
        });
      } catch (error) {
        console.error(`Failed to load agent ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to read voice directory:', error);
  }

  return agents;
}

async function getAgentStatus(agentName: string) {
  // Check if agent monitor file exists
  const monitorFile = path.join(process.cwd(), '.agent-status', `${agentName}.json`);

  try {
    const content = await fs.readFile(monitorFile, 'utf-8');
    const status = JSON.parse(content);
    return {
      status: status.running ? 'active' : 'idle',
      currentTask: status.currentTask || null,
      lastActivity: status.lastActivity || new Date().toISOString(),
      tasksCompleted: status.tasksCompleted || 0,
      uptime: status.uptime || 0,
      cpu: status.cpu,
      memory: status.memory,
    };
  } catch {
    return {
      status: 'offline' as const,
      currentTask: null,
      lastActivity: new Date().toISOString(),
      tasksCompleted: 0,
      uptime: 0,
    };
  }
}

async function getAllTasks(): Promise<Task[]> {
  const tasks: Task[] = [];
  const tasksDir = path.join(process.cwd(), 'tasks');

  try {
    const taskFiles = await fs.readdir(tasksDir);

    for (const file of taskFiles) {
      if (!file.endsWith('.yaml')) continue;

      try {
        const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
        const task = yaml.load(content) as any;

        tasks.push({
          id: task.id || file.replace('.yaml', ''),
          title: task.title || task.name || 'Untitled Task',
          assignedTo: task.assigned_to || task.assignedTo || null,
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          blockers: task.blockers || [],
          dependencies: task.dependencies || [],
          estimatedHours: task.estimated_hours || task.estimatedHours,
          actualHours: task.actual_hours || task.actualHours,
          createdAt: task.created_at || task.createdAt || new Date().toISOString(),
          updatedAt: task.updated_at || task.updatedAt || new Date().toISOString(),
          tags: task.tags || [],
        });
      } catch (error) {
        console.error(`Failed to parse task ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to read tasks directory:', error);
  }

  return tasks;
}

function detectBlockers(tasks: Task[]): Blocker[] {
  const blockers: Blocker[] = [];

  for (const task of tasks) {
    if (task.status === 'blocked' || (task.blockers && task.blockers.length > 0)) {
      blockers.push({
        taskId: task.id,
        taskTitle: task.title,
        reason: task.blockers?.join(', ') || 'No reason specified',
        blockedSince: task.updatedAt,
        assignedTo: task.assignedTo,
      });
    }
  }

  return blockers;
}

function calculateStatistics(agents: AgentInstance[], tasks: Task[]) {
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  const tasksWithTime = tasks.filter(t => t.actualHours && t.actualHours > 0);
  const averageTaskTime = tasksWithTime.length > 0
    ? tasksWithTime.reduce((sum, t) => sum + (t.actualHours || 0), 0) / tasksWithTime.length
    : 0;

  return {
    totalTasks,
    activeTasks,
    completedTasks,
    blockedTasks,
    activeAgents,
    idleAgents,
    averageTaskTime: Math.round(averageTaskTime * 10) / 10,
  };
}

// ============================================================================
// GET - Get Command Center Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const agents = await getAgentInstances();
    const tasks = await getAllTasks();
    const blockers = detectBlockers(tasks);
    const statistics = calculateStatistics(agents, tasks);

    const data: CommandCenterData = {
      timestamp: new Date().toISOString(),
      agents,
      tasks,
      blockers,
      statistics,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Command Center error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch command center data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update Task Assignment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskId, assignedTo, status } = body;

    if (action === 'reassign' && taskId && assignedTo !== undefined) {
      // Update task assignment
      const tasksDir = path.join(process.cwd(), 'tasks');
      const taskFile = path.join(tasksDir, `${taskId}.yaml`);

      try {
        const content = await fs.readFile(taskFile, 'utf-8');
        const task = yaml.load(content) as any;

        task.assigned_to = assignedTo;
        task.updated_at = new Date().toISOString();

        await fs.writeFile(taskFile, yaml.dump(task), 'utf-8');

        return NextResponse.json({ success: true, taskId, assignedTo });
      } catch (error) {
        return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 }
        );
      }
    }

    if (action === 'update_status' && taskId && status) {
      // Update task status
      const tasksDir = path.join(process.cwd(), 'tasks');
      const taskFile = path.join(tasksDir, `${taskId}.yaml`);

      try {
        const content = await fs.readFile(taskFile, 'utf-8');
        const task = yaml.load(content) as any;

        task.status = status;
        task.updated_at = new Date().toISOString();

        await fs.writeFile(taskFile, yaml.dump(task), 'utf-8');

        return NextResponse.json({ success: true, taskId, status });
      } catch (error) {
        return NextResponse.json(
          { error: `Task ${taskId} not found` },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Command Center POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
