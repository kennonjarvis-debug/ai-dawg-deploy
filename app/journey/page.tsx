'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Music, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Instance 1 widgets
import { JourneyDashboard } from '@/src/widgets/JourneyDashboard/JourneyDashboard';
import { LyricWorkspace } from '@/src/widgets/LyricWorkspace/LyricWorkspace';
import { SongStructureBuilder } from '@/src/widgets/SongStructureBuilder/SongStructureBuilder';

// Instance 2 widgets
import { LiveCoachingPanel } from '@/src/widgets/LiveCoachingPanel/LiveCoachingPanel';
import { PerformanceScorer } from '@/src/widgets/PerformanceScorer/PerformanceScorer';
import { WaveformAnnotations } from '@/src/widgets/WaveformAnnotations/WaveformAnnotations';

// Instance 3 widgets
import { VocalAssessment } from '@/src/widgets/VocalAssessment/VocalAssessment';
import { GoalSettingWizard } from '@/src/widgets/GoalSettingWizard/GoalSettingWizard';
import { StylePreferencesQuiz } from '@/src/widgets/StylePreferencesQuiz/StylePreferencesQuiz';

// Instance 4 widgets
import { SessionPlanner } from '@/src/widgets/SessionPlanner/SessionPlanner';
import { UserProfileCard } from '@/src/widgets/UserProfileCard/UserProfileCard';
import { SkillProgressChart } from '@/src/widgets/SkillProgressChart/SkillProgressChart';

type SetupStep = 'assessment' | 'goals' | 'preferences' | 'complete';
type MainView = 'dashboard' | 'lyrics' | 'structure' | 'schedule' | 'progress' | 'profile';

export default function JourneyPage() {
  const router = useRouter();
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>('assessment');
  const [currentView, setCurrentView] = useState<MainView>('dashboard');
  const [showCoaching, setShowCoaching] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [vocalProfile, setVocalProfile] = useState<any>(null);
  const [isRecording] = useState(false);

  // Check if user has completed setup
  useEffect(() => {
    const setupComplete = localStorage.getItem('journey_setup_complete');
    if (setupComplete === 'true') {
      setHasCompletedSetup(true);
    }
  }, []);

  // Initialize audio context and media stream for assessment
  useEffect(() => {
    const initAudio = async () => {
      try {
        const ctx = new AudioContext();
        setAudioContext(ctx);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    if (!hasCompletedSetup) {
      initAudio();
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasCompletedSetup]);

  const completeSetup = () => {
    localStorage.setItem('journey_setup_complete', 'true');
    setHasCompletedSetup(true);
  };

  const handleContinueSession = () => {
    setCurrentView('lyrics');
  };

  const handlePractice = () => {
    setShowCoaching(true);
  };

  const handleReview = () => {
    setCurrentView('progress');
  };

  // Setup flow
  if (!hasCompletedSetup) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--background, #0a0a0a)',
        color: 'var(--foreground)',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Setup Header */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: 'var(--protools-cyan, #00e5ff)',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
              marginBottom: '12px',
            }}>
              Welcome to Your Song Creation Journey
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary, #888)',
            }}>
              Let's get to know your voice and create a personalized path
            </p>
          </div>

          {/* Progress Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}>
            {['assessment', 'goals', 'preferences'].map((step, index) => (
              <div
                key={step}
                style={{
                  width: '120px',
                  height: '4px',
                  background: setupStep === step || index < ['assessment', 'goals', 'preferences'].indexOf(setupStep)
                    ? 'var(--protools-cyan, #00e5ff)'
                    : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>

          {/* Setup Content */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '32px',
          }}>
            {setupStep === 'assessment' && (
              <>
                <VocalAssessment
                  audioContext={audioContext}
                  mediaStream={mediaStream}
                  onComplete={(data) => {
                    console.log('Assessment complete:', data);
                    setVocalProfile(data);
                    setSetupStep('goals');
                  }}
                />
              </>
            )}

            {setupStep === 'goals' && (
              <>
                <GoalSettingWizard
                  vocalProfile={vocalProfile}
                  onComplete={(data) => {
                    console.log('Goals set:', data);
                    setSetupStep('preferences');
                  }}
                />
              </>
            )}

            {setupStep === 'preferences' && (
              <>
                <StylePreferencesQuiz
                  onComplete={(data) => {
                    console.log('Preferences saved:', data);
                    completeSetup();
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main journey interface
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background, #0a0a0a)',
      color: 'var(--foreground)',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <button
          onClick={() => router.push('/')}
          className="floating-card"
          style={{
            padding: '10px 16px',
            border: 'none',
            cursor: 'pointer',
            background: 'var(--surface-1)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ArrowLeft size={18} />
          Back to DAW
        </button>

        <div className="floating-card" style={{
          flex: 1,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--protools-cyan, #00e5ff)',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
            margin: 0,
          }}>
            Adaptive Song Creation Journey
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flex: 1,
        minHeight: 0,
      }}>
        {/* Left Sidebar - Navigation */}
        <div style={{
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexShrink: 0,
        }}>
          {/* User Profile */}
          <div className="floating-card" style={{
            padding: '12px',
          }}>
            <UserProfileCard />
          </div>

          {/* View Navigation */}
          <div className="floating-card" style={{
            padding: '12px',
          }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-tertiary, #666)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}>
              Navigation
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Music },
                { id: 'lyrics', label: 'Lyrics', icon: BookOpen },
                { id: 'structure', label: 'Structure', icon: Music },
                { id: 'schedule', label: 'Schedule', icon: Calendar },
                { id: 'progress', label: 'Progress', icon: TrendingUp },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id as MainView)}
                  style={{
                    padding: '10px 12px',
                    background: currentView === id
                      ? 'rgba(0, 229, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: currentView === id
                      ? '1px solid rgba(0, 229, 255, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    color: currentView === id
                      ? 'var(--protools-cyan, #00e5ff)'
                      : 'var(--text-secondary, #888)',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main View Area */}
        <div className="floating-card" style={{
          flex: 1,
          padding: '20px',
          overflow: 'auto',
        }}>
          {currentView === 'dashboard' && (
            <JourneyDashboard
              onContinue={handleContinueSession}
              onPractice={handlePractice}
              onReview={handleReview}
            />
          )}

          {currentView === 'lyrics' && (
            <>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--protools-purple, #b066ff)',
                textShadow: '0 0 10px rgba(176, 102, 255, 0.5)',
                marginBottom: '20px',
              }}>
                Lyric Writing
              </h2>
              <LyricWorkspace />
            </>
          )}

          {currentView === 'structure' && (
            <>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--protools-green, #00ff88)',
                textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                marginBottom: '20px',
              }}>
                Song Structure
              </h2>
              <SongStructureBuilder />
            </>
          )}

          {currentView === 'schedule' && (
            <>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--protools-blue, #00d4ff)',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                marginBottom: '20px',
              }}>
                Practice Schedule
              </h2>
              <SessionPlanner />
            </>
          )}

          {currentView === 'progress' && (
            <>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--protools-pink, #ff66cc)',
                textShadow: '0 0 10px rgba(255, 102, 204, 0.5)',
                marginBottom: '20px',
              }}>
                Skill Progress
              </h2>
              <SkillProgressChart />
            </>
          )}
        </div>
      </div>

      {/* Live Coaching Overlay */}
      {showCoaching && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="floating-card" style={{
            padding: '32px',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'var(--protools-cyan, #00e5ff)',
                textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
                margin: 0,
              }}>
                Live Coaching Session
              </h2>
              <button
                onClick={() => setShowCoaching(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Main Coaching Panel */}
            <LiveCoachingPanel
              audioContext={audioContext}
              mediaStream={mediaStream}
              isRecording={isRecording}
            />

            {/* Performance Monitoring Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginTop: '12px',
            }}>
              {/* Performance Scorer */}
              <div className="floating-card" style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.4)',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--protools-green, #00ff88)',
                  marginBottom: '12px',
                  textShadow: '0 0 8px rgba(0, 255, 136, 0.5)',
                }}>
                  Performance Score
                </h3>
                <PerformanceScorer
                  isRecording={false}
                  audioContext={null}
                  mediaStream={null}
                  targetNote={null}
                />
              </div>

              {/* AI Annotations */}
              <div className="floating-card" style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.4)',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--protools-purple, #b066ff)',
                  marginBottom: '12px',
                  textShadow: '0 0 8px rgba(176, 102, 255, 0.5)',
                }}>
                  AI Annotations
                </h3>
                <WaveformAnnotations
                  isRecording={false}
                  audioContext={null}
                  mediaStream={null}
                  targetNote={null}
                  waveformWidth={500}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
