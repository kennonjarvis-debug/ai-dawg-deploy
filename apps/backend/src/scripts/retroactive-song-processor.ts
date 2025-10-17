#!/usr/bin/env tsx
/**
 * Retroactive Song Processor
 * Goes newest → oldest, completes songs, only creates full songs
 */

import fs from 'fs';
import path from 'path';
import { transcriptionService } from '../services/notes/transcription.service.js';
import { lyricParserService } from '../services/notes/lyric-parser.service.js';
import { songCompletionService } from '../services/notes/song-completion.service.js';
import { appleNotesSyncService } from '../services/notes/apple-notes-sync.service.js';
import { vocalSeparationService } from '../services/notes/vocal-separation.service.js';
import { audioAnalysisService } from '../services/notes/audio-analysis.service.js';
import { beatGenerationService } from '../services/notes/beat-generation.service.js';
import { dynamicsProcessingService } from '../services/notes/dynamics-processing.service.js';

const VOICE_MEMOS_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
const BATCH_SIZE = 10;

interface ProcessedFile {
  fileName: string;
  filePath: string;
  timestamp: Date;
  processed: boolean;
  completable?: boolean;
  reason?: string;
}

/**
 * Get all voice memo files sorted newest to oldest
 */
function getVoiceMemoFiles(): ProcessedFile[] {
  // Recursively find all .m4a files
  function findM4aFiles(dir: string): string[] {
    let results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findM4aFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.m4a') && !entry.name.includes('_VOCALS_ONLY')) {
        results.push(fullPath);
      }
    }

    return results;
  }

  const allFiles = findM4aFiles(VOICE_MEMOS_PATH);

  const files = allFiles.map(filePath => {
    const file = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const metadataPath = filePath.replace('.m4a', '_metadata.json');

    let processed = false;
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        processed = metadata.songCompleted === true || metadata.songCompleted === false;
      } catch (e) {
        // Ignore metadata read errors
      }
    }

    return {
      fileName: file,
      filePath,
      timestamp: stats.birthtime,
      processed,
    };
  });

  // Sort newest to oldest
  files.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return files;
}

/**
 * Extract song title from completed lyrics (first line of first chorus)
 */
function extractSongTitle(completedLyrics: string): string {
  // Try to find chorus
  const chorusMatch = completedLyrics.match(/\[Chorus\]\s*\n(.*?)(?:\n|$)/);
  if (chorusMatch && chorusMatch[1]) {
    const firstLine = chorusMatch[1].trim();
    // Take first 2-4 words
    const words = firstLine.split(/\s+/).filter(w => w.length > 0);
    const titleWords = words.slice(0, Math.min(4, words.length));

    // Capitalize each word
    return titleWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // Fallback: use first line of any section
  const firstLineMatch = completedLyrics.match(/\]\s*\n(.*?)(?:\n|$)/);
  if (firstLineMatch && firstLineMatch[1]) {
    const words = firstLineMatch[1].trim().split(/\s+/).slice(0, 3);
    return words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Untitled';
}

/**
 * Process a single voice memo
 */
async function processVoiceMemo(file: ProcessedFile): Promise<void> {
  console.log(`\n🎵 Processing: ${file.fileName}`);

  try {
    // 1. ANALYZE INSTRUMENTAL
    console.log('🎸 Analyzing instrumental backing track...');
    const instrumentalAnalysis = await audioAnalysisService.analyzeInstrumental(file.filePath);

    // 2. TRANSCRIBE
    console.log('📝 Transcribing...');
    const transcription = await transcriptionService.transcribeAudio(file.filePath);

    // 3. PARSE LYRICS
    console.log('🎤 Parsing lyrics...');
    let parsedLyrics = transcription.text;

    if (lyricParserService.hasBackgroundMusicIndicators(transcription.text) || transcription.text.length > 100) {
      const parsed = await lyricParserService.parseVoiceMemoLyrics(
        transcription.text,
        {
          fileName: file.fileName,
          duration: transcription.duration,
        }
      );

      if (parsed.confidence > 0.6) {
        parsedLyrics = parsed.cleanLyrics;
      } else {
        parsedLyrics = lyricParserService.quickCleanup(transcription.text);
      }
    } else {
      parsedLyrics = lyricParserService.quickCleanup(transcription.text);
    }

    // 4. COMPLETE SONG
    console.log('✨ Attempting song completion...');
    const completion = await songCompletionService.completeSong(parsedLyrics, {
      fileName: file.fileName,
      duration: transcription.duration,
      instrumentalAnalysis,
    });

    if (!completion.isCompletable) {
      console.log(`❌ Not completable: ${completion.reason}`);
      console.log('🗑️  Deleting voice memo (insufficient data)...');

      // Delete the original file
      try {
        fs.unlinkSync(file.filePath);
        console.log(`✅ Deleted: ${file.fileName}`);
      } catch (error) {
        console.error(`⚠️  Failed to delete ${file.fileName}:`, error);
      }

      return;
    }

    // 5. EXTRACT SONG TITLE for naming vocals file
    const songTitle = extractSongTitle(completion.completedLyrics!);

    // 6. SEPARATE VOCALS + INSTRUMENTAL using stem splitter
    console.log('🎼 Separating stems (vocals + instrumental)...');
    const separatedStems = await vocalSeparationService.separateVocals(
      file.filePath,
      {
        outputFormat: 'm4a',
        normalize: true,
        noiseReduction: true,
        deleteOriginal: true,  // Move original to Recently Deleted
        extractInstrumental: true, // Extract both stems
      },
      songTitle
    );

    console.log(`✅ Stems separated:`);
    console.log(`   Vocals: ${path.basename(separatedStems.vocalsPath)}`);
    if (separatedStems.instrumentalPath) {
      console.log(`   Instrumental: ${path.basename(separatedStems.instrumentalPath)}`);

      // Analyze the separated instrumental stem for pitch/melody matching
      console.log('🎵 Analyzing separated instrumental stem...');
      const instrumentalStemAnalysis = await audioAnalysisService.analyzeInstrumental(
        separatedStems.instrumentalPath
      );

      console.log(`✅ Instrumental stem analysis:`);
      console.log(`   Genre: ${instrumentalStemAnalysis.genre}`);
      console.log(`   Key: ${instrumentalStemAnalysis.key || 'Unknown'}`);
      console.log(`   BPM: ${instrumentalStemAnalysis.bpm}`);
      console.log(`   Instruments: ${instrumentalStemAnalysis.instruments?.join(', ')}`);

      // Update main instrumental analysis with stem-specific data
      instrumentalAnalysis.key = instrumentalStemAnalysis.key;
      instrumentalAnalysis.rootFrequency = instrumentalStemAnalysis.rootFrequency;
    }

    // 7. APPLY AUTO-COMPING (dynamics processing) to vocals
    console.log('🎚️  Applying auto-comp to vocals...');
    const rawVocalsPath = separatedStems.vocalsPath;

    const compResult = await dynamicsProcessingService.processVocals(rawVocalsPath);

    if (compResult.success && compResult.outputPath) {
      // Replace raw vocals with processed vocals
      fs.unlinkSync(rawVocalsPath);
      fs.renameSync(compResult.outputPath, rawVocalsPath);
      console.log(`✅ Auto-comp applied (${compResult.metrics?.loudness.toFixed(1)} LUFS)`);
    }

    // 8. OPTIONAL: GENERATE BEAT if no instrumental detected (or use original)
    const vocalsOnlyPath = rawVocalsPath; // Use the already processed vocals path
    let finalVocalsPath = vocalsOnlyPath;

    if (!instrumentalAnalysis.hasInstrumental && beatGenerationService.isAvailable()) {
      console.log('🎹 No instrumental detected - generating beat matching original key/tempo...');

      const beatResult = await beatGenerationService.generateBeat({
        instrumentalAnalysis,
        genre: completion.metadata?.referenceArtists.includes('Morgan Wallen') ? 'country pop' : undefined,
        mood: completion.metadata?.mood,
        duration: Math.min(transcription.duration, 30), // Max 30s
        model: 'stereo-large', // Suno-level quality
        vocalsPath: vocalsOnlyPath,
        matchKey: instrumentalAnalysis.key, // Match original key
        matchTempo: instrumentalAnalysis.bpm, // Match original BPM
      });

      if (beatResult.success && beatResult.beatPath) {
        console.log(`✅ Beat generated: ${beatResult.beatPath}`);

        // Combine vocals + beat
        const combinedPath = await beatGenerationService.combineVocalsAndBeat(
          vocalsOnlyPath,
          beatResult.beatPath,
          songTitle
        );

        console.log(`✅ Combined vocals + beat`);

        // Master to radio-ready quality
        if (audioMasteringService.isAvailable()) {
          const masteringResult = await audioMasteringService.master(
            combinedPath,
            songTitle,
            {
              targetLoudness: -14,
              genre: completion.metadata?.referenceArtists.includes('Morgan Wallen') ? 'country' : 'pop',
              style: 'streaming',
              stereoEnhancement: true,
              preserveDynamics: true,
            }
          );

          if (masteringResult.success && masteringResult.masteredPath) {
            finalVocalsPath = masteringResult.masteredPath;
            console.log(`✅ Mastered to radio-ready quality (${masteringResult.iterations} iterations)`);
          }
        } else {
          finalVocalsPath = combinedPath;
        }
      } else {
        console.warn(`⚠️  Beat generation failed: ${beatResult.error}`);
      }
    } else if (instrumentalAnalysis.hasInstrumental) {
      console.log(`✓ Instrumental already present - skipping beat generation`);
    } else {
      console.log(`⚠️  Beat generation not available (REPLICATE_API_TOKEN not set)`);
    }

    // 8. CREATE APPLE NOTE with vocals (or vocals+beat)
    console.log(`📝 Creating Apple Note: "${songTitle}"`);

    // Format lyrics - convert newlines to <br> for Apple Notes
    // Remove title from lyrics if it's the first line (Apple Notes shows title separately)
    let lyrics = completion.completedLyrics!;
    const firstLine = lyrics.split('\n')[0].trim();
    if (firstLine.toLowerCase().replace(/[.,!?]/g, '') === songTitle.toLowerCase().replace(/[.,!?]/g, '')) {
      lyrics = lyrics.split('\n').slice(1).join('\n').trim();
    }
    const formattedLyrics = lyrics.replace(/\n/g, '<br>');

    // Build metadata section - convert newlines to <br>
    const meta = completion.metadata;
    const metadataSection = meta ? `🎼 Song Metadata<br><br>Key: ${meta.key}<br>BPM: ${meta.bpm}<br>Mood: ${meta.mood}<br>Reference Artists: ${meta.referenceArtists.join(', ')}<br>Reference Songs: ${meta.referenceSongs.join(', ')}` : '';

    // Generate hashtags from metadata - each on its own line for Apple Notes clickability
    const hashtagsArray = meta ? [
      `#${meta.key.replace(/\s+/g, '')}`,  // #GMajor
      `#${meta.bpm}BPM`,
      ...meta.mood.split(/[\/\s]+/).filter(w => w.length > 2).map(w => `#${w}`),  // #Hopeful #Uplifting
      ...meta.referenceArtists.map(a => `#${a.replace(/\s+/g, '')}`),  // #MorganWallen
      '#CountryPop',
      '#JarvisAI'
    ] : ['#JarvisAI'];

    const hashtags = hashtagsArray.join(' ');

    const noteContent = `${formattedLyrics}<br><br>━━━━━━━━━━━━━━━━━━━━━━━━<br><br>${metadataSection}<br><br>━━━━━━━━━━━━━━━━━━━━━━━━<br><br>✨ JARVIS AI COMPLETION<br><br>🔧 Improvements:<br>${completion.improvements.map(imp => `• ${imp}`).join('<br>')}<br><br>━━━━━━━━━━━━━━━━━━━━━━━━<br><br>💡 Why Completed:<br>${completion.reason}<br><br>━━━━━━━━━━━━━━━━━━━━━━━━<br><br>🤖 JARVIS AI Song Completion<br><br>${hashtags}`;

    const appleNoteResult = await appleNotesSyncService.createNote(
      songTitle,
      noteContent,
      'JARVIS - Complete',
      finalVocalsPath  // Attach the vocals (or vocals+beat) audio file
    );

    if (appleNoteResult.success) {
      console.log(`✅ Created song: "${songTitle}"`);

      // Save metadata marking as completed
      const metadataPath = file.filePath.replace('.m4a', '_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify({
        songCompleted: true,
        songTitle,
        noteId: appleNoteResult.noteId,
        improvements: completion.improvements,
        processedAt: new Date().toISOString(),
      }, null, 2));
    } else {
      console.error(`⚠️  Apple Note creation failed: ${appleNoteResult.error}`);
    }

  } catch (error) {
    console.error(`❌ Processing error: ${error}`);
  }
}

/**
 * Main processing loop
 */
async function main() {
  console.log('🎵 JARVIS Retroactive Song Processor');
  console.log('=====================================');
  console.log('Processing: Newest → Oldest');
  console.log('Mode: Complete songs only\n');

  const files = getVoiceMemoFiles();
  const unprocessedFiles = files.filter(f => !f.processed);

  console.log(`📊 Total files: ${files.length}`);
  console.log(`📊 Unprocessed: ${unprocessedFiles.length}`);
  console.log(`📊 Already processed: ${files.length - unprocessedFiles.length}\n`);

  if (unprocessedFiles.length === 0) {
    console.log('✅ All files processed!');
    return;
  }

  console.log(`Processing ${Math.min(BATCH_SIZE, unprocessedFiles.length)} files IN PARALLEL...\n`);

  // Process batch in parallel (all 10 at once)
  const batch = unprocessedFiles.slice(0, BATCH_SIZE);
  await Promise.all(batch.map(file => processVoiceMemo(file)));

  console.log('\n✅ Batch complete!');
  console.log(`Remaining unprocessed: ${Math.max(0, unprocessedFiles.length - BATCH_SIZE)}`);

  // Check if all done
  if (unprocessedFiles.length <= BATCH_SIZE) {
    console.log('\n🎉 ALL FILES PROCESSED!');
    console.log('🔍 Running duplicate detection...\n');

    // Run deduplication
    const { execSync } = await import('child_process');
    try {
      execSync('npx tsx src/scripts/deduplicate-songs.ts', { stdio: 'inherit' });
    } catch (error) {
      console.error('Deduplication failed:', error);
    }
  }
}

main().catch(console.error);
