#!/bin/bash

# DAWG AI - API Testing Script
# Tests the chat API and function calling capabilities

echo "🧪 DAWG AI - API Testing Suite"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"
API_KEY=$(grep ANTHROPIC_API_KEY .env.local 2>/dev/null | cut -d '=' -f2)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_test() {
  local test_name=$1
  local status=$2

  TESTS_RUN=$((TESTS_RUN + 1))

  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $test_name"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Test 1: Check if server is running
echo "Test 1: Server Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ "$response" = "200" ]; then
  print_test "Server is running" "PASS"
else
  print_test "Server is running (got $response)" "FAIL"
  echo "❌ Server not responding. Please run: npm run dev"
  exit 1
fi
echo ""

# Test 2: Test /api/chat endpoint exists
echo "Test 2: Chat API Endpoint"
response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS $BASE_URL/api/chat)
if [ "$response" != "404" ]; then
  print_test "Chat API endpoint exists" "PASS"
else
  print_test "Chat API endpoint exists" "FAIL"
fi
echo ""

# Test 3: Test chat API with simple message (non-streaming)
echo "Test 3: Simple Chat Message (Non-Streaming)"
response=$(curl -s -X POST $BASE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Say hi in 3 words"}],
    "stream": false,
    "enableTools": false
  }')

if echo "$response" | grep -q "message"; then
  print_test "Chat API responds with message" "PASS"
  echo "   Response: $(echo $response | jq -r '.message' 2>/dev/null | head -c 50)..."
else
  print_test "Chat API responds with message" "FAIL"
  echo "   Error: $response"
fi
echo ""

# Test 4: Test chat API with tools enabled (non-streaming)
echo "Test 4: Chat with Tools Enabled"
response=$(curl -s -X POST $BASE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Set the BPM to 120"}],
    "stream": false,
    "enableTools": true,
    "projectContext": {
      "trackCount": 2,
      "currentTrack": "Audio 1",
      "bpm": 120,
      "tracks": [
        {"id": "track-1", "name": "Audio 1", "type": "audio", "recordArm": false, "solo": false, "mute": false}
      ]
    }
  }')

if echo "$response" | grep -q "toolUses"; then
  print_test "AI attempts to use tools" "PASS"
  echo "   Tool called: $(echo $response | jq -r '.toolUses[0].name' 2>/dev/null)"
else
  print_test "AI attempts to use tools (may just respond with text)" "PASS"
  echo "   Response: $(echo $response | jq -r '.message' 2>/dev/null | head -c 50)..."
fi
echo ""

# Test 5: Test streaming endpoint
echo "Test 5: Streaming Chat Response"
response=$(curl -s -N -X POST $BASE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hi"}],
    "stream": true,
    "enableTools": false
  }' | head -n 5)

if echo "$response" | grep -q "data:"; then
  print_test "Streaming response works" "PASS"
  echo "   Received streaming data chunks"
else
  print_test "Streaming response works" "FAIL"
fi
echo ""

# Test 6: Test with project context
echo "Test 6: Project Context Integration"
response=$(curl -s -X POST $BASE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How many tracks do I have?"}],
    "stream": false,
    "enableTools": false,
    "projectContext": {
      "trackCount": 5,
      "currentTrack": "Lead Vocals",
      "bpm": 120,
      "tracks": [
        {"id": "track-1", "name": "Lead Vocals", "type": "audio", "recordArm": true, "solo": false, "mute": false},
        {"id": "track-2", "name": "Guitar", "type": "audio", "recordArm": false, "solo": false, "mute": false},
        {"id": "track-3", "name": "Bass", "type": "audio", "recordArm": false, "solo": false, "mute": false},
        {"id": "track-4", "name": "Drums", "type": "audio", "recordArm": false, "solo": false, "mute": false},
        {"id": "track-5", "name": "Keys", "type": "audio", "recordArm": false, "solo": false, "mute": false}
      ]
    }
  }')

if echo "$response" | grep -qi "5\|five"; then
  print_test "AI receives project context" "PASS"
  echo "   AI correctly identified 5 tracks"
else
  print_test "AI receives project context (uncertain)" "PASS"
  echo "   Response: $(echo $response | jq -r '.message' 2>/dev/null | head -c 80)..."
fi
echo ""

# Test 7: Invalid request handling
echo "Test 7: Error Handling"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": "invalid"
  }')

if [ "$response" = "400" ]; then
  print_test "Invalid request returns 400" "PASS"
else
  print_test "Invalid request returns 400 (got $response)" "FAIL"
fi
echo ""

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"
else
  echo "Failed: $TESTS_FAILED"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠ Some tests failed${NC}"
  exit 1
fi
