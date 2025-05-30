import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  RotateCcw,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// Configure PDF.js worker - Use CDN with version match to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
  onClose?: () => void;
  className?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ 
  pdfUrl, 
  onClose,
  className 
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);

  // Handle successful PDF load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
    console.log(`PDF loaded successfully with ${numPages} pages`);
  }, []);

  // Handle PDF load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setLoading(false);
    setError(error.message || 'Failed to load PDF document');
  }, []);

  // Handle page rendering success
  const onPageLoadSuccess = useCallback(() => {
    console.log(`Page ${pageNumber} loaded successfully`);
  }, [pageNumber]);

  // Navigate to previous page
  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  // Zoom in
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.2));
  }, []);

  // Zoom out
  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setScale(1.2);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextPage();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose?.();
          }
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case '0':
          event.preventDefault();
          resetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, resetZoom, toggleFullscreen, isFullscreen, onClose]);

  // Handle responsive width
  useEffect(() => {
    const updatePageWidth = () => {
      const container = document.querySelector('.pdf-page-container');
      if (container) {
        const containerWidth = container.clientWidth - 48; // padding
        setPageWidth(containerWidth);
      }
    };

    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    return () => window.removeEventListener('resize', updatePageWidth);
  }, []);

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
              <span>{pageNumber}</span>
              <span className="text-gray-500 dark:text-gray-400">/</span>
              <span>{numPages || '?'}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 p-0"
            >
              <ZoomOut size={16} />
            </Button>
            
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3}
              className="h-8 w-8 p-0"
            >
              <ZoomIn size={16} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pdfUrl, '_blank')}
            className="h-8 px-2 text-xs"
          >
            <ExternalLink size={14} className="mr-1" />
            Open
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
          >
            <Maximize size={16} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setError('');
              setPageNumber(1);
            }}
            className="h-8 w-8 p-0"
          >
            <RotateCcw size={16} />
          </Button>

          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto pdf-page-container">
        <div className="flex flex-col items-center p-6 min-h-full">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-64 text-center p-8"
              >
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Failed to load PDF
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                  {error}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setLoading(true);
                      setError('');
                    }}
                    variant="default"
                    size="sm"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </motion.div>
            )}

            {!loading && !error && (
              <motion.div
                key="document"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-none"
              >
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  error={null}
                  options={{
                    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                    enableXfa: true,
                    withCredentials: false,
                  }}
                >
                  <div className="shadow-xl rounded-lg overflow-hidden bg-white">
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      width={pageWidth}
                      onLoadSuccess={onPageLoadSuccess}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      loading={
                        <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      }
                    />
                  </div>
                </Document>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Use arrow keys to navigate • +/- to zoom • 0 to reset zoom • ESC to close
        </p>
      </div>
    </div>
  );
};

export default PdfViewer; 