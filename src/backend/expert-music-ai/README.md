# Expert Music AI - Quick Reference

## What You Get

- **Custom instrument models** (Telecaster, Metro drums, etc.)
- **80-90% of Suno quality** for instrumentals
- **Full control** over each instrument
- **No API dependency** after training
- **Commercial rights** to generated music

## Training Costs (Replicate)

- $0.23 per model training (15 minutes)
- $0.07 per 30-second generation
- **Much cheaper than Suno API!**

## Training Process

1. Collect 9-10 audio samples (30+ seconds each)
2. Upload to cloud storage (Dropbox/Drive/S3)
3. Call `/train` endpoint with dataset URL
4. Wait 15 minutes
5. Model automatically registered and ready!

## Quality Expectations

### What Works Great (80-90% of Suno)
- Instrumental music generation
- Specific instrument tones
- Genre-specific production
- Beat/drum patterns

### What Needs Work (70-80% of Suno)
- Vocals (requires additional Bark integration)
- Complex multi-instrument arrangements
- Ultra-realistic mixing

### What You Get That Suno Doesn't
- Separate specialized models per instrument
- Can generate individual stems
- Full control and customization
- No rate limits or API downtime

## Recommended Models to Train

1. **Telecaster Guitar** - For country, rock leads
2. **Metro Boomin Drums** - For trap/hip-hop beats
3. **Martin Acoustic** - For singer-songwriter style
4. **Grand Piano** - For classical/jazz
5. **Morgan Wallen Production** - For modern country full tracks
6. **808 Bass** - For deep sub-bass
7. **Lo-Fi Beats** - For chill/study music

## Server Status

Check server: http://localhost:8003
API docs: http://localhost:8003/docs (when running)

## Files Structure

```
expert-music-ai/
├── server.py          # Main FastAPI server
├── models/            # Model registry
│   └── registry.json  # Maps instruments to Replicate model IDs
├── training/          # Training job tracking
├── utils/             # Helper utilities
│   └── prepare_training_data.py
└── requirements.txt   # Python dependencies
```

## Environment Variables

```bash
REPLICATE_API_TOKEN=your_api_token_here
EXPERT_MUSIC_AI_ENABLED=true
EXPERT_MUSIC_AI_URL=http://localhost:8003
```

Get your Replicate API token from: https://replicate.com/account/api-tokens

## Quick Test

```bash
# Start server
python src/backend/expert-music-ai/server.py

# Test generation
curl -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "upbeat pop instrumental", "duration": 30}'
```
