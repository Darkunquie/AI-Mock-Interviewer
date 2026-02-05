"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Web Speech API types
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventType {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventType {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventType) => void) | null;
  onend: (() => void) | null;
}

interface UseSpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  confidenceThreshold?: number;
  maxAlternatives?: number;
}

interface UseSpeechToTextReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  requestPermission: () => Promise<boolean>;
}

// Check support synchronously
const checkSpeechSupport = (): boolean => {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
};

// Get SpeechRecognition constructor
const getSpeechRecognition = (): (new () => SpeechRecognitionInstance) | null => {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
};

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    continuous = true,
    interimResults = true,
    lang = "en-US",
    confidenceThreshold = 0.6, // Filter out low-confidence results
    maxAlternatives = 3 // Get multiple alternatives for better accuracy
  } = options;

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  // Initialize isSupported synchronously
  const [isSupported] = useState(checkSpeechSupport);
  // Initialize error synchronously based on support
  const [error, setError] = useState<string | null>(() =>
    !checkSpeechSupport() ? "Speech recognition is not supported in this browser." : null
  );
  // Permission status tracking
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false); // Track if we should auto-restart

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          result.onchange = () => {
            setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          };
        }
      } catch {
        // Permissions API not supported, will check on first use
        setPermissionStatus('unknown');
      }
    };
    checkPermission();
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      setError(null);
      return true;
    } catch (err) {
      console.error("[Speech] Permission denied:", err);
      setPermissionStatus('denied');
      setError("Microphone access denied. Please allow microphone access in browser settings.");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onresult = (event: SpeechRecognitionEventType) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        // Get the best alternative based on confidence
        let bestAlternative = result[0];
        let bestConfidence = result[0].confidence;

        // Check all alternatives and pick the one with highest confidence
        for (let j = 1; j < result.length; j++) {
          if (result[j].confidence > bestConfidence) {
            bestAlternative = result[j];
            bestConfidence = result[j].confidence;
          }
        }

        if (result.isFinal) {
          // Only use results with acceptable confidence
          if (bestConfidence >= confidenceThreshold) {
            finalTranscript += bestAlternative.transcript + " ";
            console.log(`[Speech] Accepted (confidence: ${(bestConfidence * 100).toFixed(1)}%):`, bestAlternative.transcript);
          } else {
            console.warn(`[Speech] Rejected low confidence (${(bestConfidence * 100).toFixed(1)}%):`, bestAlternative.transcript);
            // Still add it but log a warning
            finalTranscript += bestAlternative.transcript + " ";
          }
        } else {
          interim += bestAlternative.transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => {
          const newText = prev + finalTranscript;
          console.log("[Speech] Final transcript:", finalTranscript);
          console.log("[Speech] Total transcript:", newText);
          return newText;
        });
      }
      if (interim) {
        console.log("[Speech] Interim transcript:", interim);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
      console.warn("[Speech] Recognition error:", event.error);

      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access in browser settings.");
        shouldRestartRef.current = false;
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // No speech detected - this is normal, don't stop recognition
        console.log("[Speech] No speech detected, continuing...");
        // Don't set error or stop listening, let auto-restart handle it
      } else if (event.error === "audio-capture") {
        setError("Microphone not found. Please check your microphone connection.");
        shouldRestartRef.current = false;
        setIsListening(false);
      } else if (event.error === "network") {
        setError("Network error. Speech recognition requires internet connection.");
        shouldRestartRef.current = false;
        setIsListening(false);
      } else if (event.error !== "aborted") {
        console.error("[Speech] Unexpected error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        shouldRestartRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log("[Speech] Recognition ended, shouldRestart:", shouldRestartRef.current);
      setInterimTranscript("");

      // Auto-restart if we're in continuous mode and user hasn't manually stopped
      if (shouldRestartRef.current && continuous) {
        console.log("[Speech] Auto-restarting recognition...");
        try {
          recognition.start();
        } catch (err) {
          console.warn("[Speech] Failed to auto-restart:", err);
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, lang, isSupported]);

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !isListening) {
      // First check/request permission if needed
      if (permissionStatus === 'denied') {
        setError("Microphone access denied. Please allow microphone access in browser settings and refresh the page.");
        return;
      }

      if (permissionStatus !== 'granted') {
        console.log("[Speech] Requesting microphone permission...");
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      setError(null);
      setInterimTranscript("");
      shouldRestartRef.current = true; // Enable auto-restart
      try {
        console.log("[Speech] Starting recognition...");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("[Speech] Failed to start recognition:", err);
        setError("Failed to start speech recognition. Please try again.");
        shouldRestartRef.current = false;
      }
    }
  }, [isListening, permissionStatus, requestPermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log("[Speech] Stopping recognition (manual)...");
      shouldRestartRef.current = false; // Disable auto-restart
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    permissionStatus,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
  };
}
