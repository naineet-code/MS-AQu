import React, { useState, useEffect } from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion, AnimatePresence } from "motion/react";
import PageTitle from "./PageTitle";
import ChatInputSection from "./ChatInputSection";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
// PDF and control icons
import { FileText, X, Maximize2, RotateCcw, History, ChevronDown, ChevronUp, Trash2, HelpCircle, Loader2, Brain } from "lucide-react";
import { ThemeToggle, themeChangeEvent, THEME_CHANGE_EVENT } from "@/components/ui/theme-toggle";
import ChatHistory from "./ChatHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useTheme } from "@/hooks/useTheme";
import QuestionResponseSection from "./QuestionResponseSection";
import { formatDistanceToNow } from 'date-fns';
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
import HelpScreen from "./HelpScreen";
import { loadBackendUrl } from "@/config";
import AIInfoSection from './AIInfoSection';
import { useChatState } from '@/hooks/useChatState';
import { usePdfDialog } from '@/hooks/usePdfDialog';
import { getRandomInitSteps } from '@/data/initializationSteps';
import { useBackendApi } from '@/hooks/useBackendApi';

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

  const { chatHistory, clearHistory } = useChatHistory();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationSteps] = useState(getRandomInitSteps());
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showAIInfo, setShowAIInfo] = useState(false);
  const [animationKey, setAnimationKey] = useState(Date.now());
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle theme changes and background animation refresh
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      setAnimationKey(event.detail.timestamp);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };
    
    themeChangeEvent.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    return () => {
      themeChangeEvent.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    };
  }, []);

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

  // Always request loading of the single system PDF with initialization loader
  useEffect(() => {
    const initializeSystem = async () => {
      if (!backendUrl) return;
      
      try {
        await fetch(`${backendUrl}/api/refresh-pdfs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setTimeout(() => {
          setIsInitializing(false);
        }, 8000);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setTimeout(() => {
          setIsInitializing(false);
        }, 8000);
      }
    };
    
    initializeSystem();
  }, [backendUrl]);

  // Load backend URL from TOML config
  useEffect(() => {
    loadBackendUrl()
      .then(setBackendUrl)
      .catch((err) => setConfigError(err.message));
  }, []);

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

  return (
    <>
      <MultiStepLoader 
        loadingStates={initializationSteps} 
        loading={isInitializing} 
        duration={1000}
        loop={false}
      />
      <div className="relative min-h-screen flex flex-col">
        {/* Fixed Background */}
        <div className="fixed inset-0 z-0 transition-colors duration-700">
          <BackgroundGradientAnimation
            key={animationKey}
            gradientBackgroundStart={isDark ? "rgb(13, 13, 13)" : "rgb(240, 240, 240)"}
            gradientBackgroundEnd={isDark ? "rgb(30, 41, 59)" : "rgb(220, 230, 240)"}
            firstColor={isDark ? "59, 130, 246" : "59, 130, 246"}
            secondColor={isDark ? "147, 51, 234" : "120, 51, 234"}
            thirdColor={isDark ? "236, 72, 153" : "236, 72, 153"}
            fourthColor={isDark ? "248, 113, 113" : "230, 113, 113"}
            fifthColor={isDark ? "34, 197, 94" : "34, 180, 94"}
            pointerColor={isDark ? "99, 102, 241" : "79, 82, 221"}
            interactive={true}
          />
        </div>

        {/* Top Navigation Bar */}
        <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
          {/* Right side - Theme Toggle (only visible in question mode) */}
          {questionMode && !isInputFocused && !isReturnedFromResponse && (
            <div className="flex items-center justify-center h-14 w-14 rounded-full backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg">
              <ThemeToggle />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 pb-12 relative z-10">
          <PageTitle isVisible={!isInputFocused && questionMode && !isReturnedFromResponse} />
          <div className="w-full max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              {questionMode ? (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.3 }}
                >
                  <QuestionResponseSection
                    question={currentQuestion}
                    isVisible={showResponse}
                    responseData={responseData}
                    loading={loading}
                    onNewQuestion={handleNewQuestion}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-20 left-4 z-20">
        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg">
          {/* PDF Viewer Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="View PDF"
                onClick={() => {
                  setShowPdfDialog(true);
                  setPdfError("");
                }}
                className="relative h-10 w-10 rounded-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group transform hover:animate-hover-tada"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View PDF Document</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Info Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="AI System Information"
                onClick={() => setShowAIInfo(true)}
                className="relative h-10 w-10 rounded-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group transform hover:animate-hover-tada"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                <Brain className="h-5 w-5 text-purple-500 dark:text-purple-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AQu Intelligent Engine</p>
            </TooltipContent>
          </Tooltip>

          {/* Help Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Help & How to Use"
                onClick={() => setShowHelpScreen(true)}
                className="relative h-10 w-10 rounded-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group transform hover:animate-hover-tada"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                <HelpCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help & How to Use</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Chat History Button */}
      <div className="fixed bottom-20 right-4 z-20">
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Chat History"
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="relative h-10 w-10 rounded-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group transform hover:animate-hover-tada"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                <History className="h-5 w-5 text-blue-500 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat History</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10">
        <div className={`w-full py-2 px-4 text-center text-xs border-t backdrop-blur-sm ${
          isDark 
            ? 'bg-black/20 border-white/10 text-gray-400' 
            : 'bg-white/20 border-black/10 text-gray-600'
        }`}>
          <p className="flex items-center justify-center gap-1">
            Powered by 
            <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Increff AQu AI Service
            </span>
            <span className="mx-1">•</span>
            <span className="text-[10px]">
              © 2025 Increff Technologies Pvt. Ltd.
            </span>
          </p>
        </div>
      </footer>

      {/* Help Screen */}
      {showHelpScreen && (
        <HelpScreen 
          isOpen={showHelpScreen} 
          onClose={() => setShowHelpScreen(false)} 
        />
      )}

      {/* AI Info Dialog */}
      {showAIInfo && (
        <AIInfoSection isOpen={showAIInfo} onClose={() => setShowAIInfo(false)} />
      )}

      {/* PDF Viewer Dialog */}
      {showPdfDialog && (
        <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
          <DialogContent className={`${isFullScreen ? 'fixed inset-0 max-w-none w-screen h-screen max-h-none rounded-none z-50' : 'max-w-4xl w-[90vw] max-h-[90vh]'} p-0 gap-0 transition-all duration-300`}>
            {/* Header with Title and Controls */}
            <div className="relative flex items-center py-2 px-4 rounded-t-lg shadow-sm border-b bg-white/70 dark:bg-gray-900/70 backdrop-blur-md min-h-0">
              <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <DialogTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 flex-1">
                PDF Document Viewer
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Reset PDF View"
                      onClick={() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe) {
                          iframe.src = `${backendUrl}/pdf/reliance/reliance_faq.pdf`;
                        }
                      }}
                      className="h-8 w-8 rounded-full hover:bg-blue-100/60 dark:hover:bg-blue-900/40 flex items-center justify-center"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset PDF View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Full Screen"
                      onClick={() => setIsFullScreen(v => !v)}
                      className="h-8 w-8 rounded-full hover:bg-green-100/60 dark:hover:bg-green-900/40 flex items-center justify-center"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Full Screen</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogClose asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        aria-label="Close PDF Viewer" 
                        className="h-8 w-8 rounded-full hover:bg-red-100/60 dark:hover:bg-red-900/40 flex items-center justify-center"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </DialogClose>
                  </TooltipTrigger>
                  <TooltipContent>Close</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* PDF Content */}
            <div className="h-[70vh] overflow-y-auto p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              {pdfLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading PDF...</p>
                  </div>
                </div>
              ) : pdfError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-4">
                    <p className="text-red-500 dark:text-red-400 mb-2">{pdfError}</p>
                    <Button 
                      onClick={() => setShowPdfDialog(false)}
                      className="hover:bg-white/10 dark:hover:bg-white/5"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <iframe
                  src={`${backendUrl}/pdf/reliance/reliance_faq.pdf`}
                  className="w-full h-full rounded-xl border border-white/10 shadow-lg"
                  title="PDF Document"
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
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
    </>
  );
}
