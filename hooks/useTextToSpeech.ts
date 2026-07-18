"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RefObject } from "react";

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  prefetch: (text: string) => void;
  cancel: () => void;
  /** The persistent <audio> element that plays TTS — for lip-sync analysis. */
  audioElementRef: RefObject<HTMLAudioElement | null>;
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
  // Supported whenever we're in a browser: neural TTS plays via <audio>, and
  // speechSynthesis is the fallback when present.
  const [isSupported] = useState(() => typeof window !== "undefined");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSelectedRef = useRef(false);
  const warmupDoneRef = useRef(false);
  // Neural TTS (Edge) playback + prefetch cache.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Create the persistent audio element eagerly so the avatar can attach its
  // analyser before the first utterance.
  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
  }
  const speakTokenRef = useRef(0); // invalidates in-flight speaks when superseded
  const cacheRef = useRef<Map<string, string>>(new Map()); // cleaned text -> object URL
  const pendingRef = useRef<Map<string, Promise<string>>>(new Map()); // dedupe in-flight fetches

  // Load voices with progressive retry for iPadOS
  useEffect(() => {
    if (!isSupported) return;

    // Named FEMALE voices across platforms (matches the female avatar).
    const isFemaleVoice = (v: SpeechSynthesisVoice) =>
      /\bfemale\b|zira|heera|neerja|ananya|sapna|swara|priya|kavya|woman|aria|jenny|sonia|susan|hazel|eva|linda|zoe|woman\b/i.test(
        v.name
      );
    // Higher-quality engines (neural / online) — avoid the robotic legacy SAPI voices.
    const isNaturalVoice = (v: SpeechSynthesisVoice) =>
      /natural|neural|google|online|premium|enhanced/i.test(v.name);

    const selectBestVoice = (availableVoices: SpeechSynthesisVoice[]) => {
      const female = availableVoices.filter(isFemaleVoice);
      const femaleEn = female.filter((v) => v.lang.startsWith("en"));
      return (
        // Priority 1: Natural/neural female English voice (most human)
        femaleEn.find(isNaturalVoice) ||
        // Priority 2: Natural/neural female any language
        female.find(isNaturalVoice) ||
        // Priority 3: Female en-IN (matches accent), else any female English
        femaleEn.find((v) => v.lang === "en-IN") ||
        femaleEn[0] ||
        // Priority 4: Any natural English voice (even if gender unknown)
        availableVoices.find((v) => v.lang.startsWith("en") && isNaturalVoice(v)) ||
        // Priority 5: Any English voice
        availableVoices.find((v) => v.lang.startsWith("en")) ||
        // Priority 6: First available voice
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

  // Stop current playback + browser TTS, and invalidate any in-flight speak.
  const stopAll = useCallback(() => {
    speakTokenRef.current += 1;
    // Pause but keep the element (its Web Audio source stays valid for the avatar).
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Fetch (or reuse a cached) neural-TTS clip, returning an object URL.
  // Concurrent requests for the same text are de-duplicated.
  const fetchAudio = useCallback(async (cleanedText: string): Promise<string> => {
    const cached = cacheRef.current.get(cleanedText);
    if (cached) return cached;
    const inflight = pendingRef.current.get(cleanedText);
    if (inflight) return inflight;

    const p = (async () => {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText }),
      });
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      cacheRef.current.set(cleanedText, url);
      // Bound the cache: revoke + drop the oldest entry.
      if (cacheRef.current.size > 12) {
        const oldest = cacheRef.current.keys().next().value;
        if (oldest !== undefined) {
          const u = cacheRef.current.get(oldest);
          if (u) URL.revokeObjectURL(u);
          cacheRef.current.delete(oldest);
        }
      }
      return url;
    })();

    pendingRef.current.set(cleanedText, p);
    void p.finally(() => pendingRef.current.delete(cleanedText)).catch(() => {});
    return p;
  }, []);

  // Warm the cache for text likely to be spoken soon (e.g. the next question),
  // so speak() plays instantly with no network wait.
  const prefetch = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !text) return;
      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText || cacheRef.current.has(cleanedText)) return;
      fetchAudio(cleanedText).catch(() => {});
    },
    [fetchAudio]
  );

  // Fallback: the browser's built-in speechSynthesis (used if neural TTS fails).
  const speakBrowser = useCallback(
    (cleanedText: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis || !cleanedText) return;
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = selectedVoice?.lang || lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        let resumeInterval: ReturnType<typeof setInterval> | null = null;
        utterance.onstart = () => {
          setIsSpeaking(true);
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
    [lang, rate, pitch, volume, selectedVoice]
  );

  // Primary: natural neural voice via /api/tts, played from the prefetch cache
  // when warm. Falls back to the browser voice on any failure.
  const speak = useCallback(
    async (text: string) => {
      if (typeof window === "undefined" || !text) return;
      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return;

      stopAll();
      const token = speakTokenRef.current;

      try {
        const url = await fetchAudio(cleanedText); // instant if prefetched
        if (token !== speakTokenRef.current) return; // superseded while fetching

        // Reuse one persistent <audio> element so the 3D avatar can attach a
        // Web Audio analyser once (a MediaElementSource can only be created per
        // element a single time).
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.onplay = () => {
          if (token === speakTokenRef.current) setIsSpeaking(true);
        };
        audio.onended = () => {
          if (token === speakTokenRef.current) setIsSpeaking(false);
        };
        audio.onerror = () => {
          if (token !== speakTokenRef.current) return; // superseded — ignore
          setIsSpeaking(false);
          speakBrowser(cleanedText);
        };
        audio.src = url;
        audio.currentTime = 0;
        await audio.play();
      } catch {
        // Network error / non-OK / autoplay block → browser voice, unless a
        // newer speak() already superseded this one.
        if (token === speakTokenRef.current) speakBrowser(cleanedText);
      }
    },
    [stopAll, fetchAudio, speakBrowser]
  );

  const cancel = useCallback(() => {
    stopAll();
  }, [stopAll]);

  // Cleanup on unmount: stop playback and revoke cached URLs.
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      stopAll();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, [stopAll]);

  return {
    speak,
    prefetch,
    cancel,
    audioElementRef: audioRef,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}
