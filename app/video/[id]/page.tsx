'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * Public share page for viewing videos
 * Tracks views and watch progress
 */
export default function VideoPage() {
  const params = useParams();
  const videoId = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    viewCount: number;
    watchCompletions: number;
    averageWatchProgress: number;
  } | null>(null);
  const sessionIdRef = useRef<string>(`${Date.now()}-${Math.random()}`);
  const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load video and track analytics
  useEffect(() => {
    if (!videoId) return;

    const loadVideo = async () => {
      try {
        // Check if video exists
        const response = await fetch(`/api/video/${videoId}`);
        if (!response.ok) {
          throw new Error('Video not found');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        // Increment view count
        await fetch('/api/analytics/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });

        // Load analytics
        const analyticsResponse = await fetch(`/api/analytics?videoId=${videoId}`);
        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          setAnalytics({
            viewCount: data.viewCount,
            watchCompletions: data.watchCompletions,
            averageWatchProgress: data.averageWatchProgress,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();

    return () => {
      // Cleanup will be handled by the videoUrl state cleanup
    };
  }, [videoId]);

  // Cleanup video URL when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Track watch progress
  useEffect(() => {
    if (!videoRef.current || !videoId) return;

    const video = videoRef.current;
    const sessionId = sessionIdRef.current;

    const updateProgress = () => {
      if (video.duration && video.duration > 0) {
        const progress = video.currentTime / video.duration;
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            sessionId,
            progress,
          }),
        }).catch((err) => console.error('Failed to update progress:', err));
      }
    };

    // Update progress every 2 seconds
    progressUpdateIntervalRef.current = setInterval(updateProgress, 2000);

    // Update on timeupdate event
    video.addEventListener('timeupdate', updateProgress);

    // Update on video end
    video.addEventListener('ended', () => {
      updateProgress();
    });

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', updateProgress);
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, [videoId, videoUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading video...</div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Video not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Shared Video</h1>

          {analytics && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.viewCount}
                  </div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.watchCompletions}
                  </div>
                  <div className="text-sm text-gray-600">Completions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(analytics.averageWatchProgress * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg. Progress</div>
                </div>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full rounded-lg"
            autoPlay
          />
        </div>
      </div>
    </div>
  );
}

