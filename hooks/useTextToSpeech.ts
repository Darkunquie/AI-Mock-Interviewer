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
  // Initialize isSupported synchronously to avoid setState in effect
  const [isSupported] = useState(() =>
    typeof window !== "undefined" && !!window.speechSynthesis
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (isSupported) {

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Select a good default voice (prefer natural-sounding English voices)
        if (!selectedVoice && availableVoices.length > 0) {
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

      // Load voices immediately if available
      loadVoices();

      // Also listen for voices changed event (Chrome loads voices asynchronously)
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [isSupported, selectedVoice]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

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
        // Only log actual errors, not interruptions (which happen on navigation/cancel)
        if (event.error && event.error !== "interrupted" && event.error !== "canceled") {
          console.warn("Speech synthesis error:", event.error);
        }
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang, rate, pitch, volume, selectedVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
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
