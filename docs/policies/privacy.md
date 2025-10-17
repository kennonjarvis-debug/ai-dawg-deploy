# Privacy Policy - DAWG AI

**Version:** 1.0.0
**Last Updated:** 2025-10-03
**Owner:** Profile Management Agent

## Overview
DAWG AI is committed to protecting user privacy and ensuring transparent data handling practices.

## Data Collection

### What We Collect
1. **Vocal Metrics** (non-PII)
   - Pitch accuracy percentages
   - Breath control scores
   - Vibrato stability metrics
   - Range boundaries (note values only)
   - Skill progression trends

2. **Practice Session Data** (non-PII)
   - Session duration
   - Goals completed/incomplete
   - Practice frequency
   - Skill focus areas

3. **User Profile Data** (limited PII)
   - Name (optional)
   - Email (authentication only)
   - Avatar image (optional)
   - Preferred genre

4. **Audio Recordings** (PII - strictly controlled)
   - Stored with hashed IDs only
   - Never transmitted in event payloads
   - User-controlled deletion
   - S3 storage with encryption at rest

## Data Usage

### Allowed Uses
- Generate personalized coaching recommendations
- Track skill progression over time
- Provide aggregate performance statistics
- Improve AI model suggestions

### Prohibited Uses
- **Never** share raw audio recordings between agents
- **Never** log PII in plaintext event streams
- **Never** use voice data for purposes beyond vocal coaching
- **Never** sell or share user data with third parties

## Agent Communication Policy

### Event Payload Rules
1. **Use hashed IDs** for user references (e.g., `user_hash_abc123`)
2. **Aggregate metrics only** - no raw recordings in events
3. **Redact tokens** and credentials in all logs
4. **PII flags** - mark any event containing PII with `"pii": true`

### Example Compliant Event
```json
{
  "event": "profile.updated",
  "payload": {
    "user_hash": "usr_7f8a9b2c",
    "signals": {
      "vocal_range_semitones": 24,
      "pitch_accuracy_avg": 87.5,
      "practice_hours_30d": 12.5
    },
    "pii": false
  }
}
```

### Example Non-Compliant Event (DO NOT USE)
```json
{
  "event": "profile.updated",
  "payload": {
    "user_email": "user@example.com",  // ❌ PII in payload
    "recording_url": "s3://..."         // ❌ Direct recording reference
  }
}
```

## User Rights
1. **Right to Access** - Users can view all stored profile data
2. **Right to Deletion** - Users can delete all data via API
3. **Right to Export** - Users can download profile data as JSON
4. **Right to Opt-Out** - Users can disable AI features

## Data Retention
- **Profile Data:** Retained while account is active
- **Session History:** Last 90 days by default, configurable
- **Audio Recordings:** User-controlled, auto-delete after 180 days if unused
- **Aggregate Metrics:** Anonymized and retained for analytics

## Security Measures
1. HMAC-SHA256 signatures on all events
2. TLS encryption for API communication
3. S3 encryption at rest for audio files
4. JWT session tokens with 30-day expiration
5. No secrets in logs or event payloads

## Compliance
This policy aligns with:
- GDPR (user data rights)
- CCPA (California privacy)
- COPPA (no users under 13)

## Policy Updates
Changes to this policy require:
1. Version bump in `/docs/policies/privacy.md`
2. Event: `profile.policy.updated` broadcast
3. Notification to all active users
4. 30-day notice before enforcement

## Contact
For privacy concerns, contact: privacy@dawg-ai.com

---

**Enforcement:** Profile Management Agent monitors all events for policy violations and emits `alerts.error` if non-compliant data is detected.
