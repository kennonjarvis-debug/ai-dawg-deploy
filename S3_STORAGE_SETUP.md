# DAWG AI - S3 Audio Storage Setup Guide

## Overview
DAWG AI uses AWS S3 (or compatible services) for cloud audio file storage. This guide covers setup for AWS S3, Cloudflare R2, and Supabase Storage.

**Stage:** 6.4 - S3 Storage ✅

---

## Quick Start (AWS S3)

### 1. Create S3 Bucket

**AWS Console:**
1. Go to: https://s3.console.aws.amazon.com
2. Click "Create bucket"
3. **Bucket name:** `dawg-ai-recordings-prod` (or your choice)
4. **Region:** `us-east-1` (or closest to users)
5. **Block Public Access:** Keep enabled (we use signed URLs)
6. Click "Create bucket"

### 2. Create IAM User

**AWS IAM Console:**
1. Go to: https://console.aws.amazon.com/iam/
2. Users → Add users
3. **Username:** `dawg-ai-s3-user`
4. **Access type:** Programmatic access
5. **Permissions:** Attach policy: `AmazonS3FullAccess` (or custom policy below)
6. Copy **Access Key ID** and **Secret Access Key**

**Custom IAM Policy (Recommended):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::dawg-ai-recordings-prod/*"
    }
  ]
}
```

### 3. Configure Environment Variables

Update `.env.local`:

```bash
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=abc123...
AWS_S3_BUCKET=dawg-ai-recordings-prod
```

### 4. Test Upload

```bash
curl -X POST http://localhost:3000/api/audio/upload \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -F "file=@test-audio.webm" \
  -F "projectId=test-project-123" \
  -F "recordingId=test-recording-456"
```

---

## Alternative: Cloudflare R2

Cloudflare R2 is S3-compatible with **zero egress fees**.

### 1. Create R2 Bucket

**Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com/
2. R2 → Create bucket
3. **Bucket name:** `dawg-ai-recordings`
4. **Location:** Automatic

### 2. Create API Token

1. R2 → Manage R2 API Tokens
2. Create API token
3. **Permissions:** Object Read & Write
4. Copy **Access Key ID** and **Secret Access Key**

### 3. Configure Environment Variables

Update `.env.local`:

```bash
# Cloudflare R2 (S3-compatible)
AWS_REGION=auto
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
AWS_S3_BUCKET=dawg-ai-recordings

# R2 Endpoint (uncomment and update s3-client.ts)
# R2_ACCOUNT_ID=your_account_id
# R2_ENDPOINT=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

**Update `/lib/storage/s3-client.ts`:**
```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT, // Add this line
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
```

---

## Alternative: Supabase Storage

### 1. Create Supabase Bucket

**Supabase Dashboard:**
1. Go to: https://app.supabase.com
2. Storage → Create bucket
3. **Bucket name:** `audio-recordings`
4. **Public:** No (private bucket)

### 2. Get API Keys

1. Settings → API
2. Copy **URL** and **anon key**

### 3. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 4. Update S3 Client

Create `/lib/storage/supabase-client.ts` (separate implementation).

---

## API Endpoints

### POST /api/audio/upload

Upload audio file to S3.

**Request (multipart/form-data):**
```typescript
{
  file: File;           // Audio file (webm, wav, mp3)
  projectId: string;    // Project ID
  recordingId: string;  // Recording ID
  contentType?: string; // MIME type (optional)
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://dawg-ai-recordings.s3.us-east-1.amazonaws.com/users/.../recording.webm",
  "key": "users/user123/projects/proj456/recordings/rec789.webm",
  "size": 524288,
  "contentType": "audio/webm"
}
```

**Limits:**
- Max file size: 100MB
- Allowed types: `audio/webm`, `audio/wav`, `audio/mpeg`, `audio/mp3`

---

### GET /api/audio/url

Generate signed URL for audio download.

**Query Parameters:**
- `key` or `url` - S3 key or full URL
- `expiresIn` - Expiration time in seconds (default: 3600)
- `recordingId` - Optional, for ownership verification

**Example:**
```bash
curl "http://localhost:3000/api/audio/url?key=users/user123/projects/proj456/recordings/rec789.webm&expiresIn=7200"
```

**Response:**
```json
{
  "success": true,
  "url": "https://dawg-ai-recordings.s3.amazonaws.com/...?X-Amz-Algorithm=...",
  "expiresIn": 7200,
  "expiresAt": "2025-10-02T22:00:00Z"
}
```

---

### DELETE /api/audio/delete

Delete audio file from S3.

**Request Body:**
```typescript
{
  key?: string;         // S3 key
  url?: string;         // Full S3 URL (alternative)
  recordingId?: string; // Recording ID (deletes from DB too)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audio file deleted successfully"
}
```

---

## Frontend Integration

### 1. Upload Audio Recording

```typescript
// After recording
async function uploadRecording(blob: Blob, projectId: string, recordingId: string) {
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');
  formData.append('projectId', projectId);
  formData.append('recordingId', recordingId);

  const response = await fetch('/api/audio/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.url; // Store this in Recording.audioUrl
}
```

### 2. Play Audio from S3

```typescript
// Get signed URL before playback
async function getAudioUrl(recordingId: string) {
  const response = await fetch(
    `/api/audio/url?recordingId=${recordingId}&expiresIn=3600`
  );
  const data = await response.json();
  return data.url; // Use this URL in <audio> tag
}

// Play audio
const signedUrl = await getAudioUrl('rec123');
audioElement.src = signedUrl;
audioElement.play();
```

### 3. Delete Audio

```typescript
async function deleteRecording(recordingId: string) {
  const response = await fetch('/api/audio/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordingId }),
  });

  return response.json();
}
```

---

## File Organization

### S3 Key Structure

```
users/{userId}/
  projects/{projectId}/
    recordings/
      {recordingId}.webm
      {recordingId}.wav
      {recordingId}.mp3
```

**Example:**
```
users/cld123/projects/proj456/recordings/rec789.webm
```

### Benefits
- ✅ Easy to identify ownership
- ✅ Easy to delete all user data
- ✅ Easy to list project recordings
- ✅ Supports multiple takes per recording

---

## Cost Estimation

### AWS S3
- **Storage:** $0.023 per GB/month
- **PUT requests:** $0.005 per 1,000 requests
- **GET requests:** $0.0004 per 1,000 requests
- **Data transfer out:** $0.09 per GB (first 10TB)

**Example (1,000 users, 10 recordings each, 2MB average):**
- Storage: 20GB × $0.023 = **$0.46/month**
- Uploads: 10,000 × $0.000005 = **$0.05/month**
- Downloads: 50,000 × $0.0000004 = **$0.02/month**
- **Total:** ~$0.53/month

### Cloudflare R2
- **Storage:** $0.015 per GB/month
- **Class A operations:** $4.50 per million (writes)
- **Class B operations:** $0.36 per million (reads)
- **Data transfer:** **$0.00 (zero egress fees!)**

**Same example:**
- Storage: 20GB × $0.015 = **$0.30/month**
- **Total:** ~$0.30/month **(45% cheaper + no egress)**

### Supabase Storage
- **Free tier:** 1GB storage + 2GB bandwidth
- **Pro tier ($25/month):** 100GB storage + 200GB bandwidth

---

## Security Best Practices

### 1. Bucket Access
- ✅ Keep bucket private (no public access)
- ✅ Use signed URLs for downloads
- ✅ Set short expiration times (1-2 hours)

### 2. IAM Permissions
- ✅ Use least-privilege IAM policy
- ✅ Only allow PutObject, GetObject, DeleteObject
- ✅ Restrict to specific bucket ARN

### 3. CORS Configuration
Add CORS policy to bucket for browser uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 4. Validation
- ✅ Verify file type and size on server
- ✅ Verify user owns project before upload/delete
- ✅ Sanitize filenames

---

## Troubleshooting

### "S3 credentials not configured"
```bash
# Check environment variables are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_S3_BUCKET

# Restart dev server
npm run dev
```

### "Access Denied" on upload
- Verify IAM user has `s3:PutObject` permission
- Check bucket policy allows IAM user
- Verify bucket name matches `.env.local`

### "CORS error" in browser
- Add CORS policy to S3 bucket
- Include your domain in `AllowedOrigins`
- Restart browser to clear cache

### Signed URLs not working
- Check URL hasn't expired
- Verify `AWS_REGION` matches bucket region
- Use signed URL immediately (don't cache long-term)

---

## Migration Strategy

### From Local Storage to S3

**Option 1: Background Migration**
1. Keep existing local files
2. Upload new recordings to S3
3. Gradually migrate old recordings

**Option 2: On-Demand Migration**
1. Check if `Recording.audioUrl` is S3 URL
2. If not, upload to S3 and update DB
3. Delete local file after successful upload

**Script:**
```typescript
// migrate-to-s3.ts
import prisma from '@/lib/db/prisma';
import { uploadAudioToS3 } from '@/lib/storage/s3-client';
import fs from 'fs';

async function migrateRecording(recordingId: string) {
  const recording = await prisma.recording.findUnique({
    where: { id: recordingId },
    include: { track: { include: { project: true } } },
  });

  // Skip if already on S3
  if (recording.audioUrl.includes('s3.amazonaws.com')) {
    return;
  }

  // Read local file
  const localPath = recording.audioUrl;
  const fileBuffer = fs.readFileSync(localPath);

  // Upload to S3
  const userId = recording.track.project.userId;
  const s3Url = await uploadAudioToS3(/* ... */);

  // Update database
  await prisma.recording.update({
    where: { id: recordingId },
    data: { audioUrl: s3Url },
  });

  // Delete local file
  fs.unlinkSync(localPath);
}
```

---

## Next Steps

### For Instance 1 (Frontend)
1. Update `useRecording` hook to upload to S3
2. Update `usePlayback` hook to use signed URLs
3. Add upload progress indicator
4. Handle upload errors gracefully
5. Cache signed URLs (1 hour expiration)

### For Instance 4 (Backend)
**Option A: Stage 6.3 - Auto-save**
- Implement auto-save every 30 seconds
- Include S3 URLs in saved projects

**Option B: Cleanup Jobs**
- Delete orphaned S3 files (recordings not in DB)
- Compress old recordings
- Archive inactive projects

---

**Status:** ✅ S3 Storage complete
**Waiting on:** Instance 1 (frontend integration)
**Last Updated:** 2025-10-02
