"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/hooks/useTheme";

const initializingMessages = [
  "Organizing the virtual showroom... 🛍️",
  "Calculating perfect size curves... 📏",
  "Arranging inventory like a pro... 📦",
  "Syncing with the fashion matrix... ✨",
  "Loading trend predictions... 📈",
  "Calibrating style algorithms... 🎨",
  "Preparing merchandising magic... 🪄",
  "Optimizing seasonal forecasts... 🌟",
  "Initializing retail intelligence... 🧠",
  "Setting up the analytics runway... 👗"
];

interface SiteLoaderProps {
  isLoading: boolean;
}

export function SiteLoader({ isLoading }: SiteLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % initializingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #091827 0%, #1e293b 50%, #334155 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
          }}
        >
          <div className="text-center space-y-8">
            {/* Animated Logo/Icon */}
            <motion.div
              className="relative mx-auto"
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className={`w-20 h-20 rounded-full border-4 border-t-blue-600 border-r-green-500 border-b-blue-400 border-l-green-400 ${
                isDark ? 'bg-slate-800/50' : 'bg-white/50'
              }`} />
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{
                  background: isDark 
                    ? 'radial-gradient(circle, #1D4ED8 20%, #10B981 80%)'
                    : 'radial-gradient(circle, #3B82F6 20%, #059669 80%)'
                }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Loading Message */}
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                Merchandising Algorithms
              </h2>
              <p className={`text-lg ${
                isDark ? 'text-blue-300' : 'text-blue-600'
              }`}>
                {initializingMessages[messageIndex]}
              </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    isDark ? 'bg-green-400' : 'bg-green-600'
                  }`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}