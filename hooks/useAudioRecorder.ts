"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseAudioRecorderOptions {
  chunkInterval?: number; // How often to send chunks for transcription (ms)
  language?: string;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  isTranscribing: boolean;
  error: string | null;
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
  requestPermission: () => Promise<boolean>;
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { chunkInterval = 4000, language = "en" } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          setPermissionStatus(result.state as "granted" | "denied" | "prompt");
          result.onchange = () => {
            setPermissionStatus(result.state as "granted" | "denied" | "prompt");
          };
        }
      } catch {
        setPermissionStatus("unknown");
      }
    };
    checkPermission();
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      setError(null);
      return true;
    } catch (err) {
      console.error("[AudioRecorder] Permission denied:", err);
      setPermissionStatus("denied");
      setError(
        "Microphone access denied. Please allow microphone access in browser settings."
      );
      return false;
    }
  }, []);

  // Transcribe audio blob
  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", language);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Transcription failed");
        }

        const data = await response.json();
        return data.text || null;
      } catch (err) {
        console.error("[AudioRecorder] Transcription error:", err);
        return null;
      }
    },
    [language]
  );

  // Process and transcribe accumulated chunks
  const processChunks = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    // Get current chunks and clear the buffer
    const chunks = [...audioChunksRef.current];
    audioChunksRef.current = [];

    // Create blob from chunks
    const audioBlob = new Blob(chunks, { type: "audio/webm" });

    // Skip if too small (likely no audio)
    if (audioBlob.size < 1000) return;

    setIsTranscribing(true);
    setInterimTranscript("Processing...");

    const text = await transcribeAudio(audioBlob);

    if (text && text.trim()) {
      setTranscript((prev) => {
        const newText = prev ? `${prev} ${text.trim()}` : text.trim();
        return newText;
      });
      console.log("[AudioRecorder] Transcribed:", text.trim());
    }

    setInterimTranscript("");
    setIsTranscribing(false);
  }, [transcribeAudio]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    // Check/request permission
    if (permissionStatus === "denied") {
      setError(
        "Microphone access denied. Please allow microphone access in browser settings."
      );
      return;
    }

    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      setError(null);

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("[AudioRecorder] MediaRecorder error:", event);
        setError("Recording error occurred");
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      isRecordingRef.current = true;
      setIsRecording(true);
      setInterimTranscript("Listening...");

      console.log("[AudioRecorder] Started recording");

      // Set up interval to process chunks
      intervalRef.current = setInterval(() => {
        if (isRecordingRef.current && audioChunksRef.current.length > 0) {
          processChunks();
        }
      }, chunkInterval);
    } catch (err) {
      console.error("[AudioRecorder] Failed to start:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Microphone access denied");
          setPermissionStatus("denied");
        } else if (err.name === "NotFoundError") {
          setError("No microphone found");
        } else {
          setError("Failed to access microphone");
        }
      }
    }
  }, [permissionStatus, requestPermission, processChunks, chunkInterval]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("[AudioRecorder] Stopping recording...");

    isRecordingRef.current = false;

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Process any remaining chunks
    if (audioChunksRef.current.length > 0) {
      processChunks();
    }

    setIsRecording(false);
    setInterimTranscript("");
  }, [processChunks]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    audioChunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
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
