"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerOptions {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isTimeUp: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
  percentageLeft: number;
}

export function useTimer({
  initialTime,
  onTimeUp,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          // Updaters must stay pure (Strict Mode runs them twice) — onTimeUp
          // fires from the isTimeUp effect below, exactly once per expiry.
          if (prev <= 1) {
            setIsRunning(false);
            setIsTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isTimeUp) onTimeUpRef.current?.();
  }, [isTimeUp]);

  // Read via ref so start() keeps a stable identity (no timeLeft dep) and
  // callers can list it as a dependency.
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const start = useCallback(() => {
    // Expired: stay stopped and time-up; caller must reset() first.
    if (timeLeftRef.current <= 0) return;
    setIsRunning(true);
    setIsTimeUp(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    // Sync the ref now: callers do reset(); start() in one handler, before
    // the timeLeft effect runs.
    timeLeftRef.current = initialTime;
    setTimeLeft(initialTime);
    setIsRunning(false);
    setIsTimeUp(false);
  }, [initialTime]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const percentageLeft = (timeLeft / initialTime) * 100;

  return {
    timeLeft,
    isRunning,
    isTimeUp,
    start,
    pause,
    reset,
    formatTime,
    percentageLeft,
  };
}
