/**
 * LyricsWidget Example Usage
 * Demonstrates how to use the enhanced AI-powered LyricsWidget component
 */

import React, { useState, useEffect } from 'react';
import { LyricsWidget, LyricsSegment } from './LyricsWidget';

// Example lyrics data - would come from real-time transcription in production
const exampleLyrics: LyricsSegment[] = [
  { text: "In the morning light", timestamp: 1000, start: 0, end: 2 },
  { text: "I see your face", timestamp: 2000, start: 2, end: 4 },
  { text: "A gentle reminder", timestamp: 3000, start: 4, end: 6 },
  { text: "Of a better place", timestamp: 4000, start: 6, end: 8 },
  { text: "", timestamp: 5000, start: 8, end: 9 },
  { text: "Take me higher", timestamp: 6000, start: 10, end: 12 },
  { text: "Where the angels sing", timestamp: 7000, start: 12, end: 14 },
  { text: "Take me higher", timestamp: 8000, start: 14, end: 16 },
  { text: "On broken wings", timestamp: 9000, start: 16, end: 18 },
  { text: "", timestamp: 10000, start: 18, end: 19 },
  { text: "The city sleeps below", timestamp: 11000, start: 20, end: 22 },
  { text: "As I'm reaching out", timestamp: 12000, start: 22, end: 24 },
  { text: "For something more than", timestamp: 13000, start: 24, end: 26 },
  { text: "What I've lived without", timestamp: 14000, start: 26, end: 28 },
  { text: "", timestamp: 15000, start: 28, end: 29 },
  { text: "Take me higher", timestamp: 16000, start: 30, end: 32 },
  { text: "Where the angels sing", timestamp: 17000, start: 32, end: 34 },
  { text: "Take me higher", timestamp: 18000, start: 34, end: 36 },
  { text: "On broken wings", timestamp: 19000, start: 36, end: 38 },
];

export const LyricsWidgetExample: React.FC = () => {
  const [lyrics, setLyrics] = useState<LyricsSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Simulate real-time lyrics streaming
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < exampleLyrics.length) {
        setLyrics(prev => [...prev, exampleLyrics[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate playback time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleLyricsEdit = (editedLyrics: string) => {
    console.log('Lyrics edited:', editedLyrics);
    // In production, you would update your state/backend here
    const lines = editedLyrics.split('\n');
    const newLyrics: LyricsSegment[] = lines.map((text, index) => ({
      text,
      timestamp: Date.now() + index * 1000,
      start: index * 2,
      end: (index + 1) * 2,
    }));
    setLyrics(newLyrics);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0a0a0f',
      position: 'relative'
    }}>
      <div style={{
        padding: '20px',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <h1>LyricsWidget Example</h1>
        <p>This example demonstrates the enhanced LyricsWidget with AI integration.</p>

        <div style={{ marginTop: '20px' }}>
          <h2>Features:</h2>
          <ul>
            <li>✅ Real-time lyrics display</li>
            <li>✅ AI section labeling (VERSE, CHORUS, BRIDGE, etc.)</li>
            <li>✅ Genre-specific recommendations</li>
            <li>✅ AI iteration process visualization</li>
            <li>✅ Cost tracking and estimation</li>
            <li>✅ Accept/reject recommendations</li>
            <li>✅ Clickable section labels</li>
            <li>✅ Color-coded sections</li>
            <li>✅ Confidence scores</li>
            <li>✅ Edit mode</li>
            <li>✅ Export/copy functionality</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h2>How to use:</h2>
          <ol>
            <li>Wait for lyrics to appear (simulated streaming)</li>
            <li>Select a genre from the dropdown</li>
            <li>Click "Ask AI for Help" to analyze lyrics</li>
            <li>Watch the AI iteration process (3 iterations)</li>
            <li>View AI-detected section labels inline with lyrics</li>
            <li>Check recommendations panel (if recommendations available)</li>
            <li>Accept/dismiss individual recommendations</li>
            <li>Click section labels to jump to that part</li>
            <li>View cost estimate and session total</li>
            <li>Edit lyrics if needed</li>
          </ol>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setIsVisible(!isVisible)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isVisible ? 'Hide' : 'Show'} Widget
          </button>
        </div>
      </div>

      <LyricsWidget
        isVisible={isVisible}
        position="bottom-right"
        lyrics={lyrics}
        onLyricsEdit={handleLyricsEdit}
        autoScroll={true}
        showTimestamps={false}
        allowEdit={true}
        currentTime={currentTime}
        trackId="example-track-123"
        projectId="example-project-456"
        userId="user-123"
        websocketUrl="http://localhost:3000"
      />
    </div>
  );
};

export default LyricsWidgetExample;
