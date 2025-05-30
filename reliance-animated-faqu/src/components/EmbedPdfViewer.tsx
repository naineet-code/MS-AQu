import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink,
  RefreshCw,
  X,
  Download,
  Maximize,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface EmbedPdfViewerProps {
  pdfUrl: string;
  onClose?: () => void;
  className?: string;
}

const EmbedPdfViewer: React.FC<EmbedPdfViewerProps> = ({ 
  pdfUrl, 
  onClose,
  className 
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showFallback, setShowFallback] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Check browser PDF support
  useEffect(() => {
    const checkPdfSupport = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isIOSSafari = /ipad|iphone|ipod/.test(userAgent) && /safari/i.test(userAgent);
      const isFirefox = userAgent.includes('firefox');
      
      // Show fallback immediately for known unsupported browsers
      if (isMobile || isIOSSafari || isFirefox) {
        setLoading(false);
        setShowFallback(true);
        return;
      }

      // Test PDF loading
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    };

    checkPdfSupport();
  }, []);

  // Handle PDF load success
  const handlePdfLoad = () => {
    setLoading(false);
    setError('');
  };

  // Handle PDF load error
  const handlePdfError = () => {
    setLoading(false);
    setShowFallback(true);
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, onClose]);

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
                Checking browser compatibility and loading the document...
              </p>
            </motion.div>
          )}

          {showFallback && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-center p-8"
            >
              <div className="text-blue-500 mb-6">
                <Eye size={64} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Browser PDF Viewer Not Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
                Your browser doesn't support inline PDF viewing. Please use one of the options below to access the document.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  variant="default"
                  size="sm"
                  className="min-w-[140px]"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="min-w-[140px]"
                >
                  <Download size={16} className="mr-2" />
                  Download PDF
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 max-w-sm">
                For the best experience, we recommend using Chrome, Edge, or Safari desktop browsers.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Embed */}
        {!loading && !showFallback && (
          <embed
            src={pdfUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            onLoad={handlePdfLoad}
            onError={handlePdfError}
            className="border-0"
          />
        )}
      </div>

      {/* Footer with instructions */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Use your browser's PDF controls to navigate • Press ESC to close • F11 for fullscreen
        </p>
      </div>
    </div>
  );
};

export default EmbedPdfViewer; 