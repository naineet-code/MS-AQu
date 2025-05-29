import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Scroll } from "lucide-react";
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
        }, 2000);
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
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute bottom-4 right-4 z-50 pointer-events-none"
      >
        <div className={`flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-xl border shadow-xl ${
          isDark 
            ? 'bg-gradient-to-r from-gray-900/90 to-gray-800/90 border-white/20 text-white' 
            : 'bg-gradient-to-r from-white/95 to-gray-50/95 border-gray-300/40 text-gray-800'
        }`}>
          <Scroll className="h-4 w-4 opacity-70" />
          <span className="text-sm font-medium">Scroll for more</span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 opacity-70" />
          </motion.div>
        </div>
        
        {/* Elegant pulsing glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full blur-md -z-10 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30' 
              : 'bg-gradient-to-r from-blue-400/30 to-purple-400/30'
          }`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ResponseScrollHint; 