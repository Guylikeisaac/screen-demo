import fs from 'fs';
import path from 'path';
import { ensureDirectories } from './storage';

const DB_FILE = path.join(process.cwd(), 'data', 'videos.json');

export interface VideoRecord {
  id: string;
  createdAt: string;
  viewCount: number;
  watchCompletions: number; // Number of times video was watched to completion
  watchProgress: { [sessionId: string]: number }; // Track progress per session
}

/**
 * Initialize database file if it doesn't exist
 */
function initDB() {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
  }
}

/**
 * Read all video records from database
 */
function readDB(): Record<string, VideoRecord> {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return {};
  }
}

/**
 * Write video records to database
 */
function writeDB(data: Record<string, VideoRecord>) {
  initDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/**
 * Create a new video record
 */
export function createVideoRecord(videoId: string): VideoRecord {
  const db = readDB();
  const record: VideoRecord = {
    id: videoId,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    watchCompletions: 0,
    watchProgress: {},
  };
  db[videoId] = record;
  writeDB(db);
  return record;
}

/**
 * Get video record by ID
 */
export function getVideoRecord(videoId: string): VideoRecord | null {
  const db = readDB();
  return db[videoId] || null;
}

/**
 * Increment view count for a video
 */
export function incrementViewCount(videoId: string): void {
  const db = readDB();
  if (!db[videoId]) {
    createVideoRecord(videoId);
    return incrementViewCount(videoId);
  }
  db[videoId].viewCount += 1;
  writeDB(db);
}

/**
 * Update watch progress for a video session
 * @param videoId - Video ID
 * @param sessionId - Unique session ID
 * @param progress - Watch progress (0-1)
 */
export function updateWatchProgress(
  videoId: string,
  sessionId: string,
  progress: number
): void {
  const db = readDB();
  if (!db[videoId]) {
    createVideoRecord(videoId);
    return updateWatchProgress(videoId, sessionId, progress);
  }

  db[videoId].watchProgress[sessionId] = progress;

  // If progress is >= 0.95 (95%), consider it a completion
  if (progress >= 0.95 && !db[videoId].watchProgress[`${sessionId}_completed`]) {
    db[videoId].watchCompletions += 1;
    db[videoId].watchProgress[`${sessionId}_completed`] = true;
  }

  writeDB(db);
}

/**
 * Get all video records (for analytics)
 */
export function getAllVideoRecords(): VideoRecord[] {
  const db = readDB();
  return Object.values(db);
}

