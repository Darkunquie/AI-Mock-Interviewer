"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Configuration
const DEFAULT_CHUNK_INTERVAL = 2000; // 2 seconds for low latency
const MIN_AUDIO_SIZE = 1000; // Minimum bytes to process

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
 * Hook for recording audio and transcribing it in real-time
 * Uses chunked recording with parallel transcription for low latency
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
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef("");

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingInternal();
    };
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

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < MIN_AUDIO_SIZE) return;

    try {
      setIsTranscribing(true);

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text?.trim();

        if (text && isRecordingRef.current) {
          transcriptRef.current = transcriptRef.current
            ? `${transcriptRef.current} ${text}`
            : text;
          setTranscript(transcriptRef.current);
        }
      }
    } catch {
      // Silent fail - don't interrupt recording
    } finally {
      setIsTranscribing(false);
    }
  }, [language]);

  const recordChunk = useCallback(async (): Promise<Blob | null> => {
    const stream = streamRef.current;
    if (!stream || !isRecordingRef.current) return null;

    const chunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start();
    setInterimTranscript("Listening...");

    // Wait for chunk duration
    await new Promise((resolve) => setTimeout(resolve, chunkInterval));

    // Stop and wait for final data
    if (mediaRecorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        mediaRecorder.stop();
      });
    }

    if (chunks.length === 0) return null;
    return new Blob(chunks, { type: mimeType });
  }, [chunkInterval]);

  const startRecordingLoop = useCallback(async () => {
    while (isRecordingRef.current && streamRef.current) {
      const audioBlob = await recordChunk();

      if (audioBlob && isRecordingRef.current) {
        // Fire and forget - transcribe while recording next chunk
        transcribeAudio(audioBlob);
      }
    }
  }, [recordChunk, transcribeAudio]);

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
      isRecordingRef.current = true;
      setIsRecording(true);

      // Start recording loop (non-blocking)
      startRecordingLoop();
    } catch {
      setError("Failed to access microphone");
    }
  }, [permissionStatus, requestPermission, startRecordingLoop]);

  const stopRecordingInternal = () => {
    isRecordingRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = useCallback(() => {
    stopRecordingInternal();
    setIsRecording(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
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
