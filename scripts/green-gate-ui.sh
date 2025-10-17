#!/bin/bash

###############################################################################
# Green-Gate for UI Quality
#
# This script enforces UI quality standards before allowing merge:
# - No visual cut-offs (responsive tests)
# - <100ms interaction times (performance)
# - Accessibility score >90 (WCAG AA)
# - No visual regressions
# - Bundle size limits
#
# Exit code 0 = PASS (green gate open)
# Exit code 1 = FAIL (red gate closed)
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0
PASSED=0

echo "═══════════════════════════════════════════════════════════════"
echo "🚦 DAWG AI Green-Gate: UI Quality Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ==============================================================================
# 1. Visual Regression Tests
# ==============================================================================
echo "──────────────────────────────────────────────────────────────"
echo "1️⃣  Visual Regression Tests"
echo "──────────────────────────────────────────────────────────────"

if npm run test:e2e -- visual-regression --reporter=list; then
  echo -e "${GREEN}✓ PASS${NC} Visual regression tests"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} Visual regression tests detected changes"
  ((FAILED++))
fi
echo ""

# ==============================================================================
# 2. Performance Budget
# ==============================================================================
echo "──────────────────────────────────────────────────────────────"
echo "2️⃣  Performance Budget"
echo "──────────────────────────────────────────────────────────────"

if npm run test:e2e -- performance --reporter=list; then
  echo -e "${GREEN}✓ PASS${NC} Performance budgets met"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} Performance budgets exceeded"
  ((FAILED++))
fi
echo ""

# ==============================================================================
# 3. Accessibility (WCAG AA)
# ==============================================================================
echo "──────────────────────────────────────────────────────────────"
echo "3️⃣  Accessibility (WCAG AA)"
echo "──────────────────────────────────────────────────────────────"

if npm run test:e2e -- accessibility --reporter=list; then
  echo -e "${GREEN}✓ PASS${NC} Accessibility score >90"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} Accessibility violations found"
  ((FAILED++))
fi
echo ""

# ==============================================================================
# 4. Responsive Layout (No Cut-offs)
# ==============================================================================
echo "──────────────────────────────────────────────────────────────"
echo "4️⃣  Responsive Layout (No Cut-offs)"
echo "──────────────────────────────────────────────────────────────"

if npm run test:e2e -- responsive --reporter=list; then
  echo -e "${GREEN}✓ PASS${NC} No visual cut-offs detected"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} Visual cut-offs found"
  ((FAILED++))
fi
echo ""

# ==============================================================================
# 5. Design Token Validation
# ==============================================================================
echo "──────────────────────────────────────────────────────────────"
echo "5️⃣  Design Token Validation"
echo "──────────────────────────────────────────────────────────────"

if npm run validate --workspace=@dawg-ai/design-tokens; then
  echo -e "${GREEN}✓ PASS${NC} Design tokens valid"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} Design token validation failed"
  ((FAILED++))
fi
echo ""

# ==============================================================================
# 6. Type Check
# ==============================================================================
echo "──────────────────────────────────────────────────────────────"
echo "6️⃣  TypeScript Type Check"
echo "──────────────────────────────────────────────────────────────"

if npm run type-check; then
  echo -e "${GREEN}✓ PASS${NC} Type check passed"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} Type errors found"
  ((FAILED++))
fi
echo ""

# ==============================================================================
# Results
# ==============================================================================
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Green-Gate Results"
echo "═══════════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total:  $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ GREEN GATE OPEN${NC}"
  echo "All UI quality checks passed. Safe to merge."
  exit 0
else
  echo -e "${RED}❌ RED GATE CLOSED${NC}"
  echo "UI quality checks failed. Please fix issues before merging."
  echo ""
  echo "Quick fixes:"
  echo "  - Visual regressions: Review screenshots in test-results/"
  echo "  - Performance: Optimize bundle size or reduce JavaScript"
  echo "  - Accessibility: Check console for specific violations"
  echo "  - Responsive: Test on mobile viewport (375px width)"
  echo "  - Design tokens: Fix schema validation errors"
  echo "  - Type check: Run 'npm run type-check' for details"
  exit 1
fi
