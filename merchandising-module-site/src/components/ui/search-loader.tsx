"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";

const searchMessages = [
  "Diving deep into inventory wisdom... 🏊‍♀️",
  "Consulting the merchandising gurus... 🧙‍♂️",
  "Scanning through seasonal trends... 👀",
  "Crunching size mix algorithms... 🔢",
  "Hunting for the perfect insights... 🎯",
  "Decoding retail mysteries... 🕵️‍♀️",
  "Analyzing customer behavior patterns... 🧠",
  "Mining data from fashion archives... ⛏️",
  "Translating numbers into stories... 📚",
  "Brewing the perfect analytics blend... ☕",
  "Connecting dots across seasons... 🔗",
  "Summoning AI fashion spirits... 👻"
];

interface SearchLoaderProps {
  isSearching: boolean;
}

export function SearchLoader({ isSearching }: SearchLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isSearching) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % searchMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isSearching]);

  if (!isSearching) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center space-y-6 py-12"
    >
      {/* Animated Search Icon */}
      <div className="relative">
        <motion.div
          className={`w-16 h-16 rounded-full border-4 ${
            isDark 
              ? 'border-blue-500 border-t-green-400' 
              : 'border-blue-600 border-t-green-500'
          }`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="text-2xl">🔍</span>
        </motion.div>
      </div>

      {/* Search Message */}
      <motion.div
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center"
      >
        <p className={`text-lg font-medium ${
          isDark ? 'text-blue-300' : 'text-blue-700'
        }`}>
          {searchMessages[messageIndex]}
        </p>
      </motion.div>

      {/* Animated Bars */}
      <div className="flex space-x-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`w-1 rounded-full ${
              isDark ? 'bg-green-400' : 'bg-green-600'
            }`}
            animate={{
              height: [8, 24, 8],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <p className={`text-sm ${
        isDark ? 'text-slate-400' : 'text-slate-600'
      }`}>
        Crafting your perfect answer...
      </p>
    </motion.div>
  );
}