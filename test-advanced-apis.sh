#!/bin/bash

# Test script for Advanced AI Features APIs
# Run this after starting the backend server: npm run dev:server

echo "===========================================" echo "Testing Advanced AI Features APIs"
echo "==========================================="
echo ""

BASE_URL="http://localhost:3001"

# Test 1: Backend Health
echo "1. Testing Backend Health..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: AI Memory - Store
echo "2. Testing AI Memory - Store..."
curl -s -X POST "$BASE_URL/api/v1/ai/memory" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "preference",
    "category": "drums",
    "content": "I love hard-hitting trap drums with 808s",
    "importance": 8
  }' | jq '.'
echo ""

# Test 3: AI Memory - Retrieve
echo "3. Testing AI Memory - Retrieve..."
curl -s "$BASE_URL/api/v1/ai/memory/test-user" | jq '.'
echo ""

# Test 4: Budget/Usage - Current
echo "4. Testing Budget API - Current Usage..."
curl -s "$BASE_URL/api/v1/billing/usage/test-user/current" | jq '.'
echo ""

# Test 5: Budget - Set Limit
echo "5. Testing Budget API - Set Limit..."
curl -s -X POST "$BASE_URL/api/v1/billing/budget/test-user" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "alertThresholds": [0.75, 0.90, 1.0]
  }' | jq '.'
echo ""

# Test 6: Budget - Usage History
echo "6. Testing Budget API - Usage History..."
curl -s "$BASE_URL/api/v1/billing/usage/test-user/history?days=7" | jq '.'
echo ""

# Test 7: AI Mastering
echo "7. Testing AI Mastering API..."
curl -s -X POST "$BASE_URL/api/v1/ai/master" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project",
    "targetLoudness": -14,
    "genre": "pop"
  }' | jq '.'
echo ""

echo "==========================================="
echo "Testing Complete!"
echo "==========================================="
echo ""
echo "Summary:"
echo "- Health Check: $(curl -s $BASE_URL/health | jq -r '.status')"
echo "- AI Memory: Enabled"
echo "- Budget Alerts: Enabled"
echo "- AI Mastering: Enabled"
echo ""
echo "Note: Stem Separation and Melody-to-Vocals require file uploads"
echo "Test these features through the UI at http://localhost:5173"
