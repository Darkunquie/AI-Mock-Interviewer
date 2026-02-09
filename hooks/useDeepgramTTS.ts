"use client";

import { useState, useCallback, useRef } from "react";

// Deepgram Aura voices
export type DeepgramVoice =
  | "aura-asteria-en"  // Female, US
  | "aura-luna-en"     // Female, US
  | "aura-stella-en"   // Female, US
  | "aura-athena-en"   // Female, UK
  | "aura-hera-en"     // Female, US
  | "aura-orion-en"    // Male, US
  | "aura-arcas-en"    // Male, US
  | "aura-perseus-en"  // Male, US
  | "aura-angus-en"    // Male, Irish
  | "aura-orpheus-en"  // Male, US
  | "aura-helios-en"   // Male, UK
  | "aura-zeus-en";    // Male, US

interface UseDeepgramTTSOptions {
  voice?: DeepgramVoice;
}

interface UseDeepgramTTSReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  voice: DeepgramVoice;
  setVoice: (voice: DeepgramVoice) => void;
}

export function useDeepgramTTS(options: UseDeepgramTTSOptions = {}): UseDeepgramTTSReturn {
  const { voice: initialVoice = "aura-asteria-en" } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<DeepgramVoice>(initialVoice);

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
        const response = await fetch("/api/tts/deepgram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voice }),
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
          return;
        }
        const errorMessage = err instanceof Error ? err.message : "Failed to generate speech";
        setError(errorMessage);
        console.error("Deepgram TTS error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [voice]
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
  };
}
