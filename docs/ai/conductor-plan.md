# AI Conductor Plan - DAWG AI

**Version:** v1.0.0
**Last Updated:** 2025-10-03 03:47
**Status:** Initial Bootstrap

## Mission

Orchestrate the adaptive song creation journey system by defining protocols, event schemas, and integration contracts between all AI subsystems (Coach, CompGenie, AutoMix, MasterMe).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Conductor (Orchestrator)                 │
│  - Journey State Machine                                        │
│  - Protocol Definitions (OpenAPI + gRPC)                        │
│  - Event Schema Registry                                        │
│  - E2E Test Scenarios                                           │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴─────────┬──────────────┬──────────────┬────────────┐
    ▼                  ▼              ▼              ▼            ▼
┌─────────┐      ┌──────────┐   ┌─────────┐   ┌──────────┐  ┌─────────┐
│  Coach  │      │ CompGenie│   │ AutoMix │   │ MasterMe │  │ Profile │
│ (Vocal) │      │ (Takes)  │   │ (Mix)   │   │ (Master) │  │ Manager │
└─────────┘      └──────────┘   └─────────┘   └──────────┘  └─────────┘
     │                │              │              │             │
     └────────────────┴──────────────┴──────────────┴─────────────┘
                              │
                         Event Bus
                   (NATS / Redis / GitOps)
```

## Core Subsystems

### 1. Coach (Vocal Coaching AI)
- **Purpose:** Real-time vocal feedback during recording/practice
- **Inputs:** Pitch data, recording metadata, user vocal profile
- **Outputs:** Coaching suggestions, technique corrections, encouragement
- **Integration:** Consumes `recording.started`, produces `coach.feedback`

### 2. CompGenie (Comping AI)
- **Purpose:** Analyze multiple takes and suggest best sections
- **Inputs:** Multiple recording takes, vocal profile, song structure
- **Outputs:** Comping decisions, take comparison metadata
- **Integration:** Consumes `takes.uploaded`, produces `comping.suggestion`

### 3. AutoMix (Mixing AI)
- **Purpose:** Suggest EQ, compression, reverb, delay settings
- **Inputs:** Track audio, vocal profile, genre preferences, reference tracks
- **Outputs:** Effect chain suggestions with explanations
- **Integration:** Consumes `mix.requested`, produces `mix.suggestion`

### 4. MasterMe (Mastering AI)
- **Purpose:** Final mastering with loudness normalization and polish
- **Inputs:** Stereo mix, target loudness (LUFS), genre reference
- **Outputs:** Mastered audio file, mastering settings report
- **Integration:** Consumes `master.requested`, produces `master.completed`

### 5. Profile Manager
- **Purpose:** Manage user vocal profiles and learning progress
- **Inputs:** Assessment data, practice session results, journey completions
- **Outputs:** Updated profile, skill progression data
- **Integration:** Consumes `assessment.completed`, produces `profile.updated`

## Event Schemas (v1)

See `/docs/events/` for detailed schemas.

### Journey Events
- `journey.started` - User begins a new journey
- `journey.stage.completed` - User completes a stage
- `journey.paused` - User pauses journey
- `journey.resumed` - User resumes journey
- `journey.completed` - User finishes entire journey

### Recording Events
- `recording.started` - Recording session begins
- `recording.stopped` - Recording session ends
- `takes.uploaded` - Multiple takes ready for analysis
- `take.selected` - User selects best take (or comp result)

### AI Feedback Events
- `coach.feedback` - Real-time vocal coaching suggestion
- `comping.suggestion` - CompGenie comping recommendation
- `mix.suggestion` - AutoMix effect chain suggestion
- `master.completed` - MasterMe mastering result

### Profile Events
- `assessment.completed` - Vocal assessment finished
- `profile.updated` - User profile changed
- `profile.policy.updated` - Privacy policy changed

## API Contracts

### Journey API (HTTP/REST)
- `POST /api/journey/start` - Start new journey
- `GET /api/journey/:id` - Get journey status
- `POST /api/journey/:id/resume` - Resume paused journey
- `GET /api/journey/:id/stages` - Get all stages for journey

### Coach API (gRPC - Internal)
- `AnalyzeVocalPerformance(stream AudioChunk) -> stream CoachFeedback`
- `GetTechniqueCorrection(pitchData, profileId) -> TechniqueAdvice`

### Comping API (gRPC - Internal)
- `CompareTakes(takeIds[]) -> CompingDecision`
- `AutoComp(takeIds[], songStructure) -> CompedTrack`

### AutoMix API (HTTP/REST)
- `POST /api/mix/suggest` - Get mixing suggestions
- `POST /api/mix/apply` - Apply suggested mix settings

### MasterMe API (HTTP/REST)
- `POST /api/master/request` - Request mastering
- `GET /api/master/:id/status` - Check mastering job status
- `GET /api/master/:id/download` - Download mastered file

## Integration Protocols

### 1. Event-Driven (Async)
**Preferred for:** Background processing, notifications, analytics
- Use event bus (NATS/Redis/GitOps)
- Eventual consistency model
- Retry policies: exponential backoff, 3 attempts max
- Dead letter queue for failed events

### 2. Request-Response (Sync)
**Preferred for:** User-initiated actions, real-time feedback
- HTTP REST for external APIs
- gRPC for high-throughput internal services
- Timeout: 30s for HTTP, 10s for gRPC
- Circuit breaker pattern for resilience

## E2E Test Scenarios

### Scenario 1: Complete Beginner Journey
1. User completes VocalAssessment → `assessment.completed`
2. System generates journey → `journey.started`
3. User practices exercise → `recording.started` → `coach.feedback`
4. User records song takes → `takes.uploaded` → `comping.suggestion`
5. User applies mix → `mix.suggestion` → `mix.applied`
6. User masters track → `master.requested` → `master.completed`
7. Journey completed → `journey.completed` → `profile.updated`

### Scenario 2: AI-Assisted Song Creation
1. User selects "Record a Full Song" goal
2. Journey stage 1: VocalAssessment → profile created
3. Journey stage 2: StylePreferencesQuiz → preferences saved
4. Journey stage 3: LyricWorkspace + AI suggestions
5. Journey stage 4: SongStructureBuilder + arrangement
6. Journey stage 5: Multi-take recording + comping
7. Journey stage 6: AutoMix application
8. Journey stage 7: MasterMe final polish
9. Journey complete → shareable song artifact

## Monitoring & Metrics

### Key Metrics (Published via `metrics.tick`)
- `journey.completion_rate` - % of started journeys completed
- `coach.feedback_latency_ms` - Real-time feedback delay
- `comping.accuracy_score` - User acceptance of comping suggestions
- `mix.suggestion_acceptance_rate` - % of mix suggestions applied
- `master.job_duration_sec` - Mastering processing time
- `profile.assessment_completion_rate` - % of assessments finished

### Alerts (Published via `alerts.error`)
- Event processing failures
- API timeout threshold breaches
- Contract schema validation errors
- Integration circuit breaker trips

## Version History

- **v1.0.0** (2025-10-03): Initial bootstrap, minimal contract set

## Next Steps

1. ✅ Define initial event schemas → `/docs/events/`
2. ✅ Create OpenAPI specs for HTTP APIs → `/specs/openapi/`
3. ✅ Create gRPC proto files → `/specs/proto/`
4. Write first E2E test → `/tests/e2e/journey-beginner.spec.ts`
5. Implement event bus adapter (NATS/Redis/GitOps)
6. Create contract versioning strategy
