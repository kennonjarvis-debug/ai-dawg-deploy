/**
 * useProfile Hook
 * Client-side hook for accessing ProfileManager
 * Replaces scattered localStorage calls in widgets
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface VocalRange {
  lowest: string;
  highest: string;
  comfortable: string;
  semitones: number;
}

export interface UserProfile {
  userId: string;
  userHash: string;
  createdAt: Date;
  updatedAt: Date;
  vocalRange: VocalRange;
  strengths: string[];
  growthAreas: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  genre: string;
  practiceHours: number;
  sessionsCompleted: number;
  totalRecordings: number;
  skills: {
    pitchAccuracy: number;
    breathControl: number;
    vibratoControl: number;
    rangeExpansion: number;
    tonalQuality: number;
  };
  preferences: {
    autoSaveEnabled: boolean;
    autoSaveInterval: number;
    theme: 'dark' | 'light';
    defaultInput: string;
    defaultOutput: string;
  };
  privacyConsent: {
    analytics: boolean;
    aiCoaching: boolean;
    dataRetention: boolean;
    acceptedAt?: Date;
  };
}

export function useProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();

        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.error);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session]);

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      return false;
    }
  };

  // Update skills
  const updateSkills = async (skills: Partial<UserProfile['skills']>) => {
    try {
      const response = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skills),
      });

      const data = await response.json();

      if (data.success) {
        // Reload profile to get updated skills
        const profileResponse = await fetch('/api/profile');
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setProfile(profileData.profile);
        }
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update skills');
      return false;
    }
  };

  // Log session
  const logSession = async (durationMinutes: number) => {
    try {
      const response = await fetch('/api/profile/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload profile to get updated stats
        const profileResponse = await fetch('/api/profile');
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setProfile(profileData.profile);
        }
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log session');
      return false;
    }
  };

  // Export data
  const exportData = async () => {
    try {
      const response = await fetch('/api/profile/export');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dawg-ai-profile-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
      return false;
    }
  };

  // Delete profile
  const deleteProfile = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your profile? This cannot be undone. Type DELETE_MY_DATA to confirm.'
    );

    if (!confirmed) return false;

    const confirmText = window.prompt('Type DELETE_MY_DATA to confirm:');
    if (confirmText !== 'DELETE_MY_DATA') return false;

    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDelete: 'DELETE_MY_DATA' }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(null);
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateSkills,
    logSession,
    exportData,
    deleteProfile,
  };
}
