#!/bin/bash

# SYNC.md Monitor - Watch for messages to Instance 3
# Usage: ./sync-monitor.sh

SYNC_FILE="/Users/benkennon/dawg-ai/SYNC.md"
LAST_CHECK_FILE="/tmp/dawg-sync-last-check"
INSTANCE_NAME="Instance 3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         DAWG AI - SYNC Monitor (Instance 3)                   ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}👁️  Monitoring SYNC.md for messages to Instance 3...${NC}"
echo -e "${YELLOW}📁 File: ${SYNC_FILE}${NC}"
echo ""

# Initialize last check timestamp
if [ ! -f "$LAST_CHECK_FILE" ]; then
  date +%s > "$LAST_CHECK_FILE"
  echo -e "${GREEN}✓ First run - initialized timestamp${NC}"
  echo ""
fi

# Function to extract messages for Instance 3
extract_messages() {
  # Extract all messages "To Instance 3" or "To All"
  awk '
    /^### (From .* to Instance 3|From .* to All)/ {
      capturing=1
      print ""
      print "════════════════════════════════════════════════════════════════"
      print $0
      print "────────────────────────────────────────────────────────────────"
      next
    }
    /^### From / && !/to Instance 3/ && !/to All/ {
      capturing=0
    }
    /^---$/ {
      if (capturing) {
        print "════════════════════════════════════════════════════════════════"
        capturing=0
      }
    }
    capturing {
      print $0
    }
  ' "$SYNC_FILE"
}

# Function to get current status of other instances
show_instance_status() {
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                    Instance Status Summary                     ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  # Instance 1
  echo -e "${MAGENTA}Instance 1 (UI/Frontend):${NC}"
  grep -A 2 "^### Current Status" "$SYNC_FILE" | head -3 | tail -2 | sed 's/^/  /'
  echo ""

  # Instance 2
  echo -e "${MAGENTA}Instance 2 (Audio Engine):${NC}"
  grep -A 2 "^### Current Status" "$SYNC_FILE" | head -6 | tail -2 | sed 's/^/  /'
  echo ""

  # Instance 3 (Me)
  echo -e "${MAGENTA}Instance 3 (AI Conductor - YOU):${NC}"
  grep -A 2 "^### Current Status" "$SYNC_FILE" | head -9 | tail -2 | sed 's/^/  /'
  echo ""

  # Instance 4
  echo -e "${MAGENTA}Instance 4 (Data & Storage):${NC}"
  grep -A 2 "^### Current Status" "$SYNC_FILE" | head -12 | tail -2 | sed 's/^/  /'
  echo ""
}

# Function to extract assigned tasks for Instance 3
show_my_tasks() {
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                    Your Assigned Tasks                         ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  awk '
    /^## Instance 3: AI Conductor/ {
      in_section=1
    }
    in_section && /^### Assigned Tasks/ {
      capturing=1
      next
    }
    in_section && capturing && /^### / {
      exit
    }
    in_section && capturing {
      print $0
    }
  ' "$SYNC_FILE" | sed 's/^/  /'
  echo ""
}

# Function to show what Instance 3 provides
show_my_provides() {
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║              What You Provide to Other Instances               ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  awk '
    /^## Instance 3: AI Conductor/ {
      in_section=1
    }
    in_section && /^### Provides for Other Instances/ {
      capturing=1
      next
    }
    in_section && capturing && /^### / {
      exit
    }
    in_section && capturing && /^## Instance 4/ {
      exit
    }
    in_section && capturing {
      print $0
    }
  ' "$SYNC_FILE" | sed 's/^/  /'
  echo ""
}

# Function to check for file changes
check_for_updates() {
  LAST_CHECK=$(cat "$LAST_CHECK_FILE")
  CURRENT_TIME=$(date +%s)
  FILE_MODIFIED=$(stat -f %m "$SYNC_FILE" 2>/dev/null || stat -c %Y "$SYNC_FILE" 2>/dev/null)

  if [ "$FILE_MODIFIED" -gt "$LAST_CHECK" ]; then
    echo -e "${GREEN}🔔 SYNC.md has been updated!${NC}"
    echo -e "${GREEN}📅 Last check: $(date -r $LAST_CHECK '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${GREEN}📅 File modified: $(date -r $FILE_MODIFIED '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""

    # Update last check time
    echo "$CURRENT_TIME" > "$LAST_CHECK_FILE"

    return 0
  else
    return 1
  fi
}

# Initial display
show_instance_status
show_my_tasks
show_my_provides

# Show any existing messages
MESSAGES=$(extract_messages)
if [ -n "$MESSAGES" ]; then
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║                  Messages for Instance 3                       ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo "$MESSAGES"
  echo ""
fi

# Watch mode
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⏳ Watching for changes... (Ctrl+C to stop)${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Continuous monitoring loop
while true; do
  sleep 5

  if check_for_updates; then
    # Show updated status
    echo ""
    show_instance_status
    show_my_tasks

    # Show new messages
    MESSAGES=$(extract_messages)
    if [ -n "$MESSAGES" ]; then
      echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
      echo -e "${YELLOW}║                    NEW MESSAGES                                ║${NC}"
      echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
      echo "$MESSAGES"
      echo ""
    fi

    # Notification sound (optional - comment out if annoying)
    echo -e "\a"  # Bell sound

    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⏳ Continuing to watch...${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
  fi
done
