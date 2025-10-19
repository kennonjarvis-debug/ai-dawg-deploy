#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Create a dummy audio file for testing (silent WAV file)
function createDummyAudioFile(filename) {
  // Minimal WAV header + some silent audio data
  const wavHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Subchunk size (16)
    0x01, 0x00,             // Audio format (1 = PCM)
    0x01, 0x00,             // Num channels (1 = mono)
    0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
    0x88, 0x58, 0x01, 0x00, // Byte rate
    0x02, 0x00,             // Block align
    0x10, 0x00,             // Bits per sample (16)
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00  // Data size
  ]);

  // Add some silent audio data (100 samples)
  const audioData = Buffer.alloc(200, 0);
  const wavFile = Buffer.concat([wavHeader, audioData]);

  fs.writeFileSync(filename, wavFile);
  console.log(`✅ Created test audio file: ${filename}`);
  return filename;
}

async function testStemSeparation() {
  console.log('\n===========================================');
  console.log('Testing Stem Separation API');
  console.log('===========================================\n');

  const audioFile = createDummyAudioFile('/tmp/test-audio-stems.wav');

  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioFile));
    form.append('projectId', 'test-project-123');

    console.log('Uploading audio file for stem separation...');
    const response = await fetch(`${BASE_URL}/api/v1/audio/separate-stems`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));

    if (data.success && data.stems) {
      console.log('\n✅ Stem Separation Working!');
      console.log(`   Vocals: ${data.stems.vocals}`);
      console.log(`   Drums: ${data.stems.drums}`);
      console.log(`   Bass: ${data.stems.bass}`);
      console.log(`   Other: ${data.stems.other}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(audioFile)) {
      fs.unlinkSync(audioFile);
    }
  }
}

async function testMelodyToVocals() {
  console.log('\n===========================================');
  console.log('Testing Melody-to-Vocals API');
  console.log('===========================================\n');

  const audioFile = createDummyAudioFile('/tmp/test-melody.wav');

  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioFile));
    form.append('prompt', 'upbeat pop song about summer');
    form.append('genre', 'pop');
    form.append('mood', 'happy');
    form.append('theme', 'summer');
    form.append('projectId', 'test-project-456');

    console.log('Uploading melody file for vocal generation...');
    const response = await fetch(`${BASE_URL}/api/v1/ai/melody-to-vocals`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));

    if (data.success && data.audio_url) {
      console.log('\n✅ Melody-to-Vocals Working!');
      console.log(`   Audio URL: ${data.audio_url}`);
      console.log(`   Lyrics: ${data.lyrics}`);
      console.log(`   Melody Info: ${JSON.stringify(data.melody_info)}`);
    } else if (data.error) {
      console.log(`\n⚠️  Expected error (needs real melody): ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(audioFile)) {
      fs.unlinkSync(audioFile);
    }
  }
}

async function runTests() {
  await testStemSeparation();
  await testMelodyToVocals();

  console.log('\n===========================================');
  console.log('File Upload Testing Complete!');
  console.log('===========================================\n');
}

runTests();
