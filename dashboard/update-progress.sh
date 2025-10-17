#!/bin/bash

# DAWG AI - Dashboard Progress Updater
# Usage: ./update-progress.sh [module-id] [status] [progress] [optional-notes]

MODULE_ID=$1
STATUS=$2
PROGRESS=$3
NOTES=$4

if [ -z "$MODULE_ID" ] || [ -z "$STATUS" ] || [ -z "$PROGRESS" ]; then
    echo "Usage: ./update-progress.sh [module-id] [status] [progress] [optional-notes]"
    echo ""
    echo "Examples:"
    echo "  ./update-progress.sh midi-editor in-progress 25 'Piano roll component started'"
    echo "  ./update-progress.sh midi-editor complete 100 'MIDI editor finished'"
    echo "  ./update-progress.sh timeline in-progress 50"
    echo ""
    echo "Module IDs: midi-editor, timeline, recording-system, effects-processor, voice-interface"
    echo "Status: pending, in-progress, complete, blocked"
    echo "Progress: 0-100"
    exit 1
fi

# Update progress.json using Node.js
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dashboard/progress.json', 'utf8'));

// Find the module
const module = data.modules.find(m => m.id === '$MODULE_ID');
if (!module) {
  console.error('Module not found: $MODULE_ID');
  process.exit(1);
}

// Update module
module.status = '$STATUS';
module.progress = parseInt('$PROGRESS');

if ('$STATUS' === 'in-progress' && !module.startDate) {
  module.startDate = new Date().toISOString().split('T')[0];
}

if ('$STATUS' === 'complete') {
  module.progress = 100;
  module.completedDate = new Date().toISOString().split('T')[0];
}

// Update project timestamp
data.project.lastUpdated = new Date().toISOString();

// Recalculate stats
const completed = data.modules.filter(m => m.status === 'complete').length;
const inProgress = data.modules.filter(m => m.status === 'in-progress').length;
const pending = data.modules.filter(m => m.status === 'pending').length;
const blocked = data.modules.filter(m => m.status === 'blocked').length;

data.stats.completed = completed;
data.stats.inProgress = inProgress;
data.stats.pending = pending;
data.stats.blocked = blocked;

// Calculate overall progress (weighted by estimated days)
const totalEstimatedDays = data.modules.reduce((sum, m) => {
  return sum + (m.estimatedDays || m.durationDays || 0);
}, 0);

const completedDays = data.modules.reduce((sum, m) => {
  const days = m.estimatedDays || m.durationDays || 0;
  return sum + (days * (m.progress / 100));
}, 0);

data.project.overallProgress = Math.round((completedDays / totalEstimatedDays) * 100);

// Write back
fs.writeFileSync('dashboard/progress.json', JSON.stringify(data, null, 2));

console.log('✅ Updated $MODULE_ID:');
console.log('   Status: $STATUS');
console.log('   Progress: $PROGRESS%');
console.log('   Overall Project Progress: ' + data.project.overallProgress + '%');
"

echo ""
echo "🎉 Dashboard updated! Open dashboard/index.html to view."
