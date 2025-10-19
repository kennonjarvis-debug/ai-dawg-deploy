# Expert Music AI Setup Guide

## Overview

This system allows you to:
1. **Fine-tune custom MusicGen models** on Replicate (Telecaster, Metro drums, etc.)
2. **Generate music** using specialized instrument models
3. **Build a library** of expert producer models
4. **Full control** over each instrument (unlike Suno)

## Quick Start

### 1. Install Python 3.11 or 3.12 (Required)

Python 3.14 is too new. Install 3.11 or 3.12:

```bash
# Using Homebrew
brew install python@3.11

# OR using pyenv
pyenv install 3.11.9
pyenv local 3.11.9
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment with Python 3.11
python3.11 -m venv venv-expert-music

# Activate it
source venv-expert-music/bin/activate

# Install dependencies
pip install -r src/backend/expert-music-ai/requirements.txt
```

### 3. Start the Expert Music AI Server

```bash
# With virtual environment activated
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy
source venv-expert-music/bin/activate
python src/backend/expert-music-ai/server.py
```

The server will run on http://localhost:8003

### 4. Test Base MusicGen (No Fine-Tuning Required)

```bash
# Test with base MusicGen model
curl -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat pop instrumental with catchy melody",
    "duration": 30,
    "model_version": "medium"
  }'
```

## Training Your First Custom Model

### Step 1: Prepare Training Data

1. **Collect 9-10 audio files** (30+ seconds each):
   - Telecaster guitar samples → `training-data/telecaster/`
   - Metro Boomin drums → `training-data/metro-drums/`
   - Martin acoustic → `training-data/martin-acoustic/`
   - Piano samples → `training-data/piano/`

2. **Upload to cloud storage** (Replicate needs a URL):
   - Upload to Dropbox/Google Drive/S3
   - Get public URL for the zip file

**Example:**
```bash
# Put your files in the appropriate folder
ls training-data/telecaster/
# telecaster-riff-01.wav
# telecaster-riff-02.wav
# ... (9-10 files total)

# Zip it up
zip -r telecaster-training.zip training-data/telecaster/

# Upload to Dropbox/Drive and get sharable link
```

### Step 2: Start Training on Replicate

```bash
curl -X POST http://localhost:8003/train \
  -H "Content-Type: application/json" \
  -d '{
    "instrument_name": "telecaster",
    "description": "Telecaster guitar - country twang, clean tone",
    "dataset_url": "https://dropbox.com/your-file/telecaster-training.zip",
    "model_version": "medium",
    "epochs": 10,
    "auto_labeling": true,
    "drop_vocals": true
  }'
```

Response:
```json
{
  "success": true,
  "training_id": "abc123...",
  "status": "training",
  "message": "Training started for telecaster"
}
```

### Step 3: Check Training Status

```bash
curl http://localhost:8003/training/abc123...
```

Training takes **15 minutes** on Replicate's GPUs.

### Step 4: Use Your Custom Model

Once training completes, your model is automatically registered:

```bash
curl -X POST http://localhost:8003/generate \
  -H "Content-Type": application/json" \
  -d '{
    "prompt": "country guitar lead",
    "instruments": ["telecaster"],
    "duration": 30
  }'
```

## Replicate Costs

- **Training**: $0.23 per training (15 min on 8x A40 GPUs)
- **Inference**: $0.0023 per second of audio
  - 30-second track = ~$0.07
  - Much cheaper than Suno API!

## Building Your Model Library

Train specialized models for:

1. **Telecaster** - Country twang, clean tone
2. **Metro Drums** - Hard-hitting trap drums, 808s
3. **Martin Acoustic** - Fingerstyle, warm tone
4. **Grand Piano** - Rich harmonics, classical
5. **Morgan Wallen Style** - Modern country production
6. **808 Bass** - Deep sub-bass, trap/hip-hop
7. **Live Drums** - Real drum kit, various styles
8. **Synth Leads** - Electronic leads, EDM

## API Endpoints

### Generate Music
`POST /generate`
```json
{
  "prompt": "upbeat pop song",
  "instruments": ["telecaster", "metro_drums"],
  "style": "morgan_wallen",
  "duration": 30,
  "bpm": 120,
  "key": "G",
  "model_version": "medium"
}
```

### Train New Model
`POST /train`
```json
{
  "instrument_name": "telecaster",
  "description": "Telecaster guitar samples",
  "dataset_url": "https://...",
  "model_version": "medium",
  "epochs": 10
}
```

### List Models
`GET /models`

Returns all available models (base + fine-tuned)

### Check Training Status
`GET /training/{training_id}`

## Integration with DAW

The Expert Music AI server is designed to integrate seamlessly with your existing DAW backend.

See `INTEGRATION_GUIDE.md` for details on connecting to your TypeScript backend.

## Troubleshooting

### Python Version Issues
- **Error**: "requires Python <3.14"
- **Solution**: Use Python 3.11 or 3.12 (see setup above)

### Replicate API Token
- Set in `.env`: `REPLICATE_API_TOKEN=your_api_token_here`
- Get your token from https://replicate.com/account/api-tokens

### Training Data Format
- Audio files must be **>30 seconds**
- Supported formats: WAV, MP3, FLAC, M4A
- Need **minimum 9 files**, recommend 10-15 for best quality

## Next Steps

1. ✅ Install Python 3.11/3.12
2. ✅ Start the server
3. ✅ Test base MusicGen model
4. 📥 Collect training data for Telecaster
5. 🎓 Train your first custom model
6. 🎵 Generate music with custom instruments!

## Resources

- [Replicate MusicGen Docs](https://replicate.com/meta/musicgen)
- [Replicate Fine-Tuner](https://replicate.com/sakemin/musicgen-fine-tuner)
- [AudioCraft GitHub](https://github.com/facebookresearch/audiocraft)
