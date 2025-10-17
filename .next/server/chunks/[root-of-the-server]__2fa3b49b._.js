module.exports = [
"[project]/dawg-ai/.next-internal/server/app/api/health/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/dawg-ai/packages/types/src/events.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/types
 * @description Event types and Zod schemas for DAWG AI event bus
 * @owner Jerry (AI Conductor)
 */ __turbopack_context__.s([
    "AgentBuddyPairedPayloadSchema",
    ()=>AgentBuddyPairedPayloadSchema,
    "AgentHeartbeatPayloadSchema",
    ()=>AgentHeartbeatPayloadSchema,
    "AgentHelpClaimedPayloadSchema",
    ()=>AgentHelpClaimedPayloadSchema,
    "AgentHelpRequestedPayloadSchema",
    ()=>AgentHelpRequestedPayloadSchema,
    "AgentHelpResolvedPayloadSchema",
    ()=>AgentHelpResolvedPayloadSchema,
    "AgentStatusUpdatePayloadSchema",
    ()=>AgentStatusUpdatePayloadSchema,
    "AlertErrorPayloadSchema",
    ()=>AlertErrorPayloadSchema,
    "AlertInfoPayloadSchema",
    ()=>AlertInfoPayloadSchema,
    "AlertWarningPayloadSchema",
    ()=>AlertWarningPayloadSchema,
    "CoachFeedbackPayloadSchema",
    ()=>CoachFeedbackPayloadSchema,
    "CodeDiffProposedPayloadSchema",
    ()=>CodeDiffProposedPayloadSchema,
    "CodeReviewCompletedPayloadSchema",
    ()=>CodeReviewCompletedPayloadSchema,
    "CompingSuggestionPayloadSchema",
    ()=>CompingSuggestionPayloadSchema,
    "ConductorPlanUpdatedPayloadSchema",
    ()=>ConductorPlanUpdatedPayloadSchema,
    "EventEnvelopeSchema",
    ()=>EventEnvelopeSchema,
    "EventTopics",
    ()=>EventTopics,
    "JourneyCompletedPayloadSchema",
    ()=>JourneyCompletedPayloadSchema,
    "JourneyPausedPayloadSchema",
    ()=>JourneyPausedPayloadSchema,
    "JourneyResumedPayloadSchema",
    ()=>JourneyResumedPayloadSchema,
    "JourneyStartedPayloadSchema",
    ()=>JourneyStartedPayloadSchema,
    "MasterCompletedPayloadSchema",
    ()=>MasterCompletedPayloadSchema,
    "MetricSchema",
    ()=>MetricSchema,
    "MetricsTickPayloadSchema",
    ()=>MetricsTickPayloadSchema,
    "MixSuggestionPayloadSchema",
    ()=>MixSuggestionPayloadSchema,
    "RecordingStartedPayloadSchema",
    ()=>RecordingStartedPayloadSchema,
    "RecordingStoppedPayloadSchema",
    ()=>RecordingStoppedPayloadSchema,
    "StageCompletedPayloadSchema",
    ()=>StageCompletedPayloadSchema,
    "TakeSelectedPayloadSchema",
    ()=>TakeSelectedPayloadSchema,
    "TakesUploadedPayloadSchema",
    ()=>TakesUploadedPayloadSchema,
    "TaskAssignedPayloadSchema",
    ()=>TaskAssignedPayloadSchema,
    "TaskCompletedPayloadSchema",
    ()=>TaskCompletedPayloadSchema,
    "TaskCreatedPayloadSchema",
    ()=>TaskCreatedPayloadSchema,
    "TaskUpdatedPayloadSchema",
    ()=>TaskUpdatedPayloadSchema,
    "UIErrorDisplayedPayloadSchema",
    ()=>UIErrorDisplayedPayloadSchema,
    "UILayoutResizedPayloadSchema",
    ()=>UILayoutResizedPayloadSchema,
    "UIModalClosedPayloadSchema",
    ()=>UIModalClosedPayloadSchema,
    "UIModalOpenedPayloadSchema",
    ()=>UIModalOpenedPayloadSchema,
    "UINotificationShownPayloadSchema",
    ()=>UINotificationShownPayloadSchema,
    "UIRouteChangedPayloadSchema",
    ()=>UIRouteChangedPayloadSchema,
    "UIThemeChangedPayloadSchema",
    ()=>UIThemeChangedPayloadSchema,
    "UIWidgetMountedPayloadSchema",
    ()=>UIWidgetMountedPayloadSchema,
    "UIWidgetUnmountedPayloadSchema",
    ()=>UIWidgetUnmountedPayloadSchema,
    "VocalProfileSchema",
    ()=>VocalProfileSchema,
    "validateEventPayload",
    ()=>validateEventPayload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
const EventEnvelopeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    event: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    version: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default('v1'),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    trace_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    producer: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    ts: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime(),
    signature: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    payload: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any())
});
const VocalProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    lowest_note: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    highest_note: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    range_semitones: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    skill_level: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'beginner',
        'intermediate',
        'advanced'
    ])
});
const JourneyStartedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    journey_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'record_song',
        'expand_range',
        'improve_control',
        'build_confidence'
    ]),
    estimated_weeks: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    difficulty: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'easy',
        'medium',
        'hard'
    ]),
    vocal_profile: VocalProfileSchema
});
const StageCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stage_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stage_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    completion_time_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    next_stage_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const JourneyPausedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'user_request',
        'ai_recommendation',
        'technical_issue'
    ]).optional()
});
const JourneyResumedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    paused_duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const JourneyCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    total_duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    stages_completed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    final_recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const RecordingStartedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    track_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    input_device: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const RecordingStoppedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    file_size_bytes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    sample_rate: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    format: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'wav',
        'mp3',
        'webm',
        'opus'
    ])
});
const TakesUploadedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    take_ids: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    take_count: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    total_size_bytes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const TakeSelectedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    selected_take_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    selection_reason: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ai_recommendation',
        'user_choice'
    ])
});
const CoachFeedbackPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    timestamp_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    detected_issue: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'pitch_flat',
        'pitch_sharp',
        'timing_early',
        'timing_late',
        'breath_support',
        'vowel_shape',
        'vibrato'
    ]),
    severity: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'info',
        'warning',
        'critical'
    ]),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    suggested_fix: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const CompingSuggestionPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    take_ids: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    suggested_take_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    confidence_score: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(1),
    reasoning: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const MixSuggestionPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    effect_chain: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        effect_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'eq',
            'compression',
            'reverb',
            'delay',
            'saturation',
            'deesser'
        ]),
        parameters: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number())
    })),
    reasoning: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const MasterCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    mastered_file_url: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    lufs: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    peak_db: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const TaskCreatedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    owner: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    priority: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'P0',
        'P1',
        'P2',
        'P3'
    ]),
    estimate_days: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    dependencies: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
});
const TaskAssignedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    assigned_to: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    assigned_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    deadline: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional()
});
const TaskCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_ids: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    completed_items: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    completed_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const TaskUpdatedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'backlog_refined',
        'priority_changed',
        'blocked',
        'unblocked'
    ]),
    changes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any())
});
const AgentStatusUpdatePayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    agent_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'active',
        'idle',
        'blocked',
        'offline'
    ]),
    current_task: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    progress: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100),
    health: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'healthy',
        'degraded',
        'critical'
    ]),
    needs_help: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    available_to_help: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    computational_resources: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        cpu_usage: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100),
        memory_usage: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100),
        available_capacity: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100)
    })
});
const AgentHelpRequestedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    request_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    requester: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    requester_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    issue: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    urgency: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'low',
        'medium',
        'high',
        'critical'
    ]),
    required_capabilities: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional(),
    context: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
const AgentHelpClaimedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    request_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    claimed_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    claimed_by_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const AgentHelpResolvedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    request_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    resolved_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    resolved_by_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    resolution_notes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const AgentBuddyPairedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    primary: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    buddy: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    focus: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const AgentHeartbeatPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    agent_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'active',
        'idle',
        'blocked',
        'offline'
    ]),
    health: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'healthy',
        'degraded',
        'critical'
    ])
});
const MetricSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    value: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    unit: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
});
const MetricsTickPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    metrics: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(MetricSchema),
    period_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    timestamp: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime()
});
const AlertInfoPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    feature: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    metadata: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
const AlertWarningPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    severity: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'low',
        'medium',
        'high'
    ]),
    action_required: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const AlertErrorPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    error_code: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stack_trace: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    recovery_attempted: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const ConductorPlanUpdatedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    plan_version: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    contracts: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        event_schemas: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
        openapi_specs: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
        grpc_protos: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
        e2e_tests: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
    }),
    capabilities: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    links: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string())
});
const CodeDiffProposedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    branch: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    diff: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    tests: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        passed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        failed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
    }),
    coverage: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        lines: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
    }),
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const CodeReviewCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    review_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    files_analyzed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    issues_found: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()),
    report_location: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    key_findings: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    recommendations: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    estimated_effort: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const UIThemeChangedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    theme: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'light',
        'dark',
        'system'
    ]),
    previous_theme: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'light',
        'dark',
        'system'
    ]),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const UIWidgetMountedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    widget_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    widget_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    parent_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    props: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
const UIWidgetUnmountedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    widget_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    widget_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    duration_ms: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const UILayoutResizedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    viewport_width: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    viewport_height: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    breakpoint: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl'
    ]),
    previous_breakpoint: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl'
    ]).optional()
});
const UIRouteChangedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    from: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    query_params: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
});
const UIModalOpenedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    modal_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    modal_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    trigger: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'user',
        'system',
        'error'
    ])
});
const UIModalClosedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    modal_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    modal_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'confirm',
        'cancel',
        'close',
        'backdrop'
    ]),
    duration_ms: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const UINotificationShownPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    notification_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'info',
        'success',
        'warning',
        'error'
    ]),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    duration_ms: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
});
const UIErrorDisplayedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    error_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    error_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stack: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    component: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const EventTopics = {
    // Journey
    JOURNEY_STARTED: 'journey.started',
    STAGE_COMPLETED: 'stage.completed',
    JOURNEY_PAUSED: 'journey.paused',
    JOURNEY_RESUMED: 'journey.resumed',
    JOURNEY_COMPLETED: 'journey.completed',
    // Recording
    RECORDING_STARTED: 'recording.started',
    RECORDING_STOPPED: 'recording.stopped',
    TAKES_UPLOADED: 'recording.takes.uploaded',
    TAKE_SELECTED: 'recording.take.selected',
    // AI Feedback
    COACH_FEEDBACK: 'coach.feedback',
    COMPING_SUGGESTION: 'comping.suggestion',
    MIX_SUGGESTION: 'mix.suggestion',
    MASTER_COMPLETED: 'master.completed',
    // Tasks
    TASK_CREATED: 'tasks.created',
    TASK_ASSIGNED: 'tasks.assigned',
    TASK_COMPLETED: 'tasks.completed',
    TASK_UPDATED: 'tasks.updated',
    // Agent Coordination
    AGENT_STATUS_UPDATE: 'agent.status.update',
    AGENT_HELP_REQUESTED: 'agent.help.requested',
    AGENT_HELP_CLAIMED: 'agent.help.claimed',
    AGENT_HELP_RESOLVED: 'agent.help.resolved',
    AGENT_BUDDY_PAIRED: 'agent.buddy.paired',
    AGENT_HEARTBEAT: 'agent.heartbeat',
    // Metrics
    METRICS_TICK: 'metrics.tick',
    // Alerts
    ALERT_INFO: 'alerts.info',
    ALERT_WARNING: 'alerts.warning',
    ALERT_ERROR: 'alerts.error',
    // Conductor
    CONDUCTOR_PLAN_UPDATED: 'conductor.plan.updated',
    // Code
    CODE_DIFF_PROPOSED: 'code.diff.proposed',
    CODE_REVIEW_COMPLETED: 'code.review.completed',
    // UI Events
    UI_THEME_CHANGED: 'ui.theme.changed',
    UI_WIDGET_MOUNTED: 'ui.widget.mounted',
    UI_WIDGET_UNMOUNTED: 'ui.widget.unmounted',
    UI_LAYOUT_RESIZED: 'ui.layout.resized',
    UI_ROUTE_CHANGED: 'ui.route.changed',
    UI_MODAL_OPENED: 'ui.modal.opened',
    UI_MODAL_CLOSED: 'ui.modal.closed',
    UI_NOTIFICATION_SHOWN: 'ui.notification.shown',
    UI_ERROR_DISPLAYED: 'ui.error.displayed'
};
function validateEventPayload(topic, payload) {
    const schemaMap = {
        [EventTopics.JOURNEY_STARTED]: JourneyStartedPayloadSchema,
        [EventTopics.STAGE_COMPLETED]: StageCompletedPayloadSchema,
        [EventTopics.JOURNEY_PAUSED]: JourneyPausedPayloadSchema,
        [EventTopics.JOURNEY_RESUMED]: JourneyResumedPayloadSchema,
        [EventTopics.JOURNEY_COMPLETED]: JourneyCompletedPayloadSchema,
        [EventTopics.RECORDING_STARTED]: RecordingStartedPayloadSchema,
        [EventTopics.RECORDING_STOPPED]: RecordingStoppedPayloadSchema,
        [EventTopics.TAKES_UPLOADED]: TakesUploadedPayloadSchema,
        [EventTopics.TAKE_SELECTED]: TakeSelectedPayloadSchema,
        [EventTopics.COACH_FEEDBACK]: CoachFeedbackPayloadSchema,
        [EventTopics.COMPING_SUGGESTION]: CompingSuggestionPayloadSchema,
        [EventTopics.MIX_SUGGESTION]: MixSuggestionPayloadSchema,
        [EventTopics.MASTER_COMPLETED]: MasterCompletedPayloadSchema,
        [EventTopics.TASK_CREATED]: TaskCreatedPayloadSchema,
        [EventTopics.TASK_ASSIGNED]: TaskAssignedPayloadSchema,
        [EventTopics.TASK_COMPLETED]: TaskCompletedPayloadSchema,
        [EventTopics.TASK_UPDATED]: TaskUpdatedPayloadSchema,
        [EventTopics.AGENT_STATUS_UPDATE]: AgentStatusUpdatePayloadSchema,
        [EventTopics.AGENT_HELP_REQUESTED]: AgentHelpRequestedPayloadSchema,
        [EventTopics.AGENT_HELP_CLAIMED]: AgentHelpClaimedPayloadSchema,
        [EventTopics.AGENT_HELP_RESOLVED]: AgentHelpResolvedPayloadSchema,
        [EventTopics.AGENT_BUDDY_PAIRED]: AgentBuddyPairedPayloadSchema,
        [EventTopics.AGENT_HEARTBEAT]: AgentHeartbeatPayloadSchema,
        [EventTopics.METRICS_TICK]: MetricsTickPayloadSchema,
        [EventTopics.ALERT_INFO]: AlertInfoPayloadSchema,
        [EventTopics.ALERT_WARNING]: AlertWarningPayloadSchema,
        [EventTopics.ALERT_ERROR]: AlertErrorPayloadSchema,
        [EventTopics.CONDUCTOR_PLAN_UPDATED]: ConductorPlanUpdatedPayloadSchema,
        [EventTopics.CODE_DIFF_PROPOSED]: CodeDiffProposedPayloadSchema,
        [EventTopics.CODE_REVIEW_COMPLETED]: CodeReviewCompletedPayloadSchema,
        [EventTopics.UI_THEME_CHANGED]: UIThemeChangedPayloadSchema,
        [EventTopics.UI_WIDGET_MOUNTED]: UIWidgetMountedPayloadSchema,
        [EventTopics.UI_WIDGET_UNMOUNTED]: UIWidgetUnmountedPayloadSchema,
        [EventTopics.UI_LAYOUT_RESIZED]: UILayoutResizedPayloadSchema,
        [EventTopics.UI_ROUTE_CHANGED]: UIRouteChangedPayloadSchema,
        [EventTopics.UI_MODAL_OPENED]: UIModalOpenedPayloadSchema,
        [EventTopics.UI_MODAL_CLOSED]: UIModalClosedPayloadSchema,
        [EventTopics.UI_NOTIFICATION_SHOWN]: UINotificationShownPayloadSchema,
        [EventTopics.UI_ERROR_DISPLAYED]: UIErrorDisplayedPayloadSchema
    };
    const schema = schemaMap[topic];
    if (!schema) {
        throw new Error(`No schema found for topic: ${topic}`);
    }
    return schema.parse(payload);
}
}),
"[project]/dawg-ai/packages/types/src/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/types
 * @description Environment variable validation using Zod
 * @owner Jerry (AI Conductor)
 */ __turbopack_context__.s([
    "EnvSchema",
    ()=>EnvSchema,
    "getAnthropicConfig",
    ()=>getAnthropicConfig,
    "getDatabaseConfig",
    ()=>getDatabaseConfig,
    "getEnvVar",
    ()=>getEnvVar,
    "getEventBusConfig",
    ()=>getEventBusConfig,
    "getOpenAIConfig",
    ()=>getOpenAIConfig,
    "getS3Config",
    ()=>getS3Config,
    "isDevelopment",
    ()=>isDevelopment,
    "isProduction",
    ()=>isProduction,
    "isTest",
    ()=>isTest,
    "requireEnvVar",
    ()=>requireEnvVar,
    "validateEnv",
    ()=>validateEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
const EnvSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Node environment
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'production',
        'test'
    ]).default('development'),
    // Application
    NEXT_PUBLIC_APP_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    PORT: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().default(3000),
    // Event Bus Transport
    EVENT_BUS_MODE: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'nats',
        'redis',
        'gitops',
        'test'
    ]).default('gitops'),
    NATS_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    REDIS_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    EVENT_BUS_AGENT_NAME: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Database
    DATABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    // S3 Storage
    S3_BUCKET: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    S3_REGION: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default('us-east-1'),
    S3_ACCESS_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    S3_SECRET_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // AI Services
    ANTHROPIC_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    OPENAI_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Audio Services
    ELEVENLABS_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Authentication
    NEXTAUTH_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXTAUTH_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    // Feature Flags
    ENABLE_VOICE_INTERFACE: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.boolean().default(false),
    ENABLE_METRICS_COLLECTION: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.boolean().default(true),
    ENABLE_AGENT_COORDINATION: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.boolean().default(true),
    // Monitoring
    SENTRY_DSN: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    SENTRY_ENVIRONMENT: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    LOG_LEVEL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'debug',
        'info',
        'warn',
        'error'
    ]).default('info')
});
// ============================================================================
// Validation Function
// ============================================================================
let cachedEnv = null;
function validateEnv() {
    if (cachedEnv) {
        return cachedEnv;
    }
    try {
        cachedEnv = EnvSchema.parse(process.env);
        return cachedEnv;
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            const formattedErrors = error.issues.map((err)=>{
                return `  - ${err.path.join('.')}: ${err.message}`;
            });
            throw new Error(`Environment validation failed:\n${formattedErrors.join('\n')}`);
        }
        throw error;
    }
}
function requireEnvVar(key, customMessage) {
    const env = validateEnv();
    const value = env[key];
    if (value === undefined || value === null || value === '') {
        throw new Error(customMessage || `Required environment variable ${key} is not set`);
    }
    return String(value);
}
function getEnvVar(key, fallback) {
    const env = validateEnv();
    const value = env[key];
    return value !== undefined && value !== null ? String(value) : fallback;
}
function isProduction() {
    return validateEnv().NODE_ENV === 'production';
}
function isDevelopment() {
    return validateEnv().NODE_ENV === 'development';
}
function isTest() {
    return validateEnv().NODE_ENV === 'test';
}
function getEventBusConfig() {
    const env = validateEnv();
    return {
        mode: env.EVENT_BUS_MODE,
        natsUrl: env.NATS_URL,
        redisUrl: env.REDIS_URL,
        agentName: env.EVENT_BUS_AGENT_NAME || 'unknown-agent'
    };
}
function getDatabaseConfig() {
    const env = validateEnv();
    if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for database operations');
    }
    return {
        url: env.DATABASE_URL
    };
}
function getS3Config() {
    const env = validateEnv();
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
        throw new Error('S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY are required for S3 operations');
    }
    return {
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY
    };
}
function getAnthropicConfig() {
    const env = validateEnv();
    if (!env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required for Claude API operations');
    }
    return {
        apiKey: env.ANTHROPIC_API_KEY
    };
}
function getOpenAIConfig() {
    const env = validateEnv();
    if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI operations');
    }
    return {
        apiKey: env.OPENAI_API_KEY
    };
}
}),
"[project]/dawg-ai/packages/types/src/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/types
 * @description Single source of truth for DAWG AI types
 * @owner Jerry (AI Conductor)
 */ // Event types and schemas
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/events.ts [app-route] (ecmascript)");
// Environment validation
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/env.ts [app-route] (ecmascript)");
;
;
}),
"[project]/dawg-ai/app/api/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Health Check Endpoint
 * Returns system status for monitoring and CI/CD
 */ __turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/env.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
async function GET() {
    const startTime = Date.now();
    try {
        // Validate environment
        const env = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateEnv"])();
        // Initialize health status
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: String(env.NODE_ENV),
            checks: {
                database: 'skip',
                eventBus: 'skip',
                storage: 'skip',
                ai: 'skip'
            },
            version: process.env.npm_package_version || '1.0.0'
        };
        // Check database connection (if DATABASE_URL exists)
        if (env.DATABASE_URL) {
            try {
                const { PrismaClient } = await __turbopack_context__.A("[externals]/@prisma/client [external] (@prisma/client, cjs, async loader)");
                const prisma = new PrismaClient();
                await prisma.$queryRaw`SELECT 1`;
                await prisma.$disconnect();
                health.checks.database = 'ok';
            } catch (error) {
                console.error('[Health] Database check failed:', error);
                health.checks.database = 'error';
                health.status = 'degraded';
            }
        }
        // Check event bus (if configured)
        if (env.EVENT_BUS_MODE === 'nats' && env.NATS_URL) {
            try {
                // Basic connectivity check (don't actually connect for health check)
                health.checks.eventBus = 'ok';
            } catch (error) {
                console.error('[Health] Event bus check failed:', error);
                health.checks.eventBus = 'error';
                health.status = 'degraded';
            }
        } else if (env.EVENT_BUS_MODE === 'redis' && env.REDIS_URL) {
            health.checks.eventBus = 'ok';
        } else {
            health.checks.eventBus = 'skip';
        }
        // Check S3 storage (if configured)
        if (env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
            health.checks.storage = 'ok';
        }
        // Check AI services (if API keys exist)
        if (env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY) {
            health.checks.ai = 'ok';
        }
        const responseTime = Date.now() - startTime;
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ...health,
            meta: {
                responseTimeMs: responseTime,
                nodeVersion: process.version
            }
        }, {
            status: health.status === 'healthy' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'X-Response-Time': `${responseTime}ms`
            }
        });
    } catch (error) {
        console.error('[Health] Health check failed:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            uptime: process.uptime()
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-store, must-revalidate'
            }
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2fa3b49b._.js.map