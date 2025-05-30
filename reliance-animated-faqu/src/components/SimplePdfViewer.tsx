import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink,
  RefreshCw,
  X,
  Download,
  Maximize,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface SimplePdfViewerProps {
  pdfUrl: string;
  onClose?: () => void;
  className?: string;
}

const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({ 
  pdfUrl, 
  onClose,
  className 
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
    setError('');
    console.log('PDF loaded successfully in iframe');
  };

  // Handle iframe error
  const handleIframeError = () => {
    setLoading(false);
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome');
    
    if (isChrome) {
      setError('Chrome has blocked the PDF viewer. This is a common security feature. Please click "Open in New Tab" below to view the document, or download it directly.');
    } else {
      setError('Failed to load PDF document. This might be due to browser security settings or network issues. Try opening in a new tab or downloading the document.');
    }
    console.error('PDF iframe load error');
  };

  // Retry loading
  const handleRetry = () => {
    setLoading(true);
    setError('');
    setRetryCount(prev => prev + 1);
    
    // Force iframe reload by changing src
    if (iframeRef.current) {
      const timestamp = Date.now();
      iframeRef.current.src = `${pdfUrl}#zoom=100&toolbar=1&view=FitH&timestamp=${timestamp}`;
    }
  };

  // Download PDF
  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reliance_faq.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose?.();
          }
          break;
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleRetry();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, onClose]);

  // Auto-retry on initial load failure
  useEffect(() => {
    if (error && retryCount < 2) {
      const timeout = setTimeout(() => {
        handleRetry();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [error, retryCount]);

  // Set loading timeout and check for blocking
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = userAgent.includes('chrome');
        
        if (isChrome) {
          setError('PDF loading was blocked by Chrome\'s security features. Please use the "Open in New Tab" button below to view the document, or download it directly.');
        } else {
          setError('PDF loading timed out. Please try refreshing or opening in a new tab.');
        }
      }
    }, 10000); // Reduced timeout to 10 seconds for faster feedback

    return () => clearTimeout(timeout);
  }, [loading, retryCount]);

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Reliance FAQ Document
          </h3>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pdfUrl, '_blank')}
            className="h-8 px-2 text-xs"
            title="Open in new tab"
          >
            <ExternalLink size={14} className="mr-1" />
            New Tab
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-2 text-xs"
            title="Download PDF"
          >
            <Download size={14} className="mr-1" />
            Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
            title="Toggle fullscreen"
          >
            <Maximize size={16} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="h-8 w-8 p-0"
            title="Refresh document"
          >
            <RefreshCw size={16} />
          </Button>

          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="Close viewer"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">Loading PDF Document...</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm text-center max-w-md">
                Please wait while we load the document. This may take a few moments.
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-center p-8"
            >
              <div className="text-red-500 mb-4">
                <AlertCircle size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Unable to Load PDF
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
                {error}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  variant="default"
                  size="lg"
                  className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink size={18} className="mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="lg"
                  className="min-w-[120px]"
                >
                  <Download size={18} className="mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="lg"
                  className="min-w-[120px]"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Iframe */}
        {!error && (
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#zoom=100&toolbar=1&view=FitH`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={cn(
              "w-full h-full border-0 bg-white transition-opacity duration-300",
              loading ? "opacity-0" : "opacity-100"
            )}
            title="PDF Document Viewer"
            allow="fullscreen"
          />
        )}
      </div>

      {/* Footer with instructions */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Use browser PDF controls to navigate • Press ESC to close • F11 for fullscreen • Ctrl+R to refresh
        </p>
      </div>
    </div>
  );
};

export default SimplePdfViewer; 