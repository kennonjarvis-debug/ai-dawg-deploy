module.exports = [
"[project]/dawg-ai/.next-internal/server/app/api/command-center/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/dawg-ai/app/api/command-center/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Command Center API
 * Real-time agent monitoring, task management, and status reporting
 */ __turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/js-yaml/dist/js-yaml.mjs [app-route] (ecmascript)");
;
;
;
;
// ============================================================================
// Helper Functions
// ============================================================================
async function getAgentInstances() {
    const agents = [];
    const voiceDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](process.cwd(), 'agents', 'voice');
    try {
        const voiceFiles = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readdir(voiceDir);
        for (const file of voiceFiles){
            if (!file.endsWith('.yaml')) continue;
            try {
                const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](voiceDir, file), 'utf-8');
                const agent = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["load"](content);
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
                    memory: status.memory
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
async function getAgentStatus(agentName) {
    // Check if agent monitor file exists
    const monitorFile = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](process.cwd(), '.agent-status', `${agentName}.json`);
    try {
        const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(monitorFile, 'utf-8');
        const status = JSON.parse(content);
        return {
            status: status.running ? 'active' : 'idle',
            currentTask: status.currentTask || null,
            lastActivity: status.lastActivity || new Date().toISOString(),
            tasksCompleted: status.tasksCompleted || 0,
            uptime: status.uptime || 0,
            cpu: status.cpu,
            memory: status.memory
        };
    } catch  {
        return {
            status: 'offline',
            currentTask: null,
            lastActivity: new Date().toISOString(),
            tasksCompleted: 0,
            uptime: 0
        };
    }
}
async function getAllTasks() {
    const tasks = [];
    const tasksDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](process.cwd(), 'tasks');
    try {
        const taskFiles = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readdir(tasksDir);
        for (const file of taskFiles){
            if (!file.endsWith('.yaml')) continue;
            try {
                const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](tasksDir, file), 'utf-8');
                const task = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["load"](content);
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
                    tags: task.tags || []
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
function detectBlockers(tasks) {
    const blockers = [];
    for (const task of tasks){
        if (task.status === 'blocked' || task.blockers && task.blockers.length > 0) {
            blockers.push({
                taskId: task.id,
                taskTitle: task.title,
                reason: task.blockers?.join(', ') || 'No reason specified',
                blockedSince: task.updatedAt,
                assignedTo: task.assignedTo
            });
        }
    }
    return blockers;
}
function calculateStatistics(agents, tasks) {
    const activeAgents = agents.filter((a)=>a.status === 'active').length;
    const idleAgents = agents.filter((a)=>a.status === 'idle').length;
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((t)=>t.status === 'in_progress').length;
    const completedTasks = tasks.filter((t)=>t.status === 'completed').length;
    const blockedTasks = tasks.filter((t)=>t.status === 'blocked').length;
    const tasksWithTime = tasks.filter((t)=>t.actualHours && t.actualHours > 0);
    const averageTaskTime = tasksWithTime.length > 0 ? tasksWithTime.reduce((sum, t)=>sum + (t.actualHours || 0), 0) / tasksWithTime.length : 0;
    return {
        totalTasks,
        activeTasks,
        completedTasks,
        blockedTasks,
        activeAgents,
        idleAgents,
        averageTaskTime: Math.round(averageTaskTime * 10) / 10
    };
}
async function GET(request) {
    try {
        const agents = await getAgentInstances();
        const tasks = await getAllTasks();
        const blockers = detectBlockers(tasks);
        const statistics = calculateStatistics(agents, tasks);
        const data = {
            timestamp: new Date().toISOString(),
            agents,
            tasks,
            blockers,
            statistics
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error('Command Center error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch command center data'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { action, taskId, assignedTo, status } = body;
        if (action === 'reassign' && taskId && assignedTo !== undefined) {
            // Update task assignment
            const tasksDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](process.cwd(), 'tasks');
            const taskFile = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](tasksDir, `${taskId}.yaml`);
            try {
                const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(taskFile, 'utf-8');
                const task = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["load"](content);
                task.assigned_to = assignedTo;
                task.updated_at = new Date().toISOString();
                await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(taskFile, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dump"](task), 'utf-8');
                return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: true,
                    taskId,
                    assignedTo
                });
            } catch (error) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `Task ${taskId} not found`
                }, {
                    status: 404
                });
            }
        }
        if (action === 'update_status' && taskId && status) {
            // Update task status
            const tasksDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](process.cwd(), 'tasks');
            const taskFile = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](tasksDir, `${taskId}.yaml`);
            try {
                const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(taskFile, 'utf-8');
                const task = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["load"](content);
                task.status = status;
                task.updated_at = new Date().toISOString();
                await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(taskFile, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dump"](task), 'utf-8');
                return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: true,
                    taskId,
                    status
                });
            } catch (error) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `Task ${taskId} not found`
                }, {
                    status: 404
                });
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Invalid action or missing parameters'
        }, {
            status: 400
        });
    } catch (error) {
        console.error('Command Center POST error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to update task'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__165f4e7d._.js.map