# Migration Guide - Enhanced Metadata Extraction Pipeline

## Quick Start (5 minutes)

### Step 1: Database Migration

```bash
# Navigate to project root
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy

# Generate migration
npx prisma migrate dev --name add_training_metadata

# If you see errors about the database being out of sync, reset it:
npx prisma migrate reset  # WARNING: This will delete all data!
# OR manually apply the migration:
npx prisma db push

# Generate Prisma client with new types
npx prisma generate
```

### Step 2: Register API Routes

Add to your main backend server file (likely `src/backend/server.ts` or `src/backend/app.ts`):

```typescript
import trainingMetadataRoutes from './routes/training-metadata-routes';

// Add this line with your other routes
app.use('/api/training-metadata', trainingMetadataRoutes);
```

### Step 3: Update Environment (Optional)

No new environment variables are required! The system uses your existing database connection.

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
# OR
npm start
```

### Step 5: Test the Implementation

```bash
# Test music generation (should auto-save metadata)
curl -X POST http://localhost:8002/api/v1/ai/dawg \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "dark trap beat",
    "genre": "trap",
    "tempo": 140,
    "userId": "test-user-123"
  }'

# Check statistics
curl http://localhost:8002/api/training-metadata/statistics/overview

# Should return:
# {
#   "success": true,
#   "statistics": {
#     "totalGenerations": 1,
#     "byProvider": { "suno": 1 },
#     "withFeedback": 0,
#     "averageQualityScore": 0.5,
#     "usedForTraining": 0
#   }
# }
```

## Detailed Migration Steps

### 1. Verify Prerequisites

```bash
# Check Node.js version (need 18+)
node --version

# Check if Prisma is installed
npx prisma --version

# Check database connection
npx prisma db pull
```

### 2. Backup Database (Recommended)

```bash
# If using SQLite (default)
cp prisma/dev.db prisma/dev.db.backup

# If using PostgreSQL
pg_dump your_database > backup.sql
```

### 3. Run Migration

```bash
# Option A: Development migration (recommended)
npx prisma migrate dev --name add_training_metadata

# Option B: Production migration
npx prisma migrate deploy

# Option C: Force sync (if migrations are out of sync)
npx prisma db push
```

### 4. Verify Migration

```bash
# Check that TrainingMetadata table exists
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<SQL
SELECT COUNT(*) FROM TrainingMetadata;
SQL
```

### 5. Update Server Configuration

#### Option A: Express Server

```typescript
// src/backend/server.ts or app.ts
import express from 'express';
import trainingMetadataRoutes from './routes/training-metadata-routes';

const app = express();

// ... existing middleware ...

// Add training metadata routes
app.use('/api/training-metadata', trainingMetadataRoutes);

// ... rest of server setup ...
```

#### Option B: Existing AI Brain Server

The AI brain server already has music generation endpoints. No changes needed! Metadata capture is automatic when `userId` is passed.

### 6. Frontend Integration

#### Update Music Generation Calls

Before:
```typescript
const generateMusic = async (prompt: string, params: any) => {
  const response = await fetch('/api/v1/ai/dawg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...params }),
  });
  return response.json();
};
```

After:
```typescript
const generateMusic = async (prompt: string, params: any) => {
  const response = await fetch('/api/v1/ai/dawg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      ...params,
      userId: getCurrentUserId(), // ADD THIS
    }),
  });
  return response.json();
};
```

#### Add Feedback UI

```typescript
// When user likes/dislikes a generation
const submitFeedback = async (generationId: string, liked: boolean) => {
  await fetch(`/api/training-metadata/${generationId}/feedback`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked }),
  });
};

// When user adds to project (strong positive signal)
const markAsUsed = async (generationId: string) => {
  await fetch(`/api/training-metadata/${generationId}/feedback`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ used: true }),
  });
};
```

## Common Issues & Solutions

### Issue 1: Migration Fails - "Database is out of sync"

**Solution:**
```bash
# Option A: Reset database (DEV ONLY - deletes all data)
npx prisma migrate reset

# Option B: Force push schema
npx prisma db push --accept-data-loss

# Option C: Manually fix migration
npx prisma migrate resolve --applied <migration_name>
```

### Issue 2: TypeScript Errors After Migration

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VSCode
# Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Or restart your dev server
npm run dev
```

### Issue 3: Routes Not Found (404)

**Solution:**
```typescript
// Make sure routes are registered BEFORE error handlers
app.use('/api/training-metadata', trainingMetadataRoutes);

// Error handlers should come AFTER
app.use((err, req, res, next) => { ... });
```

### Issue 4: Metadata Not Saving

**Solution:**
```typescript
// Check that userId is being passed:
console.log('Request body:', req.body);

// Check database connection:
npx prisma studio

// Check service logs:
// Should see: "🔬 Saving generation metadata for training..."
// And: "✅ Metadata saved to training database"
```

### Issue 5: PrismaClient Not Found

**Solution:**
```bash
# Install Prisma dependencies
npm install @prisma/client
npm install -D prisma

# Generate client
npx prisma generate
```

## Rollback Plan

If you need to rollback:

### Step 1: Restore Database

```bash
# SQLite
mv prisma/dev.db.backup prisma/dev.db

# PostgreSQL
psql your_database < backup.sql
```

### Step 2: Revert Prisma Schema

```bash
# Reset to previous migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or manually edit prisma/schema.prisma
# Remove the TrainingMetadata model
```

### Step 3: Remove Route Registration

```typescript
// Comment out or remove:
// app.use('/api/training-metadata', trainingMetadataRoutes);
```

### Step 4: Restart Server

```bash
npm run dev
```

## Testing After Migration

### 1. Basic Functionality Test

```bash
# Generate music with metadata tracking
curl -X POST http://localhost:8002/api/v1/ai/dawg \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test beat",
    "genre": "trap",
    "tempo": 140,
    "userId": "test-user",
    "duration": 30
  }'

# Should return success with generationId
```

### 2. Metadata Retrieval Test

```bash
# Get statistics
curl http://localhost:8002/api/training-metadata/statistics/overview

# Should return non-zero totalGenerations
```

### 3. Feedback Test

```bash
# Update feedback (replace GEN_ID with actual ID from step 1)
curl -X PUT http://localhost:8002/api/training-metadata/GEN_ID/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "liked": true,
    "rating": 5,
    "feedback": "Great beat!",
    "used": true
  }'

# Should return success
```

### 4. Export Test

```bash
# Export to JSONL
curl http://localhost:8002/api/training-metadata/export/jsonl > training_data.jsonl

# Export to CSV
curl http://localhost:8002/api/training-metadata/export/csv > training_data.csv

# Check files
wc -l training_data.*
```

## Performance Verification

### Check Query Performance

```bash
# Open Prisma Studio
npx prisma studio

# Run queries and check speed:
# - Select all from TrainingMetadata
# - Filter by userId
# - Filter by provider
# - Order by createdAt

# All should be <100ms for 10,000 records
```

### Monitor Metadata Save Time

```typescript
// Check logs for:
// "✅ Metadata saved to training database"

// Should see this message within 1 second of generation completion
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Run full test suite
- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Verify all API endpoints work
- [ ] Check error handling
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerts

### Deployment Steps

```bash
# 1. Backup production DB
pg_dump production_db > prod_backup_$(date +%Y%m%d).sql

# 2. Deploy code
git push production main

# 3. Run migration
npx prisma migrate deploy

# 4. Verify migration
npx prisma db pull

# 5. Restart server
pm2 restart api-server

# 6. Monitor logs
pm2 logs api-server --lines 100

# 7. Test production endpoint
curl https://your-domain.com/api/training-metadata/statistics/overview
```

### Post-Deployment Monitoring

Monitor for 24 hours:
- Metadata save success rate (should be ~100%)
- API response times (should be unchanged)
- Database query performance
- Error logs
- User feedback submission rate

## Additional Resources

- **Full Documentation**: `/docs/AI_TRAINING_PIPELINE.md`
- **Implementation Summary**: `/docs/IMPLEMENTATION_SUMMARY.md`
- **API Reference**: `/src/backend/routes/training-metadata-routes.ts`
- **Service Code**: `/src/backend/services/training-metadata-service.ts`
- **Database Schema**: `/prisma/schema.prisma` (TrainingMetadata model)

## Support

If you encounter issues:

1. Check logs for error messages
2. Verify database connection
3. Ensure Prisma client is generated
4. Check that routes are registered
5. Verify userId is being passed in requests

Still stuck? Check the service files for inline comments and examples.

---

**Migration Version**: 1.0.0
**Last Updated**: 2025-10-18
**Estimated Migration Time**: 5-10 minutes
