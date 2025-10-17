# Recording Events Schema (v1)

## recording.started

**Published when:** User begins recording a vocal track

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "recording_id": "rec_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "track_id": "trk_001",
  "track_name": "Lead Vocal",
  "session_type": "practice" | "recording" | "warmup",
  "target_note": "C4",
  "exercise_type": "scale" | "interval" | "song" | null,
  "metronome_bpm": 120,
  "backing_track_url": "s3://bucket/backing-tracks/country-beat-120.wav",
  "input_device_id": "default",
  "started_at": "2025-10-03T03:50:00.000Z"
}
```

---

## recording.stopped

**Published when:** User stops recording

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "recording_id": "rec_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "track_id": "trk_001",
  "duration_sec": 45.3,
  "audio_url": "s3://bucket/recordings/rec_01JBNCX8QF0A1Z2Y3X4W5V6U7T.wav",
  "audio_format": "wav",
  "sample_rate": 48000,
  "bit_depth": 16,
  "file_size_bytes": 4320000,
  "pitch_analysis": {
    "avg_pitch_hz": 261.6,
    "detected_notes": ["C4", "D4", "E4"],
    "in_tune_percentage": 78.5,
    "pitch_stability_score": 82.1
  },
  "stopped_at": "2025-10-03T03:50:45.300Z"
}
```

---

## takes.uploaded

**Published when:** User uploads multiple takes for comping

**Producer:** `web-ui` (Instance 1)

**Payload Schema:**
```json
{
  "comp_session_id": "comp_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "track_id": "trk_001",
  "takes": [
    {
      "take_id": "take_001",
      "recording_id": "rec_abc",
      "audio_url": "s3://bucket/takes/take_001.wav",
      "duration_sec": 45.3,
      "pitch_accuracy": 78.5,
      "user_rating": 4
    },
    {
      "take_id": "take_002",
      "recording_id": "rec_def",
      "audio_url": "s3://bucket/takes/take_002.wav",
      "duration_sec": 44.8,
      "pitch_accuracy": 82.1,
      "user_rating": 5
    }
  ],
  "song_structure": {
    "sections": [
      {
        "type": "verse",
        "start_sec": 0,
        "end_sec": 20
      },
      {
        "type": "chorus",
        "start_sec": 20,
        "end_sec": 40
      }
    ]
  }
}
```

---

## take.selected

**Published when:** User selects final take or comped result

**Producer:** `web-ui` (Instance 1) or `comp-genie` (Instance 2)

**Payload Schema:**
```json
{
  "selection_id": "sel_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "track_id": "trk_001",
  "selected_take_id": "take_002",
  "selection_type": "user_manual" | "ai_comped" | "ai_suggested",
  "audio_url": "s3://bucket/final-takes/sel_01JBNCX8QF0A1Z2Y3X4W5V6U7T.wav",
  "comp_regions": [
    {
      "source_take_id": "take_001",
      "start_sec": 0,
      "end_sec": 20
    },
    {
      "source_take_id": "take_002",
      "start_sec": 20,
      "end_sec": 40
    }
  ]
}
```

---

## Consumers

- **coach-ai** (Instance 2): Listens to `recording.started` + `recording.stopped` for real-time feedback
- **comp-genie** (Instance 2): Listens to `takes.uploaded` for comping analysis
- **audio-engine** (Instance 2): Processes audio files
- **data-manager** (Instance 4): Persists recording metadata, generates session summaries
