import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Mic, Music, Activity, Zap, Users, Download } from 'lucide-react';

/**
 * Live Demo Showcase Page - Complete End-to-End User Journey
 * Demonstrates ALL AI DAWG features from sign-up to export
 * Perfect for screen recording and product demos
 */

interface DemoStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  component: React.ReactNode;
}

export const LiveDemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const demoSteps: DemoStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AI DAWG',
      description: 'The AI-Powered Digital Audio Workstation',
      duration: 4000,
      component: (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900">
          <div className="text-center">
            <h1 className="text-8xl font-bold text-white mb-6 animate-fade-in">AI DAWG</h1>
            <p className="text-4xl text-gray-300 animate-slide-up mb-4">Professional Music Production</p>
            <p className="text-2xl text-blue-400 animate-slide-up" style={{ animationDelay: '0.3s' }}>Powered by AI</p>
          </div>
        </div>
      )
    },
    {
      id: 'signup',
      title: 'Quick Sign Up',
      description: 'Get started in 30 seconds - no credit card required',
      duration: 5000,
      component: (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-blue-900">
          <div className="w-full max-w-md">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Your Account</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    value="demo@aidawg.com"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    value="••••••••"
                    readOnly
                  />
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg rounded-lg hover:scale-105 transition-transform shadow-lg">
                  Sign Up Free
                </button>
              </div>

              <div className="mt-6 text-center text-gray-400 text-sm">
                ✓ Free Forever Plan • ✓ No Credit Card Required
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'create-project',
      title: 'Create New Project',
      description: 'Start your music production journey',
      duration: 5000,
      component: (
        <div className="p-8 bg-gray-900 h-full flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <h2 className="text-4xl font-bold text-white mb-8 text-center animate-fade-in">Create Your First Project</h2>

            <div className="grid grid-cols-3 gap-6">
              {[
                { name: 'New Song', icon: '🎵', desc: 'Start from scratch', color: 'blue' },
                { name: 'From Template', icon: '📋', desc: '100+ templates', color: 'purple' },
                { name: 'Freestyle Session', icon: '🎤', desc: 'Voice-controlled', color: 'green' }
              ].map((option, i) => (
                <div
                  key={option.name}
                  className={`bg-gray-800 rounded-lg p-6 border-2 ${i === 0 ? 'border-blue-500' : 'border-gray-700'} hover:scale-105 transition-transform cursor-pointer animate-fade-in-up`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div className="text-6xl mb-4 text-center">{option.icon}</div>
                  <h3 className={`text-${option.color}-300 font-bold text-xl mb-2 text-center`}>{option.name}</h3>
                  <p className="text-gray-400 text-center text-sm">{option.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-blue-500">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-3xl">
                  🎵
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg"
                    value="My First Hit Song"
                    readOnly
                  />
                </div>
                <button className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'daw-interface',
      title: 'Professional DAW Interface',
      description: 'Industry-standard tools at your fingertips',
      duration: 7000,
      component: (
        <div className="p-8 bg-gray-900 h-full">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left sidebar - Track list */}
            <div className="col-span-2 bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-bold mb-4">Tracks</h3>
              {['Vocals', 'Beat', 'Bass', 'Harmony'].map((name, i) => (
                <div key={i} className="bg-gray-700 rounded p-3 mb-2 hover:bg-gray-600 cursor-pointer transition-colors">
                  <div className="text-sm text-white font-semibold">{name}</div>
                  <div className="h-1 bg-blue-500 rounded mt-2 animate-pulse"></div>
                </div>
              ))}
              <button className="w-full mt-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold">
                + Add Track
              </button>
            </div>

            {/* Center - Timeline */}
            <div className="col-span-7 bg-gray-800 rounded-lg p-4">
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <button className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                    ⏺
                  </button>
                  <button className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                    ▶
                  </button>
                  <button className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                    ⏹
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-white font-mono text-xl">00:00:00</div>
                  </div>
                </div>

                {/* Waveforms */}
                <div className="flex-1 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-700 rounded p-2 h-20">
                      <div className="flex items-center h-full gap-1">
                        {[...Array(100)].map((_, j) => (
                          <div
                            key={j}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded"
                            style={{
                              height: `${Math.random() * 100}%`,
                              animation: `pulse ${1 + Math.random()}s infinite`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar - Widgets */}
            <div className="col-span-3 bg-gray-800 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-white font-bold mb-4">AI Widgets</h3>
              <div className="space-y-3">
                <div className="bg-purple-900/50 rounded p-3 border border-purple-500 hover:bg-purple-900/70 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Mic className="text-purple-300" size={20} />
                    <div className="text-purple-300 font-semibold text-sm">Lyrics</div>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">Real-time transcription</div>
                </div>
                <div className="bg-blue-900/50 rounded p-3 border border-blue-500 hover:bg-blue-900/70 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Activity className="text-blue-300" size={20} />
                    <div className="text-blue-300 font-semibold text-sm">Vocal Coach</div>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">AI feedback</div>
                </div>
                <div className="bg-green-900/50 rounded p-3 border border-green-500 hover:bg-green-900/70 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap className="text-green-300" size={20} />
                    <div className="text-green-300 font-semibold text-sm">Chatbot</div>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">AI assistant</div>
                </div>
                <div className="bg-orange-900/50 rounded p-3 border border-orange-500 hover:bg-orange-900/70 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Music className="text-orange-300" size={20} />
                    <div className="text-orange-300 font-semibold text-sm">Audio Capture</div>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">Record anywhere</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'recording',
      title: 'Studio-Quality Recording',
      description: '15ms latency • 96kHz sample rate • 60fps waveforms',
      duration: 6000,
      component: (
        <div className="p-8 bg-gray-900 h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Professional Recording</h2>

            <div className="bg-gray-800 rounded-lg p-8">
              <div className="flex items-center justify-center mb-8">
                <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="text-6xl text-white">⏺</div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 h-40 flex items-center">
                <div className="flex-1 flex items-center gap-0.5">
                  {[...Array(200)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded animate-wave"
                      style={{
                        height: `${30 + Math.sin(i / 10) * 30}%`,
                        animationDelay: `${i * 0.01}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-400">15ms</div>
                  <div className="text-gray-400 text-sm">Ultra-Low Latency</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-400">60fps</div>
                  <div className="text-gray-400 text-sm">Real-Time Waveforms</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-400">96kHz</div>
                  <div className="text-gray-400 text-sm">Studio Quality</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'widgets-demo',
      title: 'AI Widgets in Action',
      description: 'Lyrics, Vocal Coach, Chatbot, Audio Capture',
      duration: 8000,
      component: (
        <div className="p-8 bg-gray-900 h-full">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">AI-Powered Widgets</h2>

          <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Lyrics Widget */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
              <div className="flex items-center gap-3 mb-4">
                <Mic className="text-purple-400" size={32} />
                <h3 className="text-2xl font-bold text-purple-300">Lyrics Widget</h3>
              </div>
              <div className="space-y-2">
                {['Yeah I am flowing on the beat', 'AI DAWG keeping it sweet', 'Recording vocals with no delay', 'Making hits every single day'].map((line, i) => (
                  <div
                    key={i}
                    className="text-lg text-gray-300 animate-fade-in-up bg-purple-900/30 p-2 rounded"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-purple-400">
                ✓ Real-time transcription • ✓ Auto-scrolling • ✓ Export lyrics
              </div>
            </div>

            {/* Vocal Coach Widget */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-blue-400" size={32} />
                <h3 className="text-2xl font-bold text-blue-300">Vocal Coach</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-blue-900/30 p-3 rounded">
                  <div className="text-sm text-blue-300 font-semibold mb-1">Pitch Accuracy</div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-4/5"></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">87% - Great!</div>
                </div>
                <div className="bg-blue-900/30 p-3 rounded">
                  <div className="text-sm text-blue-300 font-semibold mb-1">Timing</div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full"></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">94% - Excellent!</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-blue-400">
                ✓ Real-time feedback • ✓ Performance metrics • ✓ AI tips
              </div>
            </div>

            {/* Chatbot Widget */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="text-green-400" size={32} />
                <h3 className="text-2xl font-bold text-green-300">AI Chatbot</h3>
              </div>
              <div className="space-y-2 h-32 overflow-y-auto">
                <div className="bg-green-900/30 p-2 rounded text-sm text-green-300">
                  <strong>You:</strong> How do I add reverb?
                </div>
                <div className="bg-gray-700 p-2 rounded text-sm text-gray-300">
                  <strong>AI:</strong> Click the track, select Effects, then add Reverb. I can do it for you!
                </div>
              </div>
              <div className="mt-4 text-sm text-green-400">
                ✓ Natural language control • ✓ Smart suggestions • ✓ Learn as you go
              </div>
            </div>

            {/* Audio Capture Widget */}
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-orange-500">
              <div className="flex items-center gap-3 mb-4">
                <Music className="text-orange-400" size={32} />
                <h3 className="text-2xl font-bold text-orange-300">Audio Capture</h3>
              </div>
              <div className="flex items-center justify-center h-32">
                <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="text-white" size={48} />
                </div>
              </div>
              <div className="mt-4 text-sm text-orange-400">
                ✓ Record anywhere • ✓ Auto-sync to project • ✓ Mobile capture
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-auto-comp',
      title: 'AI Auto Comp',
      description: 'Perfect vocal takes in 2 seconds',
      duration: 6000,
      component: (
        <div className="p-8 bg-gray-900 h-full flex items-center justify-center">
          <div className="w-full max-w-5xl">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">AI Auto Comp</h2>

            <div className="grid grid-cols-2 gap-8">
              {/* Before */}
              <div>
                <h3 className="text-white font-bold mb-4 text-2xl">Before</h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-800 rounded p-3">
                      <div className="text-gray-400 text-sm mb-2">Take {i}</div>
                      <div className="h-12 bg-gray-700 rounded flex items-center px-2">
                        <div className="flex-1 flex items-center gap-0.5">
                          {[...Array(50)].map((_, j) => (
                            <div
                              key={j}
                              className="flex-1 bg-red-500/50 rounded"
                              style={{ height: `${20 + Math.random() * 60}%` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* After */}
              <div>
                <h3 className="text-white font-bold mb-4 text-2xl flex items-center gap-2">
                  After
                  <span className="text-green-400 text-sm animate-pulse">✨ AI Comped</span>
                </h3>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-green-400 text-sm mb-2 font-semibold">Perfect Comp - Best of All Takes</div>
                  <div className="h-52 bg-gray-700 rounded flex items-center px-2">
                    <div className="flex-1 flex items-center gap-0.5">
                      {[...Array(50)].map((_, j) => (
                        <div
                          key={j}
                          className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded animate-pulse"
                          style={{ height: `${40 + Math.sin(j / 5) * 30}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-3xl font-bold text-green-400">2 seconds</div>
                    <div className="text-gray-400 text-sm">Processing Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-features',
      title: 'Complete AI Suite',
      description: 'Auto Pitch, Time, Mix, Master, Music Generation',
      duration: 9000,
      component: (
        <div className="p-8 bg-gray-900 h-full">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Complete AI Feature Suite</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { name: 'Auto Comp', desc: 'Perfect vocal takes in seconds', color: 'blue', icon: '✂️', stat: '2s avg' },
                { name: 'Auto Pitch', desc: 'Natural pitch correction', color: 'purple', icon: '🎵', stat: '±50¢ range' },
                { name: 'Auto Time', desc: 'Timing alignment & quantization', color: 'green', icon: '⏱️', stat: '1ms precision' },
                { name: 'Auto Mix', desc: 'Professional mixing in one click', color: 'orange', icon: '🎚️', stat: '30s process' },
                { name: 'Auto Master', desc: 'Radio-ready mastering', color: 'indigo', icon: '🎧', stat: '-14 LUFS' },
                { name: 'Auto Music', desc: 'AI beat & melody generation', color: 'pink', icon: '🎹', stat: 'Any genre' },
              ].map((feature, i) => (
                <div
                  key={feature.name}
                  className="bg-gray-800 border-2 border-gray-700 hover:border-blue-500 rounded-lg p-6 hover:scale-105 transition-all cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="text-5xl mb-3">{feature.icon}</div>
                  <h3 className="text-white font-bold text-xl mb-2">{feature.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{feature.desc}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400 font-semibold">{feature.stat}</span>
                    <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                      Apply
                    </button>
                  </div>
                  <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'freestyle-mode',
      title: 'Freestyle Mode',
      description: 'Voice-controlled recording with real-time AI assistance',
      duration: 8000,
      component: (
        <div className="p-8 bg-gradient-to-br from-purple-900 to-gray-900 h-full">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Freestyle Mode</h2>

            <div className="grid grid-cols-2 gap-8 h-full">
              {/* Left - Voice Control */}
              <div className="flex flex-col justify-center">
                <div className="bg-black/30 backdrop-blur rounded-lg p-6 border border-purple-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="text-white" size={32} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">Voice Commands Active</div>
                      <div className="text-purple-400">"Start recording and play beat"</div>
                    </div>
                  </div>

                  <div className="h-32 bg-gray-800 rounded-lg flex items-center p-4 mb-4">
                    <div className="flex-1 flex items-center gap-1">
                      {[...Array(100)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded"
                          style={{
                            height: `${30 + Math.sin(i / 10) * 40}%`,
                            animation: `wave ${0.5 + Math.random()}s infinite`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {['Start Recording', 'Stop Recording', 'Play Beat', 'Add Harmony'].map((cmd) => (
                      <div key={cmd} className="bg-purple-900/50 rounded p-2 text-center text-purple-300 text-sm border border-purple-500">
                        "{cmd}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right - Real-time Lyrics & AI */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-black/30 backdrop-blur rounded-lg p-6 border border-blue-500">
                  <h3 className="text-white font-bold text-xl mb-4">Real-Time Lyrics</h3>
                  <div className="space-y-3">
                    {['Yeah I am flowing on the beat', 'AI DAWG keeping it sweet', 'Recording vocals with no delay', 'Making hits every single day'].map((line, i) => (
                      <div
                        key={i}
                        className="text-lg text-gray-300 animate-fade-in-up bg-blue-900/30 p-2 rounded"
                        style={{ animationDelay: `${i * 0.5}s` }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur rounded-lg p-6 border border-green-500">
                  <div className="text-green-300 font-semibold mb-3">AI Rhyme Suggestions:</div>
                  <div className="flex flex-wrap gap-2">
                    {['complete', 'elite', 'repeat', 'feat', 'heat', 'sweet'].map(word => (
                      <span key={word} className="px-4 py-2 bg-green-500/30 rounded-full text-green-200 text-sm font-semibold hover:bg-green-500/50 cursor-pointer transition-colors">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export-share',
      title: 'Export & Share',
      description: 'Professional exports in any format',
      duration: 6000,
      component: (
        <div className="p-8 bg-gray-900 h-full flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Export & Share Your Music</h2>

            <div className="grid grid-cols-2 gap-8">
              {/* Export Options */}
              <div className="bg-gray-800 rounded-lg p-6 border border-blue-500">
                <div className="flex items-center gap-3 mb-6">
                  <Download className="text-blue-400" size={32} />
                  <h3 className="text-2xl font-bold text-white">Export Options</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { format: 'WAV', quality: 'Lossless 96kHz', size: '120 MB' },
                    { format: 'MP3', quality: '320 kbps', size: '8.5 MB' },
                    { format: 'FLAC', quality: 'Lossless', size: '45 MB' },
                    { format: 'AAC', quality: '256 kbps', size: '6.2 MB' }
                  ].map((option) => (
                    <div key={option.format} className="bg-gray-700 rounded p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">{option.format}</div>
                          <div className="text-gray-400 text-sm">{option.quality}</div>
                        </div>
                        <div className="text-blue-400 text-sm">{option.size}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
                  Export Project
                </button>
              </div>

              {/* Share Options */}
              <div className="bg-gray-800 rounded-lg p-6 border border-purple-500">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="text-purple-400" size={32} />
                  <h3 className="text-2xl font-bold text-white">Share</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-white font-semibold mb-2">Public Link</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 bg-gray-600 rounded text-white text-sm"
                        value="aidawg.com/share/abc123"
                        readOnly
                      />
                      <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {['Spotify', 'SoundCloud', 'YouTube'].map((platform) => (
                      <button key={platform} className="py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm font-semibold">
                        {platform}
                      </button>
                    ))}
                  </div>

                  <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500">
                    <div className="text-purple-300 font-semibold mb-2">Collaboration</div>
                    <div className="text-sm text-gray-400 mb-3">Invite others to collaborate</div>
                    <button className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                      Invite Collaborators
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'collaboration',
      title: 'Real-Time Collaboration',
      description: 'Work together from anywhere, in real-time',
      duration: 6000,
      component: (
        <div className="p-8 bg-gray-900 h-full flex items-center justify-center">
          <div className="w-full max-w-5xl">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Real-Time Collaboration</h2>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-2xl">Live Session</h3>
                <div className="flex items-center gap-3">
                  {[
                    { name: 'Producer', color: 'blue' },
                    { name: 'Vocalist', color: 'purple' },
                    { name: 'Engineer', color: 'green' }
                  ].map((user, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-10 h-10 bg-gradient-to-br from-${user.color}-500 to-${user.color}-700 rounded-full flex items-center justify-center text-white font-bold`}>
                        {user.name[0]}
                      </div>
                      <span className="text-gray-400 text-sm">{user.name}</span>
                    </div>
                  ))}
                  <div className="ml-4 text-green-400 font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    3 online
                  </div>
                </div>
              </div>

              <div className="relative h-64 bg-gray-700 rounded-lg p-4">
                {/* Multiple cursors */}
                {[
                  { x: '30%', y: '40%', color: 'blue', name: 'Producer' },
                  { x: '60%', y: '60%', color: 'purple', name: 'Vocalist' },
                  { x: '45%', y: '25%', color: 'green', name: 'Engineer' },
                ].map((cursor, i) => (
                  <div
                    key={cursor.name}
                    className="absolute animate-float"
                    style={{
                      left: cursor.x,
                      top: cursor.y,
                      animationDelay: `${i * 0.3}s`
                    }}
                  >
                    <div className={`w-8 h-8 bg-${cursor.color}-500 rounded-full border-2 border-white shadow-lg`}></div>
                    <div className="text-xs text-white mt-1 font-semibold bg-black/70 px-2 py-1 rounded">
                      {cursor.name}
                    </div>
                  </div>
                ))}

                {/* Live activity feed */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur rounded-lg p-4 w-72">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300">Producer: Added new track</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-purple-300">Vocalist: Great take! 🔥</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300">Engineer: Mixing harmony now</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">Zero</div>
                  <div className="text-gray-400 text-sm">Conflicts</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">50ms</div>
                  <div className="text-gray-400 text-sm">Sync Latency</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">∞</div>
                  <div className="text-gray-400 text-sm">Collaborators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cta',
      title: 'Start Creating Today',
      description: 'Free forever plan • No credit card required',
      duration: 5000,
      component: (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
          <div className="text-center max-w-4xl px-8">
            <h1 className="text-7xl font-bold text-white mb-6 animate-fade-in">Start Creating for Free</h1>
            <p className="text-3xl text-gray-300 mb-8 animate-slide-up">No credit card required • Free forever plan</p>

            <button className="px-16 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-3xl rounded-lg hover:scale-105 transition-transform shadow-2xl animate-pulse-slow mb-12">
              Try AI DAWG Now
            </button>

            <div className="grid grid-cols-4 gap-8 mt-12">
              {[
                { value: '10,000+', label: 'Active Creators', color: 'green' },
                { value: '15ms', label: 'Ultra-Low Latency', color: 'blue' },
                { value: '92%', label: 'Voice Accuracy', color: 'purple' },
                { value: '$0', label: 'Forever Free', color: 'pink' }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-5xl font-bold text-${stat.color}-400 mb-2`}>{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-advance demo
  useEffect(() => {
    if (!isPlaying) return;

    const currentDuration = demoSteps[currentStep].duration;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (currentDuration / 100));
        if (newProgress >= 100) {
          setCurrentStep(prev => (prev + 1) % demoSteps.length);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, isPlaying, demoSteps]);

  const currentDemo = demoSteps[currentStep];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Demo Content */}
      <div className="flex-1 relative overflow-hidden">
        {currentDemo.component}

        {/* Step indicator */}
        <div className="absolute top-6 right-6 bg-black/80 backdrop-blur rounded-lg px-5 py-3 border border-gray-700">
          <div className="text-white font-bold text-lg">
            {currentDemo.title}
          </div>
          <div className="text-gray-400 text-sm">
            {currentDemo.description}
          </div>
        </div>

        {/* AI DAWG watermark */}
        <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur rounded-lg px-4 py-2">
          <div className="text-white font-bold text-xl">AI DAWG</div>
          <div className="text-purple-400 text-xs">Live Demo</div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-semibold">{currentDemo.title}</span>
              <span className="text-gray-400 text-sm">
                Step {currentStep + 1} of {demoSteps.length}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Skip */}
          <button
            onClick={() => {
              setCurrentStep((prev) => (prev + 1) % demoSteps.length);
              setProgress(0);
            }}
            className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
          >
            <SkipForward size={24} />
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-slide-up { animation: slide-up 1s ease-out 0.3s both; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .animate-wave { animation: wave 1s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-progress { animation: progress 2s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
