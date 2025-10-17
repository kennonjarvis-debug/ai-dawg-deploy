/**
 * SessionPlanner Widget
 * Schedule, upcoming sessions, and practice history
 * Track practice sessions with goals and completion
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './SessionPlanner.module.css';

interface PracticeSession {
  id: string;
  title: string;
  date: Date;
  duration: number; // minutes
  goals: string[];
  completed: boolean;
  notes?: string;
  skillsFocused?: string[];
}

interface SessionPlannerProps {
  onScheduleSession?: (session: Omit<PracticeSession, 'id' | 'completed'>) => void;
  onCompleteSession?: (sessionId: string, notes: string) => void;
}

export function SessionPlanner({ onScheduleSession, onCompleteSession }: SessionPlannerProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);
  const [loading, setLoading] = useState(false);

  // New session form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newGoals, setNewGoals] = useState<string[]>(['']);

  // Load sessions from localStorage or API
  useEffect(() => {
    if (!session) return;

    const savedSessions = localStorage.getItem('practiceSessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(
        parsed.map((s: any) => ({
          ...s,
          date: new Date(s.date),
        }))
      );
    }
  }, [session]);

  const handleAddGoal = () => {
    setNewGoals([...newGoals, '']);
  };

  const handleUpdateGoal = (index: number, value: string) => {
    const updated = [...newGoals];
    updated[index] = value;
    setNewGoals(updated);
  };

  const handleRemoveGoal = (index: number) => {
    setNewGoals(newGoals.filter((_, i) => i !== index));
  };

  const handleCreateSession = () => {
    if (!newTitle.trim() || !newDate) return;

    const newSession: PracticeSession = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      date: new Date(newDate),
      duration: newDuration,
      goals: newGoals.filter((g) => g.trim()),
      completed: false,
    };

    const updated = [...sessions, newSession];
    setSessions(updated);
    localStorage.setItem('practiceSessions', JSON.stringify(updated));

    if (onScheduleSession) {
      onScheduleSession({
        title: newSession.title,
        date: newSession.date,
        duration: newSession.duration,
        goals: newSession.goals,
      });
    }

    // Reset form
    setNewTitle('');
    setNewDate('');
    setNewDuration(30);
    setNewGoals(['']);
    setShowNewSession(false);
  };

  const handleCompleteSession = async (sessionId: string) => {
    const sessionToComplete = sessions.find((s) => s.id === sessionId);
    if (!sessionToComplete) return;

    const notes = prompt('Add notes for this session (optional):');
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, completed: true, notes: notes || undefined } : s
    );

    setSessions(updated);
    localStorage.setItem('practiceSessions', JSON.stringify(updated));

    // Log to Karen's ProfileManager
    try {
      await fetch('/api/profile/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: sessionToComplete.duration }),
      });
    } catch (err) {
      console.error('Failed to log session:', err);
    }

    if (onCompleteSession && notes) {
      onCompleteSession(sessionId, notes);
    }
  };

  const upcomingSessions = sessions
    .filter((s) => !s.completed && s.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const pastSessions = sessions
    .filter((s) => s.completed)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Practice Sessions</h3>
        <button onClick={() => setShowNewSession(!showNewSession)} className={styles.addButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Schedule
        </button>
      </div>

      {showNewSession && (
        <div className={styles.newSessionForm}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Session title (e.g., Vocal Technique)"
            className={styles.input}
          />

          <div className={styles.row}>
            <input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className={styles.input}
            />
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(parseInt(e.target.value))}
              className={styles.select}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className={styles.goalsSection}>
            <label className={styles.label}>Goals:</label>
            {newGoals.map((goal, index) => (
              <div key={index} className={styles.goalInput}>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => handleUpdateGoal(index, e.target.value)}
                  placeholder="Goal for this session"
                  className={styles.input}
                />
                {newGoals.length > 1 && (
                  <button onClick={() => handleRemoveGoal(index)} className={styles.removeButton}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button onClick={handleAddGoal} className={styles.addGoalButton}>
              + Add Goal
            </button>
          </div>

          <div className={styles.formActions}>
            <button onClick={() => setShowNewSession(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleCreateSession} className={styles.createButton}>
              Create Session
            </button>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={activeTab === 'upcoming' ? styles.tabActive : styles.tab}
        >
          Upcoming ({upcomingSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? styles.tabActive : styles.tab}
        >
          History ({pastSessions.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'upcoming' && (
          <div className={styles.sessionList}>
            {upcomingSessions.length === 0 ? (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
                </svg>
                <p>No upcoming sessions</p>
                <span>Schedule your next practice session</span>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <h4 className={styles.sessionTitle}>{session.title}</h4>
                    <span className={styles.sessionDuration}>{session.duration} min</span>
                  </div>
                  <div className={styles.sessionDate}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                    </svg>
                    {formatDate(session.date)} at {formatTime(session.date)}
                  </div>
                  {session.goals.length > 0 && (
                    <div className={styles.goals}>
                      {session.goals.map((goal, i) => (
                        <span key={i} className={styles.goal}>
                          {goal}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleCompleteSession(session.id)}
                    className={styles.completeButton}
                  >
                    Mark Complete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.sessionList}>
            {pastSessions.length === 0 ? (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 8v4l3 3" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                </svg>
                <p>No completed sessions yet</p>
                <span>Complete your first practice session</span>
              </div>
            ) : (
              pastSessions.map((session) => (
                <div key={session.id} className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <h4 className={styles.sessionTitle}>{session.title}</h4>
                    <span className={styles.sessionCompleted}>✓ Complete</span>
                  </div>
                  <div className={styles.sessionDate}>
                    {formatDate(session.date)} • {session.duration} min
                  </div>
                  {session.notes && <p className={styles.notes}>{session.notes}</p>}
                  {session.goals.length > 0 && (
                    <div className={styles.goals}>
                      {session.goals.map((goal, i) => (
                        <span key={i} className={styles.goalCompleted}>
                          ✓ {goal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
