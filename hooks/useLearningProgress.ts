"use client";

import { useState, useEffect, useCallback } from "react";

export interface TopicProgress {
  topicId: string;
  topicName: string;
  roleId: string;
  phase: number;
  status: "not_started" | "in_progress" | "completed";
  practiceCount: number;
  lastPracticed: string | null;
  bestScore: number | null;
  completedAt: string | null;
}

export interface RoleProgress {
  roleId: string;
  roleName: string;
  startedAt: string;
  totalTopics: number;
  completedTopics: number;
  currentPhase: number;
  topics: Record<string, TopicProgress>;
}

export interface LearningProgressState {
  roles: Record<string, RoleProgress>;
  lastUpdated: string;
}

const STORAGE_KEY = "learning_progress";

const getInitialState = (): LearningProgressState => ({
  roles: {},
  lastUpdated: new Date().toISOString(),
});

export function useLearningProgress() {
  const [progress, setProgress] = useState<LearningProgressState>(getInitialState());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setProgress(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse learning progress:", e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, isLoaded]);

  // Initialize progress for a role
  const initializeRole = useCallback(
    (roleId: string, roleName: string, totalTopics: number) => {
      setProgress((prev) => {
        if (prev.roles[roleId]) return prev;
        return {
          ...prev,
          roles: {
            ...prev.roles,
            [roleId]: {
              roleId,
              roleName,
              startedAt: new Date().toISOString(),
              totalTopics,
              completedTopics: 0,
              currentPhase: 1,
              topics: {},
            },
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Mark a topic as started
  const startTopic = useCallback(
    (roleId: string, topicId: string, topicName: string, phase: number) => {
      setProgress((prev) => {
        const roleProgress = prev.roles[roleId];
        if (!roleProgress) return prev;

        const existingTopic = roleProgress.topics[topicId];
        if (existingTopic && existingTopic.status !== "not_started") {
          // Already started, just update practice count
          return {
            ...prev,
            roles: {
              ...prev.roles,
              [roleId]: {
                ...roleProgress,
                topics: {
                  ...roleProgress.topics,
                  [topicId]: {
                    ...existingTopic,
                    practiceCount: existingTopic.practiceCount + 1,
                    lastPracticed: new Date().toISOString(),
                  },
                },
              },
            },
            lastUpdated: new Date().toISOString(),
          };
        }

        return {
          ...prev,
          roles: {
            ...prev.roles,
            [roleId]: {
              ...roleProgress,
              topics: {
                ...roleProgress.topics,
                [topicId]: {
                  topicId,
                  topicName,
                  roleId,
                  phase,
                  status: "in_progress",
                  practiceCount: 1,
                  lastPracticed: new Date().toISOString(),
                  bestScore: null,
                  completedAt: null,
                },
              },
            },
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Complete a topic with score
  const completeTopic = useCallback(
    (roleId: string, topicId: string, score: number) => {
      setProgress((prev) => {
        const roleProgress = prev.roles[roleId];
        if (!roleProgress) return prev;

        const existingTopic = roleProgress.topics[topicId];
        if (!existingTopic) return prev;

        const isNewCompletion = existingTopic.status !== "completed";
        const newBestScore =
          existingTopic.bestScore !== null
            ? Math.max(existingTopic.bestScore, score)
            : score;

        return {
          ...prev,
          roles: {
            ...prev.roles,
            [roleId]: {
              ...roleProgress,
              completedTopics: isNewCompletion
                ? roleProgress.completedTopics + 1
                : roleProgress.completedTopics,
              topics: {
                ...roleProgress.topics,
                [topicId]: {
                  ...existingTopic,
                  status: "completed",
                  bestScore: newBestScore,
                  completedAt: new Date().toISOString(),
                  lastPracticed: new Date().toISOString(),
                },
              },
            },
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Update score for a topic
  const updateTopicScore = useCallback(
    (roleId: string, topicId: string, score: number) => {
      setProgress((prev) => {
        const roleProgress = prev.roles[roleId];
        if (!roleProgress) return prev;

        const existingTopic = roleProgress.topics[topicId];
        if (!existingTopic) return prev;

        const newBestScore =
          existingTopic.bestScore !== null
            ? Math.max(existingTopic.bestScore, score)
            : score;

        return {
          ...prev,
          roles: {
            ...prev.roles,
            [roleId]: {
              ...roleProgress,
              topics: {
                ...roleProgress.topics,
                [topicId]: {
                  ...existingTopic,
                  bestScore: newBestScore,
                  lastPracticed: new Date().toISOString(),
                },
              },
            },
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Get progress for a specific role
  const getRoleProgress = useCallback(
    (roleId: string): RoleProgress | null => {
      return progress.roles[roleId] || null;
    },
    [progress]
  );

  // Get progress percentage for a role
  const getRoleProgressPercentage = useCallback(
    (roleId: string): number => {
      const roleProgress = progress.roles[roleId];
      if (!roleProgress || roleProgress.totalTopics === 0) return 0;
      return Math.round(
        (roleProgress.completedTopics / roleProgress.totalTopics) * 100
      );
    },
    [progress]
  );

  // Get topic status
  const getTopicStatus = useCallback(
    (roleId: string, topicId: string): TopicProgress["status"] => {
      const roleProgress = progress.roles[roleId];
      if (!roleProgress) return "not_started";
      return roleProgress.topics[topicId]?.status || "not_started";
    },
    [progress]
  );

  // Get topic details
  const getTopicProgress = useCallback(
    (roleId: string, topicId: string): TopicProgress | null => {
      const roleProgress = progress.roles[roleId];
      if (!roleProgress) return null;
      return roleProgress.topics[topicId] || null;
    },
    [progress]
  );

  // Reset progress for a role
  const resetRoleProgress = useCallback((roleId: string) => {
    setProgress((prev) => {
      const { [roleId]: _, ...remainingRoles } = prev.roles;
      return {
        ...prev,
        roles: remainingRoles,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Reset all progress
  const resetAllProgress = useCallback(() => {
    setProgress(getInitialState());
  }, []);

  return {
    progress,
    isLoaded,
    initializeRole,
    startTopic,
    completeTopic,
    updateTopicScore,
    getRoleProgress,
    getRoleProgressPercentage,
    getTopicStatus,
    getTopicProgress,
    resetRoleProgress,
    resetAllProgress,
  };
}
