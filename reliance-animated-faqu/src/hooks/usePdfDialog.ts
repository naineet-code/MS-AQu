import { useState } from 'react';

interface UsePdfDialogReturn {
  showPdfDialog: boolean;
  setShowPdfDialog: (show: boolean) => void;
  pdfLoading: boolean;
  setPdfLoading: (loading: boolean) => void;
  pdfError: string;
  setPdfError: (error: string) => void;
  handlePdfError: () => void;
  handlePdfLoad: () => void;
}

export const usePdfDialog = (): UsePdfDialogReturn => {
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const handlePdfError = () => {
    setPdfLoading(false);
    setPdfError("Failed to load PDF. Please try again.");
  };

  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  return {
    showPdfDialog,
    setShowPdfDialog,
    pdfLoading,
    setPdfLoading,
    pdfError,
    setPdfError,
    handlePdfError,
    handlePdfLoad
  };
}; 