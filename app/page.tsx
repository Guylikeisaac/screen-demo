'use client';

import { useState } from 'react';
import RecorderControls from '@/components/RecorderControls';
import VideoTrimmer from '@/components/VideoTrimmer';
import Toast from '@/components/Toast';

/**
 * Main page for screen recording app
 * Handles recording, trimming, uploading, and sharing workflow
 */
export default function Home() {
  const [currentVideoBlob, setCurrentVideoBlob] = useState<Blob | null>(null);
  const [trimmedVideoBlob, setTrimmedVideoBlob] = useState<Blob | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Handle recording completion
  const handleRecordingComplete = (blob: Blob) => {
    setCurrentVideoBlob(blob);
    setTrimmedVideoBlob(null);
    setUploadedVideoId(null);
    setShareUrl(null);
    setUploadSuccess(false);
  };

  // Handle video trimming
  const handleTrimmed = (trimmedBlob: Blob) => {
    setTrimmedVideoBlob(trimmedBlob);
    setUploadedVideoId(null);
    setShareUrl(null);
    setUploadSuccess(false);
  };

  // Handle video upload
  const handleUpload = async () => {
    const videoToUpload = trimmedVideoBlob || currentVideoBlob;
    if (!videoToUpload) {
      setUploadError('No video to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('video', videoToUpload, 'recording.webm');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadedVideoId(data.videoId);
      setShareUrl(data.shareUrl);
      setUploadSuccess(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Copy share link to clipboard
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast({ message: 'Share link copied to clipboard!', type: 'success' });
    } catch (error) {
      console.error('Failed to copy link:', error);
      setToast({ message: 'Failed to copy link. Please copy manually.', type: 'error' });
    }
  };

  // Download video as .webm file
  const handleDownload = () => {
    const videoToDownload = trimmedVideoBlob || currentVideoBlob;
    if (!videoToDownload) {
      setToast({ message: 'No video to download', type: 'error' });
      return;
    }

    try {
      const url = URL.createObjectURL(videoToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: 'Video downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setToast({ message: 'Failed to download video', type: 'error' });
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block mb-6 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
            Screen Recorder
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Record your screen, trim videos, download or share with analytics. All in your browser.
          </p>
        </div>

        <div className="space-y-6">
          {/* Recording Controls */}
          <RecorderControls onRecordingComplete={handleRecordingComplete} />

          {/* Video Trimmer */}
          {currentVideoBlob && (
            <VideoTrimmer videoBlob={currentVideoBlob} onTrimmed={handleTrimmed} />
          )}

          {/* Download & Upload Section */}
          {(currentVideoBlob || trimmedVideoBlob) && (
            <div className="p-8 bg-white rounded-xl shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Download & Share</h2>
              </div>

              {/* Download Button */}
              <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-200 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-800">Download Video</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {trimmedVideoBlob 
                            ? `Trimmed version (${(trimmedVideoBlob.size / 1024 / 1024).toFixed(2)} MB)`
                            : `Original recording (${currentVideoBlob ? (currentVideoBlob.size / 1024 / 1024).toFixed(2) : '0'} MB)`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download .webm</span>
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && shareUrl && (
                <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-800 mb-3">Video uploaded successfully!</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-4 py-2.5 border border-green-300 rounded-lg bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Link
                        </button>
                      </div>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium text-sm mt-3 transition-colors"
                      >
                        <span>Open video page</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Or Upload & Share Online</h3>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || uploadSuccess}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Uploaded</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload & Share</span>
                    </>
                  )}
                </button>

                {trimmedVideoBlob && !uploadSuccess && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                      Will upload trimmed version ({(trimmedVideoBlob.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

