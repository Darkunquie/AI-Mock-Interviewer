"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface FillerWordStats {
  total: number;
  breakdown: Record<string, number>;
  words: string[];
}

export interface SpeechMetrics {
  fillerWords: FillerWordStats;
  wordsPerMinute: number;
  totalWords: number;
  speakingTime: number; // in seconds
  averageWPM: number;
}

// Common filler words to detect
const FILLER_WORDS = [
  "um",
  "uh",
  "umm",
  "uhh",
  "like",
  "you know",
  "actually",
  "basically",
  "literally",
  "so",
  "right",
  "okay",
  "well",
  "kind of",
  "sort of",
];

export function useSpeechAnalysis() {
  const [metrics, setMetrics] = useState<SpeechMetrics>({
    fillerWords: { total: 0, breakdown: {}, words: [] },
    wordsPerMinute: 0,
    totalWords: 0,
    speakingTime: 0,
    averageWPM: 0,
  });

  const startTimeRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number | null>(null);

  // Start timing
  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
  }, []);

  // Stop timing
  const stopTracking = useCallback(() => {
    startTimeRef.current = null;
    lastUpdateRef.current = null;
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      fillerWords: { total: 0, breakdown: {}, words: [] },
      wordsPerMinute: 0,
      totalWords: 0,
      speakingTime: 0,
      averageWPM: 0,
    });
    startTimeRef.current = null;
    lastUpdateRef.current = null;
  }, []);

  // Detect filler words in text
  const detectFillerWords = useCallback((text: string): FillerWordStats => {
    const lowerText = text.toLowerCase();
    const breakdown: Record<string, number> = {};
    const foundWords: string[] = [];
    let total = 0;

    FILLER_WORDS.forEach((filler) => {
      // Create regex to match whole words/phrases
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = lowerText.match(regex);
      const count = matches?.length || 0;

      if (count > 0) {
        breakdown[filler] = count;
        total += count;
        // Add each occurrence to the words array
        for (let i = 0; i < count; i++) {
          foundWords.push(filler);
        }
      }
    });

    return { total, breakdown, words: foundWords };
  }, []);

  // Count words in text
  const countWords = useCallback((text: string): number => {
    const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }, []);

  // Analyze transcript
  const analyzeTranscript = useCallback(
    (transcript: string) => {
      if (!transcript.trim()) {
        return;
      }

      const fillerWords = detectFillerWords(transcript);
      const totalWords = countWords(transcript);

      // Calculate speaking time
      const currentTime = Date.now();
      const speakingTime = startTimeRef.current
        ? (currentTime - startTimeRef.current) / 1000
        : 0;

      // Calculate WPM
      let wordsPerMinute = 0;
      let averageWPM = 0;

      if (speakingTime > 0) {
        averageWPM = Math.round((totalWords / speakingTime) * 60);

        // Calculate instantaneous WPM (last 10 seconds)
        if (lastUpdateRef.current) {
          const timeSinceLastUpdate = (currentTime - lastUpdateRef.current) / 1000;
          if (timeSinceLastUpdate >= 1) {
            // Update every second
            wordsPerMinute = averageWPM;
            lastUpdateRef.current = currentTime;
          } else {
            // Keep previous WPM
            wordsPerMinute = metrics.wordsPerMinute;
          }
        } else {
          wordsPerMinute = averageWPM;
          lastUpdateRef.current = currentTime;
        }
      }

      setMetrics({
        fillerWords,
        wordsPerMinute,
        totalWords,
        speakingTime,
        averageWPM,
      });
    },
    [detectFillerWords, countWords, metrics.wordsPerMinute]
  );

  return {
    metrics,
    analyzeTranscript,
    startTracking,
    stopTracking,
    resetMetrics,
  };
}
