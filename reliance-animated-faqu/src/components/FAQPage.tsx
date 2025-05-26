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
import { FileText, X, Maximize2, History, ChevronDown, ChevronUp, Trash2, HelpCircle, Loader2 } from "lucide-react";
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

// Funny FAQ initialization steps - randomized for variety
const funnyInitSteps = [
  [
    { text: "Teaching AI that RTFM doesn't mean 'Read The Fun Manual'..." },
    { text: "Loading the 'Obvious Questions People Ask' database..." },
    { text: "Calibrating patience levels for repetitive questions..." },
    { text: "Installing empathy modules for confused users..." },
    { text: "Debugging why people don't scroll down..." },
    { text: "Optimizing responses for maximum clarity..." },
    { text: "Teaching search engines to find the right answer..." },
    { text: "Installing the 'Don't Make Me Think' protocol..." },
    { text: "Loading responses that actually solve problems..." },
    { text: "Preparing for users who skim instead of read..." },
    { text: "Buffering solutions to problems you didn't know existed..." },
    { text: "Finalizing the knowledge base optimization..." },
    { text: "Ready to answer questions you didn't know you had!" }
  ],
  [
    { text: "Convincing AI that 'Have you tried turning it off and on?' isn't always the answer..." },
    { text: "Loading infinite patience for the same question asked 50 times..." },
    { text: "Teaching algorithms the art of helpful responses..." },
    { text: "Installing common sense plugins..." },
    { text: "Preparing for questions about questions..." },
    { text: "Buffering wisdom from the knowledge vault..." },
    { text: "Teaching AI the difference between urgent and important..." },
    { text: "Loading the 'Actually Listen to What They're Asking' module..." },
    { text: "Installing the 'Context Matters' understanding engine..." },
    { text: "Preparing responses that won't create more questions..." },
    { text: "Teaching machines to read between the lines..." },
    { text: "Optimizing for humans who hate reading manuals..." },
    { text: "Ready to make documentation actually useful!" }
  ],
  [
    { text: "Explaining to AI why 'It depends' isn't a helpful answer..." },
    { text: "Loading FAQ answers that people will still ask about..." },
    { text: "Teaching machine learning that humans don't read instructions..." },
    { text: "Calibrating response clarity to maximum..." },
    { text: "Installing 'Actually Helpful' response engine..." },
    { text: "Preparing answers for questions not yet asked..." },
    { text: "Teaching AI to speak human instead of robot..." },
    { text: "Loading the 'Skip the Jargon' translator..." },
    { text: "Installing emotional intelligence for better support..." },
    { text: "Preparing for users who just want it to work..." },
    { text: "Teaching algorithms to predict what you really meant..." },
    { text: "Optimizing for clarity over technical accuracy..." },
    { text: "Ready to turn confusion into clarity!" }
  ],
  [
    { text: "Initializing the 'Why Didn't You Google This First?' module..." },
    { text: "Loading documentation that people might actually read..." },
    { text: "Installing the 'Skip to the Good Stuff' filter..." },
    { text: "Teaching AI to translate technical jargon to human..." },
    { text: "Preparing for the age-old question: 'Did you check the FAQ?'..." },
    { text: "Buffering helpful answers and hiding the sarcastic ones..." },
    { text: "Loading the 'Assume They Haven't Read Anything' protocol..." },
    { text: "Installing patience for explaining the same thing differently..." },
    { text: "Teaching AI that 'user error' isn't always the answer..." },
    { text: "Preparing responses for people who hate documentation..." },
    { text: "Loading solutions that work on the first try..." },
    { text: "Teaching machines the art of gentle guidance..." },
    { text: "Ready to make support tickets a thing of the past!" }
  ],
  [
    { text: "Uploading the 'Common Sense Isn't So Common' database..." },
    { text: "Loading wisdom from every help desk ticket ever filed..." },
    { text: "Installing the 'Actually Read the Error Message' reminder..." },
    { text: "Teaching AI that 'It's not working' isn't a detailed bug report..." },
    { text: "Preparing answers for questions you'll ask tomorrow..." },
    { text: "Optimizing for clarity because nobody likes confusing docs..." },
    { text: "Loading the 'Explain Like I'm Five' communication style..." },
    { text: "Installing the 'Show, Don't Just Tell' methodology..." },
    { text: "Teaching AI to give examples with every explanation..." },
    { text: "Preparing for users who learn by doing, not reading..." },
    { text: "Loading solutions that prevent future problems..." },
    { text: "Teaching machines to anticipate follow-up questions..." },
    { text: "Ready to be your friendly neighborhood know-it-all!" }
  ]
];

// Get random initialization steps
const getRandomInitSteps = () => {
  return funnyInitSteps[Math.floor(Math.random() * funnyInitSteps.length)];
};

export default function FAQPage() {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [questionMode, setQuestionMode] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const { chatHistory, addMessage, clearHistory } = useChatHistory();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationSteps] = useState(getRandomInitSteps());
  const [isReturnedFromResponse, setIsReturnedFromResponse] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };
  
  const truncateMessage = (message: string, limit = 100) => {
    if (message.length <= limit) return message;
    return message.slice(0, limit) + '...';
  };
  const [animationKey, setAnimationKey] = useState(Date.now());

  // Handle theme changes and background animation refresh
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      // Update the animation key with the timestamp from the event
      setAnimationKey(event.detail.timestamp);
      // Refresh the page after a short delay to ensure theme is saved
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };
    
    themeChangeEvent.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    return () => {
      themeChangeEvent.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    };
  }, []);

  // Modified addMessage function to track current question
  const handleAddMessage = (message: string, isUser: boolean) => {
    if (isUser) {
      setCurrentQuestion(message);
    }
    addMessage(message, isUser);
  };

  // Handle going back to question mode
  const handleNewQuestion = () => {
    setQuestionMode(true);
    setShowResponse(false);
    setShouldAutoFocus(false);
    // Mark that user returned from response to keep chat at top
    setIsReturnedFromResponse(true);
    // Set transitioning flag to prevent blur handler interference
    setIsTransitioning(true);
    
    // Focus the input after transition completes
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        setIsInputFocused(true); // Ensure focus state is set
      }
      setIsTransitioning(false); // Re-enable blur handler
    }, 700); // Wait for transition to complete
  };

  // Reset autoFocus after it's used
  useEffect(() => {
    if (shouldAutoFocus && questionMode) {
      // Reset after a delay to ensure the component has mounted
      const timer = setTimeout(() => {
        setShouldAutoFocus(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoFocus, questionMode]);

  // Loading state and response data from backend
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  // Global click handler to reset chat position when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Small delay to ensure state has been set properly
      setTimeout(() => {
        // Check if clicked element is outside the chat input area
        const target = e.target as HTMLElement;
        const chatContainer = document.querySelector('[data-chat-container]');
        const isClickingChat = chatContainer?.contains(target);
        
        // Check if clicking the "New Question" button (ignore this click)
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf_name: 'reliance_faq.pdf' }),
        });
        // Simulate initialization time for better UX (longer for funny messages)
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
  const handleSubmitQuestion = async (question: string) => {
    if (!backendUrl) {
      throw new Error('Backend URL not loaded');
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: question,
          category: "reliance"  // Adding the required category field
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResponseData(data);
      setShowResponse(true);
      setQuestionMode(false);
      handleAddMessage(question, true);
      handleAddMessage(data.answer, false);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
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
          <ThemeToggle />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-12 relative z-10">
        <PageTitle isVisible={!isInputFocused && questionMode && !isReturnedFromResponse} />
        <div className="w-full max-w-3xl mx-auto">
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
                    onSubmitQuestion={handleSubmitQuestion}
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

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-16 left-4 z-20 flex items-center gap-2">
        {/* PDF Viewer Button and Dialog */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              aria-label="View PDF"
              className="transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
              onClick={() => {
                setShowPdfDialog(true);
                setPdfError("");
              }}
            >
              <FileText className="h-5 w-5 hover:animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View PDF Document</p>
          </TooltipContent>
        </Tooltip>
        {showPdfDialog && (
          <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
            <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-0 gap-0">
              {/* Header with Title and Controls */}
              <div className="relative flex items-center p-4 border-b bg-gray-50 dark:bg-gray-900">
                <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex-1 pr-20">
                  FAQ PDF Document
                </DialogTitle>
                {/* Controls Container - positioned to avoid close button */}
                <div className="absolute right-16 top-4">
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Fullscreen PDF"
                    onClick={() => {
                      const iframe = document.getElementById('faq-pdf-iframe');
                      if (iframe && iframe.requestFullscreen) {
                        iframe.requestFullscreen();
                      }
                    }}
                    className="h-8 w-8 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <DialogClose asChild>
                  <Button size="icon" variant="ghost" aria-label="Close PDF Dialog" className="h-8 w-8 ml-2">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
              {/* PDF Viewer */}
              <div className="w-full h-full flex items-center justify-center relative" style={{ minHeight: 'calc(90vh - 80px)' }}>
                {pdfLoading && !pdfError && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 dark:bg-black/60">
                    <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
                  </div>
                )}
                {pdfError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/80 dark:bg-black/80">
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Failed to load PDF.</p>
                    <p className="text-xs text-gray-500">{pdfError}</p>
                  </div>
                )}
                <iframe
                  id="faq-pdf-iframe"
                  src={`${backendUrl}/pdf/reliance/reliance_faq.pdf`}
                  title="FAQ PDF"
                  className="w-full h-full border-0 relative z-0"
                  style={{ minHeight: 'calc(90vh - 80px)' }}
                  onLoad={() => setPdfLoading(false)}
                  onError={() => {
                    setPdfLoading(false);
                    setPdfError('Could not load the PDF. Please check your connection or try again later.');
                  }}
                  onLoadStart={() => setPdfLoading(true)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        {/* Help Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Help & How to Use"
              onClick={() => setShowHelpScreen(true)}
              className="transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
            >
              <HelpCircle className="h-5 w-5 hover:animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Help & How to Use</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Chat History Button and Panel */}
      <div className="fixed bottom-16 right-4 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Chat History"
              onClick={() => setShowChatHistory(!showChatHistory)}
              className="transform transition-transform duration-200 ease-in-out hover:animate-hover-tada rounded-full backdrop-blur-sm border"
            >
              <History className="h-5 w-5 hover:animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat History</p>
          </TooltipContent>
        </Tooltip>

        {/* Floating Chat History Panel */}
        <AnimatePresence>
          {showChatHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`fixed bottom-16 right-4 w-[300px] max-h-[80vh] flex flex-col overflow-hidden
                rounded-3xl
                ${isDark
                  ? 'bg-zinc-900/40'
                  : 'bg-white/30'}
                border border-white/20 shadow-xl backdrop-blur-2xl
              `}
              style={{
                boxShadow: isDark
                  ? '0 8px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset'
                  : '0 8px 32px 0 rgba(31, 38, 135, 0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04) inset',
                border: '1.5px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/10' : 'border-zinc-300/30'}`}
                style={{backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'}}>
                <span className="font-semibold text-lg">Chat History</span>
                <div className="flex items-center gap-2">
                  {/* Clear History Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to clear all chat history?')) {
                            clearHistory();
                          }
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
                        aria-label="Clear Chat History"
                        disabled={chatHistory.length === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear Chat History</TooltipContent>
                  </Tooltip>
                  {/* Close Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowChatHistory(false)}
                    className="h-8 w-8 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
                    aria-label="Close Chat History"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-transparent">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-xs text-gray-400">No chat history yet.</div>
                ) : (
                  chatHistory.map((msg, idx) => {
                    // Format timestamp as 'about X ago'
                    let timeAgo = '';
                    if (msg.timestamp) {
                      try {
                        timeAgo = `about ${formatDistanceToNow(new Date(Number(msg.timestamp)), { addSuffix: true })}`;
                      } catch {
                        timeAgo = '';
                      }
                    }
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-${msg.isUser ? 'end' : 'start'} mb-2`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl max-w-[90%] shadow text-xs break-words border
                            ${msg.isUser
                              ? isDark
                                ? 'bg-[#4B2676] text-white border-[#7C3AED]' // purple for user
                                : 'bg-[#E9D5FF] text-[#4B2676] border-[#C4B5FD]'
                              : isDark
                                ? 'bg-[#1E293B] text-white border-[#60A5FA]' // blue for system
                                : 'bg-[#DBEAFE] text-[#1E293B] border-[#60A5FA]'}
                          `}
                          style={{backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)'}}
                        >
                          {msg.isUser ? (
                            // User messages: always show full text (questions are usually short)
                            <span
                              dangerouslySetInnerHTML={{ __html: marked.parse(aiFormatter.formatAnswer(msg.message || '')) }}
                            />
                          ) : (
                            // Bot messages: truncate long answers
                            <>
                              <span
                                dangerouslySetInnerHTML={{ 
                                  __html: marked.parse(
                                    aiFormatter.formatAnswer(
                                      expandedMessages.has(msg.id) 
                                        ? msg.message || ''
                                        : truncateMessage(msg.message || '')
                                    )
                                  ) 
                                }}
                              />
                              {(msg.message || '').length > 100 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMessageExpansion(msg.id)}
                                  className={`mt-2 p-1 h-auto text-xs hover:bg-white/10 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada ${
                                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                  }`}
                                >
                                  {expandedMessages.has(msg.id) ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Show Less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      Show More
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        {timeAgo && (
                          <span className={`mt-1 ml-1 text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{timeAgo}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
      </div>
    </div>

    {/* Help Screen */}
    <HelpScreen 
      isOpen={showHelpScreen} 
      onClose={() => setShowHelpScreen(false)} 
    />
    </>
  );
}
