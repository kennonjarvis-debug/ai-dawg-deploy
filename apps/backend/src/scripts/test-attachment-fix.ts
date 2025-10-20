#!/usr/bin/env tsx
/**
 * Test Apple Notes attachment fix for duplicate bug
 */

import { appleNotesSyncService } from '../services/notes/apple-notes-sync.service.js';
import { logger } from '../../../src/lib/utils/logger.js';

const TEST_FILE = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/20251011 095953-2E1707E1.m4a';

async function testAttachmentFix() {
  logger.info('🧪 Testing Apple Notes attachment fix...\n');

  const result = await appleNotesSyncService.createNote(
    'TEST - Attachment Fix Verification',
    'This note should have EXACTLY ONE audio attachment.<br><br>If you see two attachments, the fix did not work.',
    'JARVIS',
    TEST_FILE
  );

  if (result.success) {
    logger.info('✅ Note created successfully');
    logger.info('📝 Note ID: ${result.noteId}');
    logger.info('\n🔍 MANUAL VERIFICATION REQUIRED:');
    logger.info('   1. Open Apple Notes app');
    logger.info('   2. Go to JARVIS folder');
    console.log('   3. Find note: "TEST - Attachment Fix Verification"');
    logger.info('   4. Count the audio file attachments');
    logger.info('   5. Expected: ONE audio file');
    logger.info('   6. If you see TWO audio files, the fix failed\n');
  } else {
    logger.error('❌ Failed to create note: ${result.error}');
  }
}

testAttachmentFix().catch(console.error);
