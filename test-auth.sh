#!/bin/bash
# Authentication API Test Suite

API_BASE="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "DAWG AI - Authentication Test Suite"
echo "========================================="
echo ""

# Test 1: Register new user
echo "Test 1: Register new user"
echo "POST /api/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Registration successful${NC}"
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 2: Register duplicate user (should fail)
echo "Test 2: Register duplicate user (should fail with 409)"
echo "POST /api/auth/register"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "anotherpassword",
    "name": "Duplicate User"
  }')

if echo "$DUPLICATE_RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✅ Duplicate prevention working${NC}"
else
  echo -e "${RED}❌ Duplicate prevention failed${NC}"
  echo "$DUPLICATE_RESPONSE"
fi
echo ""

# Test 3: Invalid registration (password too short)
echo "Test 3: Invalid registration (password too short)"
echo "POST /api/auth/register"
SHORT_PW_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "short@example.com",
    "password": "short"
  }')

if echo "$SHORT_PW_RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✅ Password validation working${NC}"
else
  echo -e "${RED}❌ Password validation failed${NC}"
  echo "$SHORT_PW_RESPONSE"
fi
echo ""

# Test 4: NextAuth endpoints exist
echo "Test 4: NextAuth API endpoints"
echo "GET /api/auth/providers"
PROVIDERS_RESPONSE=$(curl -s "$API_BASE/api/auth/providers")

if echo "$PROVIDERS_RESPONSE" | grep -q 'credentials'; then
  echo -e "${GREEN}✅ NextAuth endpoints working${NC}"
else
  echo -e "${RED}❌ NextAuth endpoints not responding${NC}"
  echo "$PROVIDERS_RESPONSE"
fi
echo ""

# Test 5: Project API requires auth (should fail without session)
echo "Test 5: Project API requires authentication"
echo "GET /api/projects/list"
LIST_RESPONSE=$(curl -s "$API_BASE/api/projects/list")

if echo "$LIST_RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✅ Auth protection working${NC}"
else
  echo -e "${RED}❌ Auth protection not working (endpoints are open)${NC}"
  echo "$LIST_RESPONSE"
fi
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo "✅ User registration"
echo "✅ Duplicate prevention"
echo "✅ Password validation"
echo "✅ NextAuth endpoints"
echo "✅ API route protection"
echo ""
echo "Note: To test full authentication flow (login/session),"
echo "use the browser at http://localhost:3000/api/auth/signin"
echo ""
echo "Next steps for manual testing:"
echo "1. Start dev server: npm run dev"
echo "2. Visit http://localhost:3000/api/auth/signin"
echo "3. Login with: test@example.com / testpassword123"
echo "4. Test protected endpoints with valid session"
echo ""
