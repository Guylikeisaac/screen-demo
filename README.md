# Screen Recorder Web App

A full-featured in-browser screen recording application built with Next.js, TypeScript, and ffmpeg.wasm. Record your screen, trim videos, upload them, and share with analytics tracking.

## Features

- 🎥 **Screen Recording**: Record screen, tab, or window with optional microphone audio
- 🎤 **Microphone Control**: Toggle microphone on/off before or during recording
- ✂️ **Video Trimming**: Client-side video trimming using ffmpeg.wasm
- 💾 **Download Videos**: Download recordings as .webm files directly to your computer
- ☁️ **Upload & Storage**: Upload videos and generate shareable links
- 📊 **Analytics**: Track view counts and watch completion percentages
- 🔗 **Public Sharing**: Share videos with unique URLs
- 💾 **Persistent Storage**: File-based database for analytics persistence
- 🎨 **Modern UI**: Beautiful, responsive interface with:
  - Gradient designs and smooth animations
  - Toast notifications for user feedback
  - Color-coded status indicators
  - Hover effects and transitions
  - Mobile-responsive layout

## Tech Stack

- **Next.js 14** (App Router) - React framework
- **TypeScript** - Type safety
- **React 18** - UI library
- **ffmpeg.wasm** - Client-side video processing
- **Tailwind CSS** - Styling
- **File-based DB** - JSON-based persistence for analytics

## Why ffmpeg.wasm?

ffmpeg.wasm was chosen for client-side video trimming because:

1. **No Server Load**: Video processing happens entirely in the browser, reducing server costs
2. **Privacy**: Videos are processed locally before upload
3. **Real-time**: Users can trim videos immediately after recording
4. **Scalability**: No need for server-side video processing infrastructure

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## How It Works

### Recording Flow

1. **Configure Microphone** (Before Recording):
   - Toggle microphone on/off using the switch
   - Green = microphone enabled, Gray = microphone disabled
   - This preference is used when you start recording

2. **Start Recording**: Click "Start Recording" button
   - Browser prompts for screen/tab/window selection
   - Microphone access is requested (if enabled)
   - Recording begins with MediaRecorder API

3. **Control Microphone During Recording**:
   - See microphone status (On/Muted) with visual indicators
   - Click "Mute" or "Unmute" button to toggle during recording
   - Green pulsing icon = microphone active
   - Red icon = microphone muted
   - Changes take effect immediately without stopping recording

4. **Stop Recording**: Click "Stop Recording"
   - Video blob is created and displayed
   - Recording time and file size are shown

5. **Trim Video** (Optional):
   - Enter start and end times in seconds
   - Use "Seek" buttons to preview trim points
   - Click "Trim Video" to process with ffmpeg.wasm
   - Preview trimmed video before downloading/uploading
   - Use "Reset Trim" to start over

6. **Download Video**:
   - Click "Download .webm" button
   - Video is saved directly to your computer
   - Downloads trimmed version if available, otherwise original
   - File is named `screen-recording-[timestamp].webm`

7. **Upload & Share** (Optional):
   - Click "Upload & Share" button
   - Video is sent to `/api/upload`
   - Unique ID is generated and video is saved
   - Shareable URL is returned
   - Copy link to share with others
   - View analytics on shared page

### Analytics Logic

The app tracks two main metrics:

1. **View Count**: Incremented each time `/video/[id]` page loads
   - Tracked server-side to prevent manipulation
   - Persisted in JSON database

2. **Watch Completion**:
   - Progress tracked every 2 seconds during playback
   - Progress stored per session (unique session ID)
   - Completion counted when progress ≥ 95%
   - Average watch progress calculated from all sessions

### Database Structure

Analytics are stored in `data/videos.json`:

```json
{
  "videoId": {
    "id": "videoId",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "viewCount": 10,
    "watchCompletions": 5,
    "watchProgress": {
      "sessionId1": 0.75,
      "sessionId2": 0.95,
      "sessionId2_completed": true
    }
  }
}
```

### File Structure

```
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # Video upload endpoint
│   │   ├── video/[id]/route.ts      # Video file serving
│   │   └── analytics/
│   │       ├── route.ts             # Analytics update/fetch
│   │       └── view/route.ts        # View count increment
│   ├── video/[id]/page.tsx          # Public share page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Main recording page
│   └── globals.css                  # Global styles
├── components/
│   ├── RecorderControls.tsx         # Recording UI controls with microphone toggle
│   ├── VideoTrimmer.tsx             # Video trimming interface
│   └── Toast.tsx                    # Toast notification component
├── hooks/
│   └── useScreenRecorder.ts         # Screen recording hook
├── lib/
│   ├── db.ts                        # Database operations
│   ├── ffmpeg.ts                    # FFmpeg.wasm wrapper
│   └── storage.ts                   # File storage utilities
├── uploads/                         # Uploaded video files (gitignored)
└── data/                            # Database files (gitignored)
```

## API Endpoints

### POST `/api/upload`
Upload a video file.

**Request**: `FormData` with `video` field
**Response**:
```json
{
  "success": true,
  "videoId": "abc123...",
  "shareUrl": "http://localhost:3000/video/abc123...",
  "message": "Video uploaded successfully"
}
```

### GET `/api/video/[id]`
Serve video file.

**Response**: Video file (video/webm)

### POST `/api/analytics`
Update watch progress.

**Request**:
```json
{
  "videoId": "abc123...",
  "sessionId": "unique-session-id",
  "progress": 0.75
}
```

### GET `/api/analytics?videoId=[id]`
Get analytics for a video.

**Response**:
```json
{
  "videoId": "abc123...",
  "viewCount": 10,
  "watchCompletions": 5,
  "averageWatchProgress": 0.82,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/analytics/view`
Increment view count.

**Request**:
```json
{
  "videoId": "abc123..."
}
```

## Key Features Explained

### Microphone Control

- **Pre-Recording Toggle**: Set your microphone preference before starting
  - Toggle switch allows you to enable/disable microphone
  - Visual feedback shows current state
  - Preference is remembered when you start recording

- **Live Microphone Toggle**: Control microphone during recording
  - Mute/unmute without stopping the recording
  - Real-time visual feedback (green = on, red = muted)
  - Status text updates immediately
  - Perfect for presentations or when you need to pause commentary

### Video Download

- Download recordings directly as `.webm` files
- Automatically uses trimmed version if available
- No upload required - works completely offline
- Files are timestamped for easy organization
- Perfect for local storage or sharing via other means

### Video Trimming

- Client-side trimming using ffmpeg.wasm
- Preview trimmed video before downloading/uploading
- Precise time controls with seek functionality
- Fallback encoding if codec copy fails
- Reset option to start over

## Limitations & Future Improvements

### Current Limitations

1. **Browser Compatibility**: 
   - Requires modern browser with MediaRecorder API support
   - ffmpeg.wasm requires WebAssembly support
   - Screen sharing not available in all browsers
   - Microphone toggle requires microphone permission

2. **File Size**:
   - Large videos may cause memory issues in browser
   - No file size limits enforced (should be added)
   - Download may fail for very large files

3. **Storage**:
   - Local file storage (not suitable for production)
   - No automatic cleanup of old videos
   - Downloads are stored in browser's default download folder

4. **Video Format**:
   - Only WebM format supported
   - No format conversion options
   - Downloads are always in .webm format

5. **Analytics**:
   - Basic metrics only
   - No geographic or device tracking
   - Analytics only available for uploaded videos

### Future Improvements

1. **Cloud Storage**: Integrate S3, Cloudinary, or similar
2. **Video Compression**: Add compression options before upload
3. **Multiple Formats**: Support MP4, MOV, etc.
4. **Advanced Analytics**: 
   - Watch heatmaps
   - Drop-off points
   - Device/browser stats
5. **User Authentication**: User accounts and video management
6. **Video Editing**: More editing features (annotations, filters)
7. **Real-time Collaboration**: Share and collaborate on recordings
8. **CDN Integration**: Fast global video delivery
9. **Video Expiration**: Auto-delete after set time
10. **Password Protection**: Secure video sharing

## Development Notes

- Videos are stored in `uploads/` directory (gitignored)
- Database is stored in `data/videos.json` (gitignored)
- ffmpeg.wasm loads from CDN on first use (may take a few seconds)
- All video processing is client-side for privacy
- Analytics persist across server restarts
- Microphone tracks are managed separately from screen capture
- Download functionality uses browser's native download API
- Toast notifications auto-dismiss after 3 seconds
- UI is fully responsive and works on mobile devices

## Interface Features

### Visual Design
- **Gradient Headers**: Eye-catching gradient backgrounds on key elements
- **Smooth Animations**: Fade-in effects, hover transitions, and pulse animations
- **Color-Coded Status**: 
  - Green = Active/Microphone On/Success
  - Red = Muted/Error/Stop
  - Blue = Information/Processing
  - Purple/Pink = Download actions
- **Interactive Elements**: Buttons with hover effects and scale transforms
- **Toast Notifications**: Non-intrusive notifications that auto-dismiss
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile

### User Experience
- **Clear Visual Hierarchy**: Important actions are prominently displayed
- **Real-time Feedback**: Status indicators update immediately
- **Intuitive Controls**: Large, clearly labeled buttons
- **Progress Indicators**: Loading states and progress feedback
- **Error Handling**: Clear error messages with helpful context

## Usage Tips

1. **Microphone Management**:
   - Set microphone preference before recording to avoid permission prompts
   - Use mute/unmute during recording for better control
   - Microphone status is clearly indicated with color-coded icons and gradients
   - Toggle switch provides smooth visual feedback

2. **Video Workflow**:
   - Record → (Optional) Trim → Download or Upload
   - You can download without uploading
   - Trimmed videos are automatically used for download/upload
   - Download section is prominently displayed for easy access

3. **Performance**:
   - First trim operation may take longer (ffmpeg.wasm initialization)
   - Large videos may take time to process
   - Consider trimming before uploading large files
   - UI provides loading states during processing

4. **Browser Permissions**:
   - Screen sharing permission is required
   - Microphone permission is optional (if enabled)
   - Permissions are requested only when needed
   - Clear UI indicates when permissions are required

5. **Interface Navigation**:
   - Sections appear progressively as you complete each step
   - Each section has clear visual boundaries
   - Color coding helps identify different action types
   - Hover effects provide visual feedback before clicking

## License

MIT

