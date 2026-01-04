'use client';

import { useState, useRef, useCallback } from 'react';

interface UseScreenRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  videoBlob: Blob | null;
  error: string | null;
  isMicrophoneEnabled: boolean;
  startRecording: (enableMicrophone?: boolean) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  toggleMicrophone: () => void;
}

/**
 * Custom hook for screen recording using MediaRecorder API
 * Supports screen + microphone recording with pause/resume functionality
 */
export function useScreenRecorder(): UseScreenRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  /**
   * Start screen recording with user-selected source
   */
  const startRecording = useCallback(async (enableMicrophone: boolean = true) => {
    try {
      setError(null);
      chunksRef.current = [];
      setIsMicrophoneEnabled(enableMicrophone);

      const displayMedia = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      // Request microphone access if enabled
      let audioStream: MediaStream | null = null;
      if (enableMicrophone) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          });

          if (audioStream.getAudioTracks().length > 0) {
            audioTrackRef.current = audioStream.getAudioTracks()[0];
          }
        } catch (micError) {
          console.warn('Microphone access denied, continuing without audio');
          setIsMicrophoneEnabled(false);
        }
      }

      // Combine screen and microphone streams
      const tracks: MediaStreamTrack[] = [...displayMedia.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        tracks.push(...audioStream.getAudioTracks());
      }

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      // Create MediaRecorder with WebM codec
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        chunksRef.current = [];

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        audioTrackRef.current = null;
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      startTimeRef.current = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      displayMedia.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;
    }
  }, [isRecording, isPaused]);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioTrackRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setVideoBlob(null);
    setError(null);
    setIsMicrophoneEnabled(true);
    chunksRef.current = [];
    pausedTimeRef.current = 0;
  }, [isRecording]);

  const toggleMicrophone = useCallback(() => {
    if (!isRecording || !audioTrackRef.current) return;
    const audioTrack = audioTrackRef.current;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicrophoneEnabled(audioTrack.enabled);
  }, [isRecording]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    videoBlob,
    error,
    isMicrophoneEnabled,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    toggleMicrophone,
  };
}