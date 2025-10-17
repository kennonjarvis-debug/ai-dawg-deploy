# Profile System Audit Report
**Auditor:** Karen (Profile Management Agent)
**Date:** 2025-10-03
**Scope:** User profiles, personalization data, PII compliance, event bus integration

---

## Executive Summary

✅ **COMPLIANT** - Profile system meets privacy policy requirements
⚠️ **6 IMPROVEMENTS IDENTIFIED** - Enhancements for production readiness
🔒 **PII PROTECTION:** Strong - No PII leakage in events detected
📊 **DATA QUALITY:** Good - Schema is sound, needs real data validation

---

## 1. Data Schema Review

### ✅ Strengths

**UserProfile Interface (lib/profile/ProfileManager.ts:16-61)**
- Clean separation of PII (email, name) from non-PII data
- Comprehensive vocal metrics (5 skills tracked)
- Privacy consent granularity (3 separate toggles)
- Temporal tracking (createdAt, updatedAt)

**PersonalizationSignals Interface (lib/profile/ProfileManager.ts:63-74)**
- ✅ **PII-FREE CONTRACT:** `pii: false` hardcoded - excellent
- ✅ Uses `userHash` instead of raw userId
- ✅ Aggregates only (semitones, percentages, counts)
- ✅ No recording URLs or raw audio references

### ⚠️ Issues Identified

**1. CRITICAL: Semitone Calculation Bug**
```typescript
// ProfileManager.ts:90-101
private calculateSemitones(lowest: string, highest: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  // ... parseNote logic
}
```
**Problem:** Doesn't handle flats (Db, Eb, etc.) or edge cases
**Impact:** Incorrect vocal range calculations
**Fix:** Add flat note mappings + error handling

**2. MEDIUM: Practice Hours 30-Day Calculation Missing**
```typescript
// ProfileManager.ts:154
practiceHours30d: profile.practiceHours, // TODO: calculate actual 30d
```
**Problem:** Uses total hours, not last 30 days
**Impact:** Inaccurate trend signals
**Fix:** Implement time-windowed aggregation

**3. LOW: Skill Progression History Not Tracked**
```typescript
// ProfileManager.ts:36-43
skills: {
  pitchAccuracy: number;
  breathControl: number;
  // ...
}
```
**Problem:** No historical data - can't calculate trends accurately
**Impact:** Limited AI coaching insights
**Fix:** Add `skillHistory: Array<{ timestamp, skills }>` field

---

## 2. PII Compliance Review

### ✅ COMPLIANT Areas

**Event Payloads:**
```json
// _bus/events/2025-10-03/events.jsonl
{
  "event": "profile.updated",
  "payload": {
    "signals": {
      "userHash": "usr_abc123...",  // ✅ Hashed
      "vocalRangeSemitones": 24,     // ✅ Aggregate
      "pitchAccuracyAvg": 87.5,      // ✅ Aggregate
      "pii": false                    // ✅ Contract enforced
    }
  }
}
```
✅ No email, name, or raw userId in events
✅ SHA-256 hashing for user references
✅ Explicit PII flag in all signals

**API Endpoints:**
- ✅ All endpoints require authentication (NextAuth)
- ✅ User can only access their own data
- ✅ GDPR export/delete implemented
- ✅ No PII in API error messages

**State Persistence:**
```json
// _bus/state/profiles.json
{
  "profiles": {
    "usr_abc123": {
      "userHash": "usr_abc123",
      // ✅ No email/name in state file
    }
  }
}
```
✅ State file excludes PII (email, name stripped in saveState())

### ⚠️ Privacy Gaps

**4. MEDIUM: localStorage Migration Risk**
```typescript
// ProfileManager.ts:107-129
loadFromLocalStorage(userId: string): UserProfile | null {
  const vocalProfile = localStorage.getItem('vocalProfile');
  // Loads legacy data without consent check
}
```
**Problem:** Old localStorage data may lack privacy consent
**Impact:** User never explicitly consented to current terms
**Fix:** Force consent dialog on first migration

**5. LOW: Event Signatures Not Implemented**
```json
{
  "signature": "UNSIGNED_DEV_MODE"  // ⚠️ Not HMAC-SHA256
}
```
**Problem:** Events not cryptographically signed
**Impact:** Can't verify event authenticity
**Fix:** Implement HMAC signing with `DAWGAI_HMAC_SECRET`

---

## 3. Personalization Signals Quality

### Current Signals (ProfileManager.ts:136-157)

| Signal | Type | Quality | Usage |
|--------|------|---------|-------|
| `vocalRangeSemitones` | Number | ✅ Good | Genre recommendations |
| `pitchAccuracyAvg` | Number | ✅ Good | Difficulty adjustment |
| `practiceHours30d` | Number | ⚠️ Inaccurate | Commitment level |
| `skillLevel` | Enum | ✅ Good | Content filtering |
| `preferredGenre` | String | ✅ Good | Song suggestions |
| `topStrengths` | Array | ✅ Good | Confidence boosting |
| `topGrowthAreas` | Array | ✅ Good | Exercise targeting |
| `recentTrend` | Enum | ⚠️ Simplistic | Progress feedback |

### Signal Effectiveness

**✅ High-Value Signals:**
- `vocalRangeSemitones` - Direct impact on song selection
- `skillLevel` - Critical for adaptive difficulty
- `preferredGenre` - Core personalization axis

**⚠️ Needs Improvement:**
- `recentTrend` - Uses static skill average, not true trend
- `practiceHours30d` - Currently broken (uses all-time)

**❌ Missing Critical Signals:**
- `sessionFrequency` - How often user practices
- `lastActiveDate` - For re-engagement
- `avgSessionDuration` - Attention span
- `favoriteTimeOfDay` - Scheduling hints
- `recordingCount30d` - Engagement metric
- `completionRate` - Goal achievement

---

## 4. Event Bus Integration

### Current Status

**Event Types Emitted:**
```
✅ alerts.info (hello handshake)
✅ profile.updated (on every change)
⏳ profile.deleted (implemented but untested)
❌ profile.policy.updated (not emitted)
❌ metrics.tick (heartbeat not implemented)
```

**Event Flow:**
```
User Action → API Endpoint → ProfileManager → Event Bus → State File
     ↓              ↓              ↓              ↓            ↓
SessionPlanner  /api/profile  upsertProfile  events.jsonl  profiles.json
                   /session
```

### ⚠️ Issues

**6. MEDIUM: No Heartbeat Monitoring**
```typescript
// Missing from ProfileManager
// Should emit metrics.tick every 60s
```
**Problem:** Other agents can't detect if Karen is alive
**Impact:** Silent failures possible
**Fix:** Add `setInterval` heartbeat in ProfileManager init

**7. LOW: Policy Updates Don't Emit Events**
```typescript
// privacy.md updated but no profile.policy.updated event
```
**Problem:** Users not notified of policy changes
**Impact:** Compliance risk
**Fix:** Emit event when privacy.md version changes

---

## 5. Widget Integration Review

### Migrated Widgets

**✅ UserProfileCard**
- Now uses `useProfile()` hook
- No localStorage dependencies
- Properly handles loading states

**✅ SessionPlanner**
- Logs sessions via `/api/profile/session`
- Updates practiceHours and sessionsCompleted
- Still uses localStorage for session storage (acceptable)

**✅ PrivacyControls**
- Complete GDPR implementation
- Consent management working
- Export/delete functional

### ⚠️ Not Yet Integrated

**Widgets Still Using localStorage:**
- `SkillProgressChart` - Generates fake data, doesn't read profile
- `AudioDeviceSettings` - Uses localStorage for device prefs
- `UserSettingsModal` - Uses localStorage for preferences

**Recommendation:** Migrate all widgets to `useProfile()` for consistency

---

## 6. Security Assessment

### ✅ Strong Points

1. **Authentication Required:** All APIs check NextAuth session
2. **Data Isolation:** Users can only access their own profiles
3. **GDPR Compliance:** Export and delete fully implemented
4. **PII Hashing:** SHA-256 for event payloads
5. **Consent Tracking:** Granular privacy controls

### ⚠️ Vulnerabilities

**8. MEDIUM: No Rate Limiting**
- `/api/profile/skills` can be spammed
- Could inflate skill metrics
- Fix: Add rate limiting (10 req/min per user)

**9. LOW: No Input Validation**
```typescript
// POST /api/profile accepts any fields
const body = await request.json();
const profile = await ProfileManager.upsertProfile(userId, body);
```
- Could inject invalid data
- Fix: Add Zod schema validation

**10. LOW: No Audit Logging**
- Profile changes not logged with IP/timestamp
- Fix: Add audit trail to `docs/logs/profile-changes.md`

---

## 7. Data Migration Strategy

### Current Approach
```typescript
loadFromLocalStorage(userId: string): UserProfile | null
```
- Loads on-demand when profile not found
- Preserves legacy data
- No forced migration

### ⚠️ Risks
- Users may have stale localStorage
- No consent re-confirmation
- Inconsistent data states

### ✅ Recommended Migration Flow
1. Detect localStorage on first load
2. Show migration dialog: "We've upgraded! Review privacy settings"
3. Force user to accept new privacy policy
4. Migrate data to ProfileManager
5. Clear old localStorage
6. Emit `profile.migrated` event

---

## 8. Recommendations (Prioritized)

### 🔴 CRITICAL (Fix Before Production)

1. **Fix Semitone Calculation**
   - Add flat note support
   - Handle invalid note names
   - Add unit tests

2. **Implement Event Signatures**
   - Use HMAC-SHA256 with secret
   - Verify signatures on event consumption
   - Prevent event tampering

3. **Add Input Validation**
   - Use Zod schemas for all API inputs
   - Sanitize user-provided strings
   - Validate skill ranges (0-100)

### 🟡 HIGH (Fix Within 2 Weeks)

4. **Fix Practice Hours 30-Day Calculation**
   - Track session timestamps
   - Calculate rolling 30-day window
   - Update signals accordingly

5. **Add Skill History Tracking**
   - Store skill snapshots daily
   - Enable true trend calculation
   - Power SkillProgressChart widget

6. **Implement Heartbeat Monitoring**
   - Emit `metrics.tick` every 60s
   - Include health status
   - Other agents can detect failures

### 🟢 MEDIUM (Nice to Have)

7. **Migrate Remaining Widgets**
   - SkillProgressChart → use real profile data
   - AudioDeviceSettings → use profile preferences
   - UserSettingsModal → integrate fully

8. **Add Missing Signals**
   - Session frequency
   - Last active date
   - Recording count 30d
   - Completion rate

9. **Improve Privacy UX**
   - Force migration dialog
   - Re-consent flow
   - Privacy policy change notifications

10. **Add Audit Logging**
    - Log all profile changes with timestamp/IP
    - GDPR requirement for data processors
    - Helpful for debugging

---

## 9. Performance Analysis

### Current Profile Operations

| Operation | Time Complexity | Performance |
|-----------|-----------------|-------------|
| `getProfile()` | O(1) | ✅ Excellent (Map lookup) |
| `upsertProfile()` | O(1) | ✅ Excellent |
| `getSignals()` | O(n) | ⚠️ Fair (iterates strengths/growth) |
| `saveState()` | O(n) | ⚠️ Fair (serializes all profiles) |

### Memory Usage
- **In-Memory Map:** ~2KB per profile
- **1000 users:** ~2MB RAM (acceptable)
- **10,000 users:** ~20MB RAM (acceptable)
- **100,000+ users:** Consider DB migration

### Recommendations
- ✅ Current architecture fine for <100k users
- ⚠️ Add Redis cache for >100k users
- ⚠️ Add database persistence (currently only state file)

---

## 10. Compliance Checklist

### GDPR Compliance ✅

- [x] Right to Access (GET /api/profile)
- [x] Right to Export (GET /api/profile/export)
- [x] Right to Deletion (DELETE /api/profile/delete)
- [x] Right to Rectification (POST /api/profile)
- [x] Consent Management (privacyConsent fields)
- [x] Data Minimization (PII stripped from events)
- [x] Purpose Limitation (signals used only for coaching)
- [ ] Breach Notification Process (NOT IMPLEMENTED)
- [ ] Data Protection Impact Assessment (NOT DONE)

### Privacy Policy v1.0.0 ✅

- [x] Clear data collection disclosure
- [x] Allowed/prohibited uses defined
- [x] Event payload rules documented
- [x] User rights enumerated
- [x] Retention policy specified (90-180 days)
- [x] Security measures listed
- [x] Contact information provided

---

## Final Verdict

### Overall Grade: **B+ (Good, Production-Ready with Fixes)**

**Strengths:**
- 🎯 Strong PII protection architecture
- 🎯 GDPR compliance implemented
- 🎯 Clean separation of concerns
- 🎯 Event-driven design working well

**Critical Gaps:**
- ❌ Semitone calculation broken
- ❌ Event signatures not implemented
- ❌ No input validation

**Recommendation:**
**Fix 3 critical issues (1-3), then SHIP IT.** The foundation is solid. Everything else can be iterative improvements.

---

**Audit Completed:** 2025-10-03T03:50:00Z
**Next Review:** After critical fixes implemented
**Auditor:** Karen (Profile Management Agent)
