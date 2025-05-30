"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Search, Brain, FileText, Database } from "lucide-react";

// Funny search message banks - randomized for variety
const searchMessages = [
  [
    "Consulting the oracle of obvious answers...",
    "Searching through digital haystack for your needle...",
    "Teaching AI that your question actually makes sense...",
    "Digging through documentation that nobody reads...",
    "Translating your question from human to computer...",
    "Asking the knowledge base nicely for answers...",
    "Bribing the database with virtual cookies..."
  ],
  [
    "Convincing the AI this isn't a trick question...",
    "Searching for answers in all the right places...",
    "Loading the 'Actually Useful Information' module...",
    "Teaching algorithms to be patient with humans...",
    "Extracting wisdom from the digital void...",
    "Consulting with the FAQ spirits...",
    "Decoding the mysteries of documentation..."
  ],
  [
    "Asking the internet politely for help...",
    "Searching through bytes and bits of knowledge...",
    "Loading answers that won't confuse you more...",
    "Teaching the database to speak human...",
    "Mining for gold in the information mountain...",
    "Consulting with the documentation wizards...",
    "Preparing an answer that actually answers your question..."
  ],
  [
    "Checking if you tried turning it off and on again first...",
    "Loading the 'Did You Check the FAQ?' reminder system...",
    "Teaching AI to hide its eye-roll at obvious questions...",
    "Searching for the answer you could have Googled...",
    "Consulting with the documentation that's clearly labeled...",
    "Loading responses that won't make you feel dumb...",
    "Preparing to explain why this happens every time..."
  ],
  [
    "Waking up the sleepy knowledge database...",
    "Teaching the search engine basic reading comprehension...",
    "Loading answers from the 'Actually Helpful' vault...",
    "Convincing AI that sarcasm isn't always appropriate...",
    "Searching for wisdom in the chaos of information...",
    "Preparing explanations that your boss will understand...",
    "Loading the 'Skip the Technical Jargon' translator..."
  ]
];

interface FunnySearchLoaderProps {
  isSearching: boolean;
}

export function FunnySearchLoader({ isSearching }: FunnySearchLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageBank] = useState(() => 
    searchMessages[Math.floor(Math.random() * searchMessages.length)]
  );
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isSearching) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messageBank.length);
    }, 2400);

    return () => clearInterval(interval);
  }, [isSearching, messageBank.length]);

  if (!isSearching) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col items-center justify-center space-y-8 py-16 px-6"
    >
      {/* Main Loader */}
      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          className={`w-24 h-24 rounded-full border-2 ${
            isDark 
              ? 'border-blue-500/20' 
              : 'border-blue-400/20'
          }`}
        />
        
        {/* Animated Ring */}
        <motion.div
          className={`absolute inset-0 w-24 h-24 rounded-full border-2 border-transparent ${
            isDark 
              ? 'border-t-blue-400 border-r-purple-400' 
              : 'border-t-blue-500 border-r-purple-500'
          }`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Inner Circle */}
        <motion.div
          className={`absolute inset-3 w-18 h-18 rounded-full ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50' 
              : 'bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200/50'
          } backdrop-blur-sm shadow-lg flex items-center justify-center`}
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Central Icon */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain className={`w-6 h-6 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </motion.div>
        </motion.div>
      </div>

      {/* Message Display */}
      <motion.div
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center max-w-md"
      >
        <motion.div
          className={`p-4 rounded-xl ${
            isDark 
              ? 'bg-gray-900/50 border border-gray-700/30' 
              : 'bg-white/50 border border-gray-200/30'
          } backdrop-blur-sm`}
        >
          <p className={`text-base font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {messageBank[messageIndex]}
          </p>
        </motion.div>
      </motion.div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-6">
        <div className="flex space-x-2">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              animate={i <= messageIndex ? {
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
                backgroundColor: [
                  '#FF0000', // Red
                  '#FF7F00', // Orange
                  '#FFFF00', // Yellow
                  '#00FF00', // Green
                  '#0000FF', // Blue
                  '#4B0082', // Indigo
                  '#9400D3', // Violet
                  '#FF0000', // Back to Red
                ],
              } : {
                backgroundColor: isDark ? '#4B5563' : '#D1D5DB' // gray-600 : gray-300
              }}
              transition={{
                duration: i <= messageIndex ? 8 : 0,
                repeat: i <= messageIndex ? Infinity : 0,
                ease: i <= messageIndex ? "linear" : "easeInOut"
              }}
            />
          ))}
        </div>
        
        <motion.div
          className="flex items-center space-x-2"
          animate={{ 
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{
              color: [
                '#FF0000', // Red
                '#FF7F00', // Orange
                '#FFFF00', // Yellow
                '#00FF00', // Green
                '#0000FF', // Blue
                '#4B0082', // Indigo
                '#9400D3', // Violet
                '#FF0000', // Back to Red
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Search className="w-4 h-4" />
          </motion.div>
          <motion.span
            className="text-sm font-medium"
            animate={{
              color: [
                '#FF0000', // Red
                '#FF7F00', // Orange
                '#FFFF00', // Yellow
                '#00FF00', // Green
                '#0000FF', // Blue
                '#4B0082', // Indigo
                '#9400D3', // Violet
                '#FF0000', // Back to Red
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            Brewing your perfect answer...
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}