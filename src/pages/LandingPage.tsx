import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, AlignCenter, Music, Sliders, Volume2, Wand2, Check, ArrowRight, Zap } from 'lucide-react';
import Logo from '@/components/Logo';
import { ChatbotWidget } from '@/ui/chatbot/ChatbotWidget';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Scissors className="w-6 h-6" />,
      title: 'Auto-Comp',
      description: 'AI analyzes multiple vocal takes and creates the perfect comp automatically',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: 'Auto-Pitch',
      description: 'AI delivers natural-sounding pitch correction that preserves emotion and feel',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <AlignCenter className="w-6 h-6" />,
      title: 'Auto-Align',
      description: 'AI performs perfect timing alignment while preserving natural groove and feel',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Sliders className="w-6 h-6" />,
      title: 'Auto-Mix',
      description: 'AI provides professional mixing with genre-aware balancing and effects',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: 'Auto-Master',
      description: 'AI delivers radio-ready mastering with loudness and clarity',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: 'AI Music Gen',
      description: 'AI generates chords, melodies, and full arrangements',
      color: 'from-pink-500 to-rose-500'
    },
  ];

  const pricingTiers = [
    {
      name: 'FREE',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Auto-Align AI feature',
        '25 operations per day',
        '3 projects',
        'Basic vocal coach',
        'Community support'
      ],
      cta: 'Try Free Demo',
      highlighted: false,
      action: () => navigate('/register')
    },
    {
      name: 'PRO',
      price: '$19.99',
      period: 'per month',
      description: 'For serious music producers',
      features: [
        'All AI features',
        '500 operations per day',
        'Unlimited projects',
        'Advanced vocal coach',
        'AI Producer assistant',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      highlighted: true,
      action: () => navigate('/register')
    },
    {
      name: 'STUDIO',
      price: '$49.99',
      period: 'per month',
      description: 'Professional studios & teams',
      features: [
        'Everything in Pro',
        '2000 operations per day',
        'Team collaboration',
        'Custom AI models',
        'Dedicated support',
        'Early access to features'
      ],
      cta: 'Contact Sales',
      highlighted: false,
      action: () => navigate('/register')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg text-sm"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered Music Production</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Create Music Like a
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Professional Producer
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              AI DAW brings studio-quality production to everyone. Comp, pitch correct, mix, and master your tracks with AI in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => navigate('/register')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-2xl hover:shadow-purple-500/50 flex items-center gap-2"
              >
                Try Free Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold text-lg rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                View Pricing
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo Placeholder */}
          <div className="mt-20 relative">
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl"></div>
              <div className="relative bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-2xl">
                {/* Hero Video */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src="/ai-dawg-live-demo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Play indicator */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">LIVE DEMO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Powered by AI</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Studio-Quality Tools
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to produce professional music, powered by cutting-edge AI
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 bg-gradient-to-r ${feature.color} rounded-xl mb-4`}>
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>

                {/* Description */}
                <p className="text-gray-300">{feature.description}</p>

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the perfect plan for your music production needs
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-gray-800/50 backdrop-blur border rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/20 scale-105'
                    : 'border-white/10'
                }`}
              >
                {/* Popular Badge */}
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{tier.price}</span>
                    <span className="text-gray-400">{tier.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={tier.action}
                  className={`w-full py-4 rounded-lg font-bold transition-all duration-200 ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-500/50'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Create Amazing Music?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join other users using AI DAWG to make professional tracks
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-2xl inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Logo size="sm" />
              <p className="text-gray-400 max-w-md">
                Professional music production powered by AI. Create, mix, and master studio-quality tracks in minutes.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><button onClick={() => navigate('/register')} className="text-gray-400 hover:text-white transition-colors">Sign Up</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AI DAWG. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};
