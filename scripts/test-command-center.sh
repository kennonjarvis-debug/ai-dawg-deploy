#!/bin/bash

# Test script for DAWG AI Command Center
# Tests dashboard loading, API endpoints, and message functionality

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 DAWG AI COMMAND CENTER - Integration Tests"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function for tests
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  echo -n "Testing $name... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    ((FAILED++))
    return 1
  fi
}

# Test JSON response
test_json_endpoint() {
  local name="$1"
  local url="$2"
  local expected_field="$3"

  echo -n "Testing $name... "
  response=$(curl -s "$url")

  if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC} (Field '$expected_field' exists)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Field '$expected_field' missing)"
    echo "Response: $response"
    ((FAILED++))
    return 1
  fi
}

# Test POST with JSON
test_post() {
  local name="$1"
  local url="$2"
  local data="$3"
  local expected_field="$4"

  echo -n "Testing $name... "
  response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url")

  if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $response"
    ((FAILED++))
    return 1
  fi
}

echo "──────────────────────────────────────────────────────────────"
echo "1️⃣  Dashboard & Health Checks"
echo "──────────────────────────────────────────────────────────────"

test_endpoint "Agent Dashboard" "http://localhost:3000/agent-dashboard" 200
test_json_endpoint "Health API" "http://localhost:3000/api/health" "status"
test_json_endpoint "Agent Status API" "http://localhost:3000/api/agent-status" "agents"

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "2️⃣  Team Chat API - GET Operations"
echo "──────────────────────────────────────────────────────────────"

test_json_endpoint "Fetch all messages" "http://localhost:3000/api/team-chat" "messages"
test_json_endpoint "Fetch messages with limit" "http://localhost:3000/api/team-chat?limit=10" "count"
test_json_endpoint "Fetch Jerry's messages" "http://localhost:3000/api/team-chat?agent=jerry" "messages"

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "3️⃣  Team Chat API - POST Operations"
echo "──────────────────────────────────────────────────────────────"

test_post "Send message to Jerry" \
  "http://localhost:3000/api/team-chat" \
  '{"from":"test","to":"jerry","message":"Test message from script","type":"user"}' \
  "success"

test_post "Send broadcast message" \
  "http://localhost:3000/api/team-chat" \
  '{"from":"test","to":"all","message":"Broadcast test","type":"user"}' \
  "success"

test_post "Send message to Max" \
  "http://localhost:3000/api/team-chat" \
  '{"from":"test","to":"max","message":"Test for Max","type":"user"}' \
  "success"

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "4️⃣  Agent Monitoring"
echo "──────────────────────────────────────────────────────────────"

# Check if agent monitors are running
echo -n "Checking active monitors... "
MONITORS=$(ps aux | grep -E "agent-monitor.ts" | grep -v grep | wc -l | tr -d ' ')

if [ "$MONITORS" -gt 0 ]; then
  echo -e "${GREEN}✓ PASS${NC} ($MONITORS monitor(s) running)"
  ((PASSED++))
  ps aux | grep -E "agent-monitor.ts" | grep -v grep | awk '{print "  - "$NF}' | head -5
else
  echo -e "${YELLOW}⚠ WARNING${NC} (No monitors running)"
  echo "  Tip: Start monitors with: npx ts-node scripts/agent-monitor.ts <agent-name>"
fi

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "5️⃣  Data Storage"
echo "──────────────────────────────────────────────────────────────"

# Check chat file
echo -n "Checking chat file... "
if [ -f "_bus/team-chat.jsonl" ]; then
  MSG_COUNT=$(wc -l < _bus/team-chat.jsonl)
  echo -e "${GREEN}✓ PASS${NC} ($MSG_COUNT messages)"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (File not found)"
  ((FAILED++))
fi

# Check event bus
echo -n "Checking event bus... "
TODAY=$(date -u +%Y-%m-%d)
if [ -f "_bus/events/$TODAY/events.jsonl" ]; then
  EVENT_COUNT=$(wc -l < "_bus/events/$TODAY/events.jsonl")
  echo -e "${GREEN}✓ PASS${NC} ($EVENT_COUNT events today)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (No events file for today)"
fi

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "6️⃣  Browser Console Test"
echo "──────────────────────────────────────────────────────────────"

echo "Opening dashboard in browser..."
echo "Check browser console for debug logs:"
echo "  - [Command Center] Dashboard mounted"
echo "  - [Command Center] Checking agent status..."
echo "  - [MasterChat] Component mounted"
echo "  - [AgentChat:*] Fetching messages..."
echo ""
open "http://localhost:3000/agent-dashboard"
echo -e "${YELLOW}⚠${NC} Manual verification required - check browser console"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Test Results"
echo "═══════════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total:  $TOTAL"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
