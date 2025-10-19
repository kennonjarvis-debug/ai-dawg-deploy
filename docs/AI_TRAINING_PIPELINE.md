# AI Training Pipeline - Enhanced Metadata Extraction

## Overview

This document describes the enhanced metadata extraction pipeline implemented for AI DAW beat uploads and generation. The system automatically captures comprehensive metadata from every music generation, enabling future AI model fine-tuning and quality improvements.

## Architecture

### Components

1. **MetadataAnalyzer** (`src/backend/services/MetadataAnalyzer.ts`)
   - Analyzes audio buffers to extract rich metadata
   - Detects vocal characteristics, rhythm patterns, and style
   - Provides AI-ready feature extraction

2. **TrainingMetadataService** (`src/backend/services/training-metadata-service.ts`)
   - Manages storage and retrieval of training metadata
   - Computes quality scores based on analysis and user feedback
   - Exports datasets in formats suitable for model training

3. **Database Schema** (`prisma/schema.prisma` - TrainingMetadata model)
   - Stores comprehensive generation metadata
   - Tracks user feedback and quality metrics
   - Supports efficient querying for training data collection

4. **API Endpoints** (`src/backend/routes/training-metadata-routes.ts`)
   - RESTful API for metadata management
   - Export endpoints for JSONL/CSV formats
   - Statistics and analytics endpoints

## Data Flow

```
User Request
    ↓
Music Generation (Suno/MusicGen)
    ↓
Audio Generated
    ↓
Metadata Analysis (MetadataAnalyzer)
    ↓
Save to Database (TrainingMetadataService)
    ↓
User Feedback Collection
    ↓
Training Dataset Export
    ↓
AI Model Fine-Tuning
```

## Metadata Schema

### Core Fields

```typescript
interface GenerationMetadataForTraining {
  id: string;
  userId: string;
  generationId: string;

  // User input
  userPrompt: string;
  aiEnhancedPrompt?: string;

  // Generation parameters
  generationParams: {
    genre?: string;
    bpm?: number;
    key?: string;
    mood?: string;
    style?: string;
    duration?: number;
    model?: string;
    provider?: string;
    instrumental?: boolean;
    customLyrics?: string;
  };

  // Generated output
  audioUrl: string;
  duration: number;
  format: string;

  // Analysis results
  analysisMetadata?: {
    vocalCharacteristics?: VocalCharacteristics;
    rhythmCharacteristics?: RhythmCharacteristics;
    styleMetadata?: StyleMetadata;
  };

  // Audio features
  audioEmbedding?: number[];
  spectralFeatures?: {
    spectralCentroid: number;
    spectralRolloff: number;
    mfcc: number[];
    chromagram?: number[];
  };

  // User feedback
  userFeedback?: {
    liked?: boolean;
    rating?: number;
    feedback?: string;
    used?: boolean;
  };

  // Training metadata
  provider: string;
  modelUsed?: string;
  generationCost?: number;
  generationDuration?: number;
}
```

## Implementation Details

### Automatic Metadata Capture

Every music generation automatically triggers metadata capture:

```typescript
// In musicgen-service.ts and udio-service.ts
const metadata = await saveGenerationMetadata(
  audioUrl,
  params,
  enhancedPrompt,
  generationId,
  startTime
);
```

### Quality Score Computation

Quality scores (0-1) are computed based on:
- Analysis confidence (rhythm detection, tempo stability)
- Audio characteristics (no clipping, good dynamic range)
- User feedback (likes, ratings, actual usage)

```typescript
// Base score from analysis
score += rhythmConfidence * 0.2;
score += tempoStability * 0.1;

// Boost from user feedback
if (liked) score += 0.2;
if (used) score += 0.3;
score = (score + rating/5) / 2;
```

### User Feedback Collection

Frontend should call the feedback endpoint when users interact with generated audio:

```typescript
// When user likes/dislikes
PUT /api/training-metadata/:generationId/feedback
{
  "liked": true,
  "rating": 5,
  "feedback": "Perfect trap beat!",
  "used": true
}
```

## API Usage

### Save Metadata (Automatic)

```bash
POST /api/training-metadata
Content-Type: application/json

{
  "userId": "user123",
  "generationId": "gen_xyz",
  "userPrompt": "dark trap beat 140 bpm",
  "aiEnhancedPrompt": "dark, trap, 140 BPM - dark trap beat",
  "generationParams": {
    "genre": "trap",
    "bpm": 140,
    "mood": "dark",
    "duration": 30
  },
  "audioUrl": "https://...",
  "provider": "suno",
  "modelUsed": "sonic-v5"
}
```

### Update Feedback

```bash
PUT /api/training-metadata/gen_xyz/feedback
Content-Type: application/json

{
  "liked": true,
  "rating": 5,
  "used": true
}
```

### Export Training Dataset

```bash
# Export as JSONL for model fine-tuning
GET /api/training-metadata/export/jsonl?provider=suno&minQualityScore=0.7

# Export as CSV for analysis
GET /api/training-metadata/export/csv?minQualityScore=0.5
```

### Get Statistics

```bash
GET /api/training-metadata/statistics/overview

Response:
{
  "success": true,
  "statistics": {
    "totalGenerations": 1523,
    "byProvider": {
      "suno": 1234,
      "musicgen": 289
    },
    "withFeedback": 456,
    "averageQualityScore": 0.73,
    "usedForTraining": 0
  }
}
```

## Training Data Export Formats

### JSONL Format (for MusicGen fine-tuning)

```jsonl
{"prompt": "dark, trap, 140 BPM - dark trap beat", "audio_url": "https://...", "duration": 30, "metadata": {...}, "quality_score": 5}
{"prompt": "chill, lo-fi, 85 BPM - relaxing lofi beat", "audio_url": "https://...", "duration": 30, "metadata": {...}, "quality_score": 4}
```

### CSV Format (for data analysis)

```csv
generationId,userPrompt,aiEnhancedPrompt,audioUrl,duration,genre,bpm,rating,used
gen_xyz,"dark trap beat","dark, trap - dark trap beat",https://...,30,trap,140,5,true
```

## AI Model Fine-Tuning Strategy

### Data Collection Goals

1. **Quantity**: Collect 10,000+ generations before initial fine-tuning
2. **Quality**: Focus on generations with quality_score > 0.7
3. **Diversity**: Ensure balanced representation across genres
4. **Feedback**: Prioritize generations with actual user feedback

### Training Pipeline (Future Implementation)

```python
# Placeholder for future training pipeline

# 1. Export high-quality dataset
curl http://localhost:8002/api/training-metadata/export/jsonl?minQualityScore=0.7 > training_data.jsonl

# 2. Prepare for MusicGen fine-tuning
# - Download audio files
# - Convert to consistent format (WAV, 32kHz)
# - Extract features
# - Create prompt-audio pairs

# 3. Fine-tune MusicGen model
# - Use Hugging Face Transformers
# - Apply LoRA for efficient fine-tuning
# - Train on user preferences

# 4. Evaluate on held-out test set
# - Compare with base model
# - Measure user preference alignment

# 5. Deploy improved model
# - A/B test against base model
# - Monitor user feedback
# - Iterate
```

### MusicGen Fine-Tuning Example

```python
# Future implementation placeholder
from transformers import MusicgenForConditionalGeneration, AutoProcessor
from peft import LoraConfig, get_peft_model

# Load base model
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
processor = AutoProcessor.from_pretrained("facebook/musicgen-small")

# Apply LoRA for efficient fine-tuning
lora_config = LoraConfig(
    r=16,  # LoRA rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1,
)
model = get_peft_model(model, lora_config)

# Load training data from our metadata export
# Train on user-preferred generations
# Save fine-tuned model
```

## Quality Assurance

### Monitoring

- Track metadata save success rate
- Monitor quality score distribution
- Alert on missing metadata for generations
- Analyze user feedback patterns

### Data Validation

```typescript
// Validate before saving
if (!metadata.audioUrl) throw new Error('Missing audio URL');
if (!metadata.provider) throw new Error('Missing provider');
if (metadata.duration <= 0) throw new Error('Invalid duration');
```

## Future Enhancements

### Phase 1 (Current)
- ✅ Automatic metadata capture
- ✅ Database storage
- ✅ User feedback collection
- ✅ Export endpoints

### Phase 2 (Next Steps)
- [ ] Audio feature extraction (MFCC, chromagram)
- [ ] Embedding generation for similarity search
- [ ] Advanced analysis (key detection, structure analysis)
- [ ] Real-time quality prediction

### Phase 3 (Advanced)
- [ ] MusicGen model fine-tuning
- [ ] A/B testing framework
- [ ] Recommendation system based on embeddings
- [ ] Personalized generation models per user

## Database Schema Details

```prisma
model TrainingMetadata {
  id                String    @id @default(uuid())
  userId            String
  generationId      String    @unique

  // User input
  userPrompt        String
  aiEnhancedPrompt  String?

  // Generation parameters (JSON)
  generationParams  String

  // Generated output
  audioUrl          String
  audioStorageKey   String?
  duration          Float
  format            String

  // Analysis results (JSON)
  analysisMetadata  String?

  // Audio features (JSON)
  audioEmbedding    String?
  spectralFeatures  String?

  // User feedback (JSON)
  userFeedback      String?

  // Training metadata
  provider          String
  modelUsed         String?
  generationCost    Float?
  generationDuration Float?

  // Training flags
  usedForTraining   Boolean   @default(false)
  trainingEpoch     Int?
  qualityScore      Float?

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([provider])
  @@index([usedForTraining])
  @@index([createdAt])
}
```

## Migration Instructions

### Database Migration

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_training_metadata

# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### API Registration

Add to your main server file:

```typescript
import trainingMetadataRoutes from './routes/training-metadata-routes';

app.use('/api/training-metadata', trainingMetadataRoutes);
```

## Security Considerations

1. **Data Privacy**: User prompts and generations are stored - ensure GDPR compliance
2. **Access Control**: Add authentication to metadata endpoints
3. **Rate Limiting**: Prevent abuse of export endpoints
4. **Data Retention**: Implement retention policies for old metadata

## Performance Considerations

1. **Async Metadata Save**: Don't block generation response
2. **Batch Exports**: Use streaming for large datasets
3. **Database Indexing**: Indexes on userId, provider, createdAt
4. **Caching**: Cache statistics and aggregates

## Testing

### Unit Tests

```typescript
describe('TrainingMetadataService', () => {
  it('should save metadata successfully', async () => {
    const metadataId = await trainingMetadataService.saveMetadata({...});
    expect(metadataId).toBeDefined();
  });

  it('should compute quality score correctly', () => {
    // Test quality score computation
  });
});
```

### Integration Tests

```typescript
describe('Training Metadata API', () => {
  it('POST /api/training-metadata should save metadata', async () => {
    const response = await request(app)
      .post('/api/training-metadata')
      .send({...});
    expect(response.status).toBe(200);
  });
});
```

## Support & Maintenance

- **Monitoring**: Set up alerts for metadata save failures
- **Backups**: Regular database backups of TrainingMetadata table
- **Data Quality**: Weekly review of quality score distribution
- **Export Schedule**: Monthly exports for offline analysis

## Contact

For questions or issues with the training pipeline:
- Technical Lead: [Your Name]
- Documentation: This file
- Issues: GitHub Issues

---

**Last Updated**: 2025-10-18
**Version**: 1.0.0
**Status**: Production Ready
