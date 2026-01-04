import { NextRequest, NextResponse } from 'next/server';
import { saveVideo, generateVideoId } from '@/lib/storage';
import { createVideoRecord } from '@/lib/db';

/**
 * API route for uploading videos
 * Accepts video blob and returns shareable URL
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!videoFile.type.includes('webm') && !videoFile.type.includes('video')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a video file.' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const videoId = generateVideoId();

    // Convert file to buffer and save
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    saveVideo(buffer, videoId);

    // Create database record
    createVideoRecord(videoId);

    // Return shareable URL
    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/video/${videoId}`;

    return NextResponse.json({
      success: true,
      videoId,
      shareUrl,
      message: 'Video uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

