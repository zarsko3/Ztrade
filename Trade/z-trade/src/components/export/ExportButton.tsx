'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import ExportProgress from './ExportProgress';

interface ExportButtonProps {
  type: 'trades' | 'performance' | 'analytics';
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  dateRange?: {
    start: Date;
    end: Date;
  };
  ticker?: string;
  includeOpenPositions?: boolean;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}

export default function ExportButton({
  type,
  variant = 'outline',
  size = 'md',
  className = '',
  children,
  dateRange,
  ticker,
  includeOpenPositions = true,
  onSuccess,
  onError
}: ExportButtonProps) {
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'generating' | 'downloading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'ghost':
        return 'btn-ghost';
      default:
        return 'btn btn-outline';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const handleExport = async () => {
    try {
      setExportStatus('preparing');
      setProgress(10);
      setMessage('Preparing export data...');
      setError('');

      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', type);
      
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
      }
      
      if (ticker) {
        params.append('ticker', ticker);
      }
      
      if (type === 'trades') {
        params.append('includeOpenPositions', includeOpenPositions.toString());
      }

      setExportStatus('generating');
      setProgress(30);
      setMessage('Generating Excel file...');

      // Make export request
      const response = await fetch(`/api/export?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      setExportStatus('downloading');
      setProgress(80);
      setMessage('Downloading file...');

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const downloadedFilename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setFilename(downloadedFilename);
      setExportStatus('success');
      setMessage('Export completed successfully!');
      
      onSuccess?.(downloadedFilename);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      setExportStatus('error');
      setMessage(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleCloseProgress = () => {
    setExportStatus('idle');
    setProgress(0);
    setMessage('');
    setFilename('');
    setError('');
  };

  const isDisabled = exportStatus === 'preparing' || exportStatus === 'generating' || exportStatus === 'downloading';

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={`${getVariantClasses()} ${getSizeClasses()} flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isDisabled ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4" />
            <span>{children || `Export ${type}`}</span>
          </>
        )}
      </button>

      <ExportProgress
        isVisible={exportStatus !== 'idle'}
        status={exportStatus}
        progress={progress}
        message={message}
        filename={filename}
        onClose={handleCloseProgress}
      />
    </>
  );
} 