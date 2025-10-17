/**
 * EncouragementWidget
 * Motivational messages and tips for users
 * Adaptive messaging based on user progress and context
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './EncouragementWidget.module.css';

interface EncouragementMessage {
  id: string;
  type: 'motivational' | 'tip' | 'reminder' | 'celebration';
  message: string;
  icon: string;
  context?: string;
  timestamp: Date;
}

interface EncouragementWidgetProps {
  compact?: boolean;
  autoRotate?: boolean;
  rotateInterval?: number; // milliseconds
}

export function EncouragementWidget({
  compact = false,
  autoRotate = true,
  rotateInterval = 10000,
}: EncouragementWidgetProps) {
  const { data: session } = useSession();
  const [currentMessage, setCurrentMessage] = useState<EncouragementMessage | null>(null);
  const [messages, setMessages] = useState<EncouragementMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize messages
  useEffect(() => {
    const defaultMessages: EncouragementMessage[] = [
      {
        id: '1',
        type: 'motivational',
        message: "Every great vocalist started exactly where you are now. Keep practicing!",
        icon: '🌟',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'tip',
        message: "Pro tip: Record yourself daily to track subtle improvements you might not feel.",
        icon: '💡',
        context: 'practice',
        timestamp: new Date(),
      },
      {
        id: '3',
        type: 'reminder',
        message: "Take a 5-minute break every 30 minutes to protect your vocal health.",
        icon: '⏰',
        context: 'health',
        timestamp: new Date(),
      },
      {
        id: '4',
        type: 'celebration',
        message: "You've improved your pitch accuracy by 10% this week! Outstanding progress! 🎉",
        icon: '🎊',
        timestamp: new Date(),
      },
      {
        id: '5',
        type: 'motivational',
        message: "Your voice is unique. Don't try to sound like someone else - embrace your own sound!",
        icon: '🎤',
        timestamp: new Date(),
      },
      {
        id: '6',
        type: 'tip',
        message: "Breath support is everything. Focus on deep belly breathing before vocal exercises.",
        icon: '💨',
        context: 'technique',
        timestamp: new Date(),
      },
      {
        id: '7',
        type: 'motivational',
        message: "Mistakes are proof you're pushing your boundaries. That's where growth happens!",
        icon: '🚀',
        timestamp: new Date(),
      },
      {
        id: '8',
        type: 'reminder',
        message: "Stay hydrated! Your vocal cords perform best when well-hydrated.",
        icon: '💧',
        context: 'health',
        timestamp: new Date(),
      },
      {
        id: '9',
        type: 'tip',
        message: "Sing in front of a mirror to check your posture and facial tension.",
        icon: '🪞',
        context: 'practice',
        timestamp: new Date(),
      },
      {
        id: '10',
        type: 'celebration',
        message: "12 practice sessions this week! Your dedication is inspiring! 🔥",
        icon: '🏆',
        timestamp: new Date(),
      },
      {
        id: '11',
        type: 'motivational',
        message: "Progress isn't always linear. Trust the process and stay consistent.",
        icon: '📈',
        timestamp: new Date(),
      },
      {
        id: '12',
        type: 'tip',
        message: "Warm up for at least 10 minutes before recording. Your voice will thank you!",
        icon: '🔥',
        context: 'practice',
        timestamp: new Date(),
      },
    ];

    setMessages(defaultMessages);
    setCurrentMessage(defaultMessages[0]);
  }, []);

  // Auto-rotate messages
  useEffect(() => {
    if (!autoRotate || isPaused || messages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % messages.length;
        setCurrentMessage(messages[next]);
        return next;
      });
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, isPaused, messages, rotateInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = (prev + 1) % messages.length;
      setCurrentMessage(messages[next]);
      return next;
    });
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const next = (prev - 1 + messages.length) % messages.length;
      setCurrentMessage(messages[next]);
      return next;
    });
  };

  const getTypeColor = (type: EncouragementMessage['type']) => {
    switch (type) {
      case 'motivational':
        return 'var(--accent-purple)';
      case 'tip':
        return 'var(--accent-cyan)';
      case 'reminder':
        return '#eab308'; // yellow
      case 'celebration':
        return 'var(--success)';
      default:
        return 'var(--text-primary)';
    }
  };

  const getTypeLabel = (type: EncouragementMessage['type']) => {
    switch (type) {
      case 'motivational':
        return 'Motivation';
      case 'tip':
        return 'Pro Tip';
      case 'reminder':
        return 'Reminder';
      case 'celebration':
        return 'Celebration';
      default:
        return 'Message';
    }
  };

  if (!currentMessage) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={`${styles.container} ${styles.compact}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={styles.compactContent}>
          <span className={styles.icon}>{currentMessage.icon}</span>
          <span className={styles.compactMessage}>{currentMessage.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.header}>
        <div className={styles.typeLabel} style={{ color: getTypeColor(currentMessage.type) }}>
          {getTypeLabel(currentMessage.type)}
        </div>
        <div className={styles.controls}>
          <button
            className={styles.navButton}
            onClick={handlePrevious}
            title="Previous message"
          >
            ←
          </button>
          <span className={styles.counter}>
            {currentIndex + 1} / {messages.length}
          </span>
          <button
            className={styles.navButton}
            onClick={handleNext}
            title="Next message"
          >
            →
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.iconLarge}>{currentMessage.icon}</div>
        <div className={styles.message}>{currentMessage.message}</div>

        {currentMessage.context && (
          <div className={styles.context}>
            <span className={styles.contextLabel}>Context:</span> {currentMessage.context}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.progressDots}>
          {messages.map((_, index) => (
            <div
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setCurrentMessage(messages[index]);
              }}
            />
          ))}
        </div>

        <button
          className={styles.pauseButton}
          onClick={() => setIsPaused(!isPaused)}
          title={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
      </div>
    </div>
  );
}
