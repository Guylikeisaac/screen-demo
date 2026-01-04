import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Screen Recorder - Record, Trim, Share',
  description: 'In-browser screen recording with trimming and sharing capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

