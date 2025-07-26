'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileSpreadsheet, Download } from 'lucide-react';

interface ExportProgressProps {
  isVisible: boolean;
  status: 'idle' | 'preparing' | 'generating' | 'downloading' | 'success' | 'error';
  progress?: number;
  message?: string;
  filename?: string;
  onClose?: () => void;
}

export default function ExportProgress({
  isVisible,
  status,
  progress = 0,
  message,
  filename,
  onClose
}: ExportProgressProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
        return <FileSpreadsheet className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'generating':
        return <FileSpreadsheet className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'downloading':
        return <Download className="w-5 h-5 text-green-500 animate-bounce" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileSpreadsheet className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'preparing':
      case 'generating':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'downloading':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing export data...';
      case 'generating':
        return 'Generating Excel file...';
      case 'downloading':
        return 'Downloading file...';
      case 'success':
        return 'Export completed successfully!';
      case 'error':
        return 'Export failed';
      default:
        return 'Ready to export';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'preparing':
      case 'generating':
        return 'bg-blue-500';
      case 'downloading':
        return 'bg-green-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`w-80 rounded-xl border-2 shadow-lg transition-all duration-300 ${getStatusColor()}`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Export Progress
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getStatusText()}
                </p>
              </div>
            </div>
            {status !== 'preparing' && status !== 'generating' && status !== 'downloading' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {(status === 'preparing' || status === 'generating' || status === 'downloading') && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {message}
            </p>
          )}

          {/* Filename */}
          {filename && status === 'success' && (
            <div className="bg-white dark:bg-gray-700 rounded-lg p-2 mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">File:</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {filename}
              </p>
            </div>
          )}

          {/* Success Animation */}
          {showSuccess && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 