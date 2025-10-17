#!/bin/bash

# Test AI Function Calling for DAWG AI
# Tests various tool calling scenarios

API_URL="http://localhost:3000/api/chat"

echo "🧪 Testing AI Function Calling"
echo "================================"
echo ""

# Test 1: Set BPM
echo "Test 1: Set BPM to 140"
echo "------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Set the BPM to 140"}
    ],
    "stream": false,
    "enableTools": true,
    "projectContext": {
      "trackCount": 2,
      "currentTrack": "Vocals 1",
      "tracks": [
        {"id": "track-1", "name": "Vocals 1", "type": "audio", "recordArm": true, "solo": false, "mute": false},
        {"id": "track-2", "name": "Harmony", "type": "audio", "recordArm": false, "solo": false, "mute": false}
      ]
    }
  }' | jq '.'

echo ""
echo ""

# Test 2: Start recording
echo "Test 2: Start recording on active track"
echo "----------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Start recording"}
    ],
    "stream": false,
    "enableTools": true,
    "projectContext": {
      "trackCount": 1,
      "currentTrack": "Vocals 1",
      "tracks": [
        {"id": "track-1", "name": "Vocals 1", "type": "audio", "recordArm": true, "solo": false, "mute": false}
      ]
    }
  }' | jq '.'

echo ""
echo ""

# Test 3: Adjust volume
echo "Test 3: Set volume to 80 on track"
echo "----------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Set the volume to 80 on Vocals 1"}
    ],
    "stream": false,
    "enableTools": true,
    "projectContext": {
      "trackCount": 1,
      "currentTrack": "Vocals 1",
      "tracks": [
        {"id": "track-1", "name": "Vocals 1", "type": "audio", "recordArm": false, "solo": false, "mute": false}
      ]
    }
  }' | jq '.'

echo ""
echo ""

# Test 4: Create new track
echo "Test 4: Create a new track called Lead Vocals"
echo "----------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Create a new track called Lead Vocals"}
    ],
    "stream": false,
    "enableTools": true,
    "projectContext": {
      "trackCount": 1
    }
  }' | jq '.'

echo ""
echo ""

# Test 5: Multiple actions
echo "Test 5: Multiple actions - Set BPM, mute track, adjust pan"
echo "-----------------------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Set BPM to 100, mute Harmony, and pan Vocals 1 to the left"}
    ],
    "stream": false,
    "enableTools": true,
    "projectContext": {
      "trackCount": 2,
      "currentTrack": "Vocals 1",
      "tracks": [
        {"id": "track-1", "name": "Vocals 1", "type": "audio", "recordArm": false, "solo": false, "mute": false},
        {"id": "track-2", "name": "Harmony", "type": "audio", "recordArm": false, "solo": false, "mute": false}
      ]
    }
  }' | jq '.'

echo ""
echo ""
echo "✅ Function calling tests complete!"
