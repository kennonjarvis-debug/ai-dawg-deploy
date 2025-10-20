#!/bin/bash

# Script to replace console.* calls with logger utility
# This script processes all remaining files with console.* calls

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Console.* Replacement Script ===${NC}"
echo ""

# Counter for stats
TOTAL_FILES=0
TOTAL_REPLACEMENTS=0

# Function to add logger import if not present
add_logger_import() {
    local file=$1

    # Check if logger is already imported
    if ! grep -q "import.*logger.*from.*logger" "$file"; then
        # Detect if it's a backend file or frontend file to determine correct path
        if [[ $file == *"/backend/"* ]]; then
            # Backend file - use ../utils/logger or ../../utils/logger depending on depth
            if [[ $file == *"/backend/services/"* ]] || [[ $file == *"/backend/routes/"* ]] || [[ $file == *"/backend/jobs/"* ]]; then
                sed -i '' "1a\\
import { logger } from '../utils/logger';\\
" "$file"
            elif [[ $file == *"/backend/"* ]]; then
                sed -i '' "1a\\
import { logger } from './utils/logger';\\
" "$file"
            fi
        elif [[ $file == *"/src/"* ]]; then
            # Frontend/shared file - use backend logger
            sed -i '' "1a\\
import { logger } from '../backend/utils/logger';\\
" "$file"
        fi
        echo -e "  ${GREEN}✓${NC} Added logger import"
    fi
}

# Function to replace console calls in a file
replace_in_file() {
    local file=$1
    local count=0

    echo -e "${YELLOW}Processing:${NC} $file"

    # Backup the file
    cp "$file" "$file.bak"

    # Add logger import
    add_logger_import "$file"

    # Replace console.log with logger.debug or logger.info
    count=$((count + $(grep -c "console\.log(" "$file" 2>/dev/null || echo "0")))
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"

    # Replace console.warn with logger.warn
    count=$((count + $(grep -c "console\.warn(" "$file" 2>/dev/null || echo "0")))
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"

    # Replace console.error with logger.error
    count=$((count + $(grep -c "console\.error(" "$file" 2>/dev/null || echo "0")))
    sed -i '' 's/console\.error(/logger.error(/g' "$file"

    # Replace console.info with logger.info
    count=$((count + $(grep -c "console\.info(" "$file" 2>/dev/null || echo "0")))
    sed -i '' 's/console\.info(/logger.info(/g' "$file"

    if [ $count -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Replaced $count console.* calls"
        TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + count))
        TOTAL_FILES=$((TOTAL_FILES + 1))
    else
        # Remove backup if no changes
        rm "$file.bak"
        echo -e "  ${BLUE}○${NC} No console.* calls found"
    fi
}

# Process backend service files
echo -e "\n${BLUE}=== Processing Backend Services ===${NC}"
for file in src/backend/services/*.ts; do
    if [ -f "$file" ]; then
        if grep -q "console\.\(log\|warn\|error\|info\)(" "$file" 2>/dev/null; then
            replace_in_file "$file"
        fi
    fi
done

# Process backend route files
echo -e "\n${BLUE}=== Processing Backend Routes ===${NC}"
for file in src/backend/routes/*.ts; do
    if [ -f "$file" ]; then
        if grep -q "console\.\(log\|warn\|error\|info\)(" "$file" 2>/dev/null; then
            replace_in_file "$file"
        fi
    fi
done

# Process backend job files
echo -e "\n${BLUE}=== Processing Backend Jobs ===${NC}"
for file in src/backend/jobs/*.ts; do
    if [ -f "$file" ]; then
        if grep -q "console\.\(log\|warn\|error\|info\)(" "$file" 2>/dev/null; then
            replace_in_file "$file"
        fi
    fi
done

# Process backend server files
echo -e "\n${BLUE}=== Processing Backend Servers ===${NC}"
for file in src/backend/*.ts; do
    if [ -f "$file" ]; then
        if grep -q "console\.\(log\|warn\|error\|info\)(" "$file" 2>/dev/null; then
            replace_in_file "$file"
        fi
    fi
done

# Summary
echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "Files modified: ${GREEN}$TOTAL_FILES${NC}"
echo -e "Total replacements: ${GREEN}$TOTAL_REPLACEMENTS${NC}"
echo -e "\n${YELLOW}Note:${NC} Backup files (.bak) have been created"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review the changes"
echo -e "  2. Run the build to verify no errors"
echo -e "  3. Test the application"
echo -e "  4. Remove .bak files if satisfied: find src -name '*.bak' -delete"
