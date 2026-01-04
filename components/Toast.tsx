'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component for user feedback
 */
export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px]`}>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
}

