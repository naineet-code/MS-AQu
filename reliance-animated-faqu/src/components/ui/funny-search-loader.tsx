"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

// Funny search message banks - randomized for variety
const funnySearchMessages = [
  [
    "Consulting the oracle of obvious answers",
    "Searching through digital haystack for your needle",
    "Teaching AI that your question actually makes sense",
    "Digging through documentation that nobody reads",
    "Translating your question from human to computer",
    "Asking the knowledge base nicely for answers",
    "Bribing the database with virtual cookies"
  ],
  [
    "Convincing the AI this isn't a trick question",
    "Searching for answers in all the right places",
    "Loading the 'Actually Useful Information' module",
    "Teaching algorithms to be patient with humans",
    "Extracting wisdom from the digital void",
    "Consulting with the FAQ spirits",
    "Decoding the mysteries of documentation"
  ],
  [
    "Asking the internet politely for help",
    "Searching through bytes and bits of knowledge",
    "Loading answers that won't confuse you more",
    "Teaching the database to speak human",
    "Mining for gold in the information mountain",
    "Consulting with the documentation wizards",
    "Preparing an answer that actually answers your question"
  ],
  [
    "Checking if you tried turning it off and on again first",
    "Loading the 'Did You Check the FAQ?' reminder system",
    "Teaching AI to hide its eye-roll at obvious questions",
    "Searching for the answer you could have Googled",
    "Consulting with the documentation that's clearly labeled",
    "Loading responses that won't make you feel dumb",
    "Preparing to explain why this happens every time"
  ],
  [
    "Waking up the sleepy knowledge database",
    "Teaching the search engine basic reading comprehension",
    "Loading answers from the 'Actually Helpful' vault",
    "Convincing AI that sarcasm isn't always appropriate",
    "Searching for wisdom in the chaos of information",
    "Preparing explanations that your boss will understand",
    "Loading the 'Skip the Technical Jargon' translator"
  ]
];

interface FunnySearchLoaderProps {
  isSearching: boolean;
}

export function FunnySearchLoader({ isSearching }: FunnySearchLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageBank] = useState(() => 
    funnySearchMessages[Math.floor(Math.random() * funnySearchMessages.length)]
  );
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isSearching) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messageBank.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isSearching, messageBank.length]);

  if (!isSearching) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center space-y-8 py-16"
    >
      {/* Simple rotating spinner */}
      <div className="relative">
        <motion.div
          className={`w-16 h-16 rounded-full border-4 ${
            isDark 
              ? 'border-blue-500/20 border-t-blue-400' 
              : 'border-blue-600/20 border-t-blue-600'
          }`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Central pulsing dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className={`w-4 h-4 rounded-full ${
            isDark ? 'bg-blue-400' : 'bg-blue-600'
          }`} />
        </motion.div>
      </div>

      {/* Funny Search Message */}
      <motion.div
        key={messageIndex}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="text-center max-w-md"
      >
        <p className={`text-lg font-medium ${
          isDark ? 'text-blue-300' : 'text-blue-700'
        }`}>
          {messageBank[messageIndex]}
        </p>
      </motion.div>

      {/* Simple animated dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${
              isDark ? 'bg-blue-400' : 'bg-blue-600'
            }`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4]
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

      <motion.p 
        className={`text-sm ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Brewing your perfect answer...
      </motion.p>
    </motion.div>
  );
}