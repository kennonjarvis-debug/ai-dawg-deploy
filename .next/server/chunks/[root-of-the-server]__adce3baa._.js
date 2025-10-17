module.exports = [
"[project]/dawg-ai/.next-internal/server/app/api/agent-status/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/dawg-ai/app/api/agent-status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Agent Status API
 * Returns current status and tasks for all agents
 */ __turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/js-yaml/dist/js-yaml.mjs [app-route] (ecmascript)");
;
;
;
;
const dynamic = 'force-dynamic';
const AGENT_ROLES = {
    alexis: 'Planner / PM',
    tom: 'Code Assistance / Implementer',
    jerry: 'AI Conductor / Systems Architect',
    karen: 'Data Manager / Profiles & Policy',
    max: 'UI / Frontend (instance-1)',
    alex: 'Audio Engine (instance-2)',
    'instance-1': 'UI / Frontend (Max)',
    'instance-2': 'Audio Engine (Alex)',
    'instance-3': 'Data Manager (Karen)',
    'instance-4': 'Integration Specialist'
};
async function GET() {
    try {
        const tasksDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'tasks');
        const files = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readdir(tasksDir);
        const yamlFiles = files.filter((f)=>f.endsWith('.yaml'));
        const tasks = [];
        for (const file of yamlFiles){
            try {
                const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(tasksDir, file), 'utf-8');
                const task = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$js$2d$yaml$2f$dist$2f$js$2d$yaml$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].load(content);
                tasks.push({
                    id: task.id || file.replace('.yaml', ''),
                    title: task.title || 'Untitled Task',
                    status: task.status || 'ready',
                    priority: task.priority || 'P2',
                    owner: task.owner || 'unassigned',
                    estimate: task.estimate,
                    created_at: task.created_at,
                    updated_at: task.updated_at
                });
            } catch (error) {
                console.error(`Failed to parse ${file}:`, error);
            }
        }
        // Group tasks by owner
        const agentMap = new Map();
        for (const task of tasks){
            if (!agentMap.has(task.owner)) {
                agentMap.set(task.owner, []);
            }
            agentMap.get(task.owner).push(task);
        }
        // Build agent status
        const agents = Object.keys(AGENT_ROLES).map((agentId)=>{
            const agentTasks = agentMap.get(agentId) || [];
            const activeTask = agentTasks.find((t)=>t.status === 'in_progress');
            const hasBlockedTasks = agentTasks.some((t)=>t.status === 'blocked');
            return {
                agent: agentId,
                role: AGENT_ROLES[agentId] || 'Unknown',
                tasks: agentTasks.sort((a, b)=>{
                    // Sort by priority, then status
                    const priorityOrder = {
                        P0: 0,
                        P1: 1,
                        P2: 2,
                        P3: 3
                    };
                    const statusOrder = {
                        in_progress: 0,
                        blocked: 1,
                        ready: 2,
                        complete: 3
                    };
                    const priorityDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
                    if (priorityDiff !== 0) return priorityDiff;
                    return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
                }),
                activeTask: activeTask?.title,
                status: hasBlockedTasks ? 'blocked' : activeTask ? 'active' : 'idle'
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            agents,
            summary: {
                totalTasks: tasks.length,
                inProgress: tasks.filter((t)=>t.status === 'in_progress').length,
                blocked: tasks.filter((t)=>t.status === 'blocked').length,
                complete: tasks.filter((t)=>t.status === 'complete').length,
                activeAgents: agents.filter((a)=>a.status === 'active').length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[AgentStatus] Failed to load agent status:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to load agent status',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__adce3baa._.js.map