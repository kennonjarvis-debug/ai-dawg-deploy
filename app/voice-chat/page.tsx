'use client';

import { useState, useEffect } from 'react';
import styles from './voice-chat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.lang = 'en-US';
        recognitionInstance.interimResults = true;

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          if (finalTranscript) {
            handleUserInput(finalTranscript);
          }
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          if (!isSpeaking) {
            setStatus('Ready');
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Recognition error:', event.error);
          setStatus('Error: ' + event.error);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }

      setSynth(window.speechSynthesis);
    }
  }, []);

  const startListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      return;
    }

    recognition.start();
    setIsListening(true);
    setStatus('Listening...');
    setTranscript('');
  };

  const stopSpeaking = () => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
      setStatus('Ready');
    }
  };

  const handleUserInput = async (text: string) => {
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setStatus('Thinking...');

    try {
      const response = await fetch('/api/voice-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.message || data.content || 'Sorry, I could not process that.';
      const instanceName = data.instance || 'Team';

      const assistantMsg: Message = {
        role: 'assistant',
        content: `[${instanceName}] ${assistantMessage}`
      };
      setMessages(prev => [...prev, assistantMsg]);
      speak(assistantMessage);
    } catch (error: any) {
      console.error('API error:', error);
      const errorMsg = 'Sorry, there was an error: ' + error.message;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      speak(errorMsg);
    }
  };

  const speak = (text: string) => {
    if (!synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('Speaking...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus('Ready');
    };

    synth.speak(utterance);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎙️ Voice Chat with Claude Code</h1>
        <div className={`${styles.status} ${isListening ? styles.listening : ''} ${isSpeaking ? styles.speaking : ''}`}>
          {status}
        </div>
      </div>

      {transcript && (
        <div className={`${styles.transcript} ${transcript ? styles.active : ''}`}>
          {transcript || 'Click "Start Listening" to begin...'}
        </div>
      )}

      <div className={styles.chatContainer}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageHeader}>
              {msg.role === 'user' ? 'You' : 'Claude'}
            </div>
            <div className={styles.messageText}>{msg.content}</div>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
          onClick={startListening}
        >
          🎤 {isListening ? 'Listening...' : 'Start Listening'}
        </button>
        <button
          className={styles.stopButton}
          onClick={stopSpeaking}
          disabled={!isSpeaking}
        >
          ⏹️ Stop Speaking
        </button>
      </div>
    </div>
  );
}
