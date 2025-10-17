module.exports = [
"[project]/dawg-ai/.next-internal/server/app/api/team-chat/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/dawg-ai/app/api/team-chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Team Chat API
 * Real-time chat system for coordinating between user and all agents
 */ __turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
const dynamic = 'force-dynamic';
const CHAT_FILE = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), '_bus', 'team-chat.jsonl');
// Ensure chat file exists
async function ensureChatFile() {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].access(CHAT_FILE);
    } catch  {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(CHAT_FILE), {
            recursive: true
        });
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(CHAT_FILE, '');
    }
}
async function GET(request) {
    try {
        await ensureChatFile();
        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since'); // Timestamp to fetch messages after
        const limit = parseInt(searchParams.get('limit') || '50');
        const agent = searchParams.get('agent'); // Filter for specific agent
        const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(CHAT_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        let messages = lines.map((line)=>{
            try {
                return JSON.parse(line);
            } catch  {
                return null;
            }
        }).filter(Boolean);
        // Filter by timestamp if provided
        if (since) {
            const sinceTime = new Date(since).getTime();
            messages = messages.filter((m)=>new Date(m.timestamp).getTime() > sinceTime);
        }
        // Filter for specific agent (messages to them or from them)
        if (agent) {
            messages = messages.filter((m)=>m.to === agent || m.to === 'all' || m.from === agent);
        }
        // Get most recent messages
        messages = messages.slice(-limit);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            messages,
            count: messages.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[TeamChat] Failed to fetch messages:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch messages'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        await ensureChatFile();
        const body = await request.json();
        const { from, to, message, type } = body;
        if (!from || !message) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'from and message are required'
            }, {
                status: 400
            });
        }
        const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            from,
            to: to || 'all',
            message,
            type: type || 'user',
            read: false
        };
        // Append to chat file
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].appendFile(CHAT_FILE, JSON.stringify(chatMessage) + '\n');
        // Also publish to event bus for real-time notifications
        try {
            const today = new Date().toISOString().split('T')[0];
            const eventBusDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), '_bus', 'events', today);
            const eventBusFile = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(eventBusDir, 'events.jsonl');
            // Ensure event bus directory exists
            await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(eventBusDir, {
                recursive: true
            });
            const event = {
                event: 'team.chat.message',
                version: 'v1',
                id: chatMessage.id,
                trace_id: 'tr_team_chat',
                producer: from,
                ts: chatMessage.timestamp,
                signature: 'chat_message',
                payload: {
                    from,
                    to: chatMessage.to,
                    message,
                    type
                }
            };
            await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].appendFile(eventBusFile, JSON.stringify(event) + '\n');
        } catch (eventError) {
            // Event bus is optional, don't fail if it errors
            console.error('[TeamChat] Event bus error:', eventError);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: chatMessage
        });
    } catch (error) {
        console.error('[TeamChat] Failed to send message:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to send message'
        }, {
            status: 500
        });
    }
}
async function DELETE() {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(CHAT_FILE, '');
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Chat history cleared'
        });
    } catch (error) {
        console.error('[TeamChat] Failed to clear history:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to clear history'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e1c10270._.js.map