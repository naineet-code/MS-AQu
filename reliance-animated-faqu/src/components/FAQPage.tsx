import React, { useState, useEffect } from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "./PageTitle";
import ChatInputSection from "./ChatInputSection";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
// PDF and control icons
import { FileText, X, ExternalLink, RotateCcw, History, ChevronDown, ChevronUp, Trash2, HelpCircle, Loader2, Brain, Terminal, Lightbulb } from "lucide-react";
import ChatHistory from "./ChatHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useTheme } from "@/hooks/useTheme";
import QuestionResponseSection from "./QuestionResponseSection";
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
import HelpScreen from "./HelpScreen";
import { loadBackendUrl } from "@/config";
import { TechnicalInfoSection } from './TechnicalInfoSection';
import { BusinessGuideSection } from './BusinessGuideSection';
import { useChatState } from '@/hooks/useChatState';
import { usePdfDialog } from '@/hooks/usePdfDialog';
import { getRandomInitSteps } from '@/data/initializationSteps';
import { useBackendApi } from '@/hooks/useBackendApi';
import { useLoaderControl } from '@/hooks/useLoaderControl';

export default function FAQPage() {
  const {
    isInputFocused,
    setIsInputFocused,
    showResponse,
    setShowResponse,
    questionMode,
    setQuestionMode,
    currentQuestion,
    setCurrentQuestion,
    shouldAutoFocus,
    setShouldAutoFocus,
    isReturnedFromResponse,
    setIsReturnedFromResponse,
    isTransitioning,
    setIsTransitioning,
    handleAddMessage,
    handleNewQuestion
  } = useChatState();

  const {
    showPdfDialog,
    setShowPdfDialog,
    pdfLoading,
    setPdfLoading,
    pdfError,
    setPdfError,
    handlePdfError,
    handlePdfLoad
  } = usePdfDialog();

  const {
    loading,
    setLoading,
    responseData,
    setResponseData,
    error,
    setError,
    handleSubmitQuestion
  } = useBackendApi();

  const { shouldShowLoader, temporarilyDisableLoader } = useLoaderControl();
  const { chatHistory, clearHistory } = useChatHistory();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  
  // Simple initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationSteps] = useState(getRandomInitSteps());
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // New section states
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [showBusinessGuide, setShowBusinessGuide] = useState(false);

  // Effect to close chat history when PDF viewer or guides are opened
  useEffect(() => {
    if (showPdfDialog || showHelpScreen || showTechnicalInfo || showBusinessGuide) {
      setShowChatHistory(false);
    }
  }, [showPdfDialog, showHelpScreen, showTechnicalInfo, showBusinessGuide]);

  // Global click handler to reset chat position when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setTimeout(() => {
        const target = e.target as HTMLElement;
        const chatContainer = document.querySelector('[data-chat-container]');
        const isClickingChat = chatContainer?.contains(target);
        const isClickingNewQuestionButton = target.closest('button')?.textContent?.includes('New Question');
        
        if (!isClickingChat && !isClickingNewQuestionButton && isReturnedFromResponse && !isInputFocused) {
          setIsReturnedFromResponse(false);
        }
      }, 50);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isReturnedFromResponse, isInputFocused]);

  // Simple initialization logic
  useEffect(() => {
    // Set a maximum initialization time of 3 seconds
    const maxInitTime = setTimeout(() => {
      setIsInitializing(false);
    }, 3000);

    const initializeSystem = async () => {
      try {
        if (backendUrl) {
          await fetch(`${backendUrl}/api/refresh-pdfs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
      } finally {
        // Always finish initialization after a short delay
        setTimeout(() => {
          setIsInitializing(false);
          clearTimeout(maxInitTime);
        }, 2000);
      }
    };
    
    initializeSystem();

    // Cleanup function
    return () => {
      clearTimeout(maxInitTime);
    };
  }, [backendUrl]);

  // Load backend URL from TOML config with fallback
  useEffect(() => {
    loadBackendUrl()
      .then((url) => {
        setBackendUrl(url);
      })
      .catch((err) => {
        console.warn('Backend URL loading failed:', err.message);
        setConfigError(err.message);
        // Don't let this prevent the app from loading
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000);
      });
  }, []);

  // Safety fallback - ensure app always loads within 5 seconds maximum
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setIsInitializing(false);
    }, 5000);

    return () => clearTimeout(safetyTimeout);
  }, []);

  // Handle theme change to prevent loader
  const handleThemeChange = () => {
    temporarilyDisableLoader();
  };

  /**
   * Submit question to backend and set response data
   */
  const handleQuestionSubmit = async (question: string) => {
    await handleSubmitQuestion(question, backendUrl);
    
    if (!error && responseData && responseData.answer) {
      setShowResponse(true);
      setQuestionMode(false);
      handleAddMessage(question, true);
      handleAddMessage(responseData.answer, false);
    } else {
      const errorMessage = error || 'Sorry, I encountered an error while processing your question. Please try again.';
      handleAddMessage(errorMessage, false);
    }
  };

  // Only show loader if both conditions are met: initializing AND shouldShowLoader
  const showLoader = isInitializing && shouldShowLoader;

  return (
    <TooltipProvider>
      <MultiStepLoader 
        loadingStates={initializationSteps} 
        loading={showLoader} 
        duration={1000}
        loop={false}
      />
      <div className="relative min-h-screen flex flex-col">
        {/* Fixed Background */}
        <div className="fixed inset-0 z-0">
          <BackgroundGradientAnimation
            gradientBackgroundStart={isDark ? "rgb(13, 13, 13)" : "rgb(240, 245, 250)"}
            gradientBackgroundEnd={isDark ? "rgb(30, 41, 59)" : "rgb(230, 240, 250)"}
            firstColor={isDark ? "59, 130, 246" : "59, 130, 246"}
            secondColor={isDark ? "147, 51, 234" : "147, 51, 234"}
            thirdColor={isDark ? "236, 72, 153" : "236, 72, 153"}
            fourthColor={isDark ? "248, 113, 113" : "248, 113, 113"}
            fifthColor={isDark ? "34, 197, 94" : "34, 197, 94"}
            pointerColor={isDark ? "99, 102, 241" : "99, 102, 241"}
            interactive={true}
          />
        </div>

        {/* Top Navigation Bar */}
        {/* Theme toggle button removed - light theme only
        <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
          <div className="mr-auto">
            <div className="flex items-center justify-center h-14 w-14 rounded-full backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg">
              <ThemeToggle onClick={handleThemeChange} />
            </div>
          </div>
        </div>
        */}

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 pb-8 relative z-10 pointer-events-none">
          <PageTitle isVisible={!isInputFocused && questionMode && !isReturnedFromResponse} />
          <div className="w-full container-reading mx-auto space-y-4 pointer-events-auto">
            <AnimatePresence mode="wait">
              {questionMode ? (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <div data-chat-container>
                    <ChatInputSection
                      isInputFocused={isInputFocused}
                      setIsInputFocused={setIsInputFocused}
                      setShowResponse={setShowResponse}
                      onAddMessage={handleAddMessage}
                      questionMode={questionMode}
                      setQuestionMode={setQuestionMode}
                      currentQuestion={currentQuestion}
                      autoFocus={shouldAutoFocus}
                      onSubmitQuestion={handleQuestionSubmit}
                      isReturnedFromResponse={isReturnedFromResponse}
                      isTransitioning={isTransitioning}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <QuestionResponseSection
                    question={currentQuestion}
                    isVisible={showResponse}
                    onNewQuestion={() => handleNewQuestion(() => setResponseData(null))}
                    loading={loading}
                    responseData={responseData}
                    backendUrl={backendUrl}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Apple-inspired Bottom Navigation */}
        <AnimatePresence>
          {!isInputFocused && questionMode && !isReturnedFromResponse && (
          <motion.div 
            key="bottom-navigation"
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 px-8 py-2 rounded-full glass-morphism shadow-lg hover-lift">
              {/* PDF Viewer Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="View PDF"
                    onClick={() => {
                      setShowPdfDialog(true);
                      setPdfError("");
                    }}
                    className="relative h-9 w-9 rounded-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/10 group bg-transparent border-0"
                  >
                    <motion.div
                      whileHover={{ 
                        scale: [1, 1.3, 1.1, 1.3, 1], 
                        rotate: [0, -10, 10, -10, 0],
                        transition: { 
                          duration: 0.6, 
                          ease: "easeInOut",
                          times: [0, 0.2, 0.4, 0.6, 1]
                        }
                      }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 2
                      }}
                    >
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-apple-footnote">
                  <p>View Documents</p>
                </TooltipContent>
              </Tooltip>

              {/* Separator */}
              <div className="w-px h-5 bg-white/20 dark:bg-white/10 mx-1" />

              {/* Technical Info Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Technical Deep Dive"
                    onClick={() => setShowTechnicalInfo(true)}
                    className="relative h-9 w-9 rounded-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/10 group bg-transparent border-0"
                  >
                    <motion.div
                      whileHover={{ 
                        scale: [1, 1.3, 1.1, 1.3, 1], 
                        rotate: [0, -10, 10, -10, 0],
                        transition: { 
                          duration: 0.6, 
                          ease: "easeInOut",
                          times: [0, 0.2, 0.4, 0.6, 1]
                        }
                      }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 3, -3, 0]
                      }}
                      transition={{ 
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 2.5
                      }}
                    >
                      <Terminal className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-apple-footnote">
                  <p>Technical Guide</p>
                </TooltipContent>
              </Tooltip>

              {/* User Guide Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="User Guide"
                    onClick={() => setShowBusinessGuide(true)}
                    className="relative h-9 w-9 rounded-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/10 group bg-transparent border-0"
                  >
                    <motion.div
                      whileHover={{ 
                        scale: [1, 1.3, 1.1, 1.3, 1], 
                        rotate: [0, -10, 10, -10, 0],
                        transition: { 
                          duration: 0.6, 
                          ease: "easeInOut",
                          times: [0, 0.2, 0.4, 0.6, 1]
                        }
                      }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, -2, 2, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 3
                      }}
                    >
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-apple-footnote">
                  <p>User Guide</p>
                </TooltipContent>
              </Tooltip>

              {/* Separator */}
              <div className="w-px h-5 bg-white/20 dark:bg-white/10 mx-1" />

              {/* Chat History Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Chat History"
                    onClick={() => setShowChatHistory(!showChatHistory)}
                    className="relative h-9 w-9 rounded-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/10 group bg-transparent border-0"
                  >
                    <motion.div
                      whileHover={{ 
                        scale: [1, 1.3, 1.1, 1.3, 1], 
                        rotate: [0, -10, 10, -10, 0],
                        transition: { 
                          duration: 0.6, 
                          ease: "easeInOut",
                          times: [0, 0.2, 0.4, 0.6, 1]
                        }
                      }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 1, -1, 0]
                      }}
                      transition={{ 
                        duration: 4.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 3.5
                      }}
                    >
                      <History className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-apple-footnote">
                  <p>Chat History</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Apple-inspired Footer */}
        <AnimatePresence>
          {!isInputFocused && questionMode && !isReturnedFromResponse && (
          <motion.footer 
            key="footer"
            className="fixed bottom-0 left-0 right-0 z-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`w-full py-3 px-6 text-center backdrop-blur-md border-t ${
              isDark 
                ? 'bg-black/20 border-white/10' 
                : 'bg-white/40 border-white/30'
            }`}>
              <p className="flex items-center justify-center gap-2 text-apple-footnote">
                <span className="text-slate-500 dark:text-slate-400">Powered by</span>
                <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  Increff AQu AI Service
                </span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-apple-caption text-slate-400 dark:text-slate-500">
                  © 2025 Increff Technologies
                </span>
              </p>
            </div>
          </motion.footer>
          )}
        </AnimatePresence>

        {/* Help Screen */}
        {showHelpScreen && (
          <HelpScreen 
            isOpen={showHelpScreen} 
            onClose={() => setShowHelpScreen(false)} 
          />
        )}

        {/* Technical Deep Dive Section */}
        {showTechnicalInfo && (
          <TechnicalInfoSection 
            isOpen={showTechnicalInfo} 
            onClose={() => setShowTechnicalInfo(false)} 
          />
        )}

        {/* User Guide Section */}
        {showBusinessGuide && (
          <BusinessGuideSection 
            isOpen={showBusinessGuide} 
            onClose={() => setShowBusinessGuide(false)} 
          />
        )}

        {/* PDF Viewer Dialog */}
        {showPdfDialog && (
          <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
            <DialogContent className="max-w-4xl w-[88vw] max-h-[88vh] p-0 gap-0 transition-all duration-300 rounded-3xl overflow-hidden">
              {/* Apple-inspired Header */}
              <div className="relative flex items-center py-4 px-6 border-b glass-morphism shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-apple-headline font-bold text-gray-900 dark:text-gray-100">
                      Document Viewer
                    </DialogTitle>
                    <p className="text-apple-footnote text-gray-600 dark:text-gray-400">
                      AQu Knowledge Base
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Reset PDF View"
                        onClick={() => {
                          const iframe = document.querySelector('iframe');
                          if (iframe) {
                            iframe.src = `${backendUrl}/pdf/reliance/reliance_faq.pdf`;
                          }
                        }}
                        className="p-1 transition-all duration-200 hover:scale-110 focus:outline-none"
                      >
                        <RotateCcw className="h-5 w-5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-apple-footnote">Reset View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Open in Tab"
                        onClick={() => {
                          window.open(`${backendUrl}/pdf/reliance/reliance_faq.pdf`, '_blank');
                        }}
                        className="p-1 transition-all duration-200 hover:scale-110 focus:outline-none"
                      >
                        <ExternalLink className="h-5 w-5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-200" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-apple-footnote">Open in Tab</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogClose asChild>
                        <button 
                          aria-label="Close PDF Viewer" 
                          className="p-1 transition-all duration-200 hover:scale-110 focus:outline-none"
                        >
                          <X className="h-5 w-5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200" />
                        </button>
                      </DialogClose>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-apple-footnote">Close</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* PDF Content */}
              <div className="h-[75vh] overflow-hidden bg-gray-50 dark:bg-gray-900">
                {pdfLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div 
                      className="flex flex-col items-center gap-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                      </motion.div>
                      <p className="text-apple-body text-gray-600 dark:text-gray-400 font-medium">
                        Loading Document...
                      </p>
                    </motion.div>
                  </div>
                ) : pdfError ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div 
                      className="text-center p-8 max-w-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-4 rounded-full bg-red-100 dark:bg-red-900 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-apple-body text-red-600 dark:text-red-400 mb-4 font-medium">
                        {pdfError}
                      </p>
                      <Button 
                        onClick={() => setShowPdfDialog(false)}
                        className="rounded-full px-6 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 border-0 transition-all duration-200"
                      >
                        Close
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <motion.iframe
                    src={`${backendUrl}/pdf/reliance/reliance_faq.pdf`}
                    className="w-full h-full border-0 bg-white dark:bg-gray-800"
                    title="PDF Document"
                    onLoad={handlePdfLoad}
                    onError={handlePdfError}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className={`px-4 py-2 rounded-lg shadow-lg ${
              isDark ? 'bg-red-900/90 text-red-100' : 'bg-red-100/90 text-red-900'
            }`}>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Chat History */}
        {showChatHistory && (
          <ChatHistory
            messages={chatHistory}
            onClear={clearHistory}
            onClose={() => setShowChatHistory(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
