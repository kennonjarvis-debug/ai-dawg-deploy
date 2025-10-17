# Journey Events Schema (v1)

## journey.started

**Published when:** User begins a new adaptive journey

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "journey_id": "jrn_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_type": "record_song" | "expand_range" | "improve_control" | "build_confidence",
  "estimated_weeks": 4,
  "difficulty": "easy" | "medium" | "hard",
  "vocal_profile": {
    "lowest_note": "A2",
    "highest_note": "D5",
    "range_semitones": 29,
    "skill_level": "beginner" | "intermediate" | "advanced",
    "pitch_accuracy": 75.5,
    "strengths": ["Pitch accuracy", "Vocal range"],
    "areas_to_improve": ["Note control", "Breath control"]
  },
  "style_preferences": {
    "favorite_genres": ["country", "pop-country"],
    "favorite_artists": ["morgan-wallen", "luke-combs"],
    "preferred_tempo": ["mid-tempo", "upbeat"],
    "emotional_themes": ["heartbreak", "nostalgia"]
  },
  "focus_areas": ["breath-control", "pitch-accuracy", "vocal-range"],
  "total_stages": 7,
  "milestones": [
    {
      "id": "m1",
      "title": "Song Selection",
      "week_number": 1
    }
  ]
}
```

---

## journey.stage.completed

**Published when:** User completes a journey stage

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "journey_id": "jrn_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "stage_id": "stage_1",
  "stage_number": 1,
  "stage_name": "Vocal Assessment",
  "completion_time_sec": 420,
  "performance_data": {
    "pitch_accuracy": 78.2,
    "exercises_completed": 3,
    "takes_recorded": 5
  }
}
```

---

## journey.paused

**Published when:** User pauses an active journey

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "journey_id": "jrn_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "paused_at_stage": 3,
  "reason": "user_initiated" | "inactivity_timeout"
}
```

---

## journey.resumed

**Published when:** User resumes a paused journey

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "journey_id": "jrn_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "resuming_at_stage": 3,
  "paused_duration_hours": 48.5
}
```

---

## journey.completed

**Published when:** User finishes entire journey

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "journey_id": "jrn_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_type": "record_song",
  "total_duration_hours": 28.3,
  "stages_completed": 7,
  "final_artifact": {
    "type": "song_recording",
    "title": "My First Song",
    "audio_url": "s3://bucket/usr_abc123/jrn_01JBNCX8QF0A1Z2Y3X4W5V6U7T/final.wav",
    "duration_sec": 210.5
  },
  "improvement_metrics": {
    "pitch_accuracy_improvement": 15.2,
    "range_expansion_semitones": 3,
    "confidence_score_delta": 22.5
  }
}
```

---

## Consumers

- **ai-conductor** (Instance 3): Monitors completion rates, triggers follow-up journeys
- **data-manager** (Instance 4): Persists journey state, generates progress reports
- **profile-manager**: Updates user vocal profile based on journey outcomes
