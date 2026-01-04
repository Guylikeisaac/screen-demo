'use client';

import { useState, useRef, useEffect } from 'react';
import { trimVideo, getVideoDuration, loadFFmpeg } from '@/lib/ffmpeg';

interface VideoTrimmerProps {
  videoBlob: Blob | null;
  onTrimmed: (trimmedBlob: Blob) => void;
}

/**
 * Component for trimming recorded videos using ffmpeg.wasm
 * Allows users to specify start and end times for trimming
 */
export default function VideoTrimmer({ videoBlob, onTrimmed }: VideoTrimmerProps) {
  const [startTime, setStartTime] = useState<string>('0');
  const [endTime, setEndTime] = useState<string>('0');
  const [duration, setDuration] = useState<number>(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegLoadedRef = useRef<boolean>(false);
  const trimmedUrlRef = useRef<string | null>(null);

  // Preload FFmpeg when component mounts
  useEffect(() => {
    if (!ffmpegLoadedRef.current) {
      setIsLoadingFFmpeg(true);
      loadFFmpeg()
        .then(() => {
          ffmpegLoadedRef.current = true;
          setIsLoadingFFmpeg(false);
        })
        .catch((err) => {
          console.error('Failed to preload FFmpeg:', err);
          setError('Failed to initialize video trimmer. Please refresh the page.');
          setIsLoadingFFmpeg(false);
        });
    }
  }, []);

  // Load video and get duration when blob changes
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setTrimmedVideoUrl(null);
      setError(null);

      getVideoDuration(videoBlob)
        .then((dur) => {
          if (isNaN(dur) || dur <= 0) {
            throw new Error('Invalid video duration');
          }
          setDuration(dur);
          setStartTime('0');
          setEndTime(dur.toFixed(2));
        })
        .catch((err) => {
          console.error('Error getting video duration:', err);
          setError('Failed to load video metadata');
        });

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setVideoUrl(null);
      if (trimmedUrlRef.current) {
        URL.revokeObjectURL(trimmedUrlRef.current);
        trimmedUrlRef.current = null;
      }
      setTrimmedVideoUrl(null);
      setDuration(0);
      setStartTime('0');
      setEndTime('0');
    }
  }, [videoBlob]);

  // Cleanup trimmed video URL
  useEffect(() => {
    // Cleanup previous URL if it exists
    if (trimmedUrlRef.current && trimmedUrlRef.current !== trimmedVideoUrl) {
      URL.revokeObjectURL(trimmedUrlRef.current);
    }
    trimmedUrlRef.current = trimmedVideoUrl;
    
    return () => {
      if (trimmedUrlRef.current) {
        URL.revokeObjectURL(trimmedUrlRef.current);
        trimmedUrlRef.current = null;
      }
    };
  }, [trimmedVideoUrl]);

  const handleTrim = async () => {
    if (!videoBlob) return;

    // Ensure FFmpeg is loaded
    if (!ffmpegLoadedRef.current) {
      setIsLoadingFFmpeg(true);
      try {
        await loadFFmpeg();
        ffmpegLoadedRef.current = true;
      } catch (err) {
        setError('Failed to initialize video trimmer. Please refresh the page.');
        setIsLoadingFFmpeg(false);
        return;
      }
      setIsLoadingFFmpeg(false);
    }

    const start = parseFloat(startTime);
    const end = parseFloat(endTime);

    // Validation
    if (isNaN(start) || isNaN(end)) {
      setError('Please enter valid numbers for start and end times');
      return;
    }

    if (start < 0) {
      setError('Start time must be >= 0');
      return;
    }

    if (end > duration) {
      setError(`End time must be <= ${duration.toFixed(2)} seconds`);
      return;
    }

    if (start >= end) {
      setError('Start time must be less than end time');
      return;
    }

    if (end - start < 0.1) {
      setError('Trimmed video must be at least 0.1 seconds long');
      return;
    }

    setIsTrimming(true);
    setError(null);

    try {
      const trimmedBlob = await trimVideo(videoBlob, start, end);
      
      // Create preview URL for trimmed video
      const trimmedUrl = URL.createObjectURL(trimmedBlob);
      setTrimmedVideoUrl(trimmedUrl);
      
      // Notify parent component
      onTrimmed(trimmedBlob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trim video';
      setError(errorMessage);
      console.error('Trim error:', err);
    } finally {
      setIsTrimming(false);
    }
  };

  const handleSeekToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(startTime) || 0;
    }
  };

  const handleSeekToEnd = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(endTime) || duration;
    }
  };

  if (!videoBlob || !videoUrl) {
    return null;
  }

  const displayVideoUrl = trimmedVideoUrl || videoUrl;

  return (
    <div className="flex flex-col gap-6 p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Trim Video</h2>
      </div>

      {isLoadingFFmpeg && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-r-lg flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Initializing video trimmer... This may take a few seconds on first use.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {trimmedVideoUrl && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Video trimmed successfully! Preview below.</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
          <video
            ref={videoRef}
            src={displayVideoUrl}
            controls
            className="w-full rounded-lg"
            key={displayVideoUrl} // Force re-render when URL changes
          />
          {trimmedVideoUrl && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Trimmed Preview</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="w-full sm:w-32 text-gray-700 font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Time (s):
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={duration}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <button
              onClick={handleSeekToStart}
              className="px-5 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Seek</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="w-full sm:w-32 text-gray-700 font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              End Time (s):
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={duration}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <button
              onClick={handleSeekToEnd}
              className="px-5 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Seek</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Duration: <strong className="text-gray-800">{duration.toFixed(2)}s</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
              <span>Trimmed: <strong className="text-blue-700">{(parseFloat(endTime) - parseFloat(startTime)).toFixed(2)}s</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTrim}
            disabled={isTrimming || isLoadingFFmpeg || !ffmpegLoadedRef.current}
            className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isTrimming ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Trimming...</span>
              </>
            ) : isLoadingFFmpeg ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                <span>Trim Video</span>
              </>
            )}
          </button>
          
          {trimmedVideoUrl && (
            <button
              onClick={() => {
                if (trimmedUrlRef.current) {
                  URL.revokeObjectURL(trimmedUrlRef.current);
                  trimmedUrlRef.current = null;
                }
                setTrimmedVideoUrl(null);
                setStartTime('0');
                setEndTime(duration.toFixed(2));
              }}
              className="px-6 py-4 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset Trim</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

