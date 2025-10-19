// Test instrumental generation to verify Suno integration works
const axios = require('axios');

async function testInstrumentalGeneration() {
  console.log('🎸 Testing instrumental generation with Suno V5...\n');

  try {
    const response = await axios.post('http://localhost:8002/api/v1/ai/dawg', {
      prompt: 'upbeat pop instrumental with catchy melody',
      genre: 'pop',
      mood: 'happy',
      tempo: 120,
      duration: 30,
      style: 'full-production',
      include_vocals: false, // Test instrumental first
      project_id: 'test-project'
    });

    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));

    if (response.data.audio_url) {
      console.log('\n🎵 Audio URL:', response.data.audio_url);

      // Download and play the audio
      const audioUrl = response.data.audio_url;
      const exec = require('child_process').exec;

      console.log('\n📥 Downloading audio...');
      exec(`curl -o /tmp/suno-instrumental-test.mp3 "${audioUrl}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Download error:', error);
          return;
        }
        console.log('✅ Downloaded to /tmp/suno-instrumental-test.mp3');
        console.log('\n🔊 Opening audio file...');
        exec('open /tmp/suno-instrumental-test.mp3');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testInstrumentalGeneration();
