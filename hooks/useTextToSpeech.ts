"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { lang = "en-US", rate = 1, pitch = 1, volume = 1 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() =>
    typeof window !== "undefined" && !!window.speechSynthesis
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSelectedRef = useRef(false);

  // Load voices once on mount
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) return;

      setVoices(availableVoices);

      // Only set voice once to prevent re-render loops
      if (!voiceSelectedRef.current) {
        voiceSelectedRef.current = true;
        const preferredVoice =
          availableVoices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Natural") ||
                v.name.includes("Google") ||
                v.name.includes("Microsoft") ||
                v.name.includes("Samantha") ||
                v.name.includes("Daniel"))
          ) ||
          availableVoices.find((v) => v.lang.startsWith("en")) ||
          availableVoices[0];

        setSelectedVoice(preferredVoice);
      }
    };

    // Try loading immediately
    loadVoices();

    // Chrome loads voices async - listen for the event
    const handleVoicesChanged = () => loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Chrome bug fix: resume if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
          if (event.error && event.error !== "interrupted" && event.error !== "canceled") {
            console.warn("Speech synthesis error:", event.error);
          }
          setIsSpeaking(false);
        };

        // Chrome bug: speech stops after ~15 seconds
        // Workaround: pause/resume every 10 seconds
        let resumeInterval: NodeJS.Timeout | null = null;
        utterance.onstart = () => {
          setIsSpeaking(true);
          resumeInterval = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 10000);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          if (resumeInterval) clearInterval(resumeInterval);
        };
        utterance.onerror = (event) => {
          if (event.error && event.error !== "interrupted" && event.error !== "canceled") {
            console.warn("Speech synthesis error:", event.error);
          }
          setIsSpeaking(false);
          if (resumeInterval) clearInterval(resumeInterval);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn("TTS speak failed:", error);
        setIsSpeaking(false);
      }
    },
    [isSupported, lang, rate, pitch, volume, selectedVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}
