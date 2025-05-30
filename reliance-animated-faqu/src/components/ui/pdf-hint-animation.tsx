"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextGenerateEffect } from "./text-generate-effect";

interface PdfHintAnimationProps {
  isVisible: boolean;
  onUserInteraction: () => void;
  autoHideAfter?: number;
  className?: string;
}

export const PdfHintAnimation: React.FC<PdfHintAnimationProps> = ({
  isVisible,
  onUserInteraction,
  autoHideAfter = 5000,
  className = "",
}) => {
  const [showHint, setShowHint] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Start the animation when visible
  useEffect(() => {
    if (isVisible && !hasStarted) {
      const timer = setTimeout(() => {
        setShowHint(true);
        setHasStarted(true);
      }, 1500); // Delay to let other elements settle

      return () => clearTimeout(timer);
    }
  }, [isVisible, hasStarted]);

  // Auto-hide after duration
  useEffect(() => {
    if (showHint && autoHideAfter > 0) {
      const timer = setTimeout(() => {
        setShowHint(false);
        onUserInteraction();
      }, autoHideAfter);

      return () => clearTimeout(timer);
    }
  }, [showHint, autoHideAfter, onUserInteraction]);

  // Hide on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (showHint) {
        setShowHint(false);
        onUserInteraction();
      }
    };

    // Listen for clicks anywhere on the page
    const handleClick = () => handleUserInteraction();
    
    // Listen for keyboard events
    const handleKeyDown = () => handleUserInteraction();
    
    // Listen for scroll events
    const handleScroll = () => handleUserInteraction();

    if (showHint) {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [showHint, onUserInteraction]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          className={`fixed left-8 top-[65vh] z-10 pointer-events-none ${className}`}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Just the text without container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-medium text-slate-700 dark:text-slate-300"
          >
            <TextGenerateEffect
              words="← Check the source documents"
              className="text-lg font-medium text-slate-700 dark:text-slate-300"
              duration={0.4}
              filter={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 