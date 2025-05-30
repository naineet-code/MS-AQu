import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ResponseScrollHintProps {
  containerRef: React.RefObject<HTMLElement>;
  isVisible: boolean;
}

const ResponseScrollHint: React.FC<ResponseScrollHintProps> = ({ containerRef, isVisible }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showHint, setShowHint] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const container = containerRef.current;
    let hintTimer: NodeJS.Timeout;

    const checkScrollNeeded = () => {
      if (container.scrollHeight > container.clientHeight + 50) { // 50px buffer
        // Show hint after content has loaded and settled
        hintTimer = setTimeout(() => {
          if (!hasScrolled) {
            setShowHint(true);
          }
        }, 2500); // Slightly longer to ensure content is ready
      }
    };

    const handleScroll = () => {
      if (container.scrollTop > 30) { // User has scrolled
        setHasScrolled(true);
        setShowHint(false);
      }
    };

    // Monitor for content changes and check if scroll is needed
    const observer = new ResizeObserver(checkScrollNeeded);
    observer.observe(container);

    container.addEventListener('scroll', handleScroll);
    checkScrollNeeded(); // Initial check

    return () => {
      clearTimeout(hintTimer);
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible, containerRef, hasScrolled]);

  // Reset when new content loads
  useEffect(() => {
    if (isVisible) {
      setHasScrolled(false);
      setShowHint(false);
    }
  }, [isVisible]);

  if (!showHint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.8 }}
        transition={{ 
          duration: 0.6, 
          ease: "easeOut"
        }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      >
        {/* Main nudge container with enhanced animations */}
        <motion.div 
          className={`relative flex flex-col items-center gap-1 px-6 py-3 rounded-full backdrop-blur-xl border-2 ${
            isDark 
              ? 'border-blue-400/70 text-blue-200 shadow-blue-500/20' 
              : 'border-blue-500/80 text-blue-700 shadow-blue-500/30'
          }`}
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.90) 30%, rgba(99, 102, 241, 0.85) 50%, rgba(59, 130, 246, 0.90) 70%, rgba(30, 58, 138, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(239, 246, 255, 0.98) 0%, rgba(219, 234, 254, 0.95) 20%, rgba(191, 219, 254, 0.93) 40%, rgba(147, 197, 253, 0.90) 60%, rgba(59, 130, 246, 0.93) 80%, rgba(147, 197, 253, 0.98) 100%)',
            boxShadow: isDark
              ? '0 12px 35px rgba(59, 130, 246, 0.25), 0 4px 15px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(255, 255, 255, 0.1) inset'
              : '0 12px 35px rgba(59, 130, 246, 0.20), 0 4px 15px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(255, 255, 255, 0.9) inset'
          }}
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Enhanced text with subtle animation */}
          <motion.span 
            className="text-sm font-semibold tracking-wide"
            animate={{
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            More content below
          </motion.span>
          
          {/* Dual arrow animation for stronger visual cue */}
          <div className="flex flex-col items-center -space-y-1">
            <motion.div
              animate={{ 
                y: [0, 4, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, 4, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.3
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Enhanced pulsing glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full -z-10"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.3) 30%, rgba(147, 51, 234, 0.2) 60%, transparent 100%)' 
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 30%, rgba(147, 197, 253, 0.15) 60%, transparent 100%)',
            filter: 'blur(15px)',
            transform: 'scale(2)'
          }}
        />

        {/* Additional subtle ring animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-400/30 -z-5"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ResponseScrollHint; 