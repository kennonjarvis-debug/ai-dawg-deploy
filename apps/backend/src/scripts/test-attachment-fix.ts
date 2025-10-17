#!/usr/bin/env tsx
/**
 * Test Apple Notes attachment fix for duplicate bug
 */

import { appleNotesSyncService } from '../services/notes/apple-notes-sync.service.js';

const TEST_FILE = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/20251011 095953-2E1707E1.m4a';

async function testAttachmentFix() {
  console.log('🧪 Testing Apple Notes attachment fix...\n');

  const result = await appleNotesSyncService.createNote(
    'TEST - Attachment Fix Verification',
    'This note should have EXACTLY ONE audio attachment.<br><br>If you see two attachments, the fix did not work.',
    'JARVIS',
    TEST_FILE
  );

  if (result.success) {
    console.log('✅ Note created successfully');
    console.log(`📝 Note ID: ${result.noteId}`);
    console.log('\n🔍 MANUAL VERIFICATION REQUIRED:');
    console.log('   1. Open Apple Notes app');
    console.log('   2. Go to JARVIS folder');
    console.log('   3. Find note: "TEST - Attachment Fix Verification"');
    console.log('   4. Count the audio file attachments');
    console.log('   5. Expected: ONE audio file');
    console.log('   6. If you see TWO audio files, the fix failed\n');
  } else {
    console.error(`❌ Failed to create note: ${result.error}`);
  }
}

testAttachmentFix().catch(console.error);
