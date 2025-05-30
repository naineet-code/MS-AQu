import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScrollHintProps {
  isDark: boolean;
}

export const ScrollHint: React.FC<ScrollHintProps> = ({ isDark }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleInteraction = () => {
      setIsVisible(false);
    };

    // Add event listeners for various user interactions
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      // Clean up event listeners
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50`}
        >
          <motion.div
            className={`px-6 py-3 rounded-full backdrop-blur-xl border-2 flex items-center gap-2 ${
              isDark 
                ? 'bg-sky-900/80 border-sky-500/50 text-sky-200' 
                : 'bg-sky-50/90 border-sky-400/50 text-sky-700'
            }`}
            style={{
              boxShadow: isDark
                ? '0 8px 32px rgba(14, 165, 233, 0.25), 0 0 0 1px rgba(14, 165, 233, 0.1)'
                : '0 8px 32px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)'
            }}
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-sm font-medium">Scroll for more</span>
            <motion.div
              animate={{ 
                y: [0, 4, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 