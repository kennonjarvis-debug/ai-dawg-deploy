/**
 * @package dawg-ai
 * @description Milestone tracking widget with unlock animations
 * @owner Instance 4 (Data & Storage - Karen)
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMilestones } from '@/src/hooks/useMilestones';
import type { Milestone } from '@/lib/types';

interface MilestoneTrackerProps {
  userId?: string;
  compact?: boolean;
}

export function MilestoneTracker({ userId = 'demo-user', compact = false }: MilestoneTrackerProps) {
  const { milestones, loading, error, markCelebrationShown, getPendingCelebrations } =
    useMilestones(userId);
  const [celebrating, setCelebrating] = useState<Milestone | null>(null);

  // Show celebrations for newly unlocked milestones
  useEffect(() => {
    const pending = getPendingCelebrations();

    if (pending.length > 0 && !celebrating) {
      const first = pending[0];
      if (first) {
        setCelebrating(first);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setCelebrating(null);
          markCelebrationShown(first.id);
        }, 5000);
      }
    }
  }, [getPendingCelebrations, celebrating, markCelebrationShown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-sm text-gray-500">Loading milestones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-sm text-red-500">Failed to load milestones</div>
      </div>
    );
  }

  if (!milestones) {
    return null;
  }

  const unlockedCount = milestones.milestones.filter((m) => m.isUnlocked).length;
  const totalCount = milestones.milestones.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  // Find next milestone (closest to completion)
  const nextMilestone = milestones.milestones
    .filter((m) => !m.isUnlocked)
    .reduce((closest, current) => {
      if (!closest) return current;
      const closestPercent = closest.currentProgress / closest.target;
      const currentPercent = current.currentProgress / current.target;
      return currentPercent > closestPercent ? current : closest;
    }, null as Milestone | null);

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">Milestones</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl">{milestones.currentStreak > 0 ? '🔥' : '📅'}</span>
            <span className="text-xs font-bold text-gray-900">{milestones.currentStreak}d</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-900">
              {unlockedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">{nextMilestone.icon || '🎯'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{nextMilestone.title}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{nextMilestone.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(nextMilestone.currentProgress / nextMilestone.target) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {nextMilestone.currentProgress}/{nextMilestone.target}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Celebration Modal */}
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setCelebrating(null);
                markCelebrationShown(celebrating.id);
              }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl text-center mb-4"
                >
                  {celebrating.icon || '🎉'}
                </motion.div>
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Milestone Unlocked!
                </h2>
                <p className="text-lg font-semibold text-center text-cyan-600 mb-2">
                  {celebrating.title}
                </p>
                <p className="text-sm text-center text-gray-600 mb-6">{celebrating.description}</p>
                <button
                  onClick={() => {
                    setCelebrating(null);
                    markCelebrationShown(celebrating.id);
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {/* Header with Streak */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2 rounded-lg border border-orange-200">
          <span className="text-3xl">{milestones.currentStreak > 0 ? '🔥' : '📅'}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{milestones.currentStreak} Day Streak</p>
            <p className="text-xs text-gray-600">Longest: {milestones.longestStreak} days</p>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-cyan-50 to-purple-50 p-4 rounded-lg border border-cyan-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">
            {unlockedCount}/{totalCount} Unlocked
          </span>
        </div>
        <div className="h-4 bg-white rounded-full overflow-hidden border border-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="bg-white p-4 rounded-lg border-2 border-cyan-300 shadow-sm">
          <p className="text-xs font-semibold text-cyan-600 mb-2">NEXT MILESTONE</p>
          <div className="flex items-start gap-3">
            <span className="text-4xl">{nextMilestone.icon || '🎯'}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{nextMilestone.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{nextMilestone.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(nextMilestone.currentProgress / nextMilestone.target) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {nextMilestone.currentProgress}/{nextMilestone.target}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Grid */}
      <div className="grid grid-cols-2 gap-3">
        {milestones.milestones.map((milestone) => (
          <motion.div
            key={milestone.id}
            className={`p-3 rounded-lg border-2 transition-all ${
              milestone.isUnlocked
                ? 'bg-gradient-to-br from-cyan-50 to-purple-50 border-cyan-300'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl">{milestone.icon || (milestone.isUnlocked ? '✅' : '🔒')}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{milestone.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{milestone.description}</p>
                {!milestone.isUnlocked && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(milestone.currentProgress / milestone.target) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {milestone.currentProgress}/{milestone.target}
                    </span>
                  </div>
                )}
                {milestone.isUnlocked && milestone.unlockedAt && (
                  <p className="text-xs text-cyan-600 font-medium">
                    Unlocked {milestone.unlockedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setCelebrating(null);
              markCelebrationShown(celebrating.id);
            }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-6xl text-center mb-4"
              >
                {celebrating.icon || '🎉'}
              </motion.div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Milestone Unlocked!
              </h2>
              <p className="text-lg font-semibold text-center text-cyan-600 mb-2">
                {celebrating.title}
              </p>
              <p className="text-sm text-center text-gray-600 mb-6">{celebrating.description}</p>
              <button
                onClick={() => {
                  setCelebrating(null);
                  markCelebrationShown(celebrating.id);
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
