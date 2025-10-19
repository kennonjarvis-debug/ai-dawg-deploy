import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Scissors, AlignCenter, Music, Sliders, Volume2, Wand2,
  ArrowLeft, Check, Zap, TrendingUp, Clock, Mic, GitBranch
} from 'lucide-react';
import Logo from '@/components/Logo';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Scissors className="w-8 h-8" />,
      title: 'Auto-Comp',
      tagline: 'Best Takes, Automatically',
      description: 'Stop wasting time manually comping vocals. DAWG AI analyzes all your takes and creates the perfect comp in seconds.',
      benefits: [
        'Analyzes pitch, timing, and tone quality',
        'Identifies best segments automatically',
        'Creates seamless crossfades',
        'Saves hours of manual editing'
      ],
      useCases: [
        'Vocal recording sessions',
        'Multiple guitar solo takes',
        'Drum performance comping',
        'Podcast interview editing'
      ],
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: 'Auto-Pitch',
      tagline: 'Natural Pitch Correction',
      description: 'Get perfect pitch without the robotic sound. Our AI preserves emotion and natural vocal characteristics.',
      benefits: [
        'Preserves vocal emotion and vibrato',
        'Smart scale detection',
        'Adjustable strength for natural results',
        'Works on vocals and instruments'
      ],
      useCases: [
        'Vocal tuning',
        'Guitar intonation fixes',
        'Bass note correction',
        'String ensemble tuning'
      ],
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <AlignCenter className="w-8 h-8" />,
      title: 'Auto-Align',
      tagline: 'Perfect Timing, Natural Feel',
      description: 'Align audio to the grid while preserving the natural groove that makes music feel human.',
      benefits: [
        'Quantize to any grid division',
        'Preserve feel with adjustable strength',
        'Automatic tempo detection',
        'Works with any genre'
      ],
      useCases: [
        'Tighten drum performances',
        'Fix bass timing issues',
        'Align vocal timing to beat',
        'Clean up live recordings'
      ],
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Sliders className="w-8 h-8" />,
      title: 'Auto-Mix',
      tagline: 'Studio-Quality Mixing',
      description: 'Get professional mixes with AI-powered balancing, EQ, compression, and effects tailored to your genre.',
      benefits: [
        'Genre-aware processing',
        'Intelligent level balancing',
        'Professional EQ and compression',
        'Automatic spatial mixing'
      ],
      useCases: [
        'Quick demo mixes',
        'Starting point for final mix',
        'Learning reference',
        'Time-saving rough mixes'
      ],
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <Volume2 className="w-8 h-8" />,
      title: 'Auto-Master',
      tagline: 'Radio-Ready Masters',
      description: 'Professional mastering that makes your tracks sound polished and ready for streaming platforms.',
      benefits: [
        'Optimal loudness levels',
        'Enhanced clarity and punch',
        'Platform-ready (Spotify, Apple Music)',
        'Instant A/B comparison'
      ],
      useCases: [
        'Final track polishing',
        'Album consistency',
        'Quick release masters',
        'Demo track finishing'
      ],
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Wand2 className="w-8 h-8" />,
      title: 'AI Music Generation',
      tagline: 'Create Music from Ideas',
      description: 'Generate chord progressions, melodies, and full arrangements from simple prompts or existing audio.',
      benefits: [
        'Instant chord progressions',
        'Genre-aware melody generation',
        'Full arrangement creation',
        'MIDI export for editing'
      ],
      useCases: [
        'Beat songwriting block',
        'Sketch musical ideas quickly',
        'Generate background music',
        'Create demo arrangements'
      ],
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  const stats = [
    { value: '10x', label: 'Faster Production' },
    { value: '95%', label: 'Time Saved on Comping' },
    { value: '100+', label: 'Hours Saved Monthly' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                Try Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">AI-Powered Features</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Produce Like a Pro
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Our AI-powered features handle the technical work so you can focus on creativity and making great music.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-xl p-6">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
          {features.map((feature, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
              {/* Content */}
              <div className="flex-1 space-y-6">
                {/* Icon & Title */}
                <div>
                  <div className={`inline-flex p-4 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6`}>
                    {feature.icon}
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">{feature.title}</h2>
                  <p className="text-2xl text-gray-400">{feature.tagline}</p>
                </div>

                {/* Description */}
                <p className="text-lg text-gray-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Key Benefits
                  </h3>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Use Cases */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-purple-400" />
                    Perfect For
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feature.useCases?.map((useCase, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gray-800/50 border border-white/10 rounded-full text-sm text-gray-300"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Placeholder */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} blur-3xl opacity-20`}></div>
                  <div className="relative bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        {feature.icon}
                        <p className="text-gray-400 mt-4 text-sm">Feature Demo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple Workflow
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get professional results in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Upload or Record</h3>
                <p className="text-gray-300">
                  Upload your audio files or record directly in the browser with real-time monitoring
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Select AI Tool</h3>
                <p className="text-gray-300">
                  Choose the AI feature you need: Comp, Pitch, Align, Mix, Master, or Music Gen
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Get Results</h3>
                <p className="text-gray-300">
                  AI processes your audio in seconds and delivers professional, studio-quality results
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Music Production?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of producers using DAWG AI to create professional music faster than ever
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-2xl"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold text-lg rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} DAWG AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
