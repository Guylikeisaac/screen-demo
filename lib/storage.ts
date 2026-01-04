import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Ensure uploads and data directories exist
 */
export function ensureDirectories() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Generate a unique ID for videos
 */
export function generateVideoId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Save uploaded video file
 * @param videoBuffer - Video file buffer
 * @param videoId - Unique video ID
 * @returns File path
 */
export function saveVideo(videoBuffer: Buffer, videoId: string): string {
  ensureDirectories();
  const filePath = path.join(UPLOADS_DIR, `${videoId}.webm`);
  fs.writeFileSync(filePath, videoBuffer);
  return filePath;
}

/**
 * Get video file path
 */
export function getVideoPath(videoId: string): string {
  return path.join(UPLOADS_DIR, `${videoId}.webm`);
}

/**
 * Check if video file exists
 */
export function videoExists(videoId: string): boolean {
  const filePath = getVideoPath(videoId);
  return fs.existsSync(filePath);
}

/**
 * Delete video file
 */
export function deleteVideo(videoId: string): void {
  const filePath = getVideoPath(videoId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

