"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';

interface PageLoadTypingAnimationProps {
  messages: string[];
  typingSpeed?: number;
  pauseBetweenMessages?: number;
  onAnimationComplete?: () => void;
  initialDelay?: number;
  autoHideAfter?: number; // Auto hide after this many milliseconds
  onUserInteraction?: () => void; // Called when user interacts
}

export const PageLoadTypingAnimation: React.FC<PageLoadTypingAnimationProps> = ({
  messages = ["Initializing system...", "Connecting to AI...", "Welcome!"],
  typingSpeed = 50,
  pauseBetweenMessages = 800,
  onAnimationComplete,
  initialDelay = 300,
  autoHideAfter = 8000, // Auto hide after 8 seconds
  onUserInteraction,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingCompleteForMessage, setIsTypingCompleteForMessage] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  
  const timersRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const animationStartTime = useRef<number>(0);

  // Calculate progress percentage
  const getProgress = () => {
    if (messages.length === 0) return 0;
    
    const currentMessage = messages[currentMessageIndex] || '';
    const progressPerMessage = 100 / messages.length;
    const currentMessageProgress = (displayedText.length / currentMessage.length) * progressPerMessage;
    const completedMessagesProgress = currentMessageIndex * progressPerMessage;
    
    return Math.min(completedMessagesProgress + currentMessageProgress, 100);
  };

  const clearAllTimers = () => {
    Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    timersRef.current = {};
  };

  const hideAnimation = () => {
    setShouldHide(true);
    clearAllTimers();
    
    timersRef.current.fadeOut = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete?.();
    }, 500);
  };

  // User interaction detection
  useEffect(() => {
    // Only attach listeners when animation is visible and not hiding
    if (!isVisible || shouldHide) {
      return;
    }

    const handleUserInteraction = (event: Event) => {
      // Double check visibility state
      if (!isVisible || shouldHide) return;
      
      const target = event.target as HTMLElement;
      
      // Only trigger on direct interaction with main interactive elements
      // Be more specific to avoid interfering with normal operations
      if (
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'hidden') ||
        (target.tagName === 'TEXTAREA') ||
        (target.tagName === 'BUTTON' && !(target as HTMLButtonElement).disabled) ||
        (target.closest('button:not([disabled])') && event.type === 'click') ||
        (target.closest('input[type="text"], input[type="search"], textarea') && event.type === 'focusin')
      ) {
        // Additional check: only trigger if it's a user-initiated action, not programmatic
        if (event.isTrusted) {
          onUserInteraction?.();
          hideAnimation();
        }
      }
    };

    // Use normal event listeners (not capture mode) to avoid interfering
    document.addEventListener('click', handleUserInteraction, false);
    document.addEventListener('focusin', handleUserInteraction, false);
    
    // Only listen for specific keys that indicate user intent
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible || shouldHide || !event.isTrusted) return;
      
      // Only trigger on keys that clearly indicate user wants to interact
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          onUserInteraction?.();
          hideAnimation();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('click', handleUserInteraction, false);
      document.removeEventListener('focusin', handleUserInteraction, false);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isVisible, shouldHide, onUserInteraction]);

  // Initial show and auto-hide timer
  useEffect(() => {
    timersRef.current.initial = setTimeout(() => {
      setIsVisible(true);
      animationStartTime.current = Date.now();
    }, initialDelay);

    // Set auto-hide timer
    timersRef.current.autoHide = setTimeout(() => {
      if (isVisible && !shouldHide) {
        hideAnimation();
      }
    }, initialDelay + autoHideAfter);

    return clearAllTimers;
  }, [initialDelay, autoHideAfter]);

  // Typing animation logic
  useEffect(() => {
    if (!isVisible || shouldHide || currentMessageIndex >= messages.length) {
      if (currentMessageIndex >= messages.length && isVisible && !shouldHide) {
        // All messages complete, hide immediately to prevent blank box
        hideAnimation();
      }
      return;
    }

    if (isTypingCompleteForMessage) {
      // Check if this is the last message
      if (currentMessageIndex === messages.length - 1) {
        // Last message completed, hide immediately to prevent blank box
        timersRef.current.complete = setTimeout(() => {
          hideAnimation();
        }, pauseBetweenMessages);
      } else {
        // Not the last message, proceed to next
        timersRef.current.pause = setTimeout(() => {
          setCurrentMessageIndex(prev => prev + 1);
          setDisplayedText('');
          setIsTypingCompleteForMessage(false);
        }, pauseBetweenMessages);
      }
      return;
    }

    const currentMessage = messages[currentMessageIndex];
    if (displayedText.length < currentMessage.length) {
      timersRef.current.typing = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
      }, typingSpeed);
    } else {
      setIsTypingCompleteForMessage(true);
    }

    return () => {
      if (timersRef.current.typing) clearTimeout(timersRef.current.typing);
      if (timersRef.current.pause) clearTimeout(timersRef.current.pause);
      if (timersRef.current.complete) clearTimeout(timersRef.current.complete);
    };
  }, [
    isVisible,
    shouldHide,
    displayedText,
    isTypingCompleteForMessage,
    currentMessageIndex,
    messages,
    typingSpeed,
    pauseBetweenMessages,
  ]);

  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
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

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: shouldHide ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              key={`${currentMessageIndex}-${shouldHide}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ 
                opacity: shouldHide ? 0 : 1, 
                y: shouldHide ? -20 : 0, 
                scale: shouldHide ? 0.9 : 1 
              }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`relative flex flex-col items-center gap-4 px-8 py-6 rounded-2xl backdrop-blur-xl border shadow-2xl ${
                isDark
                  ? 'border-gray-600/60 text-gray-100'
                  : 'border-blue-200/70 text-blue-900'
              }`}
              style={{
                minWidth: '360px',
                maxWidth: '600px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 50%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(248, 250, 252, 0.98) 100%)',
                boxShadow: isDark
                  ? '0 20px 50px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(255, 255, 255, 0.05) inset'
                  : '0 20px 50px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(255, 255, 255, 0.8) inset',
              }}
            >
              {/* Main message with typing animation */}
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium leading-relaxed">
                  {displayedText}
                  {!isTypingCompleteForMessage && displayedText.length < messages[currentMessageIndex]?.length && (
                    <motion.span
                      className="inline-block w-0.5 h-6 ml-1 bg-current"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                </span>
              </div>

              {/* Progress section */}
              <div className="w-full space-y-2">
                {/* Progress bar */}
                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/70'}`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${getProgress()}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              
                {/* Progress text */}
                <div className="flex justify-between items-center text-xs">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Step {currentMessageIndex + 1} of {messages.length}
                  </span>
                  <span className={`font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.round(getProgress())}%
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Export it if you want to use it as a standalone component elsewhere
// export default PageLoadTypingAnimation; 