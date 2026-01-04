'use client';

import { useEffect, useRef, useState } from 'react';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';

interface RecorderControlsProps {
  onRecordingComplete?: (blob: Blob) => void;
}

/**
 * Component for controlling screen recording
 * Provides start, stop, pause, and resume functionality
 */
export default function RecorderControls({ onRecordingComplete }: RecorderControlsProps) {
  const {
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
  } = useScreenRecorder();

  const [microphonePreference, setMicrophonePreference] = useState(true);

  const notifiedRef = useRef(false);

  // Notify parent when recording is complete
  useEffect(() => {
    if (videoBlob && onRecordingComplete && !notifiedRef.current) {
      notifiedRef.current = true;
      onRecordingComplete(videoBlob);
    }
    if (!videoBlob) {
      notifiedRef.current = false;
    }
  }, [videoBlob, onRecordingComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Screen Recorder</h2>
      </div>

      {/* Microphone Toggle - Before Recording */}
      {!isRecording && (
        <div className="w-full p-5 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                microphonePreference 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 shadow-md' 
                  : 'bg-gradient-to-br from-gray-200 to-gray-300'
              }`}>
                <svg className={`w-7 h-7 ${microphonePreference ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {microphonePreference ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Microphone</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {microphonePreference ? 'Will record with microphone' : 'Recording without microphone'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMicrophonePreference(!microphonePreference)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                microphonePreference 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 focus:ring-green-500' 
                  : 'bg-gray-300 focus:ring-gray-400'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  microphonePreference ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Microphone Toggle - During Recording */}
      {isRecording && (
        <div className={`w-full p-5 border-2 rounded-xl shadow-md transition-all ${
          isMicrophoneEnabled 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                isMicrophoneEnabled 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                  : 'bg-gradient-to-br from-red-100 to-pink-100'
              }`}>
                {isMicrophoneEnabled ? (
                  <svg className="w-7 h-7 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">
                  Microphone: <span className={isMicrophoneEnabled ? 'text-green-700' : 'text-red-700'}>
                    {isMicrophoneEnabled ? 'On' : 'Muted'}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {isMicrophoneEnabled ? 'Your voice is being recorded' : 'Microphone is muted'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMicrophone}
              className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                isMicrophoneEnabled
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {isMicrophoneEnabled ? 'Mute' : 'Unmute'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isRecording ? (
          <button
            onClick={() => startRecording(microphonePreference)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Start Recording</span>
          </button>
        ) : (
          <>
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <span>Stop Recording</span>
            </button>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Pause</span>
              </button>
            )}
          </>
        )}

        {videoBlob && (
          <button
            onClick={resetRecording}
            className="px-6 py-4 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Record New</span>
          </button>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-3 px-6 py-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse-ring"></div>
          <span className="text-xl font-mono font-semibold text-red-700">
            Recording: {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {videoBlob && (
        <div className="flex items-center gap-2 px-5 py-3 bg-green-50 border border-green-200 rounded-xl">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-green-700">
            Recording complete! Size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      )}
    </div>
  );
}

