"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";

// Expanded fashion search message banks - 5 different sets
const funnySearchBanks = [
  [
    "Finding the perfect fit for your query...",
    "Browsing the racks of data, hang on...",
    "Styling your answer elegantly...",
    "Picking matching accessories for your query...",
    "Checking availability in stockroom...",
    "Scanning barcode of wisdom...",
    "Running around the digital stockroom...",
    "Searching for the hottest trends..."
  ],
  [
    "Consulting our fashion guru database...",
    "Adjusting sizes to fit your question...",
    "Pulling threads of information together...",
    "Flipping through fashion catalogues...",
    "Matching query to color palette...",
    "Finding matching shoes for your answer...",
    "Digital stylist at work, please wait!",
    "Doing a quick wardrobe change for your query..."
  ],
  [
    "Ironing out wrinkles in the data...",
    "Checking if your query is in fashion...",
    "Sorting the sale rack of answers...",
    "Picking fabric swatches of knowledge...",
    "Navigating through digital aisles...",
    "Finding that missing sock of information...",
    "Steaming the details out—hold tight!",
    "Matching query with seasonal trends..."
  ],
  [
    "Adjusting mannequin poses for clarity...",
    "Rummaging through backend wardrobes...",
    "Pinning your question to the mood board...",
    "Sorting your query by popularity...",
    "Checking fashion archives—hold please!",
    "Scanning for a clearance sale of answers...",
    "Fitting your query into our size chart...",
    "Tailoring an answer to your specs..."
  ],
  [
    "Checking inventory for fresh answers...",
    "Consulting the oracle of retail...",
    "Brushing off lint from answer shelves...",
    "Hunting down the trending answer...",
    "Buttoning up the perfect response...",
    "Checking mirrors for reflection accuracy...",
    "Finding an answer without loose threads...",
    "Accessorizing your query perfectly—hang on!"
  ]
];

// Get random search messages
const getRandomSearchMessages = () => {
  return funnySearchBanks[Math.floor(Math.random() * funnySearchBanks.length)];
};

interface ProfessionalSearchLoaderProps {
  isSearching: boolean;
}

export function ProfessionalSearchLoader({ isSearching }: ProfessionalSearchLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [searchMessages] = useState(getRandomSearchMessages());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isSearching) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % searchMessages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isSearching]);

  if (!isSearching) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center space-y-8 py-16"
    >
      {/* Professional Animated Search Icon */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`w-20 h-20 rounded-full border-2 ${
            isDark 
              ? 'border-blue-500/30 border-t-blue-400' 
              : 'border-blue-600/30 border-t-blue-600'
          }`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Inner pulsing circle */}
        <motion.div
          className={`absolute inset-3 rounded-full ${
            isDark ? 'bg-green-500/20' : 'bg-green-600/20'
          }`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Central search dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className={`w-3 h-3 rounded-full ${
            isDark ? 'bg-blue-400' : 'bg-blue-600'
          }`} />
        </motion.div>
      </div>

      {/* Search Message */}
      <motion.div
        key={messageIndex}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="text-center"
      >
        <p className={`text-xl font-medium ${
          isDark ? 'text-blue-300' : 'text-blue-700'
        }`}>
          {searchMessages[messageIndex]}
        </p>
      </motion.div>

      {/* Professional Animated Bars */}
      <div className="flex space-x-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className={`w-1.5 rounded-full ${
              isDark ? 'bg-green-400' : 'bg-green-600'
            }`}
            animate={{
              height: [12, 32, 12],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
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
        Crafting your perfect answer...
      </motion.p>
    </motion.div>
  );
}