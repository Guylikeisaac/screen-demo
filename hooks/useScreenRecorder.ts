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

      // Request screen capture (without system audio to avoid conflicts)
      const displayMedia = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen' as MediaTrackConstraints['mediaSource'],
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false, // We'll handle microphone separately
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
          // Store the audio track reference for toggling
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
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      };

      // Fallback to default if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        chunksRef.current = [];

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        audioTrackRef.current = null;
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        setError('Recording error occurred');
        console.error('MediaRecorder error:', event);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;

      // Update recording time
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      // Handle screen share stop (user clicks stop sharing in browser)
      displayMedia.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Error starting recording:', err);
    }
  }, [isPaused]);

  /**
   * Stop recording and finalize video blob
   */
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

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }
  }, [isRecording, isPaused]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;
    }
  }, [isRecording, isPaused]);

  /**
   * Reset recording state
   */
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

  /**
   * Toggle microphone on/off during recording
   */
  const toggleMicrophone = useCallback(() => {
    if (!isRecording || !audioTrackRef.current) {
      return;
    }

    const audioTrack = audioTrackRef.current;
    if (audioTrack.enabled) {
      // Mute microphone
      audioTrack.enabled = false;
      setIsMicrophoneEnabled(false);
    } else {
      // Unmute microphone
      audioTrack.enabled = true;
      setIsMicrophoneEnabled(true);
    }
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

