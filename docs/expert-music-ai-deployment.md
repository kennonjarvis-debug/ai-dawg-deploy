# Expert Music AI Service: Deployment & Technical Documentation

Complete guide for deploying, configuring, and maintaining the Expert Music AI service that powers Melody-to-Vocals.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Endpoints](#api-endpoints)
- [Dependencies](#dependencies)
- [Deployment Options](#deployment-options)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## Overview

### What is Expert Music AI?

Expert Music AI is a FastAPI-based Python service that provides advanced music AI capabilities including:

1. **Melody-to-Vocals**: Convert hummed melodies into vocals with AI-generated lyrics
2. **Custom Model Training**: Fine-tune MusicGen models on specialized instruments
3. **Multi-Model Generation**: Use base and custom-trained models for music generation

### Key Features

- **CREPE Pitch Extraction**: Local neural network for melody analysis
- **AI Lyric Generation**: Claude AI or GPT-4 for lyrics
- **Vocal Synthesis**: Bark or MusicGen models via Replicate
- **Model Registry**: Track and manage trained models
- **REST API**: Easy integration with any application

### Service Specifications

- **Language**: Python 3.11/3.12
- **Framework**: FastAPI + Uvicorn
- **Default Port**: 8003
- **Processing**: Async/background tasks supported
- **CORS**: Enabled for web integration

## Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│         Expert Music AI Service (Port 8003)     │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   FastAPI    │  │  Uvicorn     │            │
│  │   Server     │──│  ASGI Server │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Core Processing Pipeline         │  │
│  │                                          │  │
│  │  ┌──────────────────────────────────┐   │  │
│  │  │  CREPE Pitch Extractor (Local)  │   │  │
│  │  │  - torchcrepe neural network    │   │  │
│  │  │  - Librosa audio processing     │   │  │
│  │  └──────────────────────────────────┘   │  │
│  │                                          │  │
│  │  ┌──────────────────────────────────┐   │  │
│  │  │  Lyric Generator (API)          │   │  │
│  │  │  - Anthropic Claude AI          │   │  │
│  │  │  - OpenAI GPT-4                 │   │  │
│  │  └──────────────────────────────────┘   │  │
│  │                                          │  │
│  │  ┌──────────────────────────────────┐   │  │
│  │  │  Vocal Synthesizer (Replicate)  │   │  │
│  │  │  - Bark text-to-speech          │   │  │
│  │  │  - MusicGen melody conditioning │   │  │
│  │  └──────────────────────────────────┘   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Model Registry                   │  │
│  │  - Base MusicGen models                  │  │
│  │  - Custom trained models                 │  │
│  │  - Training status tracking              │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  Client Apps    │      │  External APIs   │
│  - AI DAW       │      │  - Replicate     │
│  - Web UI       │      │  - Anthropic     │
│  - Mobile       │      │  - OpenAI        │
└─────────────────┘      └──────────────────┘
```

### Data Flow: Melody-to-Vocals

```
1. Client uploads audio file
   ↓
2. Server receives multipart/form-data request
   ↓
3. Audio saved to temporary file
   ↓
4. CREPE extracts pitch/melody data (local, 1-2s)
   ↓
5. Melody data sent to Claude/GPT-4 for lyrics (API, 3-5s)
   ↓
6. Lyrics + audio sent to Bark/MusicGen (Replicate, 20-60s)
   ↓
7. Generated audio URL returned to client
   ↓
8. Temporary files cleaned up
```

### Directory Structure

```
src/backend/expert-music-ai/
├── server.py                 # Main FastAPI application
├── requirements.txt          # Python dependencies
├── README.md                 # Service overview
├── models/
│   └── registry.json         # Trained model registry
├── training/
│   └── [training data]       # Audio samples for training
└── utils/
    ├── pitch_extractor.py    # CREPE melody extraction
    ├── lyric_generator.py    # AI lyric generation
    └── prepare_training_data.py  # Training data preparation
```

## Installation

### Prerequisites

1. **Python 3.11 or 3.12** (Python 3.14 not supported)
2. **pip** package manager
3. **Git** (for cloning repository)
4. **4GB+ RAM** (for neural network models)
5. **Internet connection** (for API calls)

### Step 1: Install Python 3.11

#### macOS (Homebrew)
```bash
brew install python@3.11
```

#### macOS (pyenv)
```bash
pyenv install 3.11.9
pyenv local 3.11.9
```

#### Linux (apt)
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
```

#### Windows
Download from [python.org](https://www.python.org/downloads/) and select Python 3.11.x

### Step 2: Create Virtual Environment

```bash
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy

# Create virtual environment with Python 3.11
python3.11 -m venv venv-expert-music

# Activate it
source venv-expert-music/bin/activate  # macOS/Linux
# OR
venv-expert-music\Scripts\activate     # Windows
```

### Step 3: Install Dependencies

```bash
# Ensure virtual environment is activated
pip install --upgrade pip

# Install all requirements
pip install -r src/backend/expert-music-ai/requirements.txt
```

**Required packages**:
- `fastapi>=0.104.0` - Web framework
- `uvicorn>=0.24.0` - ASGI server
- `torch>=2.0.0` - PyTorch for neural networks
- `torchcrepe>=0.0.24` - CREPE pitch extraction
- `librosa>=0.11.0` - Audio processing
- `anthropic>=0.70.0` - Claude AI API
- `openai>=2.0.0` - GPT-4 API
- `soundfile>=0.12.1` - Audio file I/O
- `replicate>=0.25.0` - Replicate API client
- `pydantic>=2.0.0` - Data validation
- `python-multipart>=0.0.6` - File upload handling

### Step 4: Verify Installation

```bash
# Check Python version
python --version
# Should output: Python 3.11.x or 3.12.x

# Check installed packages
pip list | grep -E "(torch|crepe|fastapi)"

# Test CREPE import
python -c "import torchcrepe; print('CREPE installed successfully')"
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider API Keys (at least one required for lyrics)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Replicate API (required for vocal synthesis)
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx

# Service Configuration (optional)
EXPERT_MUSIC_AI_URL=http://localhost:8003
EXPERT_MUSIC_AI_ENABLED=true

# Logging (optional)
LOG_LEVEL=INFO
```

### Getting API Keys

#### Anthropic (Claude AI)
1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Copy `sk-ant-api03-...` key

#### OpenAI (GPT-4)
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Copy `sk-proj-...` key

#### Replicate
1. Visit https://replicate.com/
2. Sign up or log in
3. Navigate to Account → API Tokens
4. Copy `r8_...` token

### Server Configuration

Edit `src/backend/expert-music-ai/server.py` for advanced configuration:

```python
# Port configuration
PORT = int(os.getenv("EXPERT_MUSIC_AI_PORT", "8003"))

# CORS origins (for web integration)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-production-domain.com"
]

# File upload limits
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# Processing timeouts
PITCH_EXTRACTION_TIMEOUT = 30  # seconds
LYRIC_GENERATION_TIMEOUT = 60
VOCAL_SYNTHESIS_TIMEOUT = 300
```

### Model Registry Configuration

The model registry is stored in `src/backend/expert-music-ai/models/registry.json`:

```json
{
  "base": {
    "small": "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    "medium": "meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
    "melody": "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    "large": "meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3b17a1c0f1fc"
  },
  "fine_tuned": {
    "telecaster": "your-username/telecaster-model:version-id",
    "metro_drums": "your-username/metro-drums:version-id"
  }
}
```

## Running the Service

### Development Mode

```bash
# Activate virtual environment
source venv-expert-music/bin/activate

# Run server
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy
python src/backend/expert-music-ai/server.py
```

**Output**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8003 (Press CTRL+C to quit)
```

### Production Mode

#### Using systemd (Linux)

Create `/etc/systemd/system/expert-music-ai.service`:

```ini
[Unit]
Description=Expert Music AI Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ai-dawg-deploy
Environment="PATH=/var/www/ai-dawg-deploy/venv-expert-music/bin"
EnvironmentFile=/var/www/ai-dawg-deploy/.env
ExecStart=/var/www/ai-dawg-deploy/venv-expert-music/bin/python src/backend/expert-music-ai/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl enable expert-music-ai
sudo systemctl start expert-music-ai
sudo systemctl status expert-music-ai
```

#### Using Docker

Create `Dockerfile.expert-music`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    libsndfile1-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY src/backend/expert-music-ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/backend/expert-music-ai ./expert-music-ai

# Create model registry directory
RUN mkdir -p expert-music-ai/models

# Expose port
EXPOSE 8003

# Run server
CMD ["python", "expert-music-ai/server.py"]
```

**Build and run**:
```bash
# Build image
docker build -f Dockerfile.expert-music -t expert-music-ai:latest .

# Run container
docker run -d \
  --name expert-music-ai \
  -p 8003:8003 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e REPLICATE_API_TOKEN=$REPLICATE_API_TOKEN \
  -v $(pwd)/src/backend/expert-music-ai/models:/app/expert-music-ai/models \
  expert-music-ai:latest
```

#### Using Docker Compose

Create `docker-compose.expert-music.yml`:

```yaml
version: '3.8'

services:
  expert-music-ai:
    build:
      context: .
      dockerfile: Dockerfile.expert-music
    ports:
      - "8003:8003"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
    volumes:
      - ./src/backend/expert-music-ai/models:/app/expert-music-ai/models
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Run**:
```bash
docker-compose -f docker-compose.expert-music.yml up -d
```

### Process Management (PM2)

For Node.js environments:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'expert-music-ai',
    script: 'python',
    args: 'src/backend/expert-music-ai/server.py',
    interpreter: 'none',
    cwd: '/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy',
    env: {
      PATH: '/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/venv-expert-music/bin'
    }
  }]
};
EOF

# Start service
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

## API Endpoints

### Health Check

**GET /**

Returns service status and version.

```bash
curl http://localhost:8003/
```

Response:
```json
{
  "service": "Expert Music AI",
  "version": "1.0.0",
  "status": "running"
}
```

### Melody-to-Vocals

**POST /melody-to-vocals**

Convert melody to vocals with lyrics.

See [API Documentation](/docs/api/melody-to-vocals-api.md) for detailed specifications.

### List Models

**GET /models**

List available AI models.

```bash
curl http://localhost:8003/models
```

### Health Status

**GET /health**

Detailed health check with dependencies.

```bash
curl http://localhost:8003/health
```

## Dependencies

### Python Packages

All dependencies are in `src/backend/expert-music-ai/requirements.txt`:

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
torch>=2.0.0
torchcrepe>=0.0.24
librosa>=0.11.0
anthropic>=0.70.0
openai>=2.0.0
soundfile>=0.12.1
replicate>=0.25.0
pydantic>=2.0.0
python-multipart>=0.0.6
numpy>=1.24.0
scipy>=1.11.0
```

### System Dependencies

**macOS**:
```bash
brew install libsndfile
```

**Ubuntu/Debian**:
```bash
sudo apt-get install libsndfile1 libsndfile1-dev
```

**CentOS/RHEL**:
```bash
sudo yum install libsndfile libsndfile-devel
```

### External Services

1. **Anthropic Claude AI** (optional)
   - API: https://api.anthropic.com
   - Docs: https://docs.anthropic.com

2. **OpenAI GPT-4** (optional)
   - API: https://api.openai.com
   - Docs: https://platform.openai.com/docs

3. **Replicate** (required)
   - API: https://api.replicate.com
   - Docs: https://replicate.com/docs

## Deployment Options

### Cloud Platforms

#### AWS (EC2 + ELB)

```bash
# 1. Launch EC2 instance (t3.medium recommended)
# 2. Install dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv libsndfile1

# 3. Clone repository
git clone https://github.com/your-repo/ai-dawg-deploy.git
cd ai-dawg-deploy

# 4. Setup virtual environment
python3.11 -m venv venv-expert-music
source venv-expert-music/bin/activate
pip install -r src/backend/expert-music-ai/requirements.txt

# 5. Configure environment
nano .env  # Add API keys

# 6. Setup systemd service (see above)

# 7. Configure security group
# Allow inbound: 8003 (from Load Balancer only)

# 8. Setup Application Load Balancer
# Target: EC2 instance on port 8003
# Health check: GET /health
```

#### Google Cloud Platform (Cloud Run)

```bash
# 1. Build container
gcloud builds submit --tag gcr.io/your-project/expert-music-ai

# 2. Deploy to Cloud Run
gcloud run deploy expert-music-ai \
  --image gcr.io/your-project/expert-music-ai \
  --platform managed \
  --region us-central1 \
  --port 8003 \
  --memory 2Gi \
  --timeout 300 \
  --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY,REPLICATE_API_TOKEN=$REPLICATE_API_TOKEN
```

#### Heroku

```bash
# 1. Create Procfile
echo "web: python src/backend/expert-music-ai/server.py" > Procfile

# 2. Create app
heroku create your-app-name

# 3. Set environment variables
heroku config:set ANTHROPIC_API_KEY=sk-ant-api03-xxx
heroku config:set REPLICATE_API_TOKEN=r8_xxx

# 4. Deploy
git push heroku main

# 5. Scale dyno
heroku ps:scale web=1:standard-2x
```

### Reverse Proxy (Nginx)

```nginx
upstream expert_music_ai {
    server localhost:8003;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location /expert-music-ai/ {
        proxy_pass http://expert_music_ai/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;

        # File upload support
        client_max_body_size 10M;
    }

    # SSL configuration (recommended)
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
}
```

## Monitoring & Logging

### Application Logs

Logs are written to `expert-music-ai.log`:

```bash
# View logs
tail -f expert-music-ai.log

# Search for errors
grep ERROR expert-music-ai.log

# Monitor specific requests
grep "melody-to-vocals" expert-music-ai.log
```

### Log Levels

Configure in `server.py`:

```python
import logging

logging.basicConfig(
    level=logging.INFO,  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('expert-music-ai.log'),
        logging.StreamHandler()
    ]
)
```

### Health Monitoring

**Endpoint**: `GET /health`

```bash
# Check health
curl http://localhost:8003/health

# Monitor in cron job
*/5 * * * * curl -f http://localhost:8003/health || echo "Service down" | mail -s "Alert" admin@example.com
```

### Performance Metrics

Track key metrics:

1. **Request latency**: Time per request
2. **Success rate**: Successful vs failed requests
3. **Error types**: Common error codes
4. **API costs**: Track Replicate/Claude/OpenAI usage
5. **Resource usage**: CPU, memory, disk

**Using Prometheus** (optional):

```python
from prometheus_client import Counter, Histogram, generate_latest

requests_total = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## Troubleshooting

### Common Issues

#### Port Already in Use

**Error**: `Address already in use`

**Solution**:
```bash
# Find process using port 8003
lsof -ti:8003

# Kill process
kill -9 $(lsof -ti:8003)

# Or use different port
export EXPERT_MUSIC_AI_PORT=8004
python server.py
```

#### Missing API Keys

**Error**: `ANTHROPIC_API_KEY not found`

**Solution**:
```bash
# Check .env file exists
cat .env | grep ANTHROPIC_API_KEY

# Export manually for testing
export ANTHROPIC_API_KEY=sk-ant-api03-xxx
export REPLICATE_API_TOKEN=r8_xxx

# Restart server
```

#### CREPE Import Fails

**Error**: `No module named 'torchcrepe'`

**Solution**:
```bash
# Reinstall torch and torchcrepe
pip uninstall torch torchcrepe
pip install torch>=2.0.0
pip install torchcrepe>=0.0.24

# Verify
python -c "import torchcrepe; print('OK')"
```

#### Replicate Timeout

**Error**: `Prediction timed out`

**Solution**:
```python
# Increase timeout in server.py
VOCAL_SYNTHESIS_TIMEOUT = 600  # 10 minutes

# Or retry logic
for attempt in range(3):
    try:
        result = replicate.run(...)
        break
    except TimeoutError:
        if attempt == 2:
            raise
        time.sleep(5)
```

### Debug Mode

Enable debug logging:

```python
# In server.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Run with uvicorn debug
uvicorn server:app --host 0.0.0.0 --port 8003 --reload --log-level debug
```

## Security

### Best Practices

1. **API Keys**: Never commit to git, use environment variables
2. **HTTPS**: Always use SSL in production
3. **CORS**: Restrict allowed origins
4. **File Validation**: Check uploaded file types and sizes
5. **Rate Limiting**: Implement request throttling
6. **Input Validation**: Sanitize all user inputs

### Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/melody-to-vocals")
@limiter.limit("10/minute")
async def melody_to_vocals(...):
    ...
```

### File Upload Security

```python
ALLOWED_EXTENSIONS = {'.wav', '.mp3', '.flac', '.m4a'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_audio_file(file: UploadFile):
    # Check extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, "Unsupported file type")

    # Check size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise HTTPException(413, "File too large")
```

### Environment Isolation

```bash
# Use separate .env files per environment
.env.development
.env.staging
.env.production

# Load appropriate file
export ENV=production
python -c "from dotenv import load_dotenv; load_dotenv('.env.${ENV}')"
```

---

**Last Updated**: 2025-10-18
**Version**: 1.0.0
**Support**: See main documentation for contact
