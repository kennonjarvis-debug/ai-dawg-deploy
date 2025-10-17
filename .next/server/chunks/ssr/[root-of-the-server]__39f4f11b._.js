module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/dawg-ai/packages/types/src/events.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
const EventEnvelopeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    event: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    version: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default('v1'),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    trace_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    producer: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    ts: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime(),
    signature: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    payload: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any())
});
const VocalProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    lowest_note: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    highest_note: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    range_semitones: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    skill_level: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'beginner',
        'intermediate',
        'advanced'
    ])
});
const JourneyStartedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    journey_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'record_song',
        'expand_range',
        'improve_control',
        'build_confidence'
    ]),
    estimated_weeks: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    difficulty: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'easy',
        'medium',
        'hard'
    ]),
    vocal_profile: VocalProfileSchema
});
const StageCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stage_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stage_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    completion_time_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    next_stage_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const JourneyPausedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'user_request',
        'ai_recommendation',
        'technical_issue'
    ]).optional()
});
const JourneyResumedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    paused_duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const JourneyCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    total_duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    stages_completed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    final_recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const RecordingStartedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    journey_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    track_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    input_device: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const RecordingStoppedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    file_size_bytes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    sample_rate: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    format: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'wav',
        'mp3',
        'webm',
        'opus'
    ])
});
const TakesUploadedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    take_ids: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    take_count: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    total_size_bytes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const TakeSelectedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    selected_take_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    selection_reason: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ai_recommendation',
        'user_choice'
    ])
});
const CoachFeedbackPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    timestamp_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    detected_issue: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'pitch_flat',
        'pitch_sharp',
        'timing_early',
        'timing_late',
        'breath_support',
        'vowel_shape',
        'vibrato'
    ]),
    severity: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'info',
        'warning',
        'critical'
    ]),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    suggested_fix: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const CompingSuggestionPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    take_ids: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    suggested_take_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    confidence_score: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(1),
    reasoning: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const MixSuggestionPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    effect_chain: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        effect_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'eq',
            'compression',
            'reverb',
            'delay',
            'saturation',
            'deesser'
        ]),
        parameters: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number())
    })),
    reasoning: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const MasterCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    recording_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    mastered_file_url: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    lufs: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    peak_db: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    duration_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const TaskCreatedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    owner: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    priority: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'P0',
        'P1',
        'P2',
        'P3'
    ]),
    estimate_days: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    dependencies: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
});
const TaskAssignedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    assigned_to: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    assigned_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    deadline: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional()
});
const TaskCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_ids: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    completed_items: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    completed_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const TaskUpdatedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'backlog_refined',
        'priority_changed',
        'blocked',
        'unblocked'
    ]),
    changes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any())
});
const AgentStatusUpdatePayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    agent_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'active',
        'idle',
        'blocked',
        'offline'
    ]),
    current_task: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    progress: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100),
    health: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'healthy',
        'degraded',
        'critical'
    ]),
    needs_help: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    available_to_help: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    computational_resources: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        cpu_usage: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100),
        memory_usage: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100),
        available_capacity: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100)
    })
});
const AgentHelpRequestedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    request_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    requester: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    requester_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    issue: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    urgency: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'low',
        'medium',
        'high',
        'critical'
    ]),
    required_capabilities: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional(),
    context: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
const AgentHelpClaimedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    request_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    claimed_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    claimed_by_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const AgentHelpResolvedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    request_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    resolved_by: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    resolved_by_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    resolution_notes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const AgentBuddyPairedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    primary: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    buddy: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    focus: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const AgentHeartbeatPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    agent_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent_name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'active',
        'idle',
        'blocked',
        'offline'
    ]),
    health: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'healthy',
        'degraded',
        'critical'
    ])
});
const MetricSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    value: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    unit: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
});
const MetricsTickPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    metrics: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(MetricSchema),
    period_sec: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    timestamp: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime()
});
const AlertInfoPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    feature: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    metadata: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
const AlertWarningPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    severity: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'low',
        'medium',
        'high'
    ]),
    action_required: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const AlertErrorPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    agent: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    error_code: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stack_trace: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    recovery_attempted: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const ConductorPlanUpdatedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    msg: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    plan_version: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    contracts: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        event_schemas: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
        openapi_specs: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
        grpc_protos: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
        e2e_tests: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
    }),
    capabilities: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    links: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string())
});
const CodeDiffProposedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    branch: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    diff: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    tests: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        passed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        failed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
    }),
    coverage: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        lines: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
    }),
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const CodeReviewCompletedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    task_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    review_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    files_analyzed: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    issues_found: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()),
    report_location: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    key_findings: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    recommendations: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    estimated_effort: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const UIThemeChangedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    theme: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'light',
        'dark',
        'system'
    ]),
    previous_theme: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'light',
        'dark',
        'system'
    ]),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const UIWidgetMountedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    widget_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    widget_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    parent_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    props: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
const UIWidgetUnmountedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    widget_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    widget_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    duration_ms: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const UILayoutResizedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    viewport_width: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    viewport_height: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    breakpoint: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl'
    ]),
    previous_breakpoint: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl'
    ]).optional()
});
const UIRouteChangedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    from: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    query_params: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
});
const UIModalOpenedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    modal_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    modal_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    trigger: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'user',
        'system',
        'error'
    ])
});
const UIModalClosedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    modal_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    modal_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'confirm',
        'cancel',
        'close',
        'backdrop'
    ]),
    duration_ms: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
const UINotificationShownPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    notification_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'info',
        'success',
        'warning',
        'error'
    ]),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    duration_ms: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
});
const UIErrorDisplayedPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    error_id: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    error_type: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    stack: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    component: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
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
"[project]/dawg-ai/packages/types/src/env.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
const EnvSchema = __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Node environment
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'production',
        'test'
    ]).default('development'),
    // Application
    NEXT_PUBLIC_APP_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    PORT: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().default(3000),
    // Event Bus Transport
    EVENT_BUS_MODE: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'nats',
        'redis',
        'gitops',
        'test'
    ]).default('gitops'),
    NATS_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    REDIS_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    EVENT_BUS_AGENT_NAME: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Database
    DATABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    // S3 Storage
    S3_BUCKET: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    S3_REGION: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default('us-east-1'),
    S3_ACCESS_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    S3_SECRET_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // AI Services
    ANTHROPIC_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    OPENAI_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Audio Services
    ELEVENLABS_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Authentication
    NEXTAUTH_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXTAUTH_URL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    // Feature Flags
    ENABLE_VOICE_INTERFACE: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.boolean().default(false),
    ENABLE_METRICS_COLLECTION: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.boolean().default(true),
    ENABLE_AGENT_COORDINATION: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.boolean().default(true),
    // Monitoring
    SENTRY_DSN: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    SENTRY_ENVIRONMENT: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    LOG_LEVEL: __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
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
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
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
"[project]/dawg-ai/packages/types/src/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/types
 * @description Single source of truth for DAWG AI types
 * @owner Jerry (AI Conductor)
 */ // Event types and schemas
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/events.ts [app-ssr] (ecmascript)");
// Environment validation
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$env$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/env.ts [app-ssr] (ecmascript)");
;
;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/stream/web [external] (stream/web, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream/web", () => require("stream/web"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[project]/dawg-ai/packages/event-bus/src/transports/nats.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/event-bus
 * @description NATS transport implementation
 * @owner Jerry (AI Conductor)
 */ __turbopack_context__.s([
    "NatsTransport",
    ()=>NatsTransport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$nats$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/nats/index.js [app-ssr] (ecmascript)");
;
class NatsTransport {
    connection = null;
    subscriptions = new Map();
    codec = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$nats$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StringCodec"])();
    config;
    constructor(config){
        this.config = {
            reconnect: true,
            maxReconnectAttempts: 10,
            ...config
        };
    }
    async connect() {
        try {
            this.connection = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$nats$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["connect"])({
                servers: this.config.url,
                reconnect: this.config.reconnect,
                maxReconnectAttempts: this.config.maxReconnectAttempts
            });
            console.log(`[NatsTransport] Connected to NATS at ${this.config.url}`);
        } catch (error) {
            console.error('[NatsTransport] Connection failed:', error);
            throw new Error(`Failed to connect to NATS: ${error}`);
        }
    }
    async disconnect() {
        // Close all subscriptions
        for (const [topic, subscription] of this.subscriptions.entries()){
            try {
                await subscription.drain();
                console.log(`[NatsTransport] Unsubscribed from ${topic}`);
            } catch (error) {
                console.error(`[NatsTransport] Failed to unsubscribe from ${topic}:`, error);
            }
        }
        this.subscriptions.clear();
        // Close connection
        if (this.connection) {
            try {
                await this.connection.drain();
                console.log('[NatsTransport] Disconnected from NATS');
            } catch (error) {
                console.error('[NatsTransport] Disconnect error:', error);
            }
            this.connection = null;
        }
    }
    async publish(topic, envelope) {
        if (!this.connection) {
            throw new Error('[NatsTransport] Not connected to NATS');
        }
        try {
            const message = JSON.stringify(envelope);
            this.connection.publish(topic, this.codec.encode(message));
            console.log(`[NatsTransport] Published to ${topic}`);
        } catch (error) {
            console.error(`[NatsTransport] Failed to publish to ${topic}:`, error);
            throw error;
        }
    }
    async subscribe(topic, handler) {
        if (!this.connection) {
            throw new Error('[NatsTransport] Not connected to NATS');
        }
        // Check if already subscribed
        if (this.subscriptions.has(topic)) {
            console.warn(`[NatsTransport] Already subscribed to ${topic}`);
            return;
        }
        try {
            const subscription = this.connection.subscribe(topic);
            this.subscriptions.set(topic, subscription);
            // Process messages asynchronously
            (async ()=>{
                for await (const msg of subscription){
                    try {
                        const data = this.codec.decode(msg.data);
                        const envelope = JSON.parse(data);
                        await handler(envelope);
                    } catch (error) {
                        console.error(`[NatsTransport] Error processing message on ${topic}:`, error);
                    }
                }
            })();
            console.log(`[NatsTransport] Subscribed to ${topic}`);
        } catch (error) {
            console.error(`[NatsTransport] Failed to subscribe to ${topic}:`, error);
            throw error;
        }
    }
    async unsubscribe(topic) {
        const subscription = this.subscriptions.get(topic);
        if (!subscription) {
            console.warn(`[NatsTransport] Not subscribed to ${topic}`);
            return;
        }
        try {
            await subscription.drain();
            this.subscriptions.delete(topic);
            console.log(`[NatsTransport] Unsubscribed from ${topic}`);
        } catch (error) {
            console.error(`[NatsTransport] Failed to unsubscribe from ${topic}:`, error);
            throw error;
        }
    }
    isConnected() {
        return this.connection !== null && !this.connection.isClosed();
    }
}
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/string_decoder [external] (string_decoder, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[project]/dawg-ai/packages/event-bus/src/transports/redis.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/event-bus
 * @description Redis Streams transport implementation
 * @owner Jerry (AI Conductor)
 */ __turbopack_context__.s([
    "RedisTransport",
    ()=>RedisTransport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$redis$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/redis/dist/index.js [app-ssr] (ecmascript)");
;
class RedisTransport {
    publisher = null;
    subscriber = null;
    subscriptions = new Map();
    config;
    constructor(config){
        this.config = {
            consumerGroup: 'dawg-ai',
            consumerId: config.agentName || 'default-consumer',
            ...config
        };
    }
    async connect() {
        try {
            // Create publisher client
            this.publisher = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$redis$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])({
                url: this.config.url
            });
            await this.publisher.connect();
            // Create subscriber client (separate connection for blocking reads)
            this.subscriber = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$redis$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])({
                url: this.config.url
            });
            await this.subscriber.connect();
            console.log(`[RedisTransport] Connected to Redis at ${this.config.url}`);
        } catch (error) {
            console.error('[RedisTransport] Connection failed:', error);
            throw new Error(`Failed to connect to Redis: ${error}`);
        }
    }
    async disconnect() {
        // Abort all subscriptions
        for (const [topic, controller] of this.subscriptions.entries()){
            controller.abort();
            console.log(`[RedisTransport] Unsubscribed from ${topic}`);
        }
        this.subscriptions.clear();
        // Close connections
        if (this.publisher) {
            await this.publisher.quit();
            this.publisher = null;
        }
        if (this.subscriber) {
            await this.subscriber.quit();
            this.subscriber = null;
        }
        console.log('[RedisTransport] Disconnected from Redis');
    }
    async publish(topic, envelope) {
        if (!this.publisher) {
            throw new Error('[RedisTransport] Not connected to Redis');
        }
        try {
            const streamKey = `events:${topic}`;
            const message = JSON.stringify(envelope);
            await this.publisher.xAdd(streamKey, '*', {
                data: message,
                producer: this.config.agentName || 'unknown',
                timestamp: Date.now().toString()
            });
            console.log(`[RedisTransport] Published to ${topic}`);
        } catch (error) {
            console.error(`[RedisTransport] Failed to publish to ${topic}:`, error);
            throw error;
        }
    }
    async subscribe(topic, handler) {
        if (!this.subscriber) {
            throw new Error('[RedisTransport] Not connected to Redis');
        }
        // Check if already subscribed
        if (this.subscriptions.has(topic)) {
            console.warn(`[RedisTransport] Already subscribed to ${topic}`);
            return;
        }
        const streamKey = `events:${topic}`;
        const consumerGroup = this.config.consumerGroup;
        const consumerId = this.config.consumerId;
        // Create consumer group if it doesn't exist
        try {
            await this.subscriber.xGroupCreate(streamKey, consumerGroup, '0', {
                MKSTREAM: true
            });
        } catch (error) {
            // Ignore "BUSYGROUP Consumer Group name already exists" error
            if (!error.message?.includes('BUSYGROUP')) {
                console.error(`[RedisTransport] Failed to create consumer group:`, error);
            }
        }
        // Start consuming messages
        const controller = new AbortController();
        this.subscriptions.set(topic, controller);
        (async ()=>{
            let lastId = '>';
            while(!controller.signal.aborted){
                try {
                    const messages = await this.subscriber.xReadGroup(consumerGroup, consumerId, [
                        {
                            key: streamKey,
                            id: lastId
                        }
                    ], {
                        COUNT: 10,
                        BLOCK: 5000
                    });
                    if (!messages || messages.length === 0) {
                        continue;
                    }
                    for (const stream of messages){
                        for (const message of stream.messages){
                            try {
                                const data = message.message.data;
                                if (typeof data === 'string') {
                                    const envelope = JSON.parse(data);
                                    await handler(envelope);
                                    // Acknowledge message
                                    await this.subscriber.xAck(streamKey, consumerGroup, message.id);
                                }
                            } catch (error) {
                                console.error(`[RedisTransport] Error processing message on ${topic}:`, error);
                            }
                        }
                    }
                } catch (error) {
                    if (controller.signal.aborted) {
                        break;
                    }
                    console.error(`[RedisTransport] Error reading from ${topic}:`, error);
                    // Wait before retrying
                    await new Promise((resolve)=>setTimeout(resolve, 1000));
                }
            }
        })();
        console.log(`[RedisTransport] Subscribed to ${topic}`);
    }
    async unsubscribe(topic) {
        const controller = this.subscriptions.get(topic);
        if (!controller) {
            console.warn(`[RedisTransport] Not subscribed to ${topic}`);
            return;
        }
        controller.abort();
        this.subscriptions.delete(topic);
        console.log(`[RedisTransport] Unsubscribed from ${topic}`);
    }
    isConnected() {
        return this.publisher?.isOpen === true && this.subscriber?.isOpen === true;
    }
}
}),
"[project]/dawg-ai/packages/event-bus/src/EventBus.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/event-bus
 * @description Typed event bus with multi-transport support
 * @owner Jerry (AI Conductor)
 */ __turbopack_context__.s([
    "EventBus",
    ()=>EventBus,
    "getEventBus",
    ()=>getEventBus,
    "resetEventBus",
    ()=>resetEventBus
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/events.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$env$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/env.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$transports$2f$nats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/transports/nats.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$transports$2f$redis$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/transports/redis.ts [app-ssr] (ecmascript)");
;
;
;
;
class EventBus {
    transport;
    config;
    handlers = new Map();
    signingSecret;
    constructor(config){
        const env = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$env$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateEnv"])();
        const mode = config?.mode || env.EVENT_BUS_MODE || 'gitops';
        const agentName = String(config?.agentName || env.EVENT_BUS_AGENT_NAME || 'unknown-agent');
        const natsUrl = typeof config?.natsUrl === 'string' ? config.natsUrl : typeof env.NATS_URL === 'string' ? env.NATS_URL : undefined;
        const redisUrl = typeof config?.redisUrl === 'string' ? config.redisUrl : typeof env.REDIS_URL === 'string' ? env.REDIS_URL : undefined;
        const signingSecret = typeof config?.signingSecret === 'string' ? config.signingSecret : typeof env.NEXTAUTH_SECRET === 'string' ? env.NEXTAUTH_SECRET : undefined;
        this.config = {
            mode,
            agentName,
            natsUrl,
            redisUrl,
            signingSecret
        };
        this.signingSecret = this.config.signingSecret || 'default-secret';
        // Initialize transport based on mode
        this.transport = this.createTransport();
    }
    createTransport() {
        switch(this.config.mode){
            case 'nats':
                if (!this.config.natsUrl) {
                    throw new Error('[EventBus] NATS_URL is required for NATS mode');
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$transports$2f$nats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NatsTransport"]({
                    url: this.config.natsUrl,
                    agentName: this.config.agentName
                });
            case 'redis':
                if (!this.config.redisUrl) {
                    throw new Error('[EventBus] REDIS_URL is required for Redis mode');
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$transports$2f$redis$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RedisTransport"]({
                    url: this.config.redisUrl,
                    agentName: this.config.agentName
                });
            default:
                throw new Error(`[EventBus] Unsupported mode: ${this.config.mode}`);
        }
    }
    async connect() {
        await this.transport.connect();
        console.log(`[EventBus] Connected (mode: ${this.config.mode}, agent: ${this.config.agentName})`);
    }
    async disconnect() {
        await this.transport.disconnect();
        this.handlers.clear();
        console.log('[EventBus] Disconnected');
    }
    /**
   * Publish an event with type-safe payload
   */ async publish(topic, payload, options) {
        // Validate payload against schema (unless skipped)
        if (!options?.skipValidation) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateEventPayload"])(topic, payload);
        }
        const envelope = {
            event: topic,
            version: 'v1',
            id: this.generateId(),
            trace_id: options?.traceId || this.generateTraceId(),
            producer: this.config.agentName,
            ts: new Date().toISOString(),
            signature: this.signPayload(payload),
            payload
        };
        await this.transport.publish(topic, envelope);
        // Trigger local handlers (for same-process subscribers)
        this.triggerHandlers(topic, envelope);
    }
    /**
   * Subscribe to an event with type-safe handler
   */ subscribe(topic, handler) {
        if (!this.handlers.has(topic)) {
            this.handlers.set(topic, new Set());
            // Register with transport (only once per topic)
            this.transport.subscribe(topic, (envelope)=>{
                this.triggerHandlers(topic, envelope);
            });
        }
        this.handlers.get(topic).add(handler);
        console.log(`[EventBus] Subscribed to ${topic} (${this.handlers.get(topic).size} handlers)`);
    }
    /**
   * Unsubscribe from an event
   */ async unsubscribe(topic, handler) {
        const topicHandlers = this.handlers.get(topic);
        if (!topicHandlers) {
            return;
        }
        if (handler) {
            // Remove specific handler
            topicHandlers.delete(handler);
            console.log(`[EventBus] Unsubscribed handler from ${topic}`);
            // If no more handlers, unsubscribe from transport
            if (topicHandlers.size === 0) {
                await this.transport.unsubscribe(topic);
                this.handlers.delete(topic);
            }
        } else {
            // Remove all handlers for this topic
            await this.transport.unsubscribe(topic);
            this.handlers.delete(topic);
            console.log(`[EventBus] Unsubscribed all handlers from ${topic}`);
        }
    }
    /**
   * Trigger all handlers for a topic
   */ triggerHandlers(topic, envelope) {
        const topicHandlers = this.handlers.get(topic);
        if (!topicHandlers || topicHandlers.size === 0) {
            return;
        }
        for (const handler of topicHandlers){
            try {
                const result = handler(envelope);
                if (result instanceof Promise) {
                    result.catch((error)=>{
                        console.error(`[EventBus] Handler error for ${topic}:`, error);
                    });
                }
            } catch (error) {
                console.error(`[EventBus] Handler error for ${topic}:`, error);
            }
        }
    }
    /**
   * Wait for a specific event (useful for testing)
   */ async waitForEvent(topic, timeoutMs = 5000) {
        return new Promise((resolve, reject)=>{
            const timeout = setTimeout(()=>{
                this.unsubscribe(topic, handler);
                reject(new Error(`[EventBus] Timeout waiting for ${topic}`));
            }, timeoutMs);
            const handler = (envelope)=>{
                clearTimeout(timeout);
                this.unsubscribe(topic, handler);
                resolve(envelope);
            };
            this.subscribe(topic, handler);
        });
    }
    /**
   * Generate unique event ID (ULID-like)
   */ generateId() {
        const timestamp = Date.now().toString(36);
        const randomPart = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(8).toString('hex');
        return `evt_${timestamp}_${randomPart}`;
    }
    /**
   * Generate trace ID for request correlation
   */ generateTraceId() {
        const timestamp = Date.now().toString(36);
        const randomPart = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(8).toString('hex');
        return `tr_${timestamp}_${randomPart}`;
    }
    /**
   * Sign payload using HMAC-SHA256
   */ signPayload(payload) {
        const message = JSON.stringify(payload);
        const hmac = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac('sha256', this.signingSecret);
        hmac.update(message);
        return hmac.digest('hex');
    }
    /**
   * Verify payload signature
   */ verifySignature(payload, signature) {
        const expectedSignature = this.signPayload(payload);
        return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    /**
   * Get connection status
   */ isConnected() {
        return this.transport.isConnected();
    }
    /**
   * Get current config
   */ getConfig() {
        return {
            ...this.config
        };
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let globalEventBus = null;
function getEventBus(config) {
    if (!globalEventBus) {
        globalEventBus = new EventBus(config);
    }
    return globalEventBus;
}
function resetEventBus() {
    if (globalEventBus) {
        globalEventBus.disconnect();
        globalEventBus = null;
    }
}
}),
"[project]/dawg-ai/packages/event-bus/src/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * @package @dawg-ai/event-bus
 * @description Typed event bus with NATS/Redis transport
 * @owner Jerry (AI Conductor)
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$EventBus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/EventBus.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$transports$2f$nats$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/transports/nats.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$transports$2f$redis$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/transports/redis.ts [app-ssr] (ecmascript)");
;
;
;
}),
"[project]/dawg-ai/hooks/useUIEvents.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * UI Event Bus Hooks
 * Typed hooks for subscribing to and emitting UI events
 */ __turbopack_context__.s([
    "useErrorTracking",
    ()=>useErrorTracking,
    "useLayout",
    ()=>useLayout,
    "useModal",
    ()=>useModal,
    "useNotification",
    ()=>useNotification,
    "useRoute",
    ()=>useRoute,
    "useTheme",
    ()=>useTheme,
    "useUIEvent",
    ()=>useUIEvent,
    "useWidget",
    ()=>useWidget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$EventBus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/event-bus/src/EventBus.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/packages/types/src/events.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const eventBus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$event$2d$bus$2f$src$2f$EventBus$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getEventBus"])({
    mode: 'test',
    agentName: 'ui-hooks'
});
function useUIEvent(topic, handler, deps = []) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const wrappedHandler = (event)=>{
            handler(event.payload);
        };
        eventBus.subscribe(topic, wrappedHandler);
        return ()=>{
            eventBus.unsubscribe(topic, wrappedHandler);
        };
    }, deps);
}
function useTheme() {
    const emit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_THEME_CHANGED, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_THEME_CHANGED, (event)=>handler(event.payload));
    }, []);
    return {
        emit,
        subscribe
    };
}
function useLayout() {
    const emit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_LAYOUT_RESIZED, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_LAYOUT_RESIZED, (event)=>handler(event.payload));
    }, []);
    // Automatically track viewport changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const getBreakpoint = (width)=>{
            if (width < 640) return 'xs';
            if (width < 768) return 'sm';
            if (width < 1024) return 'md';
            if (width < 1280) return 'lg';
            if (width < 1536) return 'xl';
            return '2xl';
        };
        let previousBreakpoint = getBreakpoint(window.innerWidth);
        const handleResize = ()=>{
            const width = window.innerWidth;
            const height = window.innerHeight;
            const breakpoint = getBreakpoint(width);
            if (breakpoint !== previousBreakpoint) {
                emit({
                    viewport_width: width,
                    viewport_height: height,
                    breakpoint,
                    previous_breakpoint: previousBreakpoint
                });
                previousBreakpoint = breakpoint;
            }
        };
        window.addEventListener('resize', handleResize);
        return ()=>window.removeEventListener('resize', handleResize);
    }, [
        emit
    ]);
    return {
        emit,
        subscribe
    };
}
function useWidget(widgetId, widgetType, props) {
    const mountTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Widget mounted
        mountTimeRef.current = Date.now();
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_WIDGET_MOUNTED, {
            widget_id: widgetId,
            widget_type: widgetType,
            props
        }, {
            traceId: crypto.randomUUID()
        });
        // Widget unmounted
        return ()=>{
            const duration_ms = Date.now() - (mountTimeRef.current || Date.now());
            eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_WIDGET_UNMOUNTED, {
                widget_id: widgetId,
                widget_type: widgetType,
                duration_ms
            }, {
                traceId: crypto.randomUUID()
            });
        };
    }, [
        widgetId,
        widgetType,
        props
    ]);
}
function useRoute() {
    const emit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_ROUTE_CHANGED, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_ROUTE_CHANGED, (event)=>handler(event.payload));
    }, []);
    return {
        emit,
        subscribe
    };
}
function useModal() {
    const open = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_MODAL_OPENED, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const close = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_MODAL_CLOSED, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const subscribeOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_MODAL_OPENED, (event)=>handler(event.payload));
    }, []);
    const subscribeClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_MODAL_CLOSED, (event)=>handler(event.payload));
    }, []);
    return {
        open,
        close,
        subscribeOpen,
        subscribeClose
    };
}
function useNotification() {
    const show = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_NOTIFICATION_SHOWN, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_NOTIFICATION_SHOWN, (event)=>handler(event.payload));
    }, []);
    return {
        show,
        subscribe
    };
}
function useErrorTracking() {
    const trackError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((payload)=>{
        eventBus.publish(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_ERROR_DISPLAYED, payload, {
            traceId: crypto.randomUUID()
        });
    }, []);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((handler)=>{
        return eventBus.subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$packages$2f$types$2f$src$2f$events$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EventTopics"].UI_ERROR_DISPLAYED, (event)=>handler(event.payload));
    }, []);
    // Automatic error boundary integration
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleError = (event)=>{
            trackError({
                error_id: crypto.randomUUID(),
                error_type: event.error?.name || 'UnknownError',
                message: event.message,
                stack: event.error?.stack
            });
        };
        const handleUnhandledRejection = (event)=>{
            trackError({
                error_id: crypto.randomUUID(),
                error_type: 'UnhandledPromiseRejection',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack
            });
        };
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return ()=>{
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [
        trackError
    ]);
    return {
        trackError,
        subscribe
    };
}
}),
"[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * UI Infrastructure Demo Component
 *
 * Demonstrates the complete UI infrastructure:
 * - Design tokens (colors, spacing, typography, etc.)
 * - UI events (theme, layout, widget lifecycle)
 * - Event bus integration
 *
 * This component shows how to properly use the infrastructure
 * in real components.
 */ __turbopack_context__.s([
    "UIInfrastructureDemo",
    ()=>UIInfrastructureDemo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$hooks$2f$useUIEvents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dawg-ai/hooks/useUIEvents.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function UIInfrastructureDemo() {
    const [currentTheme, setCurrentTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('system');
    const [breakpoint, setBreakpoint] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('unknown');
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    // Theme management with UI events
    const { emit: emitTheme, subscribe: onThemeChange } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$hooks$2f$useUIEvents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    // Layout tracking (auto-tracks viewport)
    const { subscribe: onLayoutChange } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$hooks$2f$useUIEvents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayout"])();
    // Notifications
    const { show: showNotification, subscribe: onNotification } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$hooks$2f$useUIEvents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNotification"])();
    // Widget lifecycle tracking
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$hooks$2f$useUIEvents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWidget"])('ui-demo-001', 'UIInfrastructureDemo', {
        version: '1.0'
    });
    // Subscribe to theme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const sub = onThemeChange((payload)=>{
            console.log('[Demo] Theme changed:', payload);
            setCurrentTheme(payload.theme);
        });
        return ()=>sub.unsubscribe();
    }, [
        onThemeChange
    ]);
    // Subscribe to layout changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const sub = onLayoutChange((payload)=>{
            console.log('[Demo] Layout changed:', payload);
            setBreakpoint(payload.breakpoint);
        });
        return ()=>sub.unsubscribe();
    }, [
        onLayoutChange
    ]);
    // Subscribe to notifications
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const sub = onNotification((payload)=>{
            console.log('[Demo] Notification shown:', payload);
            setNotifications((prev)=>[
                    ...prev.slice(-4),
                    payload.message
                ]);
        });
        return ()=>sub.unsubscribe();
    }, [
        onNotification
    ]);
    // Handle theme change
    const handleThemeChange = (newTheme)=>{
        emitTheme({
            theme: newTheme,
            previous_theme: currentTheme,
            user_id: 'demo-user'
        });
        // Show notification
        showNotification({
            notification_id: crypto.randomUUID(),
            type: 'info',
            message: `Theme changed to ${newTheme}`,
            duration_ms: 3000
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            // Using design tokens via CSS variables
            padding: 'var(--spacing-8)',
            background: 'var(--color-neutral-50)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            maxWidth: 'var(--spacing-128)',
            margin: '0 auto'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    marginBottom: 'var(--spacing-6)',
                    color: 'var(--color-neutral-900)'
                },
                children: "UI Infrastructure Demo"
            }, void 0, false, {
                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    marginBottom: 'var(--spacing-8)',
                    padding: 'var(--spacing-6)',
                    background: 'var(--color-primary-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-primary-200)'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-4)',
                            color: 'var(--color-primary-900)'
                        },
                        children: "🎨 Design Tokens"
                    }, void 0, false, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--spacing-4)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 'var(--spacing-4)',
                                    background: 'var(--color-neutral-0)',
                                    borderRadius: 'var(--radius-base)'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        style: {
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 'var(--font-weight-medium)',
                                            marginBottom: 'var(--spacing-2)',
                                            color: 'var(--color-neutral-700)'
                                        },
                                        children: "Colors"
                                    }, void 0, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 126,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: 'var(--spacing-2)'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-12)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-primary-500)',
                                                    borderRadius: 'var(--radius-base)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 135,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-12)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-secondary-500)',
                                                    borderRadius: 'var(--radius-base)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 141,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-12)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-accent-500)',
                                                    borderRadius: 'var(--radius-base)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 147,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 134,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 'var(--spacing-4)',
                                    background: 'var(--color-neutral-0)',
                                    borderRadius: 'var(--radius-base)'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        style: {
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 'var(--font-weight-medium)',
                                            marginBottom: 'var(--spacing-2)',
                                            color: 'var(--color-neutral-700)'
                                        },
                                        children: "Spacing"
                                    }, void 0, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            gap: 'var(--spacing-2)'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-4)',
                                                    height: 'var(--spacing-4)',
                                                    background: 'var(--color-neutral-400)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 171,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-4)',
                                                    height: 'var(--spacing-8)',
                                                    background: 'var(--color-neutral-400)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 172,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-4)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-neutral-400)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 173,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-4)',
                                                    height: 'var(--spacing-16)',
                                                    background: 'var(--color-neutral-400)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 174,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 170,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 157,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 'var(--spacing-4)',
                                    background: 'var(--color-neutral-0)',
                                    borderRadius: 'var(--radius-base)'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        style: {
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 'var(--font-weight-medium)',
                                            marginBottom: 'var(--spacing-2)',
                                            color: 'var(--color-neutral-700)'
                                        },
                                        children: "Shadows"
                                    }, void 0, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 184,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: 'var(--spacing-2)'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-12)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-neutral-0)',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    borderRadius: 'var(--radius-base)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 193,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-12)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-neutral-0)',
                                                    boxShadow: 'var(--shadow-md)',
                                                    borderRadius: 'var(--radius-base)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 200,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 'var(--spacing-12)',
                                                    height: 'var(--spacing-12)',
                                                    background: 'var(--color-neutral-0)',
                                                    boxShadow: 'var(--shadow-lg)',
                                                    borderRadius: 'var(--radius-base)'
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                                lineNumber: 207,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 192,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                lineNumber: 99,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    marginBottom: 'var(--spacing-8)',
                    padding: 'var(--spacing-6)',
                    background: 'var(--color-secondary-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-secondary-200)'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-4)',
                            color: 'var(--color-secondary-900)'
                        },
                        children: "📡 UI Events"
                    }, void 0, false, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 'var(--spacing-4)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginBottom: 'var(--spacing-2)',
                                    color: 'var(--color-neutral-700)'
                                },
                                children: [
                                    "Theme: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: 'var(--color-secondary-600)'
                                        },
                                        children: currentTheme
                                    }, void 0, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 244,
                                        columnNumber: 20
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 238,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    gap: 'var(--spacing-2)'
                                },
                                children: [
                                    'light',
                                    'dark',
                                    'system'
                                ].map((theme)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handleThemeChange(theme),
                                        style: {
                                            padding: 'var(--spacing-2) var(--spacing-4)',
                                            background: theme === currentTheme ? 'var(--color-secondary-500)' : 'var(--color-neutral-0)',
                                            color: theme === currentTheme ? 'var(--color-neutral-0)' : 'var(--color-neutral-900)',
                                            border: '2px solid var(--color-secondary-300)',
                                            borderRadius: 'var(--radius-base)',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 'var(--font-weight-medium)',
                                            cursor: 'pointer',
                                            transition: 'all var(--duration-fast) var(--ease-out)'
                                        },
                                        children: theme
                                    }, theme, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 248,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 246,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 'var(--spacing-4)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginBottom: 'var(--spacing-2)',
                                    color: 'var(--color-neutral-700)'
                                },
                                children: [
                                    "Breakpoint: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: 'var(--color-secondary-600)'
                                        },
                                        children: breakpoint
                                    }, void 0, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 277,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 271,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--color-neutral-600)'
                                },
                                children: "Resize window to see breakpoint changes tracked automatically"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 279,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 270,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginBottom: 'var(--spacing-2)',
                                    color: 'var(--color-neutral-700)'
                                },
                                children: "Recent Notifications:"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 289,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--spacing-2)'
                                },
                                children: notifications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: 'var(--text-sm)',
                                        color: 'var(--color-neutral-500)',
                                        fontStyle: 'italic'
                                    },
                                    children: "No notifications yet. Change theme to trigger one."
                                }, void 0, false, {
                                    fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                    lineNumber: 299,
                                    columnNumber: 15
                                }, this) : notifications.map((notif, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            padding: 'var(--spacing-2) var(--spacing-3)',
                                            background: 'var(--color-neutral-0)',
                                            borderRadius: 'var(--radius-base)',
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--color-neutral-700)',
                                            border: '1px solid var(--color-secondary-200)'
                                        },
                                        children: notif
                                    }, i, false, {
                                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                        lineNumber: 308,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 297,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 288,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                lineNumber: 220,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    padding: 'var(--spacing-6)',
                    background: 'var(--color-accent-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-accent-200)'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-4)',
                            color: 'var(--color-accent-900)'
                        },
                        children: "📊 Event Bus Status"
                    }, void 0, false, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 334,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 'var(--spacing-4)',
                            background: 'var(--color-neutral-0)',
                            borderRadius: 'var(--radius-base)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-neutral-700)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "✅ Widget lifecycle tracked: ui.widget.mounted"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 350,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "✅ Theme changes: ui.theme.changed"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 351,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "✅ Layout resize: ui.layout.resized (auto)"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 352,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "✅ Notifications: ui.notification.shown"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 353,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    marginTop: 'var(--spacing-2)',
                                    color: 'var(--color-accent-700)'
                                },
                                children: "Open console to see event logs"
                            }, void 0, false, {
                                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                                lineNumber: 354,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                        lineNumber: 342,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
                lineNumber: 328,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dawg-ai/components/examples/UIInfrastructureDemo.tsx",
        lineNumber: 80,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__39f4f11b._.js.map