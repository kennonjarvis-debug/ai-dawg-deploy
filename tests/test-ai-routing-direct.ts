/**
 * Direct AI Routing Integration Test
 *
 * Tests the AI brain server's routing capabilities by directly calling
 * the Socket.IO endpoints with function call requests.
 */

import { io, Socket } from 'socket.io-client';

const AI_BRAIN_SERVER_URL = 'http://localhost:3001';

interface FunctionCallResult {
  success: boolean;
  message?: string;
  trackId?: string;
  data?: any;
  error?: string;
}

class AIRoutingTester {
  private socket: Socket | null = null;
  private connected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(AI_BRAIN_SERVER_URL, {
        transports: ['websocket'],
        reconnection: false,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to AI brain server');
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        reject(error);
      });

      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  async callFunction(functionName: string, args: any): Promise<FunctionCallResult> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Function call timeout: ${functionName}`));
      }, 10000);

      this.socket.emit('function-call', { name: functionName, arguments: args }, (result: FunctionCallResult) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('👋 Disconnected from AI brain server');
    }
  }
}

async function runTests() {
  console.log('\n🧪 Starting AI Routing Integration Tests\n');

  const tester = new AIRoutingTester();
  let trackIds: { [key: string]: string } = {};

  try {
    // Connect to server
    await tester.connect();

    // Test 1: Get initial tracks
    console.log('\n📋 Test 1: Get all tracks');
    const tracksResult = await tester.callFunction('getTracks', {});
    console.log('Result:', tracksResult);
    if (tracksResult.success) {
      console.log('✅ PASS: Got tracks successfully');
      console.log(`   Found ${tracksResult.data?.length || 0} tracks`);
    } else {
      console.log('❌ FAIL: Could not get tracks');
    }

    // Test 2: Create stereo aux track
    console.log('\n📋 Test 2: Create stereo aux track');
    const auxStereoResult = await tester.callFunction('createAuxTrack', {
      name: 'Reverb',
      channels: 'stereo',
    });
    console.log('Result:', auxStereoResult);
    if (auxStereoResult.success && auxStereoResult.trackId) {
      trackIds.reverb = auxStereoResult.trackId;
      console.log('✅ PASS: Created stereo aux track "Reverb"');
      console.log(`   Track ID: ${auxStereoResult.trackId}`);
    } else {
      console.log('❌ FAIL: Could not create stereo aux track');
    }

    // Test 3: Create mono aux track
    console.log('\n📋 Test 3: Create mono aux track');
    const auxMonoResult = await tester.callFunction('createAuxTrack', {
      name: 'Vocal Reverb',
      channels: 'mono',
    });
    console.log('Result:', auxMonoResult);
    if (auxMonoResult.success && auxMonoResult.trackId) {
      trackIds.vocalReverb = auxMonoResult.trackId;
      console.log('✅ PASS: Created mono aux track "Vocal Reverb"');
      console.log(`   Track ID: ${auxMonoResult.trackId}`);
    } else {
      console.log('❌ FAIL: Could not create mono aux track');
    }

    // Test 4: Create stereo audio track
    console.log('\n📋 Test 4: Create stereo audio track');
    const audioStereoResult = await tester.callFunction('createAudioTrack', {
      name: 'Lead Vocals',
      channels: 'stereo',
    });
    console.log('Result:', audioStereoResult);
    if (audioStereoResult.success && audioStereoResult.trackId) {
      trackIds.vocals = audioStereoResult.trackId;
      console.log('✅ PASS: Created stereo audio track "Lead Vocals"');
      console.log(`   Track ID: ${audioStereoResult.trackId}`);
    } else {
      console.log('❌ FAIL: Could not create stereo audio track');
    }

    // Test 5: Create mono audio track
    console.log('\n📋 Test 5: Create mono audio track');
    const audioMonoResult = await tester.callFunction('createAudioTrack', {
      name: 'Kick Drum',
      channels: 'mono',
    });
    console.log('Result:', audioMonoResult);
    if (audioMonoResult.success && audioMonoResult.trackId) {
      trackIds.kick = audioMonoResult.trackId;
      console.log('✅ PASS: Created mono audio track "Kick Drum"');
      console.log(`   Track ID: ${audioMonoResult.trackId}`);
    } else {
      console.log('❌ FAIL: Could not create mono audio track');
    }

    // Test 6: Create post-fader send
    console.log('\n📋 Test 6: Create post-fader send (vocals → reverb)');
    if (trackIds.vocals && trackIds.reverb) {
      const sendResult = await tester.callFunction('createSend', {
        sourceTrackId: trackIds.vocals,
        destinationTrackId: trackIds.reverb,
        preFader: false,
        level: 0.3, // 30%
      });
      console.log('Result:', sendResult);
      if (sendResult.success) {
        console.log('✅ PASS: Created post-fader send at 30%');
      } else {
        console.log('❌ FAIL: Could not create send');
      }
    } else {
      console.log('⚠️  SKIP: Missing track IDs');
    }

    // Test 7: Create pre-fader send
    console.log('\n📋 Test 7: Create pre-fader send (kick → reverb)');
    if (trackIds.kick && trackIds.reverb) {
      const sendResult = await tester.callFunction('createSend', {
        sourceTrackId: trackIds.kick,
        destinationTrackId: trackIds.reverb,
        preFader: true,
        level: 0.15, // 15%
      });
      console.log('Result:', sendResult);
      if (sendResult.success) {
        console.log('✅ PASS: Created pre-fader send at 15%');
      } else {
        console.log('❌ FAIL: Could not create send');
      }
    } else {
      console.log('⚠️  SKIP: Missing track IDs');
    }

    // Test 8: Set track volume
    console.log('\n📋 Test 8: Set track volume (vocals to 80%)');
    if (trackIds.vocals) {
      const volumeResult = await tester.callFunction('setTrackVolume', {
        trackId: trackIds.vocals,
        volume: 0.8,
      });
      console.log('Result:', volumeResult);
      if (volumeResult.success) {
        console.log('✅ PASS: Set track volume to 80%');
      } else {
        console.log('❌ FAIL: Could not set track volume');
      }
    } else {
      console.log('⚠️  SKIP: Missing track ID');
    }

    // Test 9: Set track pan
    console.log('\n📋 Test 9: Set track pan (vocals to -0.3, 30% left)');
    if (trackIds.vocals) {
      const panResult = await tester.callFunction('setTrackPan', {
        trackId: trackIds.vocals,
        pan: -0.3,
      });
      console.log('Result:', panResult);
      if (panResult.success) {
        console.log('✅ PASS: Set track pan to 30% left');
      } else {
        console.log('❌ FAIL: Could not set track pan');
      }
    } else {
      console.log('⚠️  SKIP: Missing track ID');
    }

    // Test 10: Mute track
    console.log('\n📋 Test 10: Mute track (kick drum)');
    if (trackIds.kick) {
      const muteResult = await tester.callFunction('muteTrack', {
        trackId: trackIds.kick,
        mute: true,
      });
      console.log('Result:', muteResult);
      if (muteResult.success) {
        console.log('✅ PASS: Muted kick drum track');
      } else {
        console.log('❌ FAIL: Could not mute track');
      }
    } else {
      console.log('⚠️  SKIP: Missing track ID');
    }

    // Test 11: Solo track
    console.log('\n📋 Test 11: Solo track (vocals)');
    if (trackIds.vocals) {
      const soloResult = await tester.callFunction('soloTrack', {
        trackId: trackIds.vocals,
        solo: true,
      });
      console.log('Result:', soloResult);
      if (soloResult.success) {
        console.log('✅ PASS: Soloed vocals track');
      } else {
        console.log('❌ FAIL: Could not solo track');
      }
    } else {
      console.log('⚠️  SKIP: Missing track ID');
    }

    // Test 12: Set track output destination
    console.log('\n📋 Test 12: Set track output (vocals → master)');
    if (trackIds.vocals) {
      const outputResult = await tester.callFunction('setTrackOutput', {
        trackId: trackIds.vocals,
        outputDestination: 'master',
      });
      console.log('Result:', outputResult);
      if (outputResult.success) {
        console.log('✅ PASS: Set track output to master');
      } else {
        console.log('❌ FAIL: Could not set track output');
      }
    } else {
      console.log('⚠️  SKIP: Missing track ID');
    }

    // Test 13: Get final track list
    console.log('\n📋 Test 13: Get final track list');
    const finalTracksResult = await tester.callFunction('getTracks', {});
    console.log('Result:', finalTracksResult);
    if (finalTracksResult.success) {
      console.log('✅ PASS: Got final tracks');
      console.log(`   Total tracks: ${finalTracksResult.data?.length || 0}`);
      if (finalTracksResult.data) {
        finalTracksResult.data.forEach((track: any) => {
          console.log(`   - ${track.name} (${track.trackType}, ${track.channels})`);
          if (track.sends && track.sends.length > 0) {
            track.sends.forEach((send: any) => {
              console.log(`     • Send to ${send.destination} at ${Math.round(send.level * 100)}% (${send.preFader ? 'pre' : 'post'}-fader)`);
            });
          }
        });
      }
    } else {
      console.log('❌ FAIL: Could not get final tracks');
    }

    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    tester.disconnect();
  }
}

// Run tests
runTests().catch(console.error);
