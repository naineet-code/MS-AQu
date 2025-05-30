import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "./PageTitle";
import ChatInputSection from "./ChatInputSection";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatHistory from "./ChatHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useTheme } from "@/hooks/useTheme";
import QuestionResponseSection from "./QuestionResponseSection";
import { useChatState } from '@/hooks/useChatState';
import { usePdfDialog } from '@/hooks/usePdfDialog';
import { getRandomInitSteps } from '@/data/initializationSteps';
import { useBackendApi } from '@/hooks/useBackendApi';
import { useLoaderControl } from '@/hooks/useLoaderControl';
import { loadBackendUrl } from "@/config";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CommandIcon, 
  IdeaIcon, 
  ClockIcon,
  File01Icon 
} from "@hugeicons/core-free-icons";

// Import critical components directly (not lazy) to prevent layout issues
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { FloatingDock } from "@/components/ui/floating-dock";

// Lazy load only non-critical heavy components for better performance
const PageLoadTypingAnimation = lazy(() => import("@/components/ui/page-load-typing-animation").then(module => ({ default: module.PageLoadTypingAnimation })));
const HelpScreen = lazy(() => import('./HelpScreen'));
const TechnicalInfoSection = lazy(() => import('./TechnicalInfoSection').then(module => ({ default: module.TechnicalInfoSection })));
const BusinessGuideSection = lazy(() => import('./BusinessGuideSection').then(module => ({ default: module.BusinessGuideSection })));
const SimplePdfViewer = lazy(() => import('./SimplePdfViewer').then(module => ({ default: module.default })));

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);

export default function FAQPage() {
  // Chat state management
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

  // PDF dialog state - simplified since new component handles everything
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

  // Backend API state
  const {
    loading,
    setLoading,
    responseData,
    setResponseData,
    error,
    setError,
    handleSubmitQuestion,
    handleForceNoCache
  } = useBackendApi();

  // Other hooks
  const { shouldShowLoader, temporarilyDisableLoader } = useLoaderControl();
  const { chatHistory, clearHistory } = useChatHistory();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Core state - simplified
  const [showTypingAnimation, setShowTypingAnimation] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  
  // Dialog states
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [showBusinessGuide, setShowBusinessGuide] = useState(false);
  
  // System initialization
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string>("");
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [initializationSteps] = useState(getRandomInitSteps());
  // Generate messages for initial typing animation from the same source
  const [typingMessages] = useState(() => {
    const steps = getRandomInitSteps();
    return steps.map(step => step.text);
  });

  // Load backend URL
  useEffect(() => {
    loadBackendUrl()
      .then((url) => {
        setBackendUrl(url);
      })
      .catch((err) => {
        console.warn('Backend URL loading failed:', err.message);
        setConfigError(err.message);
        setIsSystemReady(true);
      });
  }, []);

  // System initialization
  useEffect(() => {
    const initializeSystem = async () => {
      if (backendUrl === null && !configError) return;

      if (configError) {
        return;
      }
      
      try {
        if (backendUrl) {
          await fetch(`${backendUrl}/api/refresh-pdfs`, { method: 'POST' });
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn("Initialization step failed:", e);
      } finally {
        setIsSystemReady(true);
      }
    };

    if (backendUrl !== null || configError) {
      initializeSystem();
    }
  }, [backendUrl, configError]);

  // Global click handler for chat position reset
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Don't interfere with input focus events - let them handle the state properly
      const target = e.target as HTMLElement;
      
      // Check if clicking on input or related elements
      const isClickingInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isClickingInputContainer = target.closest('form') || target.closest('[class*="placeholder"]') || target.closest('[class*="input"]');
      
      // If clicking on input-related elements, don't reset focus
      if (isClickingInput || isClickingInputContainer) {
        return;
      }
      
      setTimeout(() => {
        const chatContainer = document.querySelector('[data-chat-container]');
        const isClickingChat = chatContainer?.contains(target);
        const isClickingNewQuestionButton = target.closest('button')?.textContent?.includes('New Question');
        const isClickingFloatingDock = target.closest('[class*="floating"]') || target.closest('.fixed.bottom');
        
        // Only reset chat states when clearly clicking outside the chat area
        if (!isClickingChat && !isClickingNewQuestionButton && !isClickingFloatingDock && questionMode) {
          // Only reset focus if the input is not actually focused
          const activeElement = document.activeElement;
          const isInputCurrentlyFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
          
          if (!isInputCurrentlyFocused && isInputFocused) {
            setIsInputFocused(false);
          }
          
          // Reset returned from response state
          if (isReturnedFromResponse) {
            setIsReturnedFromResponse(false);
          }
        }
      }, 50);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isReturnedFromResponse, isInputFocused, questionMode]);

  // Close other dialogs when one is opened
  useEffect(() => {
    if (showPdfDialog || showHelpScreen || showTechnicalInfo || showBusinessGuide) {
      setShowChatHistory(false);
      setUserHasInteracted(true);
    }
  }, [showPdfDialog, showHelpScreen, showTechnicalInfo, showBusinessGuide]);

  // PDF loading timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (showPdfDialog && pdfLoading) {
      // Pre-test the PDF URL before loading in iframe
      const testPdfUrl = async () => {
        if (!backendUrl) return;
        
        try {
          const response = await fetch(`${backendUrl}/pdf/reliance/reliance_faq.pdf`, {
            method: 'HEAD',
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`PDF not accessible: ${response.status} ${response.statusText}`);
          }
          
          // Check if browser supports PDF viewing
          const userAgent = navigator.userAgent.toLowerCase();
          const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
          const isIOSSafari = /ipad|iphone|ipod/.test(userAgent) && /safari/i.test(userAgent);
          
          if (isMobile || isIOSSafari) {
            // Mobile browsers often don't support PDF iframes well
            setPdfLoading(false);
            setPdfError("PDF viewing in mobile browsers may not work properly. Please use the 'Open in New Tab' button below for the best experience.");
            return;
          }
          
          // If pre-test passes, continue with iframe loading
          timeoutId = setTimeout(() => {
            if (pdfLoading) {
              setPdfLoading(false);
              setPdfError("Document loading timed out. The PDF file might be large or there could be network issues. Please try clicking 'Open in New Tab' below.");
              console.error('PDF loading timeout after 30 seconds. Backend URL:', backendUrl);
            }
          }, 30000); // Increased to 30 seconds
          
        } catch (error) {
          setPdfLoading(false);
          setPdfError(`Failed to access PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your network connection.`);
          console.error('PDF pre-test failed:', error);
        }
      };
      
      testPdfUrl();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showPdfDialog, pdfLoading, setPdfLoading, setPdfError, backendUrl]);

  // Mark user interaction when input is focused
  useEffect(() => {
    if (isInputFocused) {
      setUserHasInteracted(true);
    }
  }, [isInputFocused]);

  // Handle typing animation completion
  const handleTypingAnimationComplete = () => {
    setShowTypingAnimation(false);
    // Immediately show main content when typing is complete
    setShowMainContent(true);
  };

  // Handle user interaction during typing animation
  const handleUserInteractionDuringTyping = () => {
    setUserHasInteracted(true);
    setShowTypingAnimation(false);
    // Immediately show main content when user interacts
    setShowMainContent(true);
  };

  // Auto-show main content when system is ready and no typing animation
  useEffect(() => {
    if (isSystemReady && !showTypingAnimation && !showMainContent) {
      setShowMainContent(true);
    }
  }, [isSystemReady, showTypingAnimation, showMainContent]);

  // Submit question handler
  const handleQuestionSubmit = async (question: string) => {
    setLoading(true);
    setShowResponse(true);
    setQuestionMode(false);
    
    try {
      const data = await handleSubmitQuestion(question, backendUrl);
      
      if (!error && data && data.answer) {
        handleAddMessage(question, true);
        handleAddMessage(data.answer, false);
      } else {
        const errorMessage = error || 'Sorry, I encountered an error while processing your question. Please try again.';
        handleAddMessage(errorMessage, false);
        setShowResponse(false);
        setQuestionMode(true);
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      const errorMessage = 'Sorry, I encountered an error while processing your question. Please try again.';
      handleAddMessage(errorMessage, false);
      setShowResponse(false);
      setQuestionMode(true);
    } finally {
      setLoading(false);
    }
  };

  // Show typing animation on initial load
  if (showTypingAnimation) {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <PageLoadTypingAnimation 
          messages={typingMessages}
          onAnimationComplete={handleTypingAnimationComplete}
          onUserInteraction={handleUserInteractionDuringTyping}
          autoHideAfter={5000}
          typingSpeed={35}
          pauseBetweenMessages={800}
        />
      </Suspense>
    );
  }

  // Main application content - Always render this as fallback to prevent blank states
  return (
    <TooltipProvider>
      <div className="relative min-h-screen flex flex-col">
        {/* Fixed Background */}
        <div className="fixed inset-0 z-0">
          <BackgroundGradientAnimation
            gradientBackgroundStart="rgb(255, 255, 255)"
            gradientBackgroundEnd="rgb(245, 248, 250)"
            firstColor="59, 130, 246"
            secondColor="147, 51, 234"
            thirdColor="236, 72, 153"
            fourthColor="34, 197, 94"
            fifthColor="251, 191, 36"
            pointerColor="99, 102, 241"
            size="80%"
            blendingValue="normal"
            interactive={true}
            containerClassName="w-full h-full"
          />
        </div>

        {/* Show content only when ready */}
        {showMainContent && (
          <>
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center p-4 pb-8 relative z-10 pointer-events-none min-h-screen">
              <div className="flex flex-col items-center w-full max-w-4xl pt-32 space-y-8">
                <PageTitle isVisible={!isInputFocused && questionMode && !isReturnedFromResponse} />
                <div className="w-full container-reading pointer-events-auto">
                  <AnimatePresence mode="wait">
                    {questionMode ? (
                      <motion.div
                        key="question"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <QuestionResponseSection
                          question={currentQuestion}
                          isVisible={showResponse}
                          onNewQuestion={() => handleNewQuestion(() => setResponseData(null))}
                          loading={loading}
                          responseData={responseData}
                          backendUrl={backendUrl}
                          onForceNoCache={() => handleForceNoCache(backendUrl)}
                          hasUserInteracted={userHasInteracted}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <AnimatePresence>
              {!isInputFocused && questionMode && !isReturnedFromResponse && (
              <motion.div 
                key="bottom-navigation"
                className="fixed bottom-24 left-0 right-0 z-20 flex items-center justify-center"
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="flex justify-center items-center w-full max-w-screen-lg px-4">
                  <FloatingDock
                    items={[
                      {
                        title: "Source Document",
                        icon: (
                          <HugeiconsIcon 
                            icon={File01Icon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.5}
                            className="text-gray-600"
                          />
                        ),
                        onClick: () => { 
                          setShowPdfDialog(true); 
                          setUserHasInteracted(true); 
                        }
                      },
                      {
                        title: "Technical Guide",
                        icon: (
                          <HugeiconsIcon 
                            icon={CommandIcon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.5}
                            className="text-gray-600"
                          />
                        ),
                        onClick: () => {
                          setShowTechnicalInfo(true); 
                          setUserHasInteracted(true);
                        }
                      },
                      {
                        title: "User Guide",
                        icon: (
                          <HugeiconsIcon 
                            icon={IdeaIcon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.5}
                            className="text-gray-600"
                          />
                        ),
                        onClick: () => {
                          setShowBusinessGuide(true); 
                          setUserHasInteracted(true);
                        }
                      },
                      {
                        title: "Chat History",
                        icon: (
                          <HugeiconsIcon 
                            icon={ClockIcon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.5}
                            className="text-gray-600"
                          />
                        ),
                        onClick: () => {
                          setShowChatHistory(!showChatHistory); 
                          setUserHasInteracted(true);
                        }
                      }
                    ]}
                    desktopClassName="bg-white shadow-2xl border border-gray-200/50 shadow-black/20 transform-gpu backdrop-blur-xl mx-auto"
                    mobileClassName="mx-auto"
                  />
                </div>
              </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <AnimatePresence>
              {!isInputFocused && questionMode && !isReturnedFromResponse && (
              <motion.footer 
                key="footer"
                className="fixed bottom-0 left-0 right-0 z-5"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className={`w-full py-2 px-6 text-center backdrop-blur-sm ${isDark ? 'bg-black/5 border-white/5' : 'bg-white/10 border-white/20'} border-t`}>
                  <p className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-slate-500/70 dark:text-slate-400/70">Powered by</span>
                    <span className={`font-medium ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>Increff AQu AI Service</span>
                    <span className="text-slate-400/50 dark:text-slate-500/50">•</span>
                    <span className="text-xs text-slate-400/70 dark:text-slate-500/70">© 2025 Increff Technologies</span>
                  </p>
                </div>
              </motion.footer>
              )}
            </AnimatePresence>

            {/* Dialogs and Screens */}
            {showHelpScreen && (
              <Suspense fallback={<ComponentLoader />}>
                <HelpScreen isOpen={showHelpScreen} onClose={() => setShowHelpScreen(false)} />
              </Suspense>
            )} 
            {showTechnicalInfo && (
              <Suspense fallback={<ComponentLoader />}>
                <TechnicalInfoSection isOpen={showTechnicalInfo} onClose={() => setShowTechnicalInfo(false)} />
              </Suspense>
            )} 
            {showBusinessGuide && (
              <Suspense fallback={<ComponentLoader />}>
                <BusinessGuideSection isOpen={showBusinessGuide} onClose={() => setShowBusinessGuide(false)} />
              </Suspense>
            )} 

            {/* PDF Viewer Dialog */}
            {showPdfDialog && (
              <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-0 gap-0 transition-all duration-300 rounded-3xl overflow-hidden">
                  {/* Hidden title for accessibility */}
                  <DialogTitle className="sr-only">
                    Reliance FAQ Document Viewer
                  </DialogTitle>
                  {/* Hidden description for accessibility */}
                  <DialogDescription className="sr-only">
                    Interactive PDF viewer displaying the Reliance Frequently Asked Questions document. Use the toolbar controls to navigate, zoom, and interact with the document.
                  </DialogDescription>
                  <Suspense fallback={<ComponentLoader />}>
                    <SimplePdfViewer
                      pdfUrl={backendUrl ? `${backendUrl}/pdf/reliance/reliance_faq.pdf` : ''}
                      onClose={() => setShowPdfDialog(false)}
                      className="h-[95vh]"
                    />
                  </Suspense>
                </DialogContent>
              </Dialog>
            )}

            {/* Chat History */}
            <AnimatePresence>
              {showChatHistory && (
                <ChatHistory
                  messages={chatHistory}
                  onClear={clearHistory}
                  onClose={() => setShowChatHistory(false)}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
