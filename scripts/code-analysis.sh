#!/bin/bash
# Comprehensive Code Analysis Script for DAWG AI
# Analyzes codebase for refactoring opportunities

set -e

echo "🔍 DAWG AI Code Analysis Report"
echo "================================"
echo ""

# 1. Lines of Code Analysis
echo "📊 Lines of Code by Directory"
echo "------------------------------"
find src -type f \( -name "*.ts" -o -name "*.svelte" \) -exec wc -l {} + | sort -rn | head -20
echo ""

# 2. Largest Files (potential complexity)
echo "📏 Largest Files (Top 15)"
echo "-------------------------"
find src -type f \( -name "*.ts" -o -name "*.svelte" \) -exec wc -l {} + | sort -rn | head -15 | awk '{printf "%-6s lines: %s\n", $1, $2}'
echo ""

# 3. File count by directory
echo "📁 File Count by Directory"
echo "--------------------------"
for dir in src/lib/* src/routes/*; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -type f \( -name "*.ts" -o -name "*.svelte" \) | wc -l)
    echo "$(printf '%-40s' "$dir"): $count files"
  fi
done
echo ""

# 4. TODO/FIXME comments
echo "📝 TODO/FIXME Comments"
echo "----------------------"
grep -r "TODO\|FIXME" src/ --include="*.ts" --include="*.svelte" | wc -l | awk '{print $1 " TODO/FIXME comments found"}'
echo ""

# 5. Console.log statements (should be using logger)
echo "🐛 Console.log Usage (should use logger)"
echo "----------------------------------------"
grep -r "console\." src/ --include="*.ts" --include="*.svelte" | wc -l | awk '{print $1 " console statements found"}'
echo ""

# 6. Any/unknown types (type safety issues)
echo "⚠️  Type Safety Issues"
echo "---------------------"
grep -r ": any" src/ --include="*.ts" | wc -l | awk '{print $1 " \": any\" type annotations"}'
grep -r "as any" src/ --include="*.ts" | wc -l | awk '{print $1 " \"as any\" type assertions"}'
echo ""

# 7. Duplicate imports (potential consolidation)
echo "📦 Import Analysis"
echo "------------------"
echo "Top 10 most imported modules:"
grep -rh "^import.*from" src/ --include="*.ts" --include="*.svelte" | sed "s/.*from ['\"]//;s/['\"].*//" | sort | uniq -c | sort -rn | head -10
echo ""

# 8. Large functions (>100 lines)
echo "🔧 Large Functions (>100 lines)"
echo "--------------------------------"
for file in $(find src -type f -name "*.ts"); do
  awk '/^(export )?(async )?(function|const .* =.*=>)/ {start=NR; name=$0}
       /^}/ {if (NR-start > 100) print FILENAME":"start":"NR-start" lines - "name}' "$file"
done | head -10
echo ""

# 9. Cyclomatic Complexity Indicators
echo "🌀 Complexity Indicators"
echo "------------------------"
echo "Files with high if/else/switch density:"
for file in $(find src -type f \( -name "*.ts" -o -name "*.svelte" \)); do
  count=$(grep -c "if\|else\|switch\|case" "$file" 2>/dev/null || echo 0)
  lines=$(wc -l < "$file")
  if [ "$count" -gt 20 ] && [ "$lines" -gt 0 ]; then
    ratio=$(echo "scale=2; $count * 100 / $lines" | bc)
    echo "$(printf '%-60s' "$file"): $count conditionals in $lines lines ($ratio% density)"
  fi
done | sort -t: -k2 -rn | head -15
echo ""

# 10. Duplicate Code Patterns
echo "🔁 Potential Code Duplication"
echo "-----------------------------"
echo "Files with similar names (potential duplication):"
find src -type f -name "*.ts" -o -name "*.svelte" | sed 's|.*/||' | sort | uniq -d | head -10
echo ""

echo "✅ Analysis complete!"
echo ""
echo "💡 Next Steps:"
echo "  1. Review largest files for potential splitting"
echo "  2. Replace remaining console.log with logger"
echo "  3. Fix 'any' types for better type safety"
echo "  4. Consolidate duplicate code patterns"
echo "  5. Break down large functions (>100 lines)"
