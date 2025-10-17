import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export async function GET() {
  try {
    const tasksDir = path.join(process.cwd(), 'tasks');
    const files = await fs.readdir(tasksDir);

    const tasks = await Promise.all(
      files
        .filter(file => file.endsWith('.yaml'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          const task = yaml.load(content) as any;
          return task;
        })
    );

    // Read deps.json for current status
    const depsPath = path.join(process.cwd(), '_bus', 'state', 'deps.json');
    let depsData;
    try {
      const depsContent = await fs.readFile(depsPath, 'utf-8');
      depsData = JSON.parse(depsContent);
    } catch {
      depsData = { tasks: {}, stats: {} };
    }

    // Merge task data with current status from deps.json
    const enrichedTasks = tasks.map(task => ({
      ...task,
      status: depsData.tasks[task.id]?.status || task.status || 'ready',
      type: depsData.tasks[task.id]?.type || task.type,
    }));

    return NextResponse.json({
      success: true,
      tasks: enrichedTasks,
      stats: depsData.stats || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { taskId, status, updates } = await request.json();

    // Read current deps.json
    const depsPath = path.join(process.cwd(), '_bus', 'state', 'deps.json');
    const depsContent = await fs.readFile(depsPath, 'utf-8');
    const depsData = JSON.parse(depsContent);

    // Update task status
    if (depsData.tasks[taskId]) {
      depsData.tasks[taskId].status = status;
      if (updates) {
        Object.assign(depsData.tasks[taskId], updates);
      }

      // Recalculate stats
      const tasks = Object.values(depsData.tasks) as any[];
      depsData.stats = {
        total_tasks: tasks.length,
        ready: tasks.filter(t => t.status === 'ready').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
        completed: tasks.filter(t => t.status === 'completed').length,
      };

      depsData.updated_at = new Date().toISOString();

      // Write back to file
      await fs.writeFile(depsPath, JSON.stringify(depsData, null, 2));

      return NextResponse.json({ success: true, task: depsData.tasks[taskId] });
    }

    return NextResponse.json(
      { success: false, error: 'Task not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
