import { NextRequest, NextResponse } from 'next/server';
import { updateWatchProgress, getVideoRecord } from '@/lib/db';

/**
 * API route for updating video analytics
 * Tracks watch progress and completion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, sessionId, progress } = body;

    if (!videoId || !sessionId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, sessionId, progress' },
        { status: 400 }
      );
    }

    if (progress < 0 || progress > 1) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 1' },
        { status: 400 }
      );
    }

    updateWatchProgress(videoId, sessionId, progress);

    return NextResponse.json({
      success: true,
      message: 'Analytics updated',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to update analytics' },
      { status: 500 }
    );
  }
}

/**
 * Get analytics for a specific video
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId parameter required' },
        { status: 400 }
      );
    }

    const record = getVideoRecord(videoId);

    if (!record) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Calculate average watch progress
    const progressValues = Object.values(record.watchProgress).filter(
      (p) => typeof p === 'number'
    ) as number[];
    const averageProgress =
      progressValues.length > 0
        ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length
        : 0;

    return NextResponse.json({
      videoId: record.id,
      viewCount: record.viewCount,
      watchCompletions: record.watchCompletions,
      averageWatchProgress: averageProgress,
      createdAt: record.createdAt,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

