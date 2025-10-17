# AI Feedback Events Schema (v1)

## coach.feedback

**Published when:** Coach AI provides real-time vocal feedback

**Producer:** `coach-ai` (Instance 2)

**Payload Schema:**
```json
{
  "feedback_id": "fb_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "recording_id": "rec_abc123",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "timestamp_sec": 12.5,
  "feedback_type": "technique" | "pitch" | "rhythm" | "encouragement",
  "severity": "info" | "warning" | "critical",
  "message": "Great pitch control on that note! Try to keep your breath support steady.",
  "detected_issue": {
    "type": "pitch_drift",
    "detected_note": "C4",
    "target_note": "C#4",
    "deviation_cents": 15,
    "recommendation": "Focus on engaging your diaphragm for better pitch stability."
  },
  "visual_indicator": {
    "type": "waveform_highlight",
    "start_sec": 12.0,
    "end_sec": 13.5,
    "color": "#ff4444"
  }
}
```

---

## comping.suggestion

**Published when:** CompGenie AI suggests comping decisions

**Producer:** `comp-genie` (Instance 2)

**Payload Schema:**
```json
{
  "suggestion_id": "sug_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "comp_session_id": "comp_xyz789",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "track_id": "trk_001",
  "analysis_method": "pitch_accuracy" | "energy_level" | "emotional_delivery" | "hybrid",
  "suggested_comp": [
    {
      "region_id": "reg_001",
      "section_name": "Verse 1",
      "source_take_id": "take_002",
      "start_sec": 0,
      "end_sec": 20,
      "reason": "Best pitch accuracy (94.2%) and consistent tone",
      "confidence_score": 0.92
    },
    {
      "region_id": "reg_002",
      "section_name": "Chorus",
      "source_take_id": "take_001",
      "start_sec": 20,
      "end_sec": 40,
      "reason": "Strong emotional delivery and energy",
      "confidence_score": 0.88
    }
  ],
  "comparison_metrics": {
    "take_001": {
      "pitch_accuracy": 78.5,
      "energy_score": 92.1,
      "emotional_delivery": 88.3
    },
    "take_002": {
      "pitch_accuracy": 94.2,
      "energy_score": 75.4,
      "emotional_delivery": 80.1
    }
  }
}
```

---

## mix.suggestion

**Published when:** AutoMix AI suggests effect settings

**Producer:** `automix-ai` (Instance 3)

**Payload Schema:**
```json
{
  "suggestion_id": "mix_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "track_id": "trk_001",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "analysis_summary": {
    "detected_genre": "country",
    "vocal_brightness": "moderate",
    "frequency_issues": ["low_end_mud", "harsh_sibilance"],
    "dynamic_range_db": 18.5
  },
  "suggested_effects": [
    {
      "effect_type": "eq",
      "effect_id": "eq_001",
      "preset_name": "Vocal Polish - Country",
      "parameters": {
        "low_shelf_hz": 80,
        "low_shelf_gain_db": -3,
        "mid_peak_hz": 3000,
        "mid_peak_gain_db": 2.5,
        "mid_peak_q": 1.2,
        "high_shelf_hz": 8000,
        "high_shelf_gain_db": 1.5
      },
      "reason": "Reduce low-end mud and add presence for clarity",
      "confidence_score": 0.91
    },
    {
      "effect_type": "compressor",
      "effect_id": "comp_001",
      "parameters": {
        "threshold_db": -18,
        "ratio": 3.5,
        "attack_ms": 5,
        "release_ms": 50,
        "knee_db": 2,
        "makeup_gain_db": 4
      },
      "reason": "Control dynamic range for radio-ready consistency",
      "confidence_score": 0.87
    },
    {
      "effect_type": "reverb",
      "effect_id": "rev_001",
      "parameters": {
        "type": "plate",
        "decay_time_sec": 1.8,
        "pre_delay_ms": 20,
        "wet_level_db": -12,
        "high_cut_hz": 8000
      },
      "reason": "Add space and depth without muddying vocals",
      "confidence_score": 0.85
    }
  ],
  "reference_track": {
    "artist": "Morgan Wallen",
    "song": "Wasted On You",
    "similarity_score": 0.78
  }
}
```

---

## master.completed

**Published when:** MasterMe AI finishes mastering

**Producer:** `masterme-ai` (Instance 3)

**Payload Schema:**
```json
{
  "master_id": "mst_01JBNCX8QF0A1Z2Y3X4W5V6U7T",
  "user_id": "usr_abc123",
  "journey_id": "jrn_xyz789",
  "input_audio_url": "s3://bucket/mix/final_mix.wav",
  "output_audio_url": "s3://bucket/mastered/mst_01JBNCX8QF0A1Z2Y3X4W5V6U7T.wav",
  "target_loudness_lufs": -14,
  "achieved_loudness_lufs": -14.2,
  "target_genre": "country",
  "processing_steps": [
    {
      "step": "eq",
      "description": "Gentle high-shelf boost at 10kHz (+0.8dB)",
      "reason": "Add air and sparkle"
    },
    {
      "step": "multiband_compression",
      "description": "4-band compression for balance",
      "reason": "Control frequency-specific dynamics"
    },
    {
      "step": "limiter",
      "description": "True peak limiting at -1.0dBTP",
      "reason": "Prevent digital clipping"
    }
  ],
  "metrics": {
    "input_lufs": -18.5,
    "output_lufs": -14.2,
    "dynamic_range_lu": 8.3,
    "true_peak_dbtp": -0.8,
    "processing_time_sec": 12.7
  },
  "quality_report": {
    "overall_score": 92,
    "frequency_balance": "excellent",
    "dynamic_range": "good",
    "loudness_consistency": "excellent"
  }
}
```

---

## Consumers

- **web-ui** (Instance 1): Displays feedback to user in real-time
- **ai-conductor** (Instance 3): Monitors feedback quality, triggers adjustments
- **data-manager** (Instance 4): Logs feedback for analytics, generates insights
