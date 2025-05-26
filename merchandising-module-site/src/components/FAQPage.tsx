import React, { useState, useEffect } from "react";
import { GeometricPatternAnimation } from "@/components/ui/geometric-pattern-animation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion, AnimatePresence } from "motion/react";
import PageTitle from "./PageTitle";
import ChatInputSection from "./ChatInputSection";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
// PDF and control icons - Atlassian style
import { FileBarChart, X, Maximize2, Clock, ChevronDown, ChevronUp, Trash2, TrendingUp, HelpCircle } from "lucide-react";
import { ThemeToggle, themeChangeEvent, THEME_CHANGE_EVENT } from "@/components/ui/theme-toggle";
import ChatHistory from "./ChatHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useTheme } from "@/hooks/useTheme";
import QuestionResponseSection from "./QuestionResponseSection";
import { formatDistanceToNow } from 'date-fns';
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
import HelpScreen from "./HelpScreen";
import { BACKEND_URL } from "@/config";

// Expanded fashion merchandising initialization steps - 5 different sets
const funnyMerchandiseSteps = [
  [
    { text: "Ironing out the creases—just a sec!" },
    { text: "Stitching the seams of the system..." },
    { text: "Dressing mannequins, please wait!" },
    { text: "Matching socks... tougher than it looks!" },
    { text: "Folding jeans neatly... almost there!" },
    { text: "Fixing the hanger chaos, stay tuned!" },
    { text: "Teaching AI the difference between small and extra-small..." },
    { text: "Loading seasonal collections into memory..." },
    { text: "Calibrating color coordination algorithms..." },
    { text: "Installing the 'Does This Match?' detector..." },
    { text: "Preparing for the endless size exchange requests..." },
    { text: "Organizing digital wardrobe by color and style..." },
    { text: "Finalizing the fashion intelligence upgrade..." },
    { text: "Ready to make your inventory dance!" }
  ],
  [
    { text: "Choosing today's outfit for the AI..." },
    { text: "Window dressing in progress..." },
    { text: "Checking fitting rooms for answers..." },
    { text: "Polishing the POS system..." },
    { text: "Steaming wrinkles out of code..." },
    { text: "Arranging shelves digitally, hold tight!" },
    { text: "Teaching algorithms about fashion trends..." },
    { text: "Loading the 'Customer is Always Right' protocol..." },
    { text: "Installing patience for size availability questions..." },
    { text: "Preparing for peak shopping season madness..." },
    { text: "Teaching AI that 'one size fits all' rarely does..." },
    { text: "Loading return policy explanations..." },
    { text: "Buffering knowledge about fabric care..." },
    { text: "System shopping spree, coming soon!" }
  ],
  [
    { text: "Scanning for mismatched shoes..." },
    { text: "Organizing stockroom chaos, bear with us!" },
    { text: "System on a coffee break—quick refill!" },
    { text: "Rolling out the red carpet for you..." },
    { text: "Pressing shirts digitally..." },
    { text: "Just accessorizing the system..." },
    { text: "Teaching AI about seasonal fashion cycles..." },
    { text: "Loading inventory management best practices..." },
    { text: "Installing the 'Find My Size' superhero cape..." },
    { text: "Preparing responses for 'Do you have this in blue?'..." },
    { text: "Teaching machines about fabric textures..." },
    { text: "Loading wisdom from veteran sales associates..." },
    { text: "Optimizing for holiday shopping rushes..." },
    { text: "Loading like it's fashion week..." }
  ],
  [
    { text: "Choosing the perfect ensemble—hold tight!" },
    { text: "Removing lint from the servers..." },
    { text: "Adjusting inventory mannequins..." },
    { text: "Spraying digital perfume—freshening up!" },
    { text: "Counting digital cash, no mistakes!" },
    { text: "Tagging the new arrivals—be right back!" },
    { text: "Teaching AI the art of outfit coordination..." },
    { text: "Loading customer preference algorithms..." },
    { text: "Installing the 'Style Guru' wisdom module..." },
    { text: "Preparing for the 'Does this make me look..?' questions..." },
    { text: "Teaching machines about body type recommendations..." },
    { text: "Loading trend forecasting capabilities..." },
    { text: "Optimizing for customer satisfaction..." },
    { text: "Tailoring your experience—loading now!" }
  ],
  [
    { text: "Checking the latest fashion gossip..." },
    { text: "Aligning the stripes with the system..." },
    { text: "Shuffling clothes on virtual racks..." },
    { text: "Training AI in fashion sense..." },
    { text: "Restocking digital shelves, hang on!" },
    { text: "Preparing store displays...virtually!" },
    { text: "System's deciding between checks or stripes..." },
    { text: "Loading celebrity style inspiration database..." },
    { text: "Teaching AI about sustainable fashion practices..." },
    { text: "Installing the 'Mix and Match Master' plugin..." },
    { text: "Preparing for endless 'What goes with this?' queries..." },
    { text: "Loading fashion history for context..." },
    { text: "Teaching machines to spot fashion faux pas..." },
    { text: "Ready to be your personal style consultant!" }
  ]
];

// Get random merchandising steps
const getRandomMerchandiseSteps = () => {
  return funnyMerchandiseSteps[Math.floor(Math.random() * funnyMerchandiseSteps.length)];
};

export default function FAQPage() {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [questionMode, setQuestionMode] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const { chatHistory, addMessage, clearHistory, getFormattedMessage } = useChatHistory();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationSteps] = useState(getRandomMerchandiseSteps());
  const [isReturnedFromResponse, setIsReturnedFromResponse] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHelpScreen, setShowHelpScreen] = useState(false);
  
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
      try {
        await fetch(`${BACKEND_URL}/api/refresh-pdfs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf_name: 'algo.pdf' }),
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
  }, []);

  /**
   * Submit question to backend and set response data
   */
  const handleSubmitQuestion = async (question: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: question,
          category: "merchandising",
          pdf_name: 'algo.pdf' 
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setResponseData(data);
      return data;
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.message || 'Error contacting server';
      setResponseData({ error: errorMsg });
      return { error: errorMsg };
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
          <GeometricPatternAnimation
            key={animationKey}
            primaryColor={isDark ? "#1D4ED8" : "#2563EB"}
            secondaryColor={isDark ? "#059669" : "#10B981"}
            backgroundColor={isDark ? "#091827" : "#F8FAFC"}
            patternSize={80}
            animationSpeed={0.3}
            interactive={true}
          />
        </div>

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
        {/* Left side - PDF Viewer and Help */}
        <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="View Merchandising Document"
                  className="transform transition-all duration-200 ease-in-out hover:animate-hover-tada text-white border-0 backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px 0 rgba(59,130,246,0.3)'
              }}
            >
                  <FileBarChart className="h-5 w-5 hover:animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Merchandising Document</p>
              </TooltipContent>
            </Tooltip>
          </DialogTrigger>
          <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-0 gap-0">
            {/* Header with Title and Controls */}
            <div className="relative flex items-center p-4 border-b"
              style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}>
              {/* Document Title */}
              <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex-1 pr-20">
                Merchandising Algorithms Document
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
              
              {/* Note: DialogContent automatically adds close button in top-right */}
            </div>
            {/* PDF Viewer */}
            <iframe
              id="faq-pdf-iframe"
              src={`${BACKEND_URL}/pdf/algo.pdf`}
              title="FAQ PDF"
              className="w-full flex-1 border-0"
              style={{ height: 'calc(90vh - 80px)' }}
            />
          </DialogContent>
        </Dialog>

        {/* Help Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Help & How to Use"
              onClick={() => setShowHelpScreen(true)}
              className="transform transition-all duration-200 ease-in-out hover:animate-hover-tada text-white border-0 backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.8) 0%, rgba(139,69,197,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px 0 rgba(168,85,247,0.3)'
              }}
            >
              <HelpCircle className="h-5 w-5 hover:animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Help & How to Use</p>
          </TooltipContent>
        </Tooltip>
        </div>

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

      {/* Chat History Button and Panel */}
      <div className="fixed bottom-16 right-4 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Chat History"
              onClick={() => setShowChatHistory(!showChatHistory)}
              className="transform transition-all duration-200 ease-in-out hover:animate-hover-tada rounded-full text-white border-0 backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.8) 0%, rgba(21,128,61,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px 0 rgba(34,197,94,0.3)'
              }}
            >
              <Clock className="h-5 w-5 hover:animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Analytics History</p>
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
                  ? 'bg-black/10'
                  : 'bg-white/10'}
                border shadow-xl backdrop-blur-2xl
              `}
              style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.2) 50%, rgba(30,41,59,0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(248,250,252,0.15) 100%)',
                boxShadow: isDark
                  ? '0 20px 40px 0 rgba(0,0,0,0.4), 0 4px 16px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 20px 40px 0 rgba(0,0,0,0.15), 0 4px 16px 0 rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)'
              }}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/10' : 'border-zinc-300/30'}`}
                style={{backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'}}>
                <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">Analytics History</span>
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
                                ? 'bg-[#1D4ED8] text-white border-[#3B82F6]' // Atlassian blue for user
                                : 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]'
                              : isDark
                                ? 'bg-[#064E3B] text-white border-[#10B981]' // Atlassian green for system
                                : 'bg-[#D1FAE5] text-[#064E3B] border-[#6EE7B7]'}
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
                                    expandedMessages.has(msg.id) 
                                      ? getFormattedMessage(msg)
                                      : truncateMessage(getFormattedMessage(msg))
                                  ) 
                                }}
                              />
                              {getFormattedMessage(msg).length > 100 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMessageExpansion(msg.id)}
                                  className={`mt-2 p-1 h-auto text-xs hover:bg-white/10 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada ${
                                    isDark ? 'text-green-400 hover:text-green-300' : 'text-blue-600 hover:text-blue-700'
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
          <div className={`w-full py-2 px-4 text-center text-xs border-t ${
            isDark 
              ? 'text-gray-400' 
              : 'text-gray-600'
          }`}
            style={{
              background: isDark 
                ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.4) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(248,250,252,0.6) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
            }}>
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
