import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
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
        }, 2000); // Professional timing
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ 
          duration: 0.4, 
          ease: "easeOut"
        }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      >
        {/* Sleek modern container */}
        <motion.div 
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
            isDark 
              ? 'border-gray-600/60 text-gray-200' 
              : 'border-blue-200/70 text-blue-800'
          }`}
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.92) 0%, rgba(100, 116, 139, 0.88) 30%, rgba(148, 163, 184, 0.85) 50%, rgba(100, 116, 139, 0.88) 70%, rgba(71, 85, 105, 0.92) 100%)'
              : 'linear-gradient(135deg, rgba(232, 249, 255, 0.98) 0%, rgba(240, 244, 255, 0.95) 20%, rgba(249, 232, 255, 0.93) 40%, rgba(232, 249, 255, 0.90) 60%, rgba(255, 249, 232, 0.93) 80%, rgba(232, 249, 255, 0.98) 100%)',
            boxShadow: isDark
              ? '0 8px 25px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(255, 255, 255, 0.08) inset, 0 1px 0 rgba(255, 255, 255, 0.12) inset'
              : '0 8px 25px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(232, 249, 255, 0.9) inset, 0 1px 0 rgba(255, 255, 255, 1) inset'
          }}
          animate={{
            y: [0, -2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Professional text */}
          <span className="text-xs font-medium tracking-wide">
            Scroll for more
          </span>
          
          {/* Elegant chevron animation */}
          <motion.div
            animate={{ 
              y: [0, 2, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
        </motion.div>
        
        {/* Subtle glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full -z-10"
          animate={{
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.15) 40%, rgba(147, 51, 234, 0.1) 70%, transparent 100%)' 
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 40%, rgba(147, 197, 253, 0.06) 70%, transparent 100%)',
            filter: 'blur(12px)',
            transform: 'scale(1.8)'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ResponseScrollHint; 