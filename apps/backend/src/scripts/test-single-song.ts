#!/usr/bin/env tsx
/**
 * Test Single Song Processor
 * Process one song to verify formatting and metadata
 */

import { transcriptionService } from '../services/notes/transcription.service.js';
import { lyricParserService } from '../services/notes/lyric-parser.service.js';
import { songCompletionService } from '../services/notes/song-completion.service.js';
import { appleNotesSyncService } from '../services/notes/apple-notes-sync.service.js';
import { vocalSeparationService } from '../services/notes/vocal-separation.service.js';
import { audioAnalysisService } from '../services/notes/audio-analysis.service.js';
import { beatGenerationService } from '../services/notes/beat-generation.service.js';
import { audioMasteringService } from '../services/notes/audio-mastering.service.js';
import { logger } from '../../../src/lib/utils/logger.js';

// Test with one of the successful files
const TEST_FILE = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/20251011 095953-2E1707E1.m4a';

async function testSingleSong() {
  logger.info('🧪 Testing single song with new formatting and metadata...\n');
  logger.info('📁 File: ${TEST_FILE.split('/').pop()}\n');

  try {
    // 1. ANALYZE INSTRUMENTAL
    logger.info('🎸 Analyzing instrumental backing track...');
    const instrumentalAnalysis = await audioAnalysisService.analyzeInstrumental(TEST_FILE);
    logger.info('✅ Instrumental analysis complete\n');

    // 2. TRANSCRIBE
    logger.info('📝 Transcribing...');
    const transcription = await transcriptionService.transcribeAudio(TEST_FILE);
    logger.info('✅ Transcribed (${transcription.text.length} chars)\n');

    // 3. PARSE LYRICS
    logger.info('🎤 Parsing lyrics...');
    let parsedLyrics = transcription.text;

    if (lyricParserService.hasBackgroundMusicIndicators(transcription.text) || transcription.text.length > 100) {
      const parsed = await lyricParserService.parseVoiceMemoLyrics(
        transcription.text,
        {
          fileName: TEST_FILE.split('/').pop(),
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
    logger.info('✅ Parsed\n');

    // 4. COMPLETE SONG
    logger.info('✨ Completing song...');
    const completion = await songCompletionService.completeSong(parsedLyrics, {
      fileName: TEST_FILE.split('/').pop(),
      duration: transcription.duration,
      instrumentalAnalysis,
    });

    if (!completion.isCompletable) {
      logger.info('❌ Not completable: ${completion.reason}');
      return;
    }

    logger.info('✅ Song completable!');
    logger.info('\n📊 Metadata:');
    if (completion.metadata) {
      logger.info('  Key: ${completion.metadata.key}');
      logger.info('  BPM: ${completion.metadata.bpm}');
      logger.info('  Mood: ${completion.metadata.mood}');
      logger.info('  Reference Artists: ${completion.metadata.referenceArtists.join(', ')}');
      logger.info('  Reference Songs: ${completion.metadata.referenceSongs.join(', ')}');
    } else {
      logger.info('  ⚠️  No metadata returned');
    }

    logger.info('\n🎸 Instrumental Analysis:');
    if (instrumentalAnalysis.hasInstrumental) {
      logger.info('  Has Instrumental: Yes (${(instrumentalAnalysis.confidence * 100).toFixed(0)}% confidence)');
      logger.info('  Genre: ${instrumentalAnalysis.genre}');
      logger.info('  Instruments: ${instrumentalAnalysis.instruments?.join(', ')}');
      logger.info('  Tempo: ${instrumentalAnalysis.tempo} (${instrumentalAnalysis.bpm} BPM)');
      logger.info('  Mood: ${instrumentalAnalysis.mood}');
      logger.info('  Energy: ${instrumentalAnalysis.energy}');
    } else {
      logger.info('  Has Instrumental: No (a cappella or no backing track detected)');
    }

    // 5. EXTRACT SONG TITLE for naming vocals file
    const songTitle = extractSongTitle(completion.completedLyrics!);

    // 6. EXTRACT VOCALS with song title
    logger.info('\n🎼 Separating vocals...');
    await vocalSeparationService.separateVocals(
      TEST_FILE,
      {
        outputFormat: 'm4a',
        normalize: true,
        noiseReduction: true,
        deleteOriginal: false,  // Don't delete test file
      },
      songTitle
    );
    logger.info('✅ Vocals extracted\n');

    // 7. OPTIONAL: GENERATE BEAT if no instrumental detected
    const vocalsFileName = `JARVIS - ${songTitle}.m4a`;
    const vocalsOnlyPath = `/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/${vocalsFileName}`;
    let finalVocalsPath = vocalsOnlyPath;

    if (!instrumentalAnalysis.hasInstrumental && beatGenerationService.isAvailable()) {
      logger.info('\n🎹 No instrumental detected - generating beat...');

      const beatResult = await beatGenerationService.generateBeat({
        instrumentalAnalysis,
        genre: completion.metadata?.referenceArtists.includes('Morgan Wallen') ? 'country pop' : undefined,
        mood: completion.metadata?.mood,
        duration: Math.min(transcription.duration, 30), // Max 30s for testing
        model: 'stereo-large', // Suno-level quality (default)
        vocalsPath: vocalsOnlyPath, // For melody conditioning if using stereo-melody
      });

      if (beatResult.success && beatResult.beatPath) {
        logger.info('✅ Beat generated!');

        // Combine vocals + beat
        const combinedPath = await beatGenerationService.combineVocalsAndBeat(
          vocalsOnlyPath,
          beatResult.beatPath,
          songTitle
        );

        logger.info('✅ Combined vocals + beat');

        // Master to radio-ready quality
        if (audioMasteringService.isAvailable()) {
          logger.info('\n🎚️  Mastering to radio-ready quality...');

          const masteringResult = await audioMasteringService.master(
            combinedPath,
            songTitle,
            {
              targetLoudness: -14, // Streaming standard
              genre: completion.metadata?.referenceArtists.includes('Morgan Wallen') ? 'country' : 'pop',
              style: 'streaming',
              stereoEnhancement: true,
              preserveDynamics: true,
              maxIterations: 3,
              targetQuality: 0.85,
            }
          );

          if (masteringResult.success && masteringResult.masteredPath) {
            finalVocalsPath = masteringResult.masteredPath;
            logger.info('\n✅ Mastered in ${masteringResult.iterations} iteration(s)');
            logger.info('   Loudness: ${masteringResult.metrics?.loudness.toFixed(2)} LUFS');
            logger.info('   Quality: ${((masteringResult.metrics?.qualityScore || 0) * 100).toFixed(0)}%');
            logger.info('   Improvements: ${masteringResult.improvements?.join(', ')}\n');
          } else {
            logger.warn('⚠️  Mastering failed: ${masteringResult.error}\n');
          }
        }
      } else {
        logger.warn('⚠️  Beat generation failed: ${beatResult.error}\n');
      }
    } else if (instrumentalAnalysis.hasInstrumental) {
      logger.info('\n✓ Instrumental already present - skipping beat generation\n');
    } else {
      logger.info('\n⚠️  Beat generation not available (REPLICATE_API_TOKEN not set)\n');
    }

    // 8. CREATE APPLE NOTE
    logger.info('📝 Creating Apple Note: "songTitle"\n', { songTitle });

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
      logger.info('✅ Test complete! Check Apple Notes for: "songTitle"', { songTitle });
      logger.info('\n🎯 Next step: Verify the note has:');
      logger.info('   ✓ Proper line spacing between sections');
      logger.info('   ✓ Bold section labels ([Verse 1], [Chorus], etc.)');
      logger.info('   ✓ Metadata box with key, BPM, mood, references');
      logger.info('   ✓ Clickable vocals link');
    } else {
      logger.error('❌ Apple Note creation failed: ${appleNoteResult.error}');
    }

  } catch (error) {
    logger.error('❌ Test error: ${error}');
  }
}

function extractSongTitle(completedLyrics: string): string {
  const chorusMatch = completedLyrics.match(/\[Chorus\]\s*\n(.*?)(?:\n|$)/);
  if (chorusMatch && chorusMatch[1]) {
    const firstLine = chorusMatch[1].trim();
    const words = firstLine.split(/\s+/).filter(w => w.length > 0);
    const titleWords = words.slice(0, Math.min(4, words.length));

    return titleWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  const firstLineMatch = completedLyrics.match(/\]\s*\n(.*?)(?:\n|$)/);
  if (firstLineMatch && firstLineMatch[1]) {
    const words = firstLineMatch[1].trim().split(/\s+/).slice(0, 3);
    return words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Untitled';
}

testSingleSong().catch(console.error);
