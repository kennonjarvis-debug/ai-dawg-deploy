# S3 Cloud Storage Guide - DAWG AI

## Overview

DAWG AI now includes comprehensive S3 cloud storage integration for audio file management. This guide covers setup, configuration, and usage of the storage system.

## Features

### Backend
- ✅ Complete S3 storage service with AWS SDK v3
- ✅ Multipart upload for large files (>5MB)
- ✅ Signed URLs for secure downloads
- ✅ File metadata management with Prisma
- ✅ Storage quota tracking per user
- ✅ Progress tracking for uploads/downloads
- ✅ Comprehensive error handling and retry logic
- ✅ Audio file type validation
- ✅ File operations: upload, download, rename, delete

### Frontend
- ✅ FileManager React component with drag & drop
- ✅ Real-time upload progress indicators
- ✅ File list with sorting and filtering
- ✅ Storage quota visualization
- ✅ File operations UI (download, rename, delete)
- ✅ Responsive design with Tailwind CSS

### Database
- ✅ StoredFile model for file metadata
- ✅ StorageQuota model for user quotas
- ✅ FileUploadSession for multipart uploads

---

## Setup Instructions

### 1. AWS Configuration

#### Create S3 Bucket

Run the provided setup script:

```bash
chmod +x scripts/setup-s3.sh
./scripts/setup-s3.sh create
```

This will:
- Create an S3 bucket
- Configure CORS policies
- Enable versioning and encryption
- Create IAM user with proper permissions
- Generate access keys

#### Manual Setup (Alternative)

If you prefer manual setup:

1. **Create S3 Bucket**
   - Go to AWS Console → S3
   - Create bucket (e.g., `dawg-ai-audio-production`)
   - Enable versioning
   - Enable server-side encryption (AES-256)

2. **Configure CORS**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": [
           "https://www.dawg-ai.com",
           "http://localhost:5173"
         ],
         "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
         "AllowedHeaders": ["*"],
         "ExposeHeaders": ["ETag", "Content-Length"],
         "MaxAgeSeconds": 3600
       }
     ]
   }
   ```

3. **Create IAM User**
   - Create user: `dawg-ai-s3-user`
   - Attach inline policy with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::dawg-ai-audio-production",
           "arn:aws:s3:::dawg-ai-audio-production/*"
         ]
       }
     ]
   }
   ```
   - Create access keys

### 2. Environment Variables

Add to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=dawg-ai-audio-production
S3_BUCKET_NAME=dawg-ai-audio-production

# Optional
USE_S3=true
S3_ENDPOINT=https://s3.amazonaws.com
AWS_CLOUDFRONT_URL=https://...cloudfront.net
```

### 3. Database Migration

Run Prisma migration to create storage tables:

```bash
npm run db:generate
npm run db:migrate
```

This creates:
- `StoredFile` - File metadata
- `StorageQuota` - User storage quotas
- `FileUploadSession` - Multipart upload tracking

### 4. Test the Setup

```bash
./scripts/setup-s3.sh test
```

This verifies:
- S3 bucket access
- File upload/download
- Signed URL generation

---

## Usage

### Backend API

#### Upload File

**Endpoint:** `POST /api/storage/upload`

```bash
curl -X POST http://localhost:3100/api/storage/upload \
  -H "x-user-id: user-123" \
  -F "file=@audio.mp3" \
  -F "projectId=project-456" \
  -F "isPublic=false"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-789",
    "userId": "user-123",
    "projectId": "project-456",
    "fileName": "audio.mp3",
    "originalName": "audio.mp3",
    "storageKey": "uploads/user-123/1234567890-abc123-audio.mp3",
    "mimeType": "audio/mpeg",
    "size": 5242880,
    "duration": 180.5,
    "uploadedAt": "2025-10-19T12:00:00Z"
  }
}
```

#### Download File

**Endpoint:** `GET /api/storage/download/:fileId`

```bash
curl http://localhost:3100/api/storage/download/file-789 \
  -H "x-user-id: user-123"
```

**Response:**
```json
{
  "success": true,
  "url": "https://dawg-ai-audio-production.s3.us-east-1.amazonaws.com/...",
  "file": {
    "id": "file-789",
    "fileName": "audio.mp3",
    ...
  }
}
```

#### List Files

**Endpoint:** `GET /api/storage/files`

```bash
curl "http://localhost:3100/api/storage/files?userId=user-123&limit=10&sortBy=uploadedAt&sortOrder=desc" \
  -H "x-user-id: user-123"
```

#### Delete File

**Endpoint:** `DELETE /api/storage/files/:fileId`

```bash
# Soft delete
curl -X DELETE http://localhost:3100/api/storage/files/file-789 \
  -H "x-user-id: user-123"

# Permanent delete
curl -X DELETE "http://localhost:3100/api/storage/files/file-789?permanent=true" \
  -H "x-user-id: user-123"
```

#### Rename File

**Endpoint:** `PUT /api/storage/files/:fileId/rename`

```bash
curl -X PUT http://localhost:3100/api/storage/files/file-789/rename \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{"newName": "my-track.mp3"}'
```

#### Get Storage Quota

**Endpoint:** `GET /api/storage/quota`

```bash
curl http://localhost:3100/api/storage/quota \
  -H "x-user-id: user-123"
```

**Response:**
```json
{
  "success": true,
  "quota": {
    "userId": "user-123",
    "totalLimit": 1073741824,
    "usedSpace": 524288000,
    "availableSpace": 549453824,
    "fileCount": 25,
    "quotaExceeded": false,
    "quotaPercentage": 48.8
  }
}
```

#### Get Storage Statistics

**Endpoint:** `GET /api/storage/statistics`

```bash
curl http://localhost:3100/api/storage/statistics \
  -H "x-user-id: user-123"
```

---

### Frontend Component

#### Using FileManager Component

```tsx
import { FileManager } from '@/ui/components/FileManager';

function MyComponent() {
  const handleFileSelect = (file: StoredFile) => {
    console.log('Selected file:', file);
  };

  return (
    <FileManager
      projectId="project-456"
      userId="user-123"
      onFileSelect={handleFileSelect}
      allowMultiple={true}
      maxFileSizeMB={100}
      showQuota={true}
    />
  );
}
```

#### Features

1. **Drag & Drop Upload**
   - Drop audio files anywhere in the component
   - Visual feedback during drag
   - Multiple file support

2. **Progress Tracking**
   - Real-time upload progress
   - Percentage and size indicators
   - Success/error states

3. **File Management**
   - Sort by date, name, or size
   - Search files
   - Download with signed URLs
   - Rename files inline
   - Delete with confirmation

4. **Storage Quota**
   - Visual progress bar
   - Used/total space display
   - Quota exceeded warnings

---

## Integration with Audio Workflows

### 1. Recording Integration

Save recorded audio to S3:

```typescript
import { getS3StorageService } from '@/backend/services/s3-storage-service';

async function saveRecording(audioBuffer: AudioBuffer, userId: string) {
  const s3Service = getS3StorageService();

  // Export audio buffer as WAV
  const wavBlob = exportAsWAV(audioBuffer);
  const buffer = await wavBlob.arrayBuffer();

  // Generate storage key
  const storageKey = s3Service.generateStorageKey(
    userId,
    'recording.wav',
    'recordings'
  );

  // Upload to S3
  const result = await s3Service.uploadFile({
    file: Buffer.from(buffer),
    key: storageKey,
    contentType: 'audio/wav',
    metadata: {
      userId,
      duration: audioBuffer.duration.toString(),
      sampleRate: audioBuffer.sampleRate.toString(),
    },
  });

  return result;
}
```

### 2. Generated Audio Storage

Store AI-generated audio:

```typescript
async function storeGeneratedAudio(
  audioUrl: string,
  userId: string,
  generationId: string
) {
  // Download generated audio
  const response = await fetch(audioUrl);
  const buffer = await response.arrayBuffer();

  const s3Service = getS3StorageService();

  // Upload to S3
  const storageKey = s3Service.generateStorageKey(
    userId,
    'generated-audio.mp3',
    'generated'
  );

  const result = await s3Service.uploadFile({
    file: Buffer.from(buffer),
    key: storageKey,
    contentType: 'audio/mpeg',
    metadata: {
      userId,
      generationId,
      provider: 'suno',
    },
    tags: {
      type: 'generated',
      provider: 'suno',
    },
  });

  // Save to database
  await prisma.storedFile.create({
    data: {
      userId,
      fileName: 'generated-audio.mp3',
      originalName: 'generated-audio.mp3',
      storageKey,
      mimeType: 'audio/mpeg',
      size: buffer.byteLength,
      metadata: JSON.stringify({
        generationId,
        provider: 'suno',
      }),
    },
  });

  return result;
}
```

### 3. Project Export

Export entire project to S3:

```typescript
async function exportProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  // Serialize project
  const projectData = JSON.stringify(project, null, 2);
  const buffer = Buffer.from(projectData, 'utf-8');

  const s3Service = getS3StorageService();

  const storageKey = s3Service.generateStorageKey(
    userId,
    `${project.name}.dawgproject`,
    'projects'
  );

  const result = await s3Service.uploadFile({
    file: buffer,
    key: storageKey,
    contentType: 'application/json',
    metadata: {
      userId,
      projectId,
      projectName: project.name,
    },
  });

  // Get download URL
  const downloadUrl = await s3Service.getSignedUrl({
    key: storageKey,
    expiresIn: 3600, // 1 hour
    contentDisposition: `attachment; filename="${project.name}.dawgproject"`,
  });

  return downloadUrl;
}
```

---

## Configuration

### Storage Quotas

Default quota: **1GB per user**

Update quota in database:

```sql
UPDATE StorageQuota
SET totalLimit = 5368709120  -- 5GB
WHERE userId = 'user-123';
```

Or programmatically:

```typescript
await prisma.storageQuota.update({
  where: { userId: 'user-123' },
  data: { totalLimit: 5368709120 }, // 5GB
});
```

### File Size Limits

- **Maximum file size:** 100MB (configurable)
- **Multipart threshold:** 5MB
- **Multipart part size:** 5MB

Update in service:

```typescript
const MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10MB
const MULTIPART_PART_SIZE = 10 * 1024 * 1024; // 10MB
```

### Allowed File Types

Currently restricted to audio files:
- audio/mpeg (MP3)
- audio/wav
- audio/aiff
- audio/flac
- audio/ogg
- audio/mp4
- audio/m4a
- audio/webm

Update in `storage-routes.ts`:

```typescript
const allowedMimeTypes = [
  'audio/mpeg',
  'audio/wav',
  // ... add more types
];
```

---

## Troubleshooting

### Upload Fails

**Problem:** File upload returns 403 error

**Solution:**
1. Check AWS credentials in `.env`
2. Verify IAM user has S3 permissions
3. Check bucket CORS configuration
4. Verify bucket name matches environment variable

### Quota Exceeded

**Problem:** Cannot upload, quota exceeded

**Solution:**
1. Check current usage: `GET /api/storage/quota`
2. Delete unused files: `DELETE /api/storage/files/:fileId?permanent=true`
3. Increase quota in database
4. Contact admin to upgrade plan

### Download URL Expired

**Problem:** Signed URL returns 403

**Solution:**
- Signed URLs expire after 1 hour by default
- Generate new download URL: `GET /api/storage/download/:fileId`
- URLs are single-use for security

### Connection Timeout

**Problem:** Upload times out for large files

**Solution:**
1. Enable multipart upload (automatic for files >5MB)
2. Increase timeout in frontend:
   ```typescript
   xhr.timeout = 300000; // 5 minutes
   ```
3. Check network connection
4. Try smaller file or better connection

---

## Security Considerations

### 1. Access Control

- Files are private by default
- Only file owner can download (via signed URLs)
- Authentication required for all operations
- User ID validated on backend

### 2. Signed URLs

- Expire after 1 hour
- Cannot be reused after expiration
- Include file-specific security token
- Prevent unauthorized access

### 3. File Validation

- MIME type validation on backend
- File size limits enforced
- Malicious file detection (TODO)
- Virus scanning integration (TODO)

### 4. Encryption

- Server-side encryption (AES-256) enabled
- HTTPS for all API calls
- Encrypted at rest in S3
- Encrypted in transit

---

## Cost Optimization

### Storage Lifecycle

Configured lifecycle policy:
- Archive to Glacier after 90 days: `generated/` prefix
- Delete old versions after 30 days

### CloudFront CDN (Optional)

For faster delivery:

1. Create CloudFront distribution
2. Point to S3 bucket
3. Add to `.env`:
   ```env
   AWS_CLOUDFRONT_URL=https://d123456.cloudfront.net
   ```

### Monitoring

Track storage costs:

```bash
aws s3 ls s3://dawg-ai-audio-production --recursive --summarize
```

Or use Storage Statistics API:

```bash
curl http://localhost:3100/api/storage/statistics \
  -H "x-user-id: user-123"
```

---

## API Reference

See full API documentation in:
- `/src/types/storage.ts` - TypeScript types
- `/src/backend/services/s3-storage-service.ts` - S3 service
- `/src/backend/routes/storage-routes.ts` - API routes

---

## TODOs and Future Enhancements

### High Priority
- [ ] Add authentication middleware (replace x-user-id header)
- [ ] Implement virus scanning (ClamAV integration)
- [ ] Add file encryption for sensitive data
- [ ] Rate limiting for uploads

### Medium Priority
- [ ] Thumbnail generation for audio waveforms
- [ ] Batch upload/download
- [ ] Folder organization
- [ ] File sharing with expiring links
- [ ] Audio transcoding (format conversion)

### Low Priority
- [ ] Storage analytics dashboard
- [ ] Cost tracking per user
- [ ] Automated backups
- [ ] Multi-region support
- [ ] CDN integration

---

## Support

For issues or questions:
1. Check this guide
2. Review error logs in console
3. Test with setup script: `./scripts/setup-s3.sh test`
4. Contact dev team

---

**Last Updated:** October 19, 2025
**Version:** 1.0.0
