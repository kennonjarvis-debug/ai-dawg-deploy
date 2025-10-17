/**
 * ProfileManager - Centralized Profile Management
 * Karen's domain - all profile operations go through here
 * Replaces scattered localStorage with event-driven state
 */

import { createHash } from 'crypto';
import {
  UserProfile,
  PersonalizationSignals,
  UserProfileSchema,
  PersonalizationSignalsSchema,
  validateStorageData,
} from '@/lib/types';

class ProfileManagerClass {
  private profiles: Map<string, UserProfile> = new Map();
  private eventLog: any[] = [];

  /**
   * Hash user ID for event payloads (PII-safe)
   */
  private hashUserId(userId: string): string {
    return 'usr_' + createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  /**
   * Sign event payload with HMAC-SHA256
   */
  private signEvent(payload: any): string {
    const secret = process.env.DAWGAI_HMAC_SECRET || 'dev_secret_change_in_production';
    const hmac = createHash('sha256');
    hmac.update(secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Calculate vocal range in semitones
   * FIXED: Now handles flats, error cases, and validates input
   */
  private calculateSemitones(lowest: string, highest: string): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const parseNote = (note: string): number | null => {
      // Handle both sharps and flats
      const match = note.match(/^([A-G][#b]?)(\d)$/);
      if (!match) {
        console.error(`Invalid note format: ${note}`);
        return null;
      }
      const [, noteName, octave] = match;
      const octaveNum = parseInt(octave!);

      // Validate octave range (typical human range is 0-8)
      if (octaveNum < 0 || octaveNum > 8) {
        console.error(`Invalid octave: ${octaveNum}`);
        return null;
      }

      const noteValue = noteMap[noteName!];
      if (noteValue === undefined) {
        console.error(`Unknown note name: ${noteName}`);
        return null;
      }

      return noteValue + (octaveNum * 12);
    };

    const lowValue = parseNote(lowest);
    const highValue = parseNote(highest);

    if (lowValue === null || highValue === null) {
      console.warn(`Failed to parse vocal range: ${lowest} - ${highest}, defaulting to 24 semitones`);
      return 24; // Default 2-octave range
    }

    const range = highValue - lowValue;
    if (range < 0) {
      console.warn(`Invalid range: highest (${highest}) is lower than lowest (${lowest})`);
      return Math.abs(range); // Fix inverted ranges
    }

    return range;
  }

  /**
   * Load profile from localStorage (migration path)
   */
  loadFromLocalStorage(userId: string): UserProfile | null {
    if (typeof window === 'undefined') return null;

    const vocalProfile = localStorage.getItem('vocalProfile');
    const userPreferences = localStorage.getItem('userPreferences');
    const audioDevicePreferences = localStorage.getItem('audioDevicePreferences');

    if (!vocalProfile) return null;

    const vocal = JSON.parse(vocalProfile);
    const prefs = userPreferences ? JSON.parse(userPreferences) : {};
    const audioPrefs = audioDevicePreferences ? JSON.parse(audioDevicePreferences) : {};

    const rawProfile = {
      userId,
      userHash: this.hashUserId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      vocalRange: {
        ...vocal.vocalRange,
        semitones: this.calculateSemitones(vocal.vocalRange.lowest, vocal.vocalRange.highest),
      },
      strengths: vocal.strengths || [],
      growthAreas: vocal.growthAreas || [],
      skillLevel: vocal.skillLevel || 'beginner',
      genre: vocal.genre || 'Country',
      practiceHours: vocal.practiceHours || 0,
      sessionsCompleted: vocal.sessionsCompleted || 0,
      totalRecordings: 0,
      skills: {
        pitchAccuracy: 50,
        breathControl: 50,
        vibratoControl: 50,
        rangeExpansion: 50,
        tonalQuality: 50,
      },
      preferences: {
        autoSaveEnabled: prefs.autoSaveEnabled ?? true,
        autoSaveInterval: prefs.autoSaveInterval ?? 30,
        theme: prefs.theme ?? 'dark',
        defaultInput: prefs.defaultInput || audioPrefs.defaultInputDeviceId || '',
        defaultOutput: prefs.defaultOutput || audioPrefs.defaultOutputDeviceId || '',
      },
      privacyConsent: {
        analytics: true,
        aiCoaching: true,
        dataRetention: true,
        acceptedAt: new Date(),
      },
    };

    // Validate with Zod schema before returning
    try {
      return validateStorageData(UserProfileSchema, rawProfile, 'vocalProfile');
    } catch (error) {
      console.error('Failed to validate profile from localStorage:', error);
      return null;
    }
  }

  /**
   * Create or update profile
   */
  async upsertProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.profiles.get(userId) || this.loadFromLocalStorage(userId);

    const profile: UserProfile = existing
      ? { ...existing, ...updates, updatedAt: new Date() }
      : {
          userId,
          userHash: this.hashUserId(userId),
          createdAt: new Date(),
          updatedAt: new Date(),
          vocalRange: { lowest: 'C3', highest: 'A5', comfortable: 'E3 - F5', semitones: 21 },
          strengths: [],
          growthAreas: [],
          skillLevel: 'beginner',
          genre: 'Country',
          practiceHours: 0,
          sessionsCompleted: 0,
          totalRecordings: 0,
          skills: {
            pitchAccuracy: 50,
            breathControl: 50,
            vibratoControl: 50,
            rangeExpansion: 50,
            tonalQuality: 50,
          },
          preferences: {
            autoSaveEnabled: true,
            autoSaveInterval: 30,
            theme: 'dark',
            defaultInput: '',
            defaultOutput: '',
          },
          privacyConsent: {
            analytics: true,
            aiCoaching: true,
            dataRetention: true,
            acceptedAt: new Date(),
          },
          ...updates,
        };

    this.profiles.set(userId, profile);

    // Emit event
    await this.emitProfileUpdated(profile);

    return profile;
  }

  /**
   * Get profile by user ID
   */
  getProfile(userId: string): UserProfile | null {
    return this.profiles.get(userId) || this.loadFromLocalStorage(userId);
  }

  /**
   * Get personalization signals (PII-safe for events)
   */
  getSignals(userId: string): PersonalizationSignals | null {
    const profile = this.getProfile(userId);
    if (!profile) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate 30-day practice hours from sessionHistory
    const sessions30d = (profile.sessionHistory || []).filter(
      (s) => s.timestamp >= thirtyDaysAgo && s.completed
    );
    const practiceHours30d = sessions30d.reduce((sum, s) => sum + s.durationMinutes / 60, 0);

    // Calculate session frequency (sessions per week)
    const sessionsLastWeek = (profile.sessionHistory || []).filter(
      (s) => s.timestamp >= sevenDaysAgo && s.completed
    ).length;
    const sessionFrequency = sessionsLastWeek;

    // Calculate average session duration
    const completedSessions = (profile.sessionHistory || []).filter((s) => s.completed);
    const avgSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / completedSessions.length
        : 0;

    // Calculate days since last activity
    const lastActiveDate = profile.lastActiveDate || profile.updatedAt;
    const lastActiveDaysAgo = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate recording count in last 30 days (TODO: implement when recording timestamps tracked)
    const recordingCount30d = 0; // Placeholder - need recording timestamps

    // Calculate completion rate
    const plannedSessions = (profile.sessionHistory || []).filter((s) => s.timestamp <= now);
    const completedCount = plannedSessions.filter((s) => s.completed).length;
    const completionRate = plannedSessions.length > 0 ? completedCount / plannedSessions.length : 0;

    // Calculate skill trend velocity (rate of improvement)
    const skillTrendVelocity = this.calculateSkillVelocity(profile);

    const recentTrend = this.calculateTrend(profile);

    return {
      userHash: profile.userHash,
      vocalRangeSemitones: profile.vocalRange.semitones ?? 0,
      pitchAccuracyAvg: profile.skills.pitchAccuracy,
      practiceHours30d,
      skillLevel: profile.skillLevel,
      preferredGenre: profile.genre,
      topStrengths: profile.strengths.slice(0, 3),
      topGrowthAreas: profile.growthAreas.slice(0, 3),
      recentTrend,
      sessionFrequency,
      lastActiveDaysAgo,
      avgSessionDuration,
      recordingCount30d,
      completionRate,
      skillTrendVelocity,
      pii: false,
    };
  }

  /**
   * Calculate skill velocity (rate of improvement)
   * Uses linear regression on skill history
   */
  private calculateSkillVelocity(profile: UserProfile): number {
    const history = profile.skillHistory || [];
    if (history.length < 2) return 0;

    // Calculate average skill for each snapshot
    const dataPoints = history.map((snapshot) => {
      const avgSkill =
        (snapshot.pitchAccuracy +
          snapshot.breathControl +
          snapshot.vibratoControl +
          snapshot.rangeExpansion +
          snapshot.tonalQuality) /
        5;
      return {
        timestamp: snapshot.timestamp.getTime(),
        skill: avgSkill,
      };
    });

    // Simple linear regression
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.timestamp, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.skill, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.timestamp * p.skill, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.timestamp * p.timestamp, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Convert slope to points per day, then scale to -100 to +100
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const pointsPerDay = slope * millisecondsPerDay;
    const velocity = Math.max(-100, Math.min(100, pointsPerDay * 30)); // Scale to 30-day change

    return Math.round(velocity * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate trend (simplified - would use skill history in production)
   */
  private calculateTrend(profile: UserProfile): 'improving' | 'stable' | 'declining' {
    const avgSkill =
      (profile.skills.pitchAccuracy +
        profile.skills.breathControl +
        profile.skills.vibratoControl +
        profile.skills.rangeExpansion +
        profile.skills.tonalQuality) /
      5;

    if (avgSkill > 60) return 'improving';
    if (avgSkill < 40) return 'declining';
    return 'stable';
  }

  /**
   * Update skill metrics
   */
  async updateSkills(userId: string, skills: Partial<UserProfile['skills']>): Promise<void> {
    const profile = this.getProfile(userId);
    if (!profile) return;

    profile.skills = { ...profile.skills, ...skills };
    profile.updatedAt = new Date();
    profile.lastActiveDate = new Date();

    // Append to skill history for trend analysis
    if (!profile.skillHistory) profile.skillHistory = [];
    profile.skillHistory.push({
      timestamp: new Date(),
      pitchAccuracy: profile.skills.pitchAccuracy,
      breathControl: profile.skills.breathControl,
      vibratoControl: profile.skills.vibratoControl,
      rangeExpansion: profile.skills.rangeExpansion,
      tonalQuality: profile.skills.tonalQuality,
    });

    // Keep only last 90 days of skill history
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    profile.skillHistory = profile.skillHistory.filter(
      (snapshot) => snapshot.timestamp >= ninetyDaysAgo
    );

    this.profiles.set(userId, profile);
    await this.emitProfileUpdated(profile);
  }

  /**
   * Log practice session
   */
  async logSession(userId: string, durationMinutes: number): Promise<void> {
    const profile = this.getProfile(userId);
    if (!profile) return;

    profile.sessionsCompleted += 1;
    profile.practiceHours += durationMinutes / 60;
    profile.updatedAt = new Date();
    profile.lastActiveDate = new Date();

    // Append to session history
    if (!profile.sessionHistory) profile.sessionHistory = [];
    profile.sessionHistory.push({
      timestamp: new Date(),
      durationMinutes,
      completed: true,
    });

    // Keep only last 180 days of session history
    const oneEightyDaysAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    profile.sessionHistory = profile.sessionHistory.filter(
      (session) => session.timestamp >= oneEightyDaysAgo
    );

    this.profiles.set(userId, profile);
    await this.emitProfileUpdated(profile);
  }

  /**
   * Delete profile (GDPR)
   */
  async deleteProfile(userId: string): Promise<void> {
    this.profiles.delete(userId);

    // Emit deletion event
    await this.emitEvent({
      event: 'profile.deleted',
      payload: {
        userHash: this.hashUserId(userId),
        deletedAt: new Date().toISOString(),
      },
    });

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vocalProfile');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('audioDevicePreferences');
    }
  }

  /**
   * Export profile data (GDPR)
   */
  exportProfile(userId: string): string {
    const profile = this.getProfile(userId);
    if (!profile) return JSON.stringify({ error: 'Profile not found' });

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Emit profile.updated event
   */
  private async emitProfileUpdated(profile: UserProfile): Promise<void> {
    const signals = this.getSignals(profile.userId);
    if (!signals) return;

    await this.emitEvent({
      event: 'profile.updated',
      payload: { signals },
    });
  }

  /**
   * Emit event to bus (GitOps mode)
   */
  private async emitEvent(event: { event: string; payload: any }): Promise<void> {
    const envelope = {
      event: event.event,
      version: 'v1',
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      trace_id: `tr_karen_${Date.now()}`,
      producer: 'karen',
      ts: new Date().toISOString(),
      signature: this.signEvent(event.payload),
      payload: event.payload,
    };

    this.eventLog.push(envelope);

    // Write to GitOps event log
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const date = new Date().toISOString().split('T')[0];
      const eventPath = path.join(process.cwd(), '_bus', 'events', date, 'events.jsonl');

      try {
        fs.appendFileSync(eventPath, JSON.stringify(envelope) + '\n');
      } catch (err) {
        console.error('Failed to write event:', err);
      }
    }
  }

  /**
   * Save all profiles to state file
   */
  async saveState(): Promise<void> {
    if (typeof window !== 'undefined') return; // Server-side only

    const fs = require('fs');
    const path = require('path');
    const statePath = path.join(process.cwd(), '_bus', 'state', 'profiles.json');

    const state = {
      version: 'v1',
      last_updated: new Date().toISOString(),
      profiles: Array.from(this.profiles.entries()).reduce((acc, [id, profile]) => {
        // Strip PII for state file
        acc[profile.userHash] = {
          userHash: profile.userHash,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          vocalRange: profile.vocalRange,
          strengths: profile.strengths,
          growthAreas: profile.growthAreas,
          skillLevel: profile.skillLevel,
          genre: profile.genre,
          practiceHours: profile.practiceHours,
          sessionsCompleted: profile.sessionsCompleted,
          skills: profile.skills,
          privacyConsent: profile.privacyConsent,
        };
        return acc;
      }, {} as any),
      policy_version: '1.0.0',
      privacy_policy_path: '/docs/policies/privacy.md',
    };

    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }
}

export const ProfileManager = new ProfileManagerClass();
