import { NextRequest, NextResponse } from 'next/server';
import { incrementViewCount } from '@/lib/db';

/**
 * API route to increment view count
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId required' },
        { status: 400 }
      );
    }

    incrementViewCount(videoId);

    return NextResponse.json({
      success: true,
      message: 'View count incremented',
    });
  } catch (error) {
    console.error('View count error:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}

