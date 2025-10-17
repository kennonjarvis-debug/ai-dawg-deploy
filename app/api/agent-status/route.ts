/**
 * Agent Status API
 * Returns current status and tasks for all agents
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export const dynamic = 'force-dynamic';

interface Task {
  id: string;
  title: string;
  status: 'ready' | 'in_progress' | 'blocked' | 'complete';
  priority: string;
  owner: string;
  estimate?: string;
  created_at?: string;
  updated_at?: string;
}

interface AgentStatus {
  agent: string;
  role: string;
  tasks: Task[];
  activeTask?: string;
  status: 'active' | 'idle' | 'blocked';
}

const AGENT_ROLES: Record<string, string> = {
  alexis: 'Planner / PM',
  tom: 'Code Assistance / Implementer',
  jerry: 'AI Conductor / Systems Architect',
  karen: 'Data Manager / Profiles & Policy',
  max: 'UI / Frontend (instance-1)',
  alex: 'Audio Engine (instance-2)',
  'instance-1': 'UI / Frontend (Max)',
  'instance-2': 'Audio Engine (Alex)',
  'instance-3': 'Data Manager (Karen)',
  'instance-4': 'Integration Specialist',
};

export async function GET() {
  try {
    const tasksDir = path.join(process.cwd(), 'tasks');
    const files = await fs.readdir(tasksDir);

    const yamlFiles = files.filter((f) => f.endsWith('.yaml'));
    const tasks: Task[] = [];

    for (const file of yamlFiles) {
      try {
        const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
        const task = yaml.load(content) as any;

        tasks.push({
          id: task.id || file.replace('.yaml', ''),
          title: task.title || 'Untitled Task',
          status: task.status || 'ready',
          priority: task.priority || 'P2',
          owner: task.owner || 'unassigned',
          estimate: task.estimate,
          created_at: task.created_at,
          updated_at: task.updated_at,
        });
      } catch (error) {
        console.error(`Failed to parse ${file}:`, error);
      }
    }

    // Group tasks by owner
    const agentMap = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!agentMap.has(task.owner)) {
        agentMap.set(task.owner, []);
      }
      agentMap.get(task.owner)!.push(task);
    }

    // Build agent status
    const agents: AgentStatus[] = Object.keys(AGENT_ROLES).map((agentId) => {
      const agentTasks = agentMap.get(agentId) || [];
      const activeTask = agentTasks.find((t) => t.status === 'in_progress');
      const hasBlockedTasks = agentTasks.some((t) => t.status === 'blocked');

      return {
        agent: agentId,
        role: AGENT_ROLES[agentId] || 'Unknown',
        tasks: agentTasks.sort((a, b) => {
          // Sort by priority, then status
          const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
          const statusOrder = {
            in_progress: 0,
            blocked: 1,
            ready: 2,
            complete: 3,
          };

          const priorityDiff =
            (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99);

          if (priorityDiff !== 0) return priorityDiff;

          return (
            (statusOrder[a.status as keyof typeof statusOrder] ?? 99) -
            (statusOrder[b.status as keyof typeof statusOrder] ?? 99)
          );
        }),
        activeTask: activeTask?.title,
        status: hasBlockedTasks ? 'blocked' : activeTask ? 'active' : 'idle',
      };
    });

    return NextResponse.json({
      agents,
      summary: {
        totalTasks: tasks.length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        blocked: tasks.filter((t) => t.status === 'blocked').length,
        complete: tasks.filter((t) => t.status === 'complete').length,
        activeAgents: agents.filter((a) => a.status === 'active').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AgentStatus] Failed to load agent status:', error);

    return NextResponse.json(
      {
        error: 'Failed to load agent status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
