#!/bin/bash

# Test script for Generation API
# Make sure the backend server is running: npm run dev:server

BASE_URL="http://localhost:3001/api/generate"
USER_ID="test-user-123"

echo "======================================"
echo "Generation API Test Suite"
echo "======================================"
echo ""

# Test 1: Get supported genres
echo "Test 1: Getting supported genres..."
curl -s "$BASE_URL/genres" | jq '.genres | length'
echo ""

# Test 2: Generate a trap beat
echo "Test 2: Generating trap beat at 140 BPM..."
RESPONSE=$(curl -s -X POST "$BASE_URL/beat" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "genre": "trap",
    "bpm": 140,
    "key": "Cm",
    "mood": "dark",
    "duration": 30
  }')

echo "$RESPONSE" | jq '.'
JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId')
echo ""

# Test 3: Check job status
echo "Test 3: Checking job status (ID: $JOB_ID)..."
sleep 1
curl -s "$BASE_URL/status/$JOB_ID" | jq '{state: .status.state, progress: .status.progress}'
echo ""

# Test 4: Wait for completion
echo "Test 4: Waiting for job to complete..."
for i in {1..10}; do
  sleep 1
  STATE=$(curl -s "$BASE_URL/status/$JOB_ID" | jq -r '.status.state')
  PROGRESS=$(curl -s "$BASE_URL/status/$JOB_ID" | jq -r '.status.progress')
  echo "  Attempt $i: State=$STATE, Progress=$PROGRESS%"

  if [ "$STATE" = "completed" ]; then
    echo "  ✓ Job completed!"
    break
  fi
done
echo ""

# Test 5: Get job result
if [ "$STATE" = "completed" ]; then
  echo "Test 5: Getting job result..."
  curl -s "$BASE_URL/result/$JOB_ID" | jq '{audioUrl: .result.result.audioUrl, bpm: .result.result.bpm, genre: .result.result.genre}'
  echo ""
fi

# Test 6: Get queue stats
echo "Test 6: Getting queue statistics..."
curl -s "$BASE_URL/queue/stats" | jq '.stats'
echo ""

echo "======================================"
echo "All tests completed!"
echo "======================================"
