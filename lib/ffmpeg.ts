import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

/**
 * Initialize and load ffmpeg.wasm
 * Must be called before using any ffmpeg operations
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  ffmpegInstance = ffmpeg;

  // Load ffmpeg.wasm core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    isLoaded = true;
    return ffmpeg;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('Failed to initialize FFmpeg. Please refresh the page and try again.');
  }
}

/**
 * Trim video using ffmpeg.wasm
 * @param videoBlob - Input video blob
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns Trimmed video blob
 */
export async function trimVideo(
  videoBlob: Blob,
  startTime: number,
  endTime: number
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  // Generate unique file names
  const timestamp = Date.now();
  const inputFileName = `input-${timestamp}.webm`;
  const outputFileName = `output-${timestamp}.webm`;

  try {
    // Write input file to FFmpeg's virtual file system
    const fileData = await fetchFile(videoBlob);
    await ffmpeg.writeFile(inputFileName, fileData);

    // Calculate duration
    const duration = endTime - startTime;

    // Try with codec copy first (faster, no re-encoding)
    // If that fails, fall back to re-encoding
    try {
      await ffmpeg.exec([
        '-i',
        inputFileName,
        '-ss',
        startTime.toString(),
        '-t',
        duration.toString(),
        '-c',
        'copy',
        '-avoid_negative_ts',
        'make_zero',
        outputFileName,
      ]);
    } catch (copyError) {
      console.warn('Codec copy failed, trying re-encode:', copyError);
      // Fallback: re-encode with libvpx-vp9 and libopus
      await ffmpeg.exec([
        '-i',
        inputFileName,
        '-ss',
        startTime.toString(),
        '-t',
        duration.toString(),
        '-c:v',
        'libvpx-vp9',
        '-c:a',
        'libopus',
        '-b:v',
        '1M',
        '-b:a',
        '128k',
        outputFileName,
      ]);
    }

    // Read output file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Check if output is valid
    if (!data || data.length === 0) {
      throw new Error('Trimmed video is empty');
    }

    const outputBlob = new Blob([data], { type: 'video/webm' });

    // Clean up virtual files
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      console.warn('Cleanup error (non-critical):', cleanupError);
    }

    return outputBlob;
  } catch (error) {
    // Clean up on error
    try {
      await ffmpeg.deleteFile(inputFileName).catch(() => {});
      await ffmpeg.deleteFile(outputFileName).catch(() => {});
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    console.error('FFmpeg trim error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to trim video: ${errorMessage}. Please check the time values and try again.`);
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    video.src = URL.createObjectURL(videoBlob);
  });
}

