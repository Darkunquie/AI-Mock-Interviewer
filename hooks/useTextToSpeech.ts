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

// Clean text for better speech synthesis — strip emojis, markdown, special chars
function cleanTextForSpeech(text: string): string {
  return text
    // Remove emoji (Unicode emoji ranges)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    // Remove markdown formatting
    .replace(/#{1,6}\s/g, "")
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    // Remove special characters that cause speech pauses
    .replace(/[<>{}|\\^~]/g, "")
    // Collapse multiple spaces/newlines
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { lang = "en-IN", rate = 1, pitch = 1, volume = 1 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() =>
    typeof window !== "undefined" && !!window.speechSynthesis
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSelectedRef = useRef(false);
  const warmupDoneRef = useRef(false);

  // Load voices with progressive retry for iPadOS
  useEffect(() => {
    if (!isSupported) return;

    const isFemaleVoice = (v: SpeechSynthesisVoice) =>
      /female|zira|heera|neerja|sapna|swara|woman|aria|jenny|sonia/i.test(v.name);

    const selectBestVoice = (availableVoices: SpeechSynthesisVoice[]) => {
      return (
        // Priority 1: Female Google en-IN voice
        availableVoices.find(
          (v) => v.lang === "en-IN" && v.name.includes("Google") && isFemaleVoice(v)
        ) ||
        // Priority 2: Female Microsoft en-IN voice (Neerja/Sapna)
        availableVoices.find(
          (v) => v.lang === "en-IN" && v.name.includes("Microsoft") && isFemaleVoice(v)
        ) ||
        // Priority 3: Any female en-IN voice
        availableVoices.find((v) => v.lang === "en-IN" && isFemaleVoice(v)) ||
        // Priority 4: Any en-IN voice
        availableVoices.find((v) => v.lang === "en-IN") ||
        // Priority 5: Any female English voice
        availableVoices.find((v) => v.lang.startsWith("en") && isFemaleVoice(v)) ||
        // Priority 6: Any English voice
        availableVoices.find((v) => v.lang.startsWith("en")) ||
        // Priority 7: First available voice
        availableVoices[0]
      );
    };

    const loadVoices = (): boolean => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) return false;

      setVoices(availableVoices);

      if (!voiceSelectedRef.current) {
        voiceSelectedRef.current = true;
        setSelectedVoice(selectBestVoice(availableVoices));
      }
      return true;
    };

    // Try loading immediately
    if (loadVoices()) return;

    // Chrome loads voices async
    const handleVoicesChanged = () => loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    // iPadOS progressive retry: 100ms → 200ms → 400ms → 800ms → 1600ms → 2000ms
    const retryDelays = [100, 200, 400, 800, 1600, 2000];
    const retryTimeouts: ReturnType<typeof setTimeout>[] = [];

    retryDelays.forEach((delay) => {
      retryTimeouts.push(
        setTimeout(() => {
          if (!voiceSelectedRef.current) {
            loadVoices();
          }
        }, delay)
      );
    });

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      retryTimeouts.forEach(clearTimeout);
    };
  }, [isSupported]);

  // iPad/Safari warmup: fire silent utterance on first user gesture to unlock audio
  useEffect(() => {
    if (!isSupported || warmupDoneRef.current) return;

    const handleUserGesture = () => {
      if (warmupDoneRef.current) return;
      warmupDoneRef.current = true;

      const silentUtterance = new SpeechSynthesisUtterance("");
      silentUtterance.volume = 0;
      silentUtterance.rate = 1;
      window.speechSynthesis.speak(silentUtterance);

      document.removeEventListener("click", handleUserGesture);
      document.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("keydown", handleUserGesture);
    };

    document.addEventListener("click", handleUserGesture, { once: true });
    document.addEventListener("touchstart", handleUserGesture, { once: true });
    document.addEventListener("keydown", handleUserGesture, { once: true });

    return () => {
      document.removeEventListener("click", handleUserGesture);
      document.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("keydown", handleUserGesture);
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return;

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Chrome bug fix: resume if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        let resumeInterval: ReturnType<typeof setInterval> | null = null;

        utterance.onstart = () => {
          setIsSpeaking(true);
          // Chrome bug fix: pause/resume every 500ms to prevent speech stopping
          resumeInterval = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 500);
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
