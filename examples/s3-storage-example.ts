/**
 * S3 Storage Service - Usage Examples
 *
 * Demonstrates how to use the S3 storage service in DAWG AI
 */

import { getS3StorageService } from '../src/backend/services/s3-storage-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const s3Service = getS3StorageService();

// ============================================================================
// Example 1: Upload Audio File
// ============================================================================

async function uploadAudioExample() {
  console.log('\n=== Example 1: Upload Audio File ===\n');

  const userId = 'user-123';
  const fileName = 'my-recording.wav';

  // Simulate audio file buffer
  const audioBuffer = Buffer.from('fake audio data');

  // Generate unique storage key
  const storageKey = s3Service.generateStorageKey(
    userId,
    fileName,
    'recordings'
  );

  console.log('Storage key:', storageKey);

  // Upload to S3
  const uploadResult = await s3Service.uploadFile({
    file: audioBuffer,
    key: storageKey,
    contentType: 'audio/wav',
    metadata: {
      userId,
      duration: '180.5',
      sampleRate: '44100',
    },
    tags: {
      type: 'recording',
      project: 'my-project',
    },
  });

  if (uploadResult.success) {
    console.log('✅ Upload successful!');
    console.log('File URL:', uploadResult.url);
    console.log('File size:', uploadResult.size, 'bytes');
    console.log('ETag:', uploadResult.etag);

    // Save metadata to database
    const storedFile = await prisma.storedFile.create({
      data: {
        userId,
        fileName,
        originalName: fileName,
        storageKey,
        mimeType: 'audio/wav',
        size: audioBuffer.length,
        duration: 180.5,
        sampleRate: 44100,
        channels: 2,
        metadata: JSON.stringify({
          uploadedFrom: 'recording',
        }),
        tags: JSON.stringify(['recording', 'my-project']),
      },
    });

    console.log('📝 Metadata saved to database');
    console.log('File ID:', storedFile.id);
  } else {
    console.error('❌ Upload failed:', uploadResult.error);
  }
}

// ============================================================================
// Example 2: Download Audio File
// ============================================================================

async function downloadAudioExample() {
  console.log('\n=== Example 2: Download Audio File ===\n');

  const fileId = 'file-123';

  // Get file from database
  const storedFile = await prisma.storedFile.findUnique({
    where: { id: fileId },
  });

  if (!storedFile) {
    console.error('❌ File not found in database');
    return;
  }

  console.log('Found file:', storedFile.fileName);

  // Generate signed URL for download
  const signedUrlResult = await s3Service.getSignedUrl({
    key: storedFile.storageKey,
    expiresIn: 3600, // 1 hour
    contentType: storedFile.mimeType,
    contentDisposition: `attachment; filename="${storedFile.fileName}"`,
  });

  if (signedUrlResult.success) {
    console.log('✅ Download URL generated!');
    console.log('URL:', signedUrlResult.url);
    console.log('Expires at:', signedUrlResult.expiresAt);
    console.log('\nUser can download from this URL for 1 hour');
  } else {
    console.error('❌ Failed to generate URL:', signedUrlResult.error);
  }
}

// ============================================================================
// Example 3: List User Files
// ============================================================================

async function listFilesExample() {
  console.log('\n=== Example 3: List User Files ===\n');

  const userId = 'user-123';

  // Get files from database
  const files = await prisma.storedFile.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: { uploadedAt: 'desc' },
    take: 10,
  });

  console.log(`Found ${files.length} files for user ${userId}:\n`);

  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.fileName}`);
    console.log(`   Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Uploaded: ${file.uploadedAt.toLocaleString()}`);
    console.log(`   Storage key: ${file.storageKey}`);
    console.log('');
  });
}

// ============================================================================
// Example 4: Delete File
// ============================================================================

async function deleteFileExample() {
  console.log('\n=== Example 4: Delete File ===\n');

  const fileId = 'file-123';
  const userId = 'user-123';
  const permanent = true;

  // Get file
  const storedFile = await prisma.storedFile.findUnique({
    where: { id: fileId },
  });

  if (!storedFile) {
    console.error('❌ File not found');
    return;
  }

  // Check ownership
  if (storedFile.userId !== userId) {
    console.error('❌ Access denied');
    return;
  }

  console.log('Deleting file:', storedFile.fileName);

  if (permanent) {
    // Delete from S3
    const deleteResult = await s3Service.deleteFile({
      key: storedFile.storageKey,
    });

    if (deleteResult.success) {
      console.log('✅ Deleted from S3');

      // Delete from database
      await prisma.storedFile.delete({
        where: { id: fileId },
      });

      console.log('✅ Deleted from database');

      // Update quota
      await prisma.storageQuota.update({
        where: { userId },
        data: {
          usedSpace: { decrement: storedFile.size },
          fileCount: { decrement: 1 },
        },
      });

      console.log('✅ Updated storage quota');
    } else {
      console.error('❌ Failed to delete from S3:', deleteResult.error);
    }
  } else {
    // Soft delete
    await prisma.storedFile.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    console.log('✅ File marked as deleted (soft delete)');
  }
}

// ============================================================================
// Example 5: Multipart Upload (Large File)
// ============================================================================

async function multipartUploadExample() {
  console.log('\n=== Example 5: Multipart Upload (Large File) ===\n');

  const userId = 'user-123';
  const fileName = 'large-audio-file.wav';

  // Simulate large file (10MB)
  const largeFileSize = 10 * 1024 * 1024;
  const largeBuffer = Buffer.alloc(largeFileSize);

  console.log('File size:', (largeFileSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Will use multipart upload...\n');

  const storageKey = s3Service.generateStorageKey(
    userId,
    fileName,
    'large-files'
  );

  // Track progress
  let lastProgress = 0;
  const onProgress = (progress: any) => {
    const percent = progress.percentage.toFixed(1);
    if (progress.percentage - lastProgress >= 10) {
      console.log(
        `Progress: ${percent}% (Part ${progress.currentPart}/${progress.totalParts})`
      );
      lastProgress = progress.percentage;
    }
  };

  // Upload with progress tracking
  const uploadResult = await s3Service.uploadFile({
    file: largeBuffer,
    key: storageKey,
    contentType: 'audio/wav',
    metadata: {
      userId,
      isLargeFile: 'true',
    },
  });

  if (uploadResult.success) {
    console.log('\n✅ Large file upload complete!');
    console.log('Total size:', (uploadResult.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('ETag:', uploadResult.etag);
  } else {
    console.error('\n❌ Upload failed:', uploadResult.error);
  }
}

// ============================================================================
// Example 6: Storage Quota Management
// ============================================================================

async function storageQuotaExample() {
  console.log('\n=== Example 6: Storage Quota Management ===\n');

  const userId = 'user-123';

  // Get or create quota
  let quota = await prisma.storageQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await prisma.storageQuota.create({
      data: {
        userId,
        totalLimit: 1073741824, // 1GB
        usedSpace: 0,
        fileCount: 0,
      },
    });
    console.log('Created new quota for user');
  }

  console.log('Storage Quota:');
  console.log('  Total limit:', (quota.totalLimit / 1024 / 1024).toFixed(0), 'MB');
  console.log('  Used space:', (quota.usedSpace / 1024 / 1024).toFixed(2), 'MB');
  console.log('  Available:', ((quota.totalLimit - quota.usedSpace) / 1024 / 1024).toFixed(2), 'MB');
  console.log('  File count:', quota.fileCount);
  console.log('  Usage:', ((quota.usedSpace / quota.totalLimit) * 100).toFixed(1), '%');

  // Check if quota exceeded
  if (quota.usedSpace >= quota.totalLimit) {
    console.log('\n⚠️  WARNING: Storage quota exceeded!');
  } else if (quota.usedSpace >= quota.totalLimit * 0.9) {
    console.log('\n⚠️  WARNING: Storage quota almost full (>90%)');
  } else {
    console.log('\n✅ Storage quota OK');
  }
}

// ============================================================================
// Example 7: Copy/Rename File
// ============================================================================

async function copyFileExample() {
  console.log('\n=== Example 7: Copy/Rename File ===\n');

  const fileId = 'file-123';
  const newName = 'renamed-file.wav';

  // Get file
  const storedFile = await prisma.storedFile.findUnique({
    where: { id: fileId },
  });

  if (!storedFile) {
    console.error('❌ File not found');
    return;
  }

  console.log('Original name:', storedFile.fileName);
  console.log('New name:', newName);

  // Generate new storage key
  const newStorageKey = s3Service.generateStorageKey(
    storedFile.userId,
    newName,
    'renamed'
  );

  // Copy file in S3
  const copyResult = await s3Service.copyFile(
    storedFile.storageKey,
    newStorageKey
  );

  if (copyResult.success) {
    console.log('✅ File copied in S3');

    // Update database (or create new record)
    await prisma.storedFile.update({
      where: { id: fileId },
      data: {
        fileName: newName,
        storageKey: newStorageKey,
      },
    });

    console.log('✅ Database updated');
  } else {
    console.error('❌ Copy failed:', copyResult.error);
  }
}

// ============================================================================
// Example 8: Check File Exists
// ============================================================================

async function checkFileExistsExample() {
  console.log('\n=== Example 8: Check File Exists ===\n');

  const storageKey = 'uploads/user-123/1234567890-abc123-audio.mp3';

  const exists = await s3Service.fileExists(storageKey);

  if (exists) {
    console.log('✅ File exists in S3:', storageKey);

    // Get metadata
    const metadata = await s3Service.getFileMetadata(storageKey);

    if (metadata.success) {
      console.log('\nFile metadata:');
      console.log('  Content-Type:', metadata.metadata?.contentType);
      console.log('  Size:', metadata.metadata?.contentLength, 'bytes');
      console.log('  Last Modified:', metadata.metadata?.lastModified);
      console.log('  ETag:', metadata.metadata?.etag);
    }
  } else {
    console.log('❌ File does not exist:', storageKey);
  }
}

// ============================================================================
// Example 9: Integration with Audio Recording
// ============================================================================

async function recordingIntegrationExample() {
  console.log('\n=== Example 9: Integration with Audio Recording ===\n');

  const userId = 'user-123';
  const projectId = 'project-456';

  // Simulate audio recording buffer
  const audioBuffer = {
    sampleRate: 44100,
    numberOfChannels: 2,
    duration: 120.5,
    length: 5308800,
    getChannelData: (channel: number) => new Float32Array(5308800),
  };

  console.log('Recording details:');
  console.log('  Sample rate:', audioBuffer.sampleRate, 'Hz');
  console.log('  Channels:', audioBuffer.numberOfChannels);
  console.log('  Duration:', audioBuffer.duration.toFixed(1), 'seconds');

  // Export as WAV (simplified)
  const wavData = Buffer.alloc(audioBuffer.length * 4); // Float32 = 4 bytes

  // Upload to S3
  const storageKey = s3Service.generateStorageKey(
    userId,
    'recording.wav',
    `projects/${projectId}/recordings`
  );

  const uploadResult = await s3Service.uploadFile({
    file: wavData,
    key: storageKey,
    contentType: 'audio/wav',
    metadata: {
      userId,
      projectId,
      duration: audioBuffer.duration.toString(),
      sampleRate: audioBuffer.sampleRate.toString(),
      channels: audioBuffer.numberOfChannels.toString(),
    },
    tags: {
      type: 'recording',
      project: projectId,
    },
  });

  if (uploadResult.success) {
    console.log('\n✅ Recording saved to S3!');

    // Save to database
    const storedFile = await prisma.storedFile.create({
      data: {
        userId,
        projectId,
        fileName: 'recording.wav',
        originalName: 'recording.wav',
        storageKey,
        mimeType: 'audio/wav',
        size: wavData.length,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        metadata: JSON.stringify({
          recordedAt: new Date().toISOString(),
        }),
      },
    });

    console.log('📝 Recording metadata saved');
    console.log('File ID:', storedFile.id);

    // Update quota
    await prisma.storageQuota.update({
      where: { userId },
      data: {
        usedSpace: { increment: wavData.length },
        fileCount: { increment: 1 },
      },
    });

    console.log('✅ Storage quota updated');
  } else {
    console.error('❌ Failed to save recording:', uploadResult.error);
  }
}

// ============================================================================
// Run All Examples
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   DAWG AI - S3 Storage Service Examples                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    // Run examples
    await uploadAudioExample();
    await downloadAudioExample();
    await listFilesExample();
    await deleteFileExample();
    await multipartUploadExample();
    await storageQuotaExample();
    await copyFileExample();
    await checkFileExistsExample();
    await recordingIntegrationExample();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  uploadAudioExample,
  downloadAudioExample,
  listFilesExample,
  deleteFileExample,
  multipartUploadExample,
  storageQuotaExample,
  copyFileExample,
  checkFileExistsExample,
  recordingIntegrationExample,
};
