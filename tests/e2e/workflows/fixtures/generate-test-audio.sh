#!/bin/bash

# Generate Test Audio Fixtures for DAWG AI E2E Tests
# Requires: ffmpeg

set -e

echo "🎵 Generating test audio fixtures..."

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo "Install with: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)"
    exit 1
fi

# Create fixtures directory if it doesn't exist
mkdir -p "$(dirname "$0")"
cd "$(dirname "$0")"

echo "📁 Working directory: $(pwd)"

# 1. Basic test audio (440Hz tone, 3 seconds)
echo "Generating test-audio.wav..."
ffmpeg -f lavfi -i "sine=frequency=440:duration=3" -ar 48000 -y test-audio.wav -loglevel quiet

# 2. Melody sample (musical sequence)
echo "Generating test-melody.wav..."
ffmpeg -f lavfi -i "sine=frequency=440:duration=0.5,sine=frequency=493.88:duration=0.5,sine=frequency=523.25:duration=0.5,sine=frequency=587.33:duration=0.5,sine=frequency=659.25:duration=0.5" -ar 48000 -y test-melody.wav -loglevel quiet

# 3. Full mix simulation (multiple frequencies)
echo "Generating test-full-mix.wav..."
ffmpeg -f lavfi -i "aevalsrc='0.3*sin(440*2*PI*t)+0.2*sin(220*2*PI*t)+0.15*sin(880*2*PI*t):d=5'" -ar 48000 -y test-full-mix.wav -loglevel quiet

# 4. Unmastered track (lower volume)
echo "Generating test-unmastered.wav..."
ffmpeg -f lavfi -i "aevalsrc='0.2*sin(440*2*PI*t)+0.1*sin(220*2*PI*t):d=4'" -ar 48000 -y test-unmastered.wav -loglevel quiet

# 5. Vocal sample (varying frequencies to simulate vocals)
echo "Generating test-vocal-sample.wav..."
ffmpeg -f lavfi -i "sine=frequency=262:duration=0.3,sine=frequency=294:duration=0.3,sine=frequency=330:duration=0.3,sine=frequency=349:duration=0.3,sine=frequency=392:duration=0.3" -ar 48000 -y test-vocal-sample.wav -loglevel quiet

# 6. Silent audio (for quick tests)
echo "Generating test-silent.wav..."
ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -t 2 -y test-silent.wav -loglevel quiet

# 7. Short audio (for fast CI tests)
echo "Generating test-short.wav..."
ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ar 48000 -y test-short.wav -loglevel quiet

echo ""
echo "✅ All test audio fixtures generated successfully!"
echo ""
echo "Generated files:"
ls -lh *.wav | awk '{print "  - " $9 " (" $5 ")"}'

echo ""
echo "📝 Note: Add *.wav to .gitignore to avoid committing large files"
