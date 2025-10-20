'use client';

import { useState } from 'react';
import { Mic, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { usePitchDetection } from '$lib/../core/usePitchDetection';
import styles from './VocalAssessment.module.css';

interface VocalAssessmentProps {
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
  onComplete?: (profile: VocalProfile) => void;
}

interface VocalProfile {
  lowestNote: string;
  highestNote: string;
  range: number; // in semitones
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  controlScore: number; // 0-100
  pitchAccuracy: number; // 0-100
  strengths: string[];
  areasToImprove: string[];
}

const ASSESSMENT_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Vocal Assessment',
    description: 'We\'ll analyze your voice to create a personalized training plan.',
  },
  {
    id: 'low-range',
    title: 'Find Your Lowest Note',
    description: 'Sing down the scale as low as you comfortably can. Hold the lowest note for 3 seconds.',
  },
  {
    id: 'high-range',
    title: 'Find Your Highest Note',
    description: 'Sing up the scale as high as you comfortably can. Hold the highest note for 3 seconds.',
  },
  {
    id: 'control',
    title: 'Pitch Control Test',
    description: 'Match these 5 target notes and hold each for 2 seconds.',
  },
  {
    id: 'results',
    title: 'Assessment Complete!',
    description: 'Here\'s your vocal profile.',
  },
];

const TARGET_NOTES = ['C4', 'E4', 'G4', 'C5', 'E5'];

export function VocalAssessment({
  audioContext,
  mediaStream,
  onComplete,
}: VocalAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [lowestNote, setLowestNote] = useState<string | null>(null);
  const [highestNote, setHighestNote] = useState<string | null>(null);
  const [controlScores, setControlScores] = useState<number[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);

  const { currentPitch, start, stop, clearHistory } = usePitchDetection({
    audioContext,
    mediaStream,
    enabled: true,
    targetNote: currentStep === 3 ? TARGET_NOTES[currentTargetIndex] : null,
  });

  const step = ASSESSMENT_STEPS[currentStep];

  const handleStartRecording = () => {
    setIsRecording(true);
    clearHistory();
    start();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    stop();

    // Capture note based on current step
    if (currentStep === 1 && currentPitch?.note) {
      setLowestNote(currentPitch.note);
    } else if (currentStep === 2 && currentPitch?.note) {
      setHighestNote(currentPitch.note);
    } else if (currentStep === 3 && currentPitch) {
      // Record control score
      const accuracy = currentPitch.inTune ? currentPitch.confidence * 100 : 0;
      setControlScores((prev) => [...prev, accuracy]);

      if (currentTargetIndex < TARGET_NOTES.length - 1) {
        setCurrentTargetIndex((prev) => prev + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < ASSESSMENT_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsRecording(false);
      stop();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setIsRecording(false);
      stop();
    }
  };

  const calculateProfile = (): VocalProfile => {
    // Calculate range (simplified - would need proper note-to-semitone conversion)
    const range = 12; // Placeholder

    // Calculate control score
    const controlScore =
      controlScores.length > 0
        ? controlScores.reduce((a, b) => a + b, 0) / controlScores.length
        : 0;

    // Calculate pitch accuracy (from control test)
    const pitchAccuracy = controlScore;

    // Determine skill level
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (controlScore > 70 && range > 15) skillLevel = 'advanced';
    else if (controlScore > 50 && range > 10) skillLevel = 'intermediate';

    // Determine strengths and areas to improve
    const strengths: string[] = [];
    const areasToImprove: string[] = [];

    if (pitchAccuracy > 70) strengths.push('Pitch accuracy');
    else areasToImprove.push('Pitch accuracy');

    if (range > 15) strengths.push('Vocal range');
    else areasToImprove.push('Vocal range');

    if (controlScore > 60) strengths.push('Note control');
    else areasToImprove.push('Note control');

    return {
      lowestNote: lowestNote || 'Unknown',
      highestNote: highestNote || 'Unknown',
      range,
      skillLevel,
      controlScore,
      pitchAccuracy,
      strengths,
      areasToImprove,
    };
  };

  const handleComplete = () => {
    const profile = calculateProfile();
    if (onComplete) {
      onComplete(profile);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return lowestNote !== null;
    if (currentStep === 2) return highestNote !== null;
    if (currentStep === 3) return controlScores.length === TARGET_NOTES.length;
    return true;
  };

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        {ASSESSMENT_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.progressDot} ${i <= currentStep ? styles.active : ''}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h2>{step.title}</h2>
        <p>{step.description}</p>

        {/* Step-specific UI */}
        {currentStep === 0 && (
          <div className={styles.intro}>
            <Mic size={64} className={styles.icon} />
            <ul className={styles.checklist}>
              <li>Find a quiet space</li>
              <li>Warm up your voice (optional)</li>
              <li>Have water nearby</li>
              <li>Takes about 5 minutes</li>
            </ul>
          </div>
        )}

        {(currentStep === 1 || currentStep === 2) && (
          <div className={styles.recorder}>
            {currentPitch && (
              <div className={styles.noteDisplay}>
                <div className={styles.note}>{currentPitch.note || '--'}</div>
                <div className={styles.frequency}>
                  {currentPitch.frequency.toFixed(1)} Hz
                </div>
              </div>
            )}

            <button
              className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
            >
              {isRecording ? 'Stop & Save Note' : 'Start Recording'}
            </button>

            {currentStep === 1 && lowestNote && (
              <div className={styles.captured}>✓ Captured: {lowestNote}</div>
            )}
            {currentStep === 2 && highestNote && (
              <div className={styles.captured}>✓ Captured: {highestNote}</div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.controlTest}>
            <div className={styles.targetNote}>
              <span className={styles.label}>Target Note:</span>
              <span className={styles.note}>{TARGET_NOTES[currentTargetIndex]}</span>
            </div>

            {currentPitch && (
              <div className={styles.currentNote}>
                <span className={styles.label}>Your Note:</span>
                <span className={`${styles.note} ${currentPitch.inTune ? styles.inTune : styles.outOfTune}`}>
                  {currentPitch.note || '--'}
                </span>
              </div>
            )}

            <div className={styles.progress}>
              {TARGET_NOTES.map((note, i) => (
                <div
                  key={note}
                  className={`${styles.noteCheck} ${i < controlScores.length ? styles.complete : ''}`}
                >
                  {i < controlScores.length ? <Check size={16} /> : note}
                </div>
              ))}
            </div>

            <button
              className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={controlScores.length === TARGET_NOTES.length}
            >
              {isRecording ? 'Confirm Note' : 'Start'}
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles.results}>
            <div className={styles.profileCard}>
              <h3>Your Vocal Profile</h3>

              <div className={styles.stat}>
                <span className={styles.statLabel}>Range:</span>
                <span className={styles.statValue}>
                  {lowestNote} - {highestNote}
                </span>
              </div>

              <div className={styles.stat}>
                <span className={styles.statLabel}>Skill Level:</span>
                <span className={styles.statValue}>
                  {calculateProfile().skillLevel}
                </span>
              </div>

              <div className={styles.stat}>
                <span className={styles.statLabel}>Pitch Accuracy:</span>
                <span className={styles.statValue}>
                  {calculateProfile().pitchAccuracy.toFixed(0)}%
                </span>
              </div>

              <div className={styles.section}>
                <h4>Strengths</h4>
                <ul>
                  {calculateProfile().strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.section}>
                <h4>Areas to Improve</h4>
                <ul>
                  {calculateProfile().areasToImprove.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <button className={styles.completeBtn} onClick={handleComplete}>
                Continue to Goal Setting
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <button
          className={styles.navBtn}
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        {currentStep < ASSESSMENT_STEPS.length - 1 && (
          <button
            className={styles.navBtn}
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
