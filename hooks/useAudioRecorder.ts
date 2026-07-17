"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Configuration
const DEFAULT_CHUNK_INTERVAL = 4000; // How often to re-transcribe while recording
const TIMESLICE = 1000; // MediaRecorder emits a blob every 1s
const MIN_AUDIO_SIZE = 1000; // Minimum bytes to bother transcribing

interface UseAudioRecorderOptions {
  chunkInterval?: number;
  language?: string;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  isTranscribing: boolean;
  error: string | null;
  permissionStatus: PermissionState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
  requestPermission: () => Promise<boolean>;
}

type PermissionState = "granted" | "denied" | "prompt" | "unknown";

/**
 * Hook for recording audio and transcribing it via Groq Whisper.
 *
 * Uses ONE continuous MediaRecorder for the whole answer and periodically
 * re-transcribes the full accumulated blob. This avoids the word-dropping that
 * happens when you stop/recreate a recorder per chunk (audio spoken during the
 * stop→start gap is lost, and each isolated fragment loses Whisper's context).
 * Every request sends a complete webm (header + all audio so far), so the
 * transcript is a full replacement — not appended fragments.
 */
export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const {
    chunkInterval = DEFAULT_CHUNK_INTERVAL,
    language = "en"
  } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>("unknown");

  // Refs for mutable state that shouldn't trigger re-renders
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.permissions) return;
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setPermissionStatus(result.state as PermissionState);
    } catch {
      setPermissionStatus("unknown");
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      setError(null);
      return true;
    } catch {
      setPermissionStatus("denied");
      setError("Microphone access denied");
      return false;
    }
  }, []);

  // Transcribe the full audio captured so far. Replaces the transcript.
  const transcribeFull = useCallback(async () => {
    // Skip if a request is already running or there's nothing to send.
    if (inFlightRef.current) return;
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    if (blob.size < MIN_AUDIO_SIZE) return;

    inFlightRef.current = true;
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("language", language);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text?.trim();
        // Full replacement — Whisper re-read the entire answer.
        if (typeof text === "string") {
          setTranscript(text);
        }
      }
    } catch {
      // Silent fail — don't interrupt recording.
    } finally {
      inFlightRef.current = false;
      setIsTranscribing(false);
    }
  }, [language]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    // Check permissions
    if (permissionStatus === "denied") {
      setError("Microphone access denied");
      return;
    }

    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;

      // One continuous recording; emit a blob every TIMESLICE ms.
      recorder.start(TIMESLICE);

      isRecordingRef.current = true;
      setIsRecording(true);
      setInterimTranscript("Listening...");

      // Periodically re-transcribe everything captured so far.
      intervalRef.current = setInterval(() => {
        transcribeFull();
      }, chunkInterval);
    } catch {
      setError("Failed to access microphone");
    }
  }, [permissionStatus, requestPermission, transcribeFull, chunkInterval]);

  const stopRecordingInternal = () => {
    isRecordingRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    recorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = useCallback(() => {
    stopRecordingInternal();
    setIsRecording(false);
    setInterimTranscript("");
    // Final pass so the last words (spoken since the last interval) are captured.
    // Small delay lets the final ondataavailable flush after stop().
    setTimeout(() => {
      transcribeFull();
    }, 250);
  }, [transcribeFull]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    isTranscribing,
    error,
    permissionStatus,
    startRecording,
    stopRecording,
    resetTranscript,
    requestPermission,
  };
}
