# Stem Separation Quick Start Guide

## For Developers: Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install replicate bullmq ioredis
```

### 2. Set Environment Variables
```bash
# .env
REPLICATE_API_TOKEN=r8_your_token_here  # Get from https://replicate.com
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start Redis
```bash
# macOS
brew install redis
redis-server

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Add Routes to Server
```typescript
// src/backend/unified-server.ts
import separationRoutes from './routes/separation-routes';

app.use('/api/separation', separationRoutes);
```

### 5. Test the API
```bash
# Start server
npm run dev:unified

# Test separation
curl -X POST http://localhost:3000/api/separation/separate \
  -F "audio=@test-song.mp3" \
  -F "quality=balanced"

# Check status (use jobId from response)
curl http://localhost:3000/api/separation/status/{jobId}
```

### 6. Use in React
```tsx
import StemSeparationWidget from '@/ui/components/StemSeparationWidget';

function MyDAW() {
  return <StemSeparationWidget />;
}
```

## API Reference

### POST /api/separation/separate
Start a new separation job.

**Request:**
```bash
curl -X POST /api/separation/separate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@song.mp3" \
  -F "quality=balanced" \
  -F "projectId=optional-project-id"
```

**Response:**
```json
{
  "success": true,
  "jobId": "sep_abc123",
  "estimatedTime": 25,
  "message": "Separation started. Estimated completion in 25 seconds."
}
```

### GET /api/separation/status/:jobId
Check job status and get results.

**Request:**
```bash
curl /api/separation/status/sep_abc123
```

**Response (Processing):**
```json
{
  "success": true,
  "jobId": "sep_abc123",
  "status": "processing",
  "progress": 45
}
```

**Response (Completed):**
```json
{
  "success": true,
  "jobId": "sep_abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "stems": [
      {
        "type": "vocals",
        "url": "https://storage.com/vocals.wav",
        "duration": 180,
        "size": 10000000,
        "quality": {
          "sdr": 7.8,
          "lufs": -14.0,
          "peakLevel": -3.0
        }
      }
      // ... drums, bass, other
    ],
    "metadata": {
      "model": "htdemucs",
      "processingTime": 27,
      "cost": 0.05
    }
  }
}
```

### DELETE /api/separation/cancel/:jobId
Cancel a running job.

### GET /api/separation/quota
Get user's remaining separations.

### POST /api/separation/batch
Process multiple files (premium only).

## WebSocket Events

### Listen for Updates
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('separation:started', (data) => {
  console.log('Job started:', data.jobId);
});

socket.on('separation:progress', (data) => {
  console.log(`Progress: ${data.progress}% - ${data.stage}`);
});

socket.on('separation:completed', (result) => {
  console.log('Stems ready:', result.stems);
});

socket.on('separation:failed', (data) => {
  console.error('Separation failed:', data.error);
});
```

## Quality Settings

| Setting | Model | Time | Use Case |
|---------|-------|------|----------|
| `fast` | htdemucs | 15s | Quick preview, free tier |
| `balanced` | htdemucs | 25s | Production quality (recommended) |
| `high-quality` | htdemucs_ft | 40s | Studio mastering, premium only |

## Supported Formats
- **Input**: MP3, WAV, M4A, FLAC, OGG
- **Output**: WAV (44.1kHz, 16-bit, stereo)
- **Max Size**: 100MB
- **Max Duration**: 10 minutes

## Pricing Tiers

### Free Tier
- 5 separations/month
- Fast & Balanced quality
- Standard processing (1 concurrent job)

### Premium Tier ($10/month)
- Unlimited separations
- All quality settings
- Priority processing (3 concurrent jobs)
- Batch processing
- No ads

## Common Issues

### "Queue is full"
**Solution**: Wait a few minutes or upgrade to premium for priority access.

### "Audio file too large"
**Solution**: Compress to <100MB or split into segments.

### "Separation timeout"
**Solution**: Use shorter audio (<10 minutes) or contact support.

### "Low separation quality"
**Cause**: Complex audio (classical, jazz) or poor recording quality
**Solution**: Try "high-quality" setting or provide better source material.

## Performance Tips

1. **Use Balanced Quality** - Best quality/time ratio
2. **Cache Results** - Store stems for 7 days to avoid re-processing
3. **Batch Upload** - Process multiple files at once (premium)
4. **Compress Input** - Smaller files = faster upload

## Next Steps

1. **Production**: Add S3 storage for file uploads
2. **Billing**: Integrate Stripe for quota enforcement
3. **Monitoring**: Set up Prometheus + Grafana
4. **Scaling**: Migrate to local Demucs at >5,000/month

## Support

- **Docs**: `/docs/STEM_SEPARATION_IMPLEMENTATION_REPORT.md`
- **Tests**: `npm run test:e2e -- tests/e2e/stem-separation.spec.ts`
- **Issues**: GitHub Issues
- **Email**: support@dawg-ai.com

---

**Last Updated**: October 19, 2025
**Version**: 1.0
