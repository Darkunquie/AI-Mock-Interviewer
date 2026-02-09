"use client";

import { useState, useCallback, useRef } from "react";

// Available OpenAI TTS voices
export type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface UseOpenAITTSOptions {
  voice?: OpenAIVoice;
  speed?: number; // 0.25 to 4.0
}

interface UseOpenAITTSReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  voice: OpenAIVoice;
  setVoice: (voice: OpenAIVoice) => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

export function useOpenAITTS(options: UseOpenAITTSOptions = {}): UseOpenAITTSReturn {
  const { voice: initialVoice = "nova", speed: initialSpeed = 1.0 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<OpenAIVoice>(initialVoice);
  const [speed, setSpeed] = useState(initialSpeed);

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
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voice, speed }),
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
        console.error("OpenAI TTS error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [voice, speed]
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
    speed,
    setSpeed,
  };
}
