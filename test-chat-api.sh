#!/bin/bash
# Test script for /api/chat endpoint

echo "================================"
echo "DAWG AI - Chat API Test Suite"
echo "================================"
echo ""

BASE_URL="http://localhost:3000/api/chat"

echo "Test 1: Invalid message format (should return 400)"
echo "---------------------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"messages":"invalid"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "Test 2: Valid non-streaming request (should return 401 without API key)"
echo "------------------------------------------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"stream":false}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "Test 3: Streaming request with project context (should return 200 with SSE)"
echo "----------------------------------------------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Give me vocal warmup exercises"}
    ],
    "stream": true,
    "projectContext": {
      "trackCount": 3,
      "currentTrack": "Vocals 1",
      "recordingDuration": 45
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n\n" | head -20

echo "Test 4: Empty messages array (should return 400)"
echo "-------------------------------------------------"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"messages":[]}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "================================"
echo "Test suite complete!"
echo "================================"
echo ""
echo "Note: Tests 2 and 3 will return authentication errors if ANTHROPIC_API_KEY"
echo "is not set to a valid API key in .env.local"
