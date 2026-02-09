"use client";

import { useState, useCallback, useRef } from "react";

// Available Google Cloud TTS voices (Neural2 - highest quality)
export type GoogleVoice =
  | "en-US-Neural2-A" // Male
  | "en-US-Neural2-C" // Female
  | "en-US-Neural2-D" // Male 2
  | "en-US-Neural2-E" // Female 2
  | "en-US-Neural2-F" // Female 3
  | "en-US-Neural2-G" // Female 4
  | "en-US-Neural2-H" // Female 5
  | "en-US-Neural2-I" // Male 3
  | "en-US-Neural2-J" // Male 4
  | "en-US-Wavenet-A" // Male (WaveNet)
  | "en-US-Wavenet-C" // Female (WaveNet)
  | "en-US-Wavenet-D"; // Male 2 (WaveNet)

interface UseGoogleTTSOptions {
  voice?: GoogleVoice;
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
}

interface UseGoogleTTSReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  voice: GoogleVoice;
  setVoice: (voice: GoogleVoice) => void;
  speakingRate: number;
  setSpeakingRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
}

export function useGoogleTTS(options: UseGoogleTTSOptions = {}): UseGoogleTTSReturn {
  const {
    voice: initialVoice = "en-US-Neural2-C",
    speakingRate: initialRate = 1.0,
    pitch: initialPitch = 0,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<GoogleVoice>(initialVoice);
  const [speakingRate, setSpeakingRate] = useState(initialRate);
  const [pitch, setPitch] = useState(initialPitch);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/tts/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voice, speakingRate, pitch }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate speech");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsSpeaking(true);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsLoading(false);
          setError("Failed to play audio");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, not an error
          return;
        }
        const errorMessage = err instanceof Error ? err.message : "Failed to generate speech";
        setError(errorMessage);
        console.error("Google TTS error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [voice, speakingRate, pitch]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isLoading,
    error,
    voice,
    setVoice,
    speakingRate,
    setSpeakingRate,
    pitch,
    setPitch,
  };
}
