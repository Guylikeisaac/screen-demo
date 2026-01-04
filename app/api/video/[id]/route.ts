import { NextRequest, NextResponse } from 'next/server';
import { getVideoPath, videoExists } from '@/lib/storage';
import fs from 'fs';

/**
 * API route to serve video files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      );
    }

    if (!videoExists(videoId)) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoPath = getVideoPath(videoId);
    const videoBuffer = fs.readFileSync(videoPath);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Length': videoBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Video serve error:', error);
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    );
  }
}

